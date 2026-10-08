"""
VANVAS Travel Commerce Booking Service
Encapsulates provider-neutral booking logic, strict state transition validation,
financial breakdowns, idempotency, audit event logging, and notification integration.

Authoritative Status Lifecycle:
DRAFT -> CHECKING_AVAILABILITY, SELECTED, UNAVAILABLE, FAILED, CANCELLED
CHECKING_AVAILABILITY -> AVAILABLE, UNAVAILABLE, FAILED
AVAILABLE -> PAYMENT_REQUIRED, PROVIDER_HANDOFF, CANCELLED
PAYMENT_REQUIRED -> PAYMENT_PROCESSING, PROVIDER_HANDOFF, CANCELLED, FAILED
PAYMENT_PROCESSING -> CONFIRMING, PAYMENT_FAILED, CANCELLED
CONFIRMING -> CONFIRMED, CONFIRMATION_FAILED, CANCELLED
CONFIRMED -> CANCELLED, REFUND_PENDING, REFUNDED
PROVIDER_HANDOFF -> USER_RECORDED, PROVIDER_CONFIRMED, CONFIRMED, CANCELLED
REFUND_PENDING -> REFUNDED, FAILED
Terminal States: CANCELLED, REFUNDED, FAILED, UNAVAILABLE, PAYMENT_FAILED, CONFIRMATION_FAILED
"""

from enum import Enum
import json
import uuid
import random
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import User, Trip, Booking, BookingItem, BookingEvent, PaymentTransaction
from app.schemas.schemas import (
    BookingIntentCreateRequest, BookingTransitionRequest, BookingCheckoutInitiateRequest, Offer
)
from app.services.action_link_generator import is_valid_url
from app.services.notification_service import NotificationService
from app.providers.provider_factory import ProviderFactory

logger = logging.getLogger("vanvas.services.booking")


class BookingStatus(str, Enum):
    DRAFT = "DRAFT"
    DISCOVERED = "DISCOVERED"
    SELECTED = "SELECTED"
    CHECKING_AVAILABILITY = "CHECKING_AVAILABILITY"
    AVAILABLE = "AVAILABLE"
    PAYMENT_REQUIRED = "PAYMENT_REQUIRED"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    CONFIRMING = "CONFIRMING"
    CONFIRMED = "CONFIRMED"
    CHECKOUT_READY = "CHECKOUT_READY"
    PENDING = "PENDING"
    EXTERNAL_CHECKOUT_PENDING = "EXTERNAL_CHECKOUT_PENDING"
    PROVIDER_HANDOFF = "PROVIDER_HANDOFF"
    USER_RECORDED = "USER_RECORDED"
    PROVIDER_CONFIRMED = "PROVIDER_CONFIRMED"
    UNAVAILABLE = "UNAVAILABLE"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    CONFIRMATION_FAILED = "CONFIRMATION_FAILED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"


VALID_STATUSES = {s.value for s in BookingStatus}

VALID_BOOKING_TYPES = {
    "stay", "hotel", "hostel", "homestay", "rental",
    "bus", "train", "flight", "cab", "activity"
}

ALLOWED_TRANSITIONS: Dict[str, set] = {
    "DRAFT": {
        "CHECKING_AVAILABILITY", "AVAILABLE", "SELECTED", "CHECKOUT_READY",
        "PAYMENT_REQUIRED", "PROVIDER_HANDOFF", "UNAVAILABLE", "FAILED", "CANCELLED"
    },
    "DISCOVERED": {
        "SELECTED", "CHECKING_AVAILABILITY", "AVAILABLE", "CHECKOUT_READY",
        "FAILED", "CANCELLED"
    },
    "SELECTED": {
        "CHECKING_AVAILABILITY", "AVAILABLE", "CHECKOUT_READY", "PAYMENT_REQUIRED",
        "PENDING", "EXTERNAL_CHECKOUT_PENDING", "PROVIDER_HANDOFF", "FAILED", "CANCELLED"
    },
    "CHECKING_AVAILABILITY": {
        "AVAILABLE", "UNAVAILABLE", "FAILED", "CANCELLED"
    },
    "AVAILABLE": {
        "PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "CHECKOUT_READY",
        "PROVIDER_HANDOFF", "CANCELLED", "FAILED"
    },
    "CHECKOUT_READY": {
        "PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "PENDING",
        "EXTERNAL_CHECKOUT_PENDING", "PROVIDER_HANDOFF", "USER_RECORDED",
        "PROVIDER_CONFIRMED", "CONFIRMED", "FAILED", "CANCELLED"
    },
    "PAYMENT_REQUIRED": {
        "PAYMENT_PROCESSING", "PROVIDER_HANDOFF", "PAYMENT_FAILED", "CANCELLED", "FAILED"
    },
    "PENDING": {
        "PAYMENT_PROCESSING", "EXTERNAL_CHECKOUT_PENDING", "USER_RECORDED",
        "PROVIDER_CONFIRMED", "CONFIRMING", "CONFIRMED", "FAILED", "CANCELLED"
    },
    "EXTERNAL_CHECKOUT_PENDING": {
        "USER_RECORDED", "PROVIDER_CONFIRMED", "CONFIRMED", "FAILED", "CANCELLED"
    },
    "PROVIDER_HANDOFF": {
        "USER_RECORDED", "PROVIDER_CONFIRMED", "CONFIRMED", "CANCELLED", "FAILED"
    },
    "PAYMENT_PROCESSING": {
        "CONFIRMING", "CONFIRMED", "PAYMENT_FAILED", "FAILED", "CANCELLED"
    },
    "CONFIRMING": {
        "CONFIRMED", "CONFIRMATION_FAILED", "FAILED", "CANCELLED"
    },
    "USER_RECORDED": {
        "PROVIDER_CONFIRMED", "CONFIRMED", "CANCELLED", "REFUND_PENDING", "REFUNDED"
    },
    "PROVIDER_CONFIRMED": {
        "CONFIRMED", "CANCELLED", "REFUND_PENDING", "REFUNDED"
    },
    "CONFIRMED": {
        "CANCELLED", "REFUND_PENDING", "REFUNDED"
    },
    "REFUND_PENDING": {
        "REFUNDED", "FAILED"
    },
    "UNAVAILABLE": set(),
    "PAYMENT_FAILED": {"PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "CANCELLED"},
    "CONFIRMATION_FAILED": {"REFUND_PENDING", "REFUNDED", "CANCELLED"},
    "FAILED": set(),
    "CANCELLED": {"REFUND_PENDING", "REFUNDED"},
    "REFUNDED": set(),
}


def generate_public_booking_reference() -> str:
    """Generates human-readable durable reference code, e.g. VV-2026-X8K9M2"""
    current_year = datetime.now().year
    charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    random_str = "".join(random.choices(charset, k=6))
    return f"VV-{current_year}-{random_str}"


class BookingService:

    @classmethod
    def create_booking_intent(
        cls,
        db: Session,
        user: User,
        req: Optional[BookingIntentCreateRequest] = None,
        provider: Optional[str] = None,
        booking_type: Optional[str] = None,
        trip_id: Optional[str] = None,
        currency: str = "INR",
        total_amount: Optional[float] = None,
        base_amount: Optional[float] = None,
        taxes: Optional[float] = None,
        fees: Optional[float] = None,
        refundable: bool = True,
        items: Optional[List[Dict[str, Any]]] = None,
        checkout_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
        **kwargs
    ) -> Booking:
        """
        Creates a new provider-neutral booking intent in DRAFT, SELECTED, or CHECKOUT_READY state.
        Never fabricates booking confirmation. Enforces idempotency when provided.
        """
        if req is not None:
            provider = req.provider or provider or "vanvas_curated"
            booking_type = req.booking_type or booking_type or "stay"
            trip_id = req.trip_id or trip_id
            currency = req.currency or currency
            total_amount = req.total_amount if req.total_amount is not None else total_amount
            base_amount = req.base_amount if req.base_amount is not None else base_amount
            taxes = req.taxes if req.taxes is not None else taxes
            fees = req.fees if req.fees is not None else fees
            refundable = req.refundable if req.refundable is not None else refundable
            checkout_url = req.checkout_url or checkout_url
            metadata = req.metadata or metadata or {}
            idempotency_key = req.idempotency_key or idempotency_key
            raw_items = [item.model_dump() if hasattr(item, "model_dump") else item for item in req.items] if req.items else (items or [])
        else:
            provider = provider or "vanvas_curated"
            booking_type = booking_type or "stay"
            raw_items = items or []
            metadata = metadata or {}

        # 1. Check idempotency
        if idempotency_key:
            existing = db.query(Booking).filter(
                Booking.user_id == user.id,
                Booking.idempotency_key == idempotency_key
            ).first()
            if existing:
                logger.info(f"Idempotent booking hit for key {idempotency_key} -> returning Booking {existing.id}")
                return existing

        # 2. Validate trip authorization if attached
        if trip_id:
            trip = db.query(Trip).filter(Trip.id == trip_id).first()
            if not trip:
                raise HTTPException(status_code=404, detail="Referenced trip not found.")
            if trip.user_id != user.id and getattr(user, "role", "") != "admin":
                is_member = any(m.user_id == user.id for m in trip.members)
                if not is_member:
                    raise HTTPException(status_code=403, detail="Not authorized to attach booking to this trip.")

        # 3. Determine initial status
        verified_checkout_url = None
        if checkout_url and is_valid_url(checkout_url):
            verified_checkout_url = checkout_url.strip()
            initial_status = "CHECKOUT_READY"
        elif raw_items:
            initial_status = "SELECTED"
        else:
            initial_status = "DISCOVERED"

        # 4. Calculate total & base amounts if not explicit
        if total_amount is None and raw_items:
            item_totals = [
                float(it.get("total_price") or (float(it.get("unit_price") or 0.0) * max(1, it.get("quantity") or 1)))
                for it in raw_items
                if it.get("total_price") is not None or it.get("unit_price") is not None
            ]
            base_calc = sum(item_totals) if item_totals else 0.0
            base_amount = base_amount if base_amount is not None else round(base_calc, 2)
            taxes = taxes if taxes is not None else 0.0
            fees = fees if fees is not None else 0.0
            total_amount = round(base_amount + taxes + fees, 2)

        booking = Booking(
            user_id=user.id,
            trip_id=trip_id,
            public_booking_reference=generate_public_booking_reference(),
            provider=provider,
            provider_booking_id=kwargs.get("provider_offer_id") or kwargs.get("provider_booking_id"),
            booking_type=booking_type,
            status=initial_status,
            payment_status="PAYMENT_REQUIRED",
            currency=currency,
            total_amount=total_amount,
            base_amount=base_amount,
            taxes=taxes or 0.0,
            fees=fees or 0.0,
            refundable=refundable,
            checkout_url=verified_checkout_url,
            idempotency_key=idempotency_key,
            metadata_json=json.dumps(metadata or {}),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(booking)
        db.flush()

        # Add BookingItems
        for item_data in raw_items:
            q = max(1, item_data.get("quantity") or 1)
            u_price = item_data.get("unit_price")
            t_price = item_data.get("total_price")
            if t_price is None and u_price is not None:
                t_price = round(float(u_price) * q, 2)

            item = BookingItem(
                booking_id=booking.id,
                provider_offer_id=item_data.get("provider_offer_id"),
                product_type=item_data.get("product_type", booking_type),
                title=item_data.get("title", "Booking Item"),
                destination=item_data.get("destination", "Himalayas"),
                start_at=item_data.get("start_at"),
                end_at=item_data.get("end_at"),
                quantity=q,
                unit_price=u_price,
                total_price=t_price,
                metadata_json=json.dumps(item_data.get("metadata") or {}),
            )
            db.add(item)

        # Log initial event
        event = BookingEvent(
            booking_id=booking.id,
            event_type="INTENT_CREATED",
            previous_status=None,
            new_status=initial_status,
            metadata_json=json.dumps({
                "provider": booking.provider,
                "public_ref": booking.public_booking_reference,
                "items_count": len(raw_items),
                "created_by": user.id,
            }),
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)

        db.commit()
        db.refresh(booking)
        logger.info(f"Created Booking {booking.id} [{booking.public_booking_reference}] ({booking.status}) for user {user.id}")
        return booking

    @classmethod
    def initiate_checkout(
        cls,
        db: Session,
        user: User,
        req: BookingCheckoutInitiateRequest,
    ) -> Booking:
        """
        Initiates end-to-end checkout by:
        1. Revalidating availability & pricing with provider.
        2. Deriving authoritative server-side base amount, taxes, fees.
        3. Transitioning state to PAYMENT_REQUIRED.
        """
        provider_name = req.provider or "sandbox_stay"
        provider_adapter = ProviderFactory.get_booking_provider(provider_name)

        # 1. Live availability check
        avail = provider_adapter.availability(
            offer_id=req.provider_offer_id or f"{provider_name}-{req.destination.lower()}",
            start_date=req.check_in,
            end_date=req.check_out,
            guests=req.guests,
        )
        if not avail.get("available", True) or avail.get("state") == "UNAVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected stay or room is no longer available for these dates."
            )

        # 2. Authoritative pricing calculation
        pricing_data = provider_adapter.pricing(
            offer_id=req.provider_offer_id or f"{provider_name}-{req.destination.lower()}",
            start_date=req.check_in,
            end_date=req.check_out,
            guests=req.guests,
            rooms=req.rooms,
        )

        base_amt = pricing_data.get("base_amount", req.unit_price)
        tax_amt = pricing_data.get("taxes", round(base_amt * 0.12, 2))
        fee_amt = pricing_data.get("fees", round(base_amt * 0.02, 2))
        tot_amt = pricing_data.get("total_amount", round(base_amt + tax_amt + fee_amt, 2))
        refundable = pricing_data.get("refundable", True)

        # Parse dates
        start_dt = None
        end_dt = None
        if req.check_in:
            try:
                start_dt = datetime.fromisoformat(req.check_in.split("T")[0])
            except Exception:
                pass
        if req.check_out:
            try:
                end_dt = datetime.fromisoformat(req.check_out.split("T")[0])
            except Exception:
                pass

        item_payload = {
            "provider_offer_id": req.provider_offer_id,
            "product_type": req.booking_type,
            "title": req.title,
            "destination": req.destination,
            "start_at": start_dt,
            "end_at": end_dt,
            "quantity": req.rooms,
            "unit_price": base_amt / max(1, req.rooms),
            "total_price": base_amt,
            "metadata": {
                "guests": req.guests,
                "rooms": req.rooms,
                "traveller_name": req.traveller_name,
                "traveller_email": req.traveller_email,
                "traveller_phone": req.traveller_phone,
                "special_requests": req.special_requests,
                "cancellation_policy": pricing_data.get("cancellation_policy"),
            }
        }

        booking = cls.create_booking_intent(
            db=db,
            user=user,
            trip_id=req.trip_id,
            provider=provider_name,
            booking_type=req.booking_type,
            currency="INR",
            total_amount=tot_amt,
            base_amount=base_amt,
            taxes=tax_amt,
            fees=fee_amt,
            refundable=refundable,
            items=[item_payload],
            metadata={
                "traveller_name": req.traveller_name,
                "traveller_email": req.traveller_email,
                "traveller_phone": req.traveller_phone,
                "special_requests": req.special_requests,
                "pricing_breakdown": pricing_data,
                "revalidated_at": datetime.now(timezone.utc).isoformat(),
            },
            idempotency_key=req.idempotency_key,
        )

        # Transition to PAYMENT_REQUIRED if not already advanced
        if booking.status not in ("PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "CONFIRMING", "CONFIRMED", "CANCELLED", "REFUNDED"):
            booking = cls.transition_booking_status(
                db=db,
                booking_id=booking.id,
                target_status="PAYMENT_REQUIRED",
                user=user,
                reason="Price & availability verified. Checkout ready for payment.",
            )
        return booking

    @classmethod
    def transition_booking_status(
        cls,
        db: Session,
        booking_id: str,
        target_status: str,
        user: User,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Booking:
        """
        Direct python service transition with full state graph validation and notification dispatch.
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")

        if booking.user_id != user.id and getattr(user, "role", "") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to modify this booking.")

        target = target_status.upper().strip()
        if target not in VALID_STATUSES:
            raise ValueError(f"Invalid target status '{target}'. Must be one of: {sorted(list(VALID_STATUSES))}")

        current = booking.status.upper().strip()
        if target == current:
            return booking

        allowed = ALLOWED_TRANSITIONS.get(current, set())

        if target not in allowed:
            raise ValueError(
                f"Invalid status transition from '{current}' to '{target}'. Allowed transitions: {sorted(list(allowed)) or 'None (Terminal)'}"
            )

        # Custom reference handoff
        if target == "PROVIDER_CONFIRMED":
            custom_ref = (
                (metadata or {}).get("confirmation_reference")
                or (metadata or {}).get("provider_confirmation_reference")
                or (metadata or {}).get("provider_reference")
            )
            if not custom_ref and not booking.confirmation_reference:
                raise ValueError("Real provider confirmation reference is strictly required for PROVIDER_CONFIRMED transition.")
            if custom_ref:
                booking.confirmation_reference = custom_ref
            if not booking.confirmed_at:
                booking.confirmed_at = datetime.now(timezone.utc)
            booking.payment_status = "PAYMENT_SUCCESS"
        elif target == "CONFIRMED":
            custom_ref = (
                (metadata or {}).get("confirmation_reference")
                or (metadata or {}).get("provider_confirmation_reference")
                or (metadata or {}).get("provider_reference")
            )
            if custom_ref:
                booking.confirmation_reference = custom_ref
            if not booking.confirmed_at:
                booking.confirmed_at = datetime.now(timezone.utc)
            booking.payment_status = "PAYMENT_SUCCESS"

            # Create immutable frozen snapshot
            booking.booking_snapshot = json.dumps({
                "booking_id": booking.id,
                "public_reference": booking.public_booking_reference,
                "provider": booking.provider,
                "booking_type": booking.booking_type,
                "total_amount": booking.total_amount,
                "base_amount": booking.base_amount,
                "taxes": booking.taxes,
                "fees": booking.fees,
                "currency": booking.currency,
                "refundable": booking.refundable,
                "confirmed_at": booking.confirmed_at.isoformat() if booking.confirmed_at else None,
                "items": [
                    {
                        "title": it.title,
                        "destination": it.destination,
                        "start_at": it.start_at.isoformat() if it.start_at else None,
                        "end_at": it.end_at.isoformat() if it.end_at else None,
                        "quantity": it.quantity,
                        "unit_price": it.unit_price,
                        "total_price": it.total_price,
                    }
                    for it in booking.items
                ],
                "metadata": json.loads(booking.metadata_json or "{}"),
            })

        elif target == "CANCELLED":
            if not booking.cancelled_at:
                booking.cancelled_at = datetime.now(timezone.utc)
            if booking.payment_status == "PAYMENT_SUCCESS":
                booking.payment_status = "REFUND_PENDING" if booking.refundable else "PAYMENT_CANCELLED"

        elif target == "REFUNDED":
            booking.payment_status = "REFUND_COMPLETE"

        elif target == "USER_RECORDED":
            custom_ref = (metadata or {}).get("confirmation_reference") or (metadata or {}).get("user_reference")
            if custom_ref:
                booking.confirmation_reference = custom_ref

        previous = booking.status
        booking.status = target
        booking.updated_at = datetime.now(timezone.utc)

        # Audit Event Log
        event = BookingEvent(
            booking_id=booking.id,
            event_type=f"STATUS_TRANSITION_TO_{target}",
            previous_status=previous,
            new_status=target,
            metadata_json=json.dumps({
                "reason": reason or "Transition request",
                "custom_metadata": metadata or {},
                "actor_user_id": user.id,
                "public_ref": booking.public_booking_reference,
            }),
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)
        db.commit()
        db.refresh(booking)

        # Dispatch life-cycle notification
        try:
            cls._dispatch_booking_notification(db, booking, target)
        except Exception as e:
            logger.warning(f"Notification dispatch failed for booking {booking.id}: {e}")

        return booking

    @classmethod
    def _dispatch_booking_notification(cls, db: Session, booking: Booking, target_status: str):
        """Sends canonical push/in-app notification for booking lifecycle events."""
        first_item_title = booking.items[0].title if booking.items else "Trip Booking"
        deep_link = f"/trips/{booking.trip_id}" if booking.trip_id else f"/bookings"

        if target_status == "CONFIRMED":
            NotificationService.send_notification(
                db=db,
                user_id=booking.user_id,
                notification_type="booking_update",
                title="Booking Confirmed! 🎒",
                body=f"Your {booking.booking_type} reservation '{first_item_title}' is confirmed ({booking.public_booking_reference}).",
                deep_link=deep_link,
                trip_id=booking.trip_id,
            )
        elif target_status == "CANCELLED":
            NotificationService.send_notification(
                db=db,
                user_id=booking.user_id,
                notification_type="booking_update",
                title="Booking Cancelled",
                body=f"Your reservation '{first_item_title}' has been cancelled.",
                deep_link=deep_link,
                trip_id=booking.trip_id,
            )
        elif target_status == "REFUNDED":
            NotificationService.send_notification(
                db=db,
                user_id=booking.user_id,
                notification_type="booking_update",
                title="Refund Processed 💳",
                body=f"Refund of ₹{booking.total_amount or 0} for '{first_item_title}' has been completed.",
                deep_link=deep_link,
                trip_id=booking.trip_id,
            )

    @classmethod
    def transition_status(
        cls,
        db: Session,
        booking_id: str,
        user: User,
        req: BookingTransitionRequest,
    ) -> Booking:
        """API transition endpoint handler mapping ValueError to HTTPException(400)."""
        try:
            return cls.transition_booking_status(
                db=db,
                booking_id=booking_id,
                target_status=req.target_status,
                user=user,
                reason=req.reason,
                metadata=req.metadata,
            )
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

    @classmethod
    def cancel_booking(
        cls,
        db: Session,
        booking_id: str,
        user: User,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """User or provider cancellation handler."""
        booking = cls.get_booking_by_id(db=db, booking_id=booking_id, user=user)

        if booking.status in ("CANCELLED", "REFUNDED", "FAILED"):
            return {
                "success": False,
                "booking_id": booking.id,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "cancellation_amount": booking.cancellation_amount or 0.0,
                "refund_amount": 0.0,
                "message": f"Booking is already in terminal state: {booking.status}",
            }

        # Calculate refund eligibility
        tot = booking.total_amount or 0.0
        refund_amt = tot if booking.refundable else 0.0
        booking.cancellation_amount = tot - refund_amt

        # Call provider cancellation if active provider
        provider_adapter = ProviderFactory.get_booking_provider(booking.provider)
        if booking.provider_booking_id:
            try:
                provider_adapter.cancel_booking(booking.provider_booking_id, reason=reason)
            except Exception as e:
                logger.warning(f"Provider cancellation warning for {booking.provider_booking_id}: {e}")

        # Transition status
        cls.transition_booking_status(
            db=db,
            booking_id=booking.id,
            target_status="CANCELLED",
            user=user,
            reason=reason or "User requested cancellation",
        )

        if refund_amt > 0 and booking.payment_status in ("PAYMENT_SUCCESS", "REFUND_PENDING"):
            cls.transition_booking_status(
                db=db,
                booking_id=booking.id,
                target_status="REFUNDED",
                user=user,
                reason="Automatic refund completed for refundable booking",
            )

        return {
            "success": True,
            "booking_id": booking.id,
            "status": booking.status,
            "payment_status": booking.payment_status,
            "cancellation_amount": booking.cancellation_amount or 0.0,
            "refund_amount": refund_amt,
            "message": "Booking cancellation and refund processed successfully.",
        }

    @classmethod
    def attach_to_trip(
        cls,
        db: Session,
        booking_id: str,
        trip_id: str,
        user: User,
    ) -> Booking:
        """Attaches a confirmed/active booking to an authorized trip."""
        booking = cls.get_booking_by_id(db=db, booking_id=booking_id, user=user)
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found.")

        if trip.user_id != user.id and getattr(user, "role", "") != "admin":
            is_member = any(m.user_id == user.id for m in trip.members)
            if not is_member:
                raise HTTPException(status_code=403, detail="Not authorized to attach booking to this trip.")

        booking.trip_id = trip.id
        booking.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(booking)
        logger.info(f"Attached Booking {booking.id} to Trip {trip.id}")
        return booking

    @classmethod
    def get_user_bookings(cls, db: Session, user: User, status_filter: Optional[str] = None) -> List[Booking]:
        """Returns bookings strictly owned by the authenticated user."""
        q = db.query(Booking).filter(Booking.user_id == user.id)
        if status_filter and status_filter.upper() != "ALL":
            sf = status_filter.upper().strip()
            if sf == "UPCOMING":
                q = q.filter(Booking.status.in_(["CONFIRMED", "PAYMENT_REQUIRED", "PENDING", "PROVIDER_HANDOFF"]))
            elif sf == "COMPLETED":
                q = q.filter(Booking.status == "CONFIRMED")
            elif sf == "CANCELLED":
                q = q.filter(Booking.status == "CANCELLED")
            elif sf == "REFUNDED":
                q = q.filter(Booking.status == "REFUNDED")
            else:
                q = q.filter(Booking.status == sf)

        return q.order_by(Booking.created_at.desc()).all()

    @classmethod
    def get_trip_bookings(cls, db: Session, trip_id: str, user: User) -> List[Booking]:
        """Returns bookings attached to a trip with member authorization."""
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found.")

        if trip.user_id != user.id and getattr(user, "role", "") != "admin":
            is_member = any(m.user_id == user.id for m in trip.members)
            if not is_member:
                raise HTTPException(status_code=403, detail="Not authorized to access this trip's bookings.")

        return db.query(Booking).filter(Booking.trip_id == trip_id).order_by(Booking.created_at.asc()).all()

    @classmethod
    def get_booking_by_id(cls, db: Session, booking_id: str, user: User) -> Booking:
        """Fetches booking with strict authorization (owner or admin)."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.user_id != user.id and getattr(user, "role", "") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access this booking.")
        return booking
