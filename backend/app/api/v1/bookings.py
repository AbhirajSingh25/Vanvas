"""
VANVAS Travel Commerce & Booking API Endpoints
Provider-neutral booking lifecycle, offer inspection, and checkout handoff.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, Booking
from app.schemas.schemas import (
    BookingResponse, BookingIntentCreateRequest, BookingTransitionRequest, Offer
)
from app.api.deps import get_current_user, get_current_admin
from app.services.booking_service import BookingService
from app.providers.commerce.discovery_adapter import DiscoveryCommerceAdapter
from app.providers.commerce.amadeus_stay_adapter import AmadeusStayCommerceAdapter

router = APIRouter()


@router.get("/bookings", response_model=List[BookingResponse])
def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves booking records strictly owned by the authenticated traveller.
    """
    bookings = BookingService.get_user_bookings(db=db, user=current_user)
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
    Initiates a new booking intent in DISCOVERED or CHECKOUT_READY state.
    """
    booking = BookingService.create_booking_intent(db=db, user=current_user, req=req)
    return booking


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
    Explicitly tags booking_capability as DISCOVERY_ONLY, EXTERNAL_CHECKOUT, or UNAVAILABLE.
    """
    offers: List[Offer] = []

    # 1. Live Stay Commerce Provider (Amadeus) if stay product requested
    p_type = (product_type or "").lower().strip()
    if not p_type or p_type in ["stay", "hotel", "accommodation"]:
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

    # 2. Discovery Commerce Adapter (Curated Stays, Places, Rentals, Transport)
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
    Checks provider-neutral availability across live providers and discovery tier.
    Returns explicit UNKNOWN, AVAILABLE, or UNAVAILABLE states without fabricating live inventory.
    """
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

