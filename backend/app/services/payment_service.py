"""
VANVAS Travel Commerce Payment Service
Encapsulates server-side payment derivation, gateway order creation,
cryptographic signature verification, idempotency, reconciliation, and refund lifecycle.
Zero fake confirmations: strictly verifies payment and upstream provider reservation.
"""

import hmac
import hashlib
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.models import User, Booking, PaymentTransaction
from app.schemas.schemas import PaymentInitiateResponse, PaymentVerifyResponse, BookingReconcileResponse
from app.services.booking_service import BookingService
from app.providers.provider_factory import ProviderFactory
from app.providers.commerce.sandbox_payment_adapter import SandboxPaymentGateway

logger = logging.getLogger("vanvas.services.payment")


class PaymentService:

    @classmethod
    def initiate_payment(
        cls,
        db: Session,
        booking_id: str,
        user: User,
        payment_gateway: str = "vanvas_pay_sandbox",
        idempotency_key: Optional[str] = None,
    ) -> PaymentInitiateResponse:
        """
        Initiates a payment order for a booking.
        Authoritative Amount Rule: Derives payable amount exclusively from server DB state.
        """
        booking = BookingService.get_booking_by_id(db=db, booking_id=booking_id, user=user)

        # 1. State validation
        if booking.status in ("CONFIRMED", "CANCELLED", "REFUNDED", "FAILED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot initiate payment for booking in state: {booking.status}"
            )

        if not booking.total_amount or booking.total_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking does not have a valid payable amount calculated."
            )

        # 2. Check Idempotency on payment transaction
        if idempotency_key:
            existing_tx = db.query(PaymentTransaction).filter(
                PaymentTransaction.user_id == user.id,
                PaymentTransaction.idempotency_key == idempotency_key,
                PaymentTransaction.status.in_(["INITIATED", "PENDING", "SUCCESS"])
            ).first()
            if existing_tx:
                logger.info(f"Returning idempotent PaymentTransaction {existing_tx.id}")
                sim_payment_id = f"pay_{existing_tx.gateway_order_id}"
                sim_signature = SandboxPaymentGateway.generate_signature(existing_tx.gateway_order_id, sim_payment_id) if existing_tx.payment_gateway in ("vanvas_pay_sandbox", "sandbox", "test") else None

                return PaymentInitiateResponse(
                    booking_id=booking.id,
                    payment_transaction_id=existing_tx.id,
                    payment_gateway=existing_tx.payment_gateway,
                    order_id=existing_tx.gateway_order_id or f"order_{existing_tx.id[:12]}",
                    amount=existing_tx.amount,
                    currency=existing_tx.currency,
                    key_id=settings.RAZORPAY_KEY_ID if existing_tx.payment_gateway == "razorpay" else "sandbox_key_vanvas",
                    status=existing_tx.status,
                    expires_at=(datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
                    checkout_payload={
                        "order_id": existing_tx.gateway_order_id,
                        "amount": existing_tx.amount,
                        "currency": existing_tx.currency,
                        "booking_ref": booking.public_booking_reference,
                        "sandbox_simulated_payment_id": sim_payment_id,
                        "sandbox_simulated_signature": sim_signature,
                    }
                )

        # 3. Environment verification
        gateway = (payment_gateway or getattr(settings, "PAYMENT_PROVIDER", "vanvas_pay_sandbox")).lower().strip()
        if settings.is_production and gateway in ("vanvas_pay_sandbox", "sandbox", "test"):
            if not getattr(settings, "RAZORPAY_KEY_ID", None) and not getattr(settings, "STRIPE_API_KEY", None):
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Live payment gateway configuration is pending external provider credentials. Please use provider direct checkout."
                )

        # 4. Generate gateway order ID & register in server-side gateway
        gateway_order_id = f"order_vv_{uuid.uuid4().hex[:14]}"

        if gateway in ("vanvas_pay_sandbox", "sandbox", "test"):
            SandboxPaymentGateway.create_order(
                order_id=gateway_order_id,
                amount=booking.total_amount,
                currency=booking.currency or "INR",
                metadata={"booking_id": booking.id, "user_id": user.id},
            )

        # Create persistent payment transaction record
        tx = PaymentTransaction(
            booking_id=booking.id,
            user_id=user.id,
            payment_gateway=gateway,
            gateway_order_id=gateway_order_id,
            amount=booking.total_amount,
            currency=booking.currency or "INR",
            status="INITIATED",
            idempotency_key=idempotency_key,
            metadata_json=json.dumps({
                "booking_type": booking.booking_type,
                "public_ref": booking.public_booking_reference,
                "user_email": user.email,
            }),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(tx)

        # Advance booking status to PAYMENT_PROCESSING
        if booking.status in ("AVAILABLE", "PAYMENT_REQUIRED", "CHECKOUT_READY", "PENDING", "SELECTED", "DRAFT"):
            BookingService.transition_booking_status(
                db=db,
                booking_id=booking.id,
                target_status="PAYMENT_PROCESSING",
                user=user,
                reason="Traveller initiated payment transaction.",
            )

        db.commit()
        db.refresh(tx)

        sim_payment_id = f"pay_{gateway_order_id}"
        sim_signature = SandboxPaymentGateway.generate_signature(gateway_order_id, sim_payment_id) if gateway in ("vanvas_pay_sandbox", "sandbox", "test") else None

        return PaymentInitiateResponse(
            booking_id=booking.id,
            payment_transaction_id=tx.id,
            payment_gateway=gateway,
            order_id=gateway_order_id,
            amount=tx.amount,
            currency=tx.currency,
            key_id=getattr(settings, "RAZORPAY_KEY_ID", None) if gateway == "razorpay" else "sandbox_key_vanvas",
            status=tx.status,
            expires_at=(datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
            checkout_payload={
                "order_id": gateway_order_id,
                "amount": tx.amount,
                "currency": tx.currency,
                "name": "VANVAS Travel",
                "description": f"Booking {booking.public_booking_reference}",
                "sandbox_simulated_payment_id": sim_payment_id,
                "sandbox_simulated_signature": sim_signature,
                "prefill": {
                    "name": user.full_name,
                    "email": user.email,
                }
            }
        )

    @classmethod
    def verify_payment(
        cls,
        db: Session,
        booking_id: str,
        user: User,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: Optional[str] = None,
        payment_transaction_id: Optional[str] = None,
    ) -> PaymentVerifyResponse:
        """
        Server-side signature and payment verification.
        Zero fake confirmations: Never creates a SUCCESS payment transaction from client claims.
        Transitions booking to CONFIRMED only if payment is cryptographically verified AND
        upstream provider returns a valid authoritative confirmation reference.
        """
        booking = BookingService.get_booking_by_id(db=db, booking_id=booking_id, user=user)

        # 1. Strictly locate authoritative PaymentTransaction created by server
        tx = None
        if payment_transaction_id:
            tx = db.query(PaymentTransaction).filter(
                PaymentTransaction.id == payment_transaction_id,
                PaymentTransaction.booking_id == booking.id,
                PaymentTransaction.user_id == user.id,
            ).first()
        if not tx:
            tx = db.query(PaymentTransaction).filter(
                PaymentTransaction.gateway_order_id == gateway_order_id,
                PaymentTransaction.booking_id == booking.id,
                PaymentTransaction.user_id == user.id,
            ).first()

        # Rule 2: NEVER create a SUCCESS payment from a client claim
        if not tx:
            logger.error(f"Payment verification failed: No server transaction found for booking={booking_id}, order={gateway_order_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PAYMENT_TRANSACTION_NOT_FOUND: No matching transaction initiated by server exists for this order.",
            )

        # Validate order and user match
        if tx.gateway_order_id != gateway_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mismatched gateway order ID for this transaction.",
            )
        if tx.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mismatched user for this payment transaction.",
            )
        if tx.booking_id != booking.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mismatched booking for this payment transaction.",
            )
        if round(float(tx.amount), 2) != round(float(booking.total_amount or 0.0), 2) or (tx.currency or "INR").upper() != (booking.currency or "INR").upper():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mismatched transaction amount or currency with booking.",
            )
        if not gateway_signature or not gateway_signature.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing payment gateway signature.",
            )

        # 2. Cryptographic signature verification based on payment gateway
        gateway_name = (tx.payment_gateway or "vanvas_pay_sandbox").lower().strip()

        if gateway_name == "razorpay":
            razorpay_secret = getattr(settings, "RAZORPAY_KEY_SECRET", None) or getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)
            if not razorpay_secret:
                # In strict production, fail if unconfigured
                if settings.is_production or getattr(settings, "PROVIDER_ENV", "sandbox").lower() == "production":
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Razorpay gateway secret not configured on server.",
                    )
                razorpay_secret = "sandbox_razorpay_secret_key"

            msg = f"{gateway_order_id}|{gateway_payment_id}".encode("utf-8")
            expected_sig = hmac.new(razorpay_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected_sig, gateway_signature):
                logger.warning(f"Razorpay signature verification rejected for order {gateway_order_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid payment gateway signature.",
                )

        elif gateway_name in ("vanvas_pay_sandbox", "sandbox", "test"):
            is_valid = SandboxPaymentGateway.verify_signature(
                order_id=gateway_order_id,
                payment_id=gateway_payment_id,
                signature=gateway_signature,
            )
            if not is_valid:
                logger.warning(f"Sandbox signature verification rejected for order {gateway_order_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid payment gateway signature.",
                )

            # Record capture in sandbox gateway
            try:
                SandboxPaymentGateway.capture(
                    order_id=gateway_order_id,
                    payment_id=gateway_payment_id,
                    amount=tx.amount,
                )
            except Exception as e:
                logger.error(f"Sandbox payment capture error: {e}")
                tx.status = "FAILED"
                booking.payment_status = "PAYMENT_FAILED"
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Payment capture failed: {str(e)}",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported payment gateway: {gateway_name}",
            )

        # 3. Mark payment transaction SUCCESS & advance booking to CONFIRMING
        tx.gateway_payment_id = gateway_payment_id
        tx.gateway_signature = gateway_signature
        tx.status = "SUCCESS"
        tx.updated_at = datetime.now(timezone.utc)
        booking.payment_status = "PAYMENT_SUCCESS"
        db.commit()

        # Transition to CONFIRMING state
        if booking.status != "CONFIRMING":
            BookingService.transition_booking_status(
                db=db,
                booking_id=booking.id,
                target_status="CONFIRMING",
                user=user,
                reason="Payment verified. Securing upstream provider reservation.",
                metadata={
                    "gateway_order_id": gateway_order_id,
                    "gateway_payment_id": gateway_payment_id,
                }
            )

        # 4. Call upstream provider create_booking()
        provider_adapter = ProviderFactory.get_booking_provider(booking.provider)
        provider_ref = None
        provider_error = None
        prov_offer_id = booking.provider_booking_id or (booking.items[0].provider_offer_id if booking.items else None) or booking.id

        try:
            prov_res = provider_adapter.create_booking(
                user_id=user.id,
                offer_id=prov_offer_id,
                payload={
                    "traveller_name": user.full_name,
                    "traveller_email": user.email,
                    "total_amount": booking.total_amount,
                    "currency": booking.currency,
                },
                idempotency_key=booking.idempotency_key or tx.idempotency_key,
            )
            if isinstance(prov_res, dict):
                if prov_res.get("status") == "FAILED" or "error" in prov_res:
                    provider_error = prov_res.get("error") or "Provider returned reservation failure."
                else:
                    provider_ref = prov_res.get("provider_booking_id") or prov_res.get("confirmation_code")
            if not provider_ref and not provider_error:
                provider_error = "Provider returned empty confirmation reference."
        except Exception as e:
            provider_error = str(e)
            logger.error(f"Upstream provider reservation failed for booking {booking.id}: {e}")

        # 5. Rule 3 & 4: Provider Failure MUST block CONFIRMED status
        if provider_ref and not provider_error:
            booking.provider_booking_id = provider_ref
            booking.confirmation_reference = provider_ref

            BookingService.transition_booking_status(
                db=db,
                booking_id=booking.id,
                target_status="CONFIRMED",
                user=user,
                reason="Payment verified and provider reservation confirmed.",
                metadata={
                    "gateway_order_id": gateway_order_id,
                    "gateway_payment_id": gateway_payment_id,
                    "provider_confirmation_reference": provider_ref,
                }
            )
            db.commit()
            db.refresh(booking)

            logger.info(f"Booking {booking.id} [{booking.public_booking_reference}] CONFIRMED with provider_ref={provider_ref}")
            return PaymentVerifyResponse(
                success=True,
                booking=booking,
                message="Payment verified and booking confirmed successfully.",
                public_booking_reference=booking.public_booking_reference,
            )
        else:
            # Rule 3: PAYMENT_SUCCESS -> CONFIRMATION_FAILED
            logger.error(f"Provider failed. Marking booking {booking.id} as CONFIRMATION_FAILED: {provider_error}")
            BookingService.transition_booking_status(
                db=db,
                booking_id=booking.id,
                target_status="CONFIRMATION_FAILED",
                user=user,
                reason=f"Payment verified but upstream provider reservation failed: {provider_error}",
                metadata={
                    "gateway_order_id": gateway_order_id,
                    "gateway_payment_id": gateway_payment_id,
                    "provider_error": provider_error,
                }
            )
            db.commit()
            db.refresh(booking)

            return PaymentVerifyResponse(
                success=False,
                booking=booking,
                message=f"Payment verified, but provider reservation failed ({provider_error}). Booking marked CONFIRMATION_FAILED.",
                public_booking_reference=booking.public_booking_reference,
            )

    @classmethod
    def reconcile_booking(
        cls,
        db: Session,
        booking_id: str,
        user: User,
    ) -> BookingReconcileResponse:
        """
        Reconciles booking state with authoritative external payment gateway and booking provider.
        Determines: CAPTURED, AUTHORIZED, FAILED, PENDING, UNKNOWN and updates database accordingly.
        Zero shortcuts: Always queries external gateway layer for transaction truth.
        """
        booking = BookingService.get_booking_by_id(db=db, booking_id=booking_id, user=user)

        # 1. Load latest PaymentTransaction
        tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.booking_id == booking.id
        ).order_by(PaymentTransaction.created_at.desc()).first()

        gateway_status = "UNKNOWN"
        provider_status = "UNKNOWN"

        if tx:
            gateway_name = (tx.payment_gateway or "vanvas_pay_sandbox").lower().strip()
            if gateway_name in ("vanvas_pay_sandbox", "sandbox", "test"):
                res = SandboxPaymentGateway.query_status(
                    order_id=tx.gateway_order_id,
                    payment_id=tx.gateway_payment_id,
                )
                gateway_status = res.get("status", "UNKNOWN")
            elif gateway_name == "razorpay":
                razorpay_key = getattr(settings, "RAZORPAY_KEY_ID", "")
                razorpay_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "") or getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "")
                if settings.is_production or getattr(settings, "PROVIDER_ENV", "sandbox").lower() == "production":
                    if not razorpay_key or not razorpay_secret:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Razorpay credentials not configured for production reconciliation.",
                        )
                    try:
                        import urllib.request
                        import base64
                        auth_str = f"{razorpay_key}:{razorpay_secret}"
                        b64_auth = base64.b64encode(auth_str.encode()).decode()
                        req_url = f"https://api.razorpay.com/v1/orders/{tx.gateway_order_id}"
                        r_req = urllib.request.Request(req_url, headers={"Authorization": f"Basic {b64_auth}"})
                        with urllib.request.urlopen(r_req, timeout=5) as resp:
                            if resp.status == 200:
                                r_data = json.loads(resp.read().decode())
                                r_status = r_data.get("status", "").lower()
                                if r_status == "paid":
                                    gateway_status = "CAPTURED"
                                elif r_status in ("created", "attempted"):
                                    gateway_status = "PENDING"
                                else:
                                    gateway_status = "FAILED"
                    except Exception as e:
                        logger.warning(f"Razorpay live query failed for order {tx.gateway_order_id}: {e}")
                        gateway_status = "UNKNOWN"
                else:
                    # In sandbox/test environment: query SandboxPaymentGateway
                    res = SandboxPaymentGateway.query_status(
                        order_id=tx.gateway_order_id,
                        payment_id=tx.gateway_payment_id,
                    )
                    gateway_status = res.get("status", "UNKNOWN")
            else:
                gateway_status = "UNKNOWN"

        # 2. Evaluate gateway status (NO local shortcuts)
        if gateway_status == "CAPTURED":
            if tx and tx.status != "SUCCESS":
                tx.status = "SUCCESS"
                tx.updated_at = datetime.now(timezone.utc)
            booking.payment_status = "PAYMENT_SUCCESS"

            # Transition to CONFIRMING if not yet advanced
            if booking.status in ("PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "AVAILABLE", "SELECTED", "CHECKOUT_READY", "DRAFT"):
                BookingService.transition_booking_status(
                    db=db,
                    booking_id=booking.id,
                    target_status="CONFIRMING",
                    user=user,
                    reason="Reconciliation verified payment. Checking provider reservation.",
                )

            # Check provider reservation
            provider_adapter = ProviderFactory.get_booking_provider(booking.provider)
            prov_ref = booking.provider_booking_id
            prov_offer_id = booking.provider_booking_id or (booking.items[0].provider_offer_id if booking.items else None) or booking.id

            if prov_ref:
                prov_res = provider_adapter.retrieve_booking(prov_ref)
                provider_status = prov_res.get("status", "UNKNOWN")

                if provider_status == "CONFIRMED":
                    if booking.status not in ("CONFIRMED", "CANCELLED", "REFUNDED"):
                        booking.confirmation_reference = prov_ref
                        BookingService.transition_booking_status(
                            db=db,
                            booking_id=booking.id,
                            target_status="CONFIRMED",
                            user=user,
                            reason="Reconciliation confirmed authoritative provider reservation.",
                            metadata={"provider_confirmation_reference": prov_ref}
                        )
                elif provider_status in ("NOT_FOUND", "FAILED"):
                    if booking.status not in ("CONFIRMATION_FAILED", "CANCELLED", "REFUNDED"):
                        BookingService.transition_booking_status(
                            db=db,
                            booking_id=booking.id,
                            target_status="CONFIRMATION_FAILED",
                            user=user,
                            reason="Reconciliation detected missing or failed provider reservation.",
                        )
                elif provider_status == "UNKNOWN":
                    logger.info(f"Reconciliation: Payment CAPTURED + Provider UNKNOWN for booking {booking.id}. Remaining in {booking.status}.")
            else:
                # No provider reference yet — attempt idempotent recovery if still in flight
                if booking.status in ("CONFIRMING", "PAYMENT_PROCESSING", "PAYMENT_REQUIRED"):
                    try:
                        prov_res = provider_adapter.create_booking(
                            user_id=user.id,
                            offer_id=prov_offer_id,
                            payload={
                                "traveller_name": user.full_name,
                                "traveller_email": user.email,
                                "total_amount": booking.total_amount,
                                "currency": booking.currency,
                            },
                            idempotency_key=booking.idempotency_key or (tx.idempotency_key if tx else None),
                        )
                        recovered_ref = prov_res.get("provider_booking_id") or prov_res.get("confirmation_code")
                        if recovered_ref:
                            booking.provider_booking_id = recovered_ref
                            booking.confirmation_reference = recovered_ref
                            provider_status = "CONFIRMED"
                            BookingService.transition_booking_status(
                                db=db,
                                booking_id=booking.id,
                                target_status="CONFIRMED",
                                user=user,
                                reason="Reconciliation recovered provider reservation.",
                                metadata={"provider_confirmation_reference": recovered_ref}
                            )
                        else:
                            provider_status = "FAILED"
                            BookingService.transition_booking_status(
                                db=db,
                                booking_id=booking.id,
                                target_status="CONFIRMATION_FAILED",
                                user=user,
                                reason="Reconciliation provider creation returned empty reference.",
                            )
                    except Exception as pe:
                        provider_status = "FAILED"
                        BookingService.transition_booking_status(
                            db=db,
                            booking_id=booking.id,
                            target_status="CONFIRMATION_FAILED",
                            user=user,
                            reason=f"Reconciliation provider creation error: {pe}",
                        )

        elif gateway_status in ("FAILED", "CANCELLED"):
            if tx:
                tx.status = "FAILED"
                tx.updated_at = datetime.now(timezone.utc)
            booking.payment_status = "PAYMENT_FAILED"
            if booking.status not in ("PAYMENT_FAILED", "CANCELLED", "FAILED"):
                BookingService.transition_booking_status(
                    db=db,
                    booking_id=booking.id,
                    target_status="PAYMENT_FAILED",
                    user=user,
                    reason="Reconciliation confirmed payment gateway failure.",
                )

        db.commit()
        db.refresh(booking)

        is_terminal = booking.status in ("CONFIRMED", "CANCELLED", "REFUNDED", "FAILED", "UNAVAILABLE")
        return BookingReconcileResponse(
            booking=booking,
            payment_status=booking.payment_status,
            is_terminal=is_terminal,
            message=f"Reconciliation complete. Status: {booking.status}, Gateway: {gateway_status}, Provider: {provider_status}",
        )
