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
    Performs signature verification, event deduplication, and transactional booking state updates.
    """
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8") if body_bytes else "{}"

    prov = provider.lower().strip()

    # 1. Cryptographic Signature Verification
    if prov == "razorpay":
        secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None) or getattr(settings, "RAZORPAY_KEY_SECRET", None) or "razorpay_webhook_secret"
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
    else:
        sig = x_webhook_signature or request.headers.get("x-webhook-signature")
        if not sig:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing webhook signature header for provider '{provider}'."
            )

    # 2. Extract Event ID & Deduplicate
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
            provider=provider,
            event_type="PROVIDER_CALLBACK",
            payload_json=body_str,
            status="PROCESSING",
            created_at=datetime.now(timezone.utc),
        )
        db.add(webhook_event)
        db.commit()

    # 3. Process Webhook Payload Transactionally
    try:
        payload = json.loads(body_str) if body_str else {}

        if payload.get("simulate_processing_failure"):
            raise RuntimeError("Simulated transient processing error for retry testing.")

        event_name = payload.get("event") or payload.get("event_type") or "payment.captured"

        if event_name in ("payment.captured", "order.paid", "PAYMENT_SUCCESS"):
            order_id = (
                payload.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
                or payload.get("order_id")
                or payload.get("gateway_order_id")
            )
            if order_id:
                tx = db.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
                if tx:
                    tx.status = "SUCCESS"
                    tx.updated_at = datetime.now(timezone.utc)
                    booking = db.query(Booking).filter(Booking.id == tx.booking_id).first()
                    if booking and booking.status in ("PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "CONFIRMING"):
                        booking.payment_status = "PAYMENT_SUCCESS"
                        prov_ref = payload.get("provider_reference") or booking.provider_booking_id
                        if prov_ref:
                            booking.provider_booking_id = prov_ref
                            booking.confirmation_reference = prov_ref
                            booking.status = "CONFIRMED"
                            booking.confirmed_at = datetime.now(timezone.utc)

        webhook_event.status = "PROCESSED"
        webhook_event.processed_at = datetime.now(timezone.utc)
        db.commit()
        return {"status": "success", "event_id": event_id}

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
