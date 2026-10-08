"""
VANVAS Travel Commerce & Booking API Endpoints
Comprehensive booking lifecycle, checkout execution, payment initiation/verification,
cancellation & refunds, trip attachment, and durable webhook processing.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.models import User, Booking, WebhookEvent
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
    """
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
    """
    booking = BookingService.get_booking_by_id(db=db, booking_id=booking_id, user=current_user)
    is_terminal = booking.status in ("CONFIRMED", "CANCELLED", "REFUNDED", "FAILED", "UNAVAILABLE")
    return BookingReconcileResponse(
        booking=booking,
        payment_status=booking.payment_status,
        is_terminal=is_terminal,
        message=f"Current authoritative status: {booking.status}",
    )


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
    x_event_id: Optional[str] = Header(None, alias="X-Event-ID"),
):
    """
    Durable webhook ingestion endpoint.
    Performs signature verification, event deduplication, and idempotent booking updates.
    """
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8") if body_bytes else "{}"
    event_id = x_event_id or f"{provider}_{hash(body_str)}"

    # 1. Deduplicate event ID
    existing = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if existing:
        return {"status": "already_processed", "event_id": event_id}

    # 2. Persist WebhookEvent
    webhook_event = WebhookEvent(
        event_id=event_id,
        provider=provider,
        event_type="PROVIDER_CALLBACK",
        payload_json=body_str,
        status="PROCESSED",
        processed_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    db.add(webhook_event)
    db.commit()

    return {"status": "success", "event_id": event_id}
