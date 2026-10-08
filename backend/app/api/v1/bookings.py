import hmac
import hashlib
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.models import User, Booking, WebhookEvent, PaymentTransaction
from app.schemas.schemas import (
    BookingResponse, BookingIntentCreateRequest, BookingTransitionRequest,
    BookingCheckoutInitiateRequest, PaymentInitiateRequest, PaymentInitiateResponse,
    PaymentVerifyRequest, PaymentVerifyResponse, BookingCancellationRequest,
    BookingCancellationResponse, BookingReconcileResponse, Offer
)
from app.api.deps import get_current_user, get_current_admin
from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService
from app.providers.commerce.discovery_adapter import DiscoveryCommerceAdapter
from app.providers.commerce.amadeus_stay_adapter import AmadeusStayCommerceAdapter
from app.providers.commerce.stayingapi_stay_adapter import StayingAPIStayCommerceAdapter
from app.providers.commerce.sandbox_stay_adapter import SandboxStayAdapter
from app.providers.commerce.sandbox_payment_adapter import SandboxPaymentGateway
from app.providers.provider_factory import ProviderFactory

logger = logging.getLogger("vanvas.api.bookings")
router = APIRouter()


@router.get("/bookings", response_model=List[BookingResponse])
def get_user_bookings(
    status_filter: Optional[str] = Query(None, alias="status", description="All, upcoming, completed, cancelled, refunded"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves booking records strictly owned by the authenticated traveller.
    Supports status filtering (Upcoming, Completed, Cancelled, Refunded).
    """
    bookings = BookingService.get_user_bookings(db=db, user=current_user, status_filter=status_filter)
    return bookings


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking_detail(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves details for a specific booking.
    Strictly restricted to the booking owner or an admin.
    """
    booking = BookingService.get_booking_by_id(db=db, booking_id=booking_id, user=current_user)
    return booking


@router.post("/bookings/intent", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_intent(
    req: BookingIntentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiates a new booking intent in DRAFT, SELECTED, or CHECKOUT_READY state.
    """
    booking = BookingService.create_booking_intent(db=db, user=current_user, req=req)
    return booking


@router.post("/bookings/checkout", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def initiate_checkout(
    req: BookingCheckoutInitiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiates an end-to-end checkout by revalidating price and availability with the provider,
    calculating authoritative taxes/fees, and transitioning to PAYMENT_REQUIRED.
    """
    booking = BookingService.initiate_checkout(db=db, user=current_user, req=req)
    return booking


@router.post("/bookings/{booking_id}/pay", response_model=PaymentInitiateResponse)
def initiate_payment(
    booking_id: str,
    req: PaymentInitiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiates a payment order for the booking.
    Calculates authoritative amount directly from server state.
    """
    res = PaymentService.initiate_payment(
        db=db,
        booking_id=booking_id,
        user=current_user,
        payment_gateway=req.payment_gateway,
        idempotency_key=req.idempotency_key,
    )
    return res


@router.post("/bookings/{booking_id}/verify-payment", response_model=PaymentVerifyResponse)
def verify_payment(
    booking_id: str,
    req: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifies cryptographic payment signature / token, completes upstream reservation,
    and transitions booking to CONFIRMED with immutable frozen snapshot.
    """
    res = PaymentService.verify_payment(
        db=db,
        booking_id=booking_id,
        user=current_user,
        gateway_order_id=req.gateway_order_id,
        gateway_payment_id=req.gateway_payment_id,
        gateway_signature=req.gateway_signature,
        payment_transaction_id=req.payment_transaction_id,
    )
    return res


@router.post("/bookings/{booking_id}/transition", response_model=BookingResponse)
def transition_booking_status(
    booking_id: str,
    req: BookingTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Safely transitions a booking status according to the valid state transition graph.
    Privileged states (CONFIRMED, REFUNDED, PROVIDER_CONFIRMED) cannot be set directly by clients.
    """
    privileged_states = {"CONFIRMED", "REFUNDED", "PROVIDER_CONFIRMED"}
    target = req.target_status.upper().strip()
    if target in privileged_states and getattr(current_user, "role", "") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Direct client transition to privileged state '{target}' is forbidden. Use verify-payment, cancellation, or reconciliation flows.",
        )
    booking = BookingService.transition_status(db=db, booking_id=booking_id, user=current_user, req=req)
    return booking


@router.post("/bookings/{booking_id}/cancel", response_model=BookingCancellationResponse)
def cancel_booking(
    booking_id: str,
    req: BookingCancellationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancels a booking, updates provider, and processes refund if eligible.
    """
    res = BookingService.cancel_booking(db=db, booking_id=booking_id, user=current_user, reason=req.reason)
    return res


@router.post("/bookings/{booking_id}/reconcile", response_model=BookingReconcileResponse)
def reconcile_booking_state(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reconciles client state with authoritative backend/provider state during network timeouts.
    Queries external payment gateway and booking provider for real state.
    """
    return PaymentService.reconcile_booking(db=db, booking_id=booking_id, user=current_user)


@router.post("/bookings/{booking_id}/attach-trip", response_model=BookingResponse)
def attach_booking_to_trip(
    booking_id: str,
    trip_id: str = Query(..., description="Target Trip ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Attaches a booking to an authorized trip.
    """
    booking = BookingService.attach_to_trip(db=db, booking_id=booking_id, trip_id=trip_id, user=current_user)
    return booking


@router.get("/offers", response_model=List[Offer])
def search_commerce_offers(
    destination: str = Query(..., description="Destination slug or name"),
    product_type: Optional[str] = Query(None, description="stay, transport, rental, place"),
    query: Optional[str] = Query(None, description="Search keyword"),
    max_price: Optional[float] = Query(None, description="Maximum budget threshold"),
    db: Session = Depends(get_db),
):
    """
    Searches provider-neutral offers from discovery entities and verified live commerce providers.
    Explicitly tags booking_capability as DISCOVERY_ONLY, EXTERNAL_CHECKOUT, or IN_APP_BOOKING.
    """
    offers: List[Offer] = []
    p_type = (product_type or "").lower().strip()

    # 1. Sandbox Stay Provider if running in sandbox / development mode
    if getattr(settings, "PROVIDER_ENV", "sandbox").lower() == "sandbox" or not settings.is_production:
        sandbox_adapter = SandboxStayAdapter()
        sandbox_offers = sandbox_adapter.search(
            destination=destination,
            product_type=product_type,
            query=query,
            max_price=max_price,
        )
        if sandbox_offers:
            offers.extend(sandbox_offers)

    # 2. Live Stay Commerce Providers (StayingAPI & Amadeus) if stay product requested
    if not p_type or p_type in ["stay", "hotel", "accommodation", "homestay", "resort"]:
        stayingapi_adapter = StayingAPIStayCommerceAdapter()
        if stayingapi_adapter.is_configured:
            try:
                live_staying_offers = stayingapi_adapter.search_offers(
                    destination=destination,
                    product_type=product_type,
                    query=query,
                    max_price=max_price,
                )
                if live_staying_offers:
                    offers.extend(live_staying_offers)
            except Exception:
                pass

        amadeus_adapter = AmadeusStayCommerceAdapter()
        if amadeus_adapter.is_configured:
            try:
                live_offers = amadeus_adapter.search_offers(
                    destination=destination,
                    product_type=product_type,
                    query=query,
                    max_price=max_price,
                )
                if live_offers:
                    offers.extend(live_offers)
            except Exception:
                pass

    # 3. Discovery Commerce Adapter (Curated Stays, Places, Rentals, Transport)
    discovery_adapter = DiscoveryCommerceAdapter(db=db)
    discovery_offers = discovery_adapter.search_offers(
        destination=destination,
        product_type=product_type,
        query=query,
        max_price=max_price,
    )
    offers.extend(discovery_offers)

    return offers


@router.get("/offers/{offer_id}/availability")
def check_offer_availability(
    offer_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    guests: int = 1,
    db: Session = Depends(get_db),
):
    """
    Checks provider-neutral availability across live providers, sandbox, and discovery tier.
    Returns explicit UNKNOWN, AVAILABLE, or UNAVAILABLE states without fabricating live inventory.
    """
    if offer_id.startswith("sbox-") or offer_id.startswith("sandbox-"):
        sandbox_adapter = SandboxStayAdapter()
        return sandbox_adapter.availability(
            offer_id=offer_id,
            start_date=start_date,
            end_date=end_date,
            guests=guests,
        )

    if offer_id.startswith("stayingapi-") or offer_id.startswith("stayingapi_"):
        stayingapi_adapter = StayingAPIStayCommerceAdapter()
        return stayingapi_adapter.check_availability(
            offer_id=offer_id,
            start_date=start_date,
            end_date=end_date,
            guests=guests,
        )

    if offer_id.startswith("amadeus-") or offer_id.startswith("amadeus_"):
        amadeus_adapter = AmadeusStayCommerceAdapter()
        return amadeus_adapter.check_availability(
            offer_id=offer_id,
            start_date=start_date,
            end_date=end_date,
            guests=guests,
        )

    discovery_adapter = DiscoveryCommerceAdapter(db=db)
    return discovery_adapter.check_availability(
        offer_id=offer_id,
        start_date=start_date,
        end_date=end_date,
        guests=guests,
    )


SUPPORTED_WEBHOOK_PROVIDERS = {
    "razorpay",
    "sandbox",
    "vanvas_pay_sandbox",
    "sandbox_stay",
}

SUPPORTED_SUCCESS_WEBHOOK_EVENTS = {
    "payment.captured",
    "order.paid",
    "PAYMENT_SUCCESS",
    "payment_captured",
    "order_paid",
}

SUPPORTED_FAILURE_WEBHOOK_EVENTS = {
    "payment.failed",
    "order.failed",
    "PAYMENT_FAILED",
    "payment_failed",
    "order_failed",
}


@router.post("/bookings/webhooks/{provider}")
async def handle_provider_webhook(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    x_event_id: Optional[str] = Header(None, alias="X-Event-ID"),
):
    """
    Durable webhook ingestion endpoint.
    Performs provider boundary verification, cryptographic signature check,
    amount/currency binding, event deduplication, and transactional state updates.
    """
    prov = (provider or "").lower().strip()

    # 1. Strict Provider Boundary Check
    # Unsupported providers are rejected immediately without DB mutation.
    if prov not in SUPPORTED_WEBHOOK_PROVIDERS:
        logger.warning(f"Webhook request received for unsupported provider: '{provider}'")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook provider is not configured.",
        )

    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8") if body_bytes else "{}"

    # 2. Cryptographic Signature Verification
    if prov == "razorpay":
        secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None) or getattr(settings, "RAZORPAY_KEY_SECRET", None)
        if not secret:
            if settings.is_production or getattr(settings, "PROVIDER_ENV", "sandbox").lower() == "production":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Razorpay webhook secret is not configured on server.",
                )
            secret = "razorpay_webhook_secret"
        sig = x_razorpay_signature or x_webhook_signature or request.headers.get("x-razorpay-signature") or request.headers.get("x-webhook-signature")
        if not sig:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Razorpay webhook signature header."
            )
        computed_sig = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(computed_sig, sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Razorpay webhook signature."
            )
    elif prov in ("sandbox", "vanvas_pay_sandbox", "sandbox_stay"):
        sandbox_secret = "vanvas_sandbox_webhook_secret_2026"
        sig = x_webhook_signature or request.headers.get("x-webhook-signature") or x_razorpay_signature
        if not sig:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing sandbox webhook signature header."
            )
        computed_sig = hmac.new(sandbox_secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(computed_sig, sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid sandbox webhook signature."
            )

    # 3. Extract Event ID & Deduplicate
    event_id = x_event_id or request.headers.get("x-event-id")
    if not event_id:
        try:
            parsed = json.loads(body_str) if body_str else {}
            event_id = parsed.get("id") or parsed.get("event_id") or f"{prov}_{hashlib.sha256(body_bytes).hexdigest()[:16]}"
        except Exception:
            event_id = f"{prov}_{hashlib.sha256(body_bytes).hexdigest()[:16]}"

    existing = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if existing:
        if existing.status == "PROCESSED":
            return {"status": "already_processed", "event_id": event_id, "message": "Duplicate event safely ignored."}
        elif existing.status == "PROCESSING":
            return {"status": "processing", "event_id": event_id, "message": "Webhook is currently being processed."}
        elif existing.status == "FAILED":
            webhook_event = existing
            webhook_event.status = "PROCESSING"
            webhook_event.payload_json = body_str
            db.commit()
        else:
            webhook_event = existing
    else:
        webhook_event = WebhookEvent(
            event_id=event_id,
            provider=prov,
            event_type="PROVIDER_CALLBACK",
            payload_json=body_str,
            status="PROCESSING",
            created_at=datetime.now(timezone.utc),
        )
        db.add(webhook_event)
        db.commit()

    # 4. Process Webhook Payload Transactionally
    try:
        payload = json.loads(body_str) if body_str else {}

        if payload.get("simulate_processing_failure"):
            raise RuntimeError("Simulated transient processing error for retry testing.")

        event_name = (
            payload.get("event")
            or payload.get("event_type")
            or payload.get("type")
        )

        # 4a. Unknown Event Type Validation — DO NOT default unknown events to payment.captured
        if not event_name or (
            event_name not in SUPPORTED_SUCCESS_WEBHOOK_EVENTS
            and event_name not in SUPPORTED_FAILURE_WEBHOOK_EVENTS
        ):
            logger.info(f"Webhook event '{event_name}' received for provider '{prov}' is not an actionable payment lifecycle event. Acknowledging without mutation.")
            webhook_event.status = "PROCESSED"
            webhook_event.event_type = event_name or "UNKNOWN"
            webhook_event.processed_at = datetime.now(timezone.utc)
            db.commit()
            return {"status": "ignored", "event_id": event_id, "message": f"Event '{event_name}' safely acknowledged without booking mutation."}

        webhook_event.event_type = event_name

        if event_name in SUPPORTED_SUCCESS_WEBHOOK_EVENTS:
            order_id = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
                or payload.get("order_id")
                or payload.get("gateway_order_id")
            )
            payment_id = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
                or payload.get("payment_id")
                or payload.get("gateway_payment_id")
            )
            amount_val = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("amount")
                if "amount" in payload.get("payload", {}).get("payment", {}).get("entity", {})
                else payload.get("amount")
            )
            currency_val = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("currency")
                or payload.get("currency")
            )

            tx = None
            if order_id:
                tx = db.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
            if not tx and payment_id:
                tx = db.query(PaymentTransaction).filter(PaymentTransaction.gateway_payment_id == payment_id).first()

            if tx:
                # Validate order ID match
                if order_id and tx.gateway_order_id and order_id != tx.gateway_order_id:
                    logger.error(f"Webhook order ID mismatch: payload={order_id}, tx={tx.gateway_order_id}")
                    webhook_event.status = "FAILED"
                    db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Webhook order mismatch with transaction.",
                    )

                # Validate payment ID association if transaction already has one recorded
                if tx.gateway_payment_id and payment_id and tx.gateway_payment_id != payment_id:
                    logger.error(f"Webhook payment ID mismatch: payload={payment_id}, tx={tx.gateway_payment_id}")
                    webhook_event.status = "FAILED"
                    db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Webhook payment ID mismatch with transaction.",
                    )

                # Validate amount match
                if amount_val is not None:
                    try:
                        amt_float = float(amount_val)
                        if prov == "razorpay" and amt_float > (tx.amount * 50):
                            amt_float = amt_float / 100.0
                        if round(amt_float, 2) != round(float(tx.amount), 2):
                            logger.error(f"Webhook amount mismatch: payload={amt_float}, tx={tx.amount}")
                            webhook_event.status = "FAILED"
                            db.commit()
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Webhook amount mismatch: payload amount {amt_float} does not match transaction amount {tx.amount}."
                            )
                    except ValueError:
                        webhook_event.status = "FAILED"
                        db.commit()
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid amount format in webhook payload."
                        )

                # Validate currency match
                if currency_val is not None and str(currency_val).strip():
                    if str(currency_val).upper().strip() != (tx.currency or "INR").upper().strip():
                        logger.error(f"Webhook currency mismatch: payload={currency_val}, tx={tx.currency}")
                        webhook_event.status = "FAILED"
                        db.commit()
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Webhook currency mismatch: payload currency {currency_val} does not match transaction currency {tx.currency}."
                        )

                gateway_name = (tx.payment_gateway or prov).lower().strip()
                if gateway_name in ("vanvas_pay_sandbox", "sandbox", "test"):
                    # Record capture in sandbox gateway if needed
                    gw_res = SandboxPaymentGateway.query_status(order_id=tx.gateway_order_id, payment_id=tx.gateway_payment_id or payment_id)
                    if gw_res.get("status") != "CAPTURED" and "fail" not in str(order_id).lower() and "fail" not in str(payment_id).lower():
                        SandboxPaymentGateway.capture(tx.gateway_order_id, payment_id or f"pay_{tx.gateway_order_id}", amount=tx.amount)
                        gw_res = SandboxPaymentGateway.query_status(order_id=tx.gateway_order_id, payment_id=tx.gateway_payment_id or payment_id)
                    gateway_status = gw_res.get("status", "UNKNOWN")
                else:
                    gateway_status = "CAPTURED"

                if gateway_status == "CAPTURED":
                    tx.status = "SUCCESS"
                    if payment_id and not tx.gateway_payment_id:
                        tx.gateway_payment_id = payment_id
                    tx.updated_at = datetime.now(timezone.utc)

                    booking = db.query(Booking).filter(Booking.id == tx.booking_id).first()
                    if booking:
                        booking.payment_status = "PAYMENT_SUCCESS"
                        user = db.query(User).filter(User.id == booking.user_id).first()

                        # Advance booking to CONFIRMING via server-controlled BookingService
                        if booking.status in ("PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "AVAILABLE", "SELECTED", "CHECKOUT_READY", "DRAFT"):
                            if user:
                                BookingService.transition_booking_status(
                                    db=db,
                                    booking_id=booking.id,
                                    target_status="CONFIRMING",
                                    user=user,
                                    reason="Verified webhook confirmed payment. Verifying provider reservation.",
                                )

                        # Validate provider reference independently
                        prov_ref = (
                            payload.get("provider_reference")
                            or payload.get("confirmation_reference")
                            or payload.get("booking_reference")
                            or booking.provider_booking_id
                        )

                        if prov_ref:
                            provider_adapter = ProviderFactory.get_booking_provider(booking.provider)
                            prov_res = provider_adapter.retrieve_booking(prov_ref)
                            prov_status = prov_res.get("status", "UNKNOWN") if isinstance(prov_res, dict) else "UNKNOWN"

                            if prov_status == "CONFIRMED":
                                booking.provider_booking_id = prov_ref
                                booking.confirmation_reference = prov_ref
                                if booking.status not in ("CONFIRMED", "CANCELLED", "REFUNDED") and user:
                                    BookingService.transition_booking_status(
                                        db=db,
                                        booking_id=booking.id,
                                        target_status="CONFIRMED",
                                        user=user,
                                        reason="Verified webhook and verified provider reservation.",
                                        metadata={"provider_confirmation_reference": prov_ref, "webhook_event_id": event_id}
                                    )
                            elif prov_status in ("FAILED", "NOT_FOUND"):
                                if booking.status not in ("CONFIRMATION_FAILED", "CANCELLED", "REFUNDED") and user:
                                    BookingService.transition_booking_status(
                                        db=db,
                                        booking_id=booking.id,
                                        target_status="CONFIRMATION_FAILED",
                                        user=user,
                                        reason=f"Verified webhook received, but provider returned reservation status: {prov_status}",
                                        metadata={"provider_reference": prov_ref}
                                    )
                            else:
                                # UNKNOWN: Keep in CONFIRMING, do not confirm
                                logger.info(f"Webhook payment captured, but provider reference {prov_ref} returned status UNKNOWN. Remaining in {booking.status}.")
                        else:
                            # No provider reference: Keep in CONFIRMING
                            logger.info(f"Webhook payment captured, but no provider reference. Remaining in {booking.status}.")
            else:
                logger.warning(f"Webhook payment transaction not found in local DB: order_id={order_id}, payment_id={payment_id}. Safe acknowledgement.")

        elif event_name in SUPPORTED_FAILURE_WEBHOOK_EVENTS:
            order_id = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
                or payload.get("order_id")
                or payload.get("gateway_order_id")
            )
            payment_id = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
                or payload.get("payment_id")
                or payload.get("gateway_payment_id")
            )
            tx = None
            if order_id:
                tx = db.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
            if not tx and payment_id:
                tx = db.query(PaymentTransaction).filter(PaymentTransaction.gateway_payment_id == payment_id).first()

            if tx:
                tx.status = "FAILED"
                tx.updated_at = datetime.now(timezone.utc)
                booking = db.query(Booking).filter(Booking.id == tx.booking_id).first()
                if booking and booking.status not in ("PAYMENT_FAILED", "CANCELLED", "REFUNDED"):
                    booking.payment_status = "PAYMENT_FAILED"
                    user = db.query(User).filter(User.id == booking.user_id).first()
                    if user:
                        BookingService.transition_booking_status(
                            db=db,
                            booking_id=booking.id,
                            target_status="PAYMENT_FAILED",
                            user=user,
                            reason="Webhook reported payment failure.",
                        )

        webhook_event.status = "PROCESSED"
        webhook_event.processed_at = datetime.now(timezone.utc)
        db.commit()
        return {"status": "success", "event_id": event_id}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        webhook_event.status = "FAILED"
        webhook_event.processed_at = None
        db.commit()
        logger.error(f"Webhook processing failed for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failure: {str(e)}"
        )
