"""
VANVAS Travel Commerce Booking Service
Encapsulates provider-neutral booking logic, strict state transition validation, and audit event logging.

Safe Status Transition Graph:
DISCOVERED -> SELECTED, FAILED, CANCELLED
SELECTED -> CHECKOUT_READY, FAILED, CANCELLED
CHECKOUT_READY -> PENDING, FAILED, CANCELLED
PENDING -> CONFIRMED, FAILED, CANCELLED
CONFIRMED -> CANCELLED, REFUND_PENDING, REFUNDED
REFUND_PENDING -> REFUNDED, FAILED
FAILED, CANCELLED, REFUNDED -> Terminal
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import User, Trip, Booking, BookingItem, BookingEvent
from app.schemas.schemas import BookingIntentCreateRequest, BookingTransitionRequest, Offer
from app.services.action_link_generator import is_valid_url

logger = logging.getLogger("vanvas.services.booking")

VALID_STATUSES = {
    "DISCOVERED",
    "SELECTED",
    "CHECKOUT_READY",
    "PENDING",
    "CONFIRMED",
    "FAILED",
    "CANCELLED",
    "REFUND_PENDING",
    "REFUNDED",
}

ALLOWED_TRANSITIONS: Dict[str, set] = {
    "DISCOVERED": {"SELECTED", "FAILED", "CANCELLED"},
    "SELECTED": {"CHECKOUT_READY", "FAILED", "CANCELLED"},
    "CHECKOUT_READY": {"PENDING", "FAILED", "CANCELLED"},
    "PENDING": {"CONFIRMED", "FAILED", "CANCELLED"},
    "CONFIRMED": {"CANCELLED", "REFUND_PENDING", "REFUNDED"},
    "REFUND_PENDING": {"REFUNDED", "FAILED"},
    "FAILED": set(),
    "CANCELLED": set(),
    "REFUNDED": set(),
}


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
        items: Optional[List[Dict[str, Any]]] = None,
        checkout_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Booking:
        """
        Creates a new provider-neutral booking intent in DISCOVERED or SELECTED/CHECKOUT_READY state.
        Never fabricates booking confirmation.
        """
        # Unpack if req schema provided
        if req is not None:
            provider = req.provider or provider or "vanvas_curated"
            booking_type = req.booking_type or booking_type or "stay"
            trip_id = req.trip_id or trip_id
            currency = req.currency or currency
            total_amount = req.total_amount if req.total_amount is not None else total_amount
            checkout_url = req.checkout_url or checkout_url
            metadata = req.metadata or metadata or {}
            raw_items = [item.model_dump() if hasattr(item, "model_dump") else item for item in req.items] if req.items else (items or [])
        else:
            provider = provider or "vanvas_curated"
            booking_type = booking_type or "stay"
            raw_items = items or []

        # Validate trip authorization if trip_id is provided
        if trip_id:
            trip = db.query(Trip).filter(Trip.id == trip_id).first()
            if not trip:
                raise HTTPException(status_code=404, detail="Referenced trip not found.")
            if trip.user_id != user.id and getattr(user, "role", "") != "admin":
                is_member = any(m.user_id == user.id for m in trip.members)
                if not is_member:
                    raise HTTPException(status_code=403, detail="Not authorized to attach booking to this trip.")

        # Determine initial state
        verified_checkout_url = None
        if checkout_url and is_valid_url(checkout_url):
            verified_checkout_url = checkout_url.strip()
            initial_status = "CHECKOUT_READY"
        elif raw_items:
            initial_status = "SELECTED"
        else:
            initial_status = "DISCOVERED"

        # Calculate total if not explicit
        if total_amount is None and raw_items:
            item_totals = [
                float(it.get("total_price") or (float(it.get("unit_price") or 0.0) * max(1, it.get("quantity") or 1)))
                for it in raw_items
                if it.get("total_price") is not None or it.get("unit_price") is not None
            ]
            total_amount = round(sum(item_totals), 2) if item_totals else None

        booking = Booking(
            user_id=user.id,
            trip_id=trip_id,
            provider=provider,
            provider_booking_id=kwargs.get("provider_offer_id") or kwargs.get("provider_booking_id"),
            booking_type=booking_type,
            status=initial_status,
            currency=currency,
            total_amount=total_amount,
            checkout_url=verified_checkout_url,
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
                "verified_url": bool(verified_checkout_url),
                "items_count": len(raw_items),
                "created_by": user.id,
            }),
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)

        db.commit()
        db.refresh(booking)
        logger.info(f"Created Booking {booking.id} ({booking.status}) for user {user.id}")
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
        Direct python service transition that raises ValueError on invalid status or transition.
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
        allowed = ALLOWED_TRANSITIONS.get(current, set())

        if target not in allowed:
            raise ValueError(
                f"Invalid status transition from '{current}' to '{target}'. Allowed transitions: {sorted(list(allowed)) or 'None (Terminal)'}"
            )

        if target == "CONFIRMED" and not booking.confirmation_reference:
            custom_ref = (metadata or {}).get("confirmation_reference")
            booking.confirmation_reference = custom_ref or f"VV-{booking.booking_type[:3].upper()}-{booking.id[:8].upper()}"

        previous = booking.status
        booking.status = target
        booking.updated_at = datetime.now(timezone.utc)

        event = BookingEvent(
            booking_id=booking.id,
            event_type=f"STATUS_TRANSITION_TO_{target}",
            previous_status=previous,
            new_status=target,
            metadata_json=json.dumps({
                "reason": reason or "Transition request",
                "custom_metadata": metadata or {},
                "actor_user_id": user.id,
            }),
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)
        db.commit()
        db.refresh(booking)
        return booking

    @classmethod
    def transition_status(
        cls,
        db: Session,
        booking_id: str,
        user: User,
        req: BookingTransitionRequest,
    ) -> Booking:
        """
        API endpoint transition handler mapping ValueError to HTTPException(400).
        """
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
    def get_user_bookings(cls, db: Session, user: User) -> List[Booking]:
        """Returns bookings strictly owned by the authenticated user."""
        return db.query(Booking).filter(Booking.user_id == user.id).order_by(Booking.created_at.desc()).all()

    @classmethod
    def get_booking_by_id(cls, db: Session, booking_id: str, user: User) -> Booking:
        """Fetches booking with strict authorization (owner or admin)."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.user_id != user.id and getattr(user, "role", "") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access this booking.")
        return booking
