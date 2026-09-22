import asyncio
from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import TransportOption, Hotel, RentalOption, Destination
from app.schemas.schemas import (
    TransportOptionResponse, HotelResponse, RentalOptionResponse,
    ArrivalOptimizerRequest, ArrivalOptimizerResponse
)
from app.itinerary.arrival_optimizer import ArrivalOptimizer
from app.providers.provider_factory import ProviderFactory
from app.itinerary.clustering import haversine_distance_km

from app.services.action_link_generator import ActionLinkGenerator
from app.services.operating_hours_engine import OperatingHoursEngine

router = APIRouter()
arrival_optimizer = ArrivalOptimizer()

@router.get("/transport", response_model=List[TransportOptionResponse])
async def get_transport_options(
    destination_id: str,
    origin_city: Optional[str] = "Delhi",
    transport_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(
        (Destination.id == destination_id) | (Destination.slug == destination_id)
    ).first()
    dest_id = dest.id if dest else destination_id

    query = db.query(TransportOption).filter(
        TransportOption.destination_id == dest_id,
        TransportOption.origin_city.ilike(f"%{origin_city}%")
    )
    if transport_type and transport_type != "All":
        query = query.filter(TransportOption.transport_type.ilike(f"%{transport_type}%"))
    
    db_options = query.order_by(TransportOption.price.asc()).all()
    results: List[TransportOptionResponse] = []

    for opt in db_options:
        action_links = ActionLinkGenerator.generate_transport_action_links(
            operator_name=opt.operator_name,
            booking_url=opt.booking_url,
        )
        results.append(TransportOptionResponse(
            id=opt.id,
            origin_city=opt.origin_city,
            destination_id=opt.destination_id,
            transport_type=opt.transport_type,
            operator_name=opt.operator_name,
            departure_time=opt.departure_time,
            arrival_time=opt.arrival_time,
            duration_hours=opt.duration_hours,
            price=opt.price,
            departure_location=opt.departure_location,
            arrival_location=opt.arrival_location,
            booking_url=opt.booking_url,
            recommendation_badge=opt.recommendation_badge or "Best Arrival Time",
            source="vanvas_curated",
            source_id=opt.id,
            is_live=False,
            schedule_type="curated_schedule",
            action_links=action_links,
            data_state="VERIFIED",
            trust_source="VANVAS_CURATED",
        ))

    if not results:
        # Fallback to provider search with explicit schedule provenance
        transport_provider = ProviderFactory.get_transport_provider()
        target_name = dest.name if dest else destination_id
        try:
            live_routes = await asyncio.wait_for(
                transport_provider.search_routes(
                    origin=origin_city or "Delhi",
                    destination=target_name,
                    transport_type=transport_type
                ),
                timeout=3.5
            )
        except Exception:
            live_routes = []
        for r in live_routes:
            action_links = ActionLinkGenerator.generate_transport_action_links(
                operator_name=r["operator_name"],
                booking_url=r.get("booking_url"),
            )
            results.append(TransportOptionResponse(
                id=r.get("id", f"curated-{r['operator_name'].lower().replace(' ', '-')[:12]}"),
                origin_city=r.get("origin_city", origin_city or "Delhi"),
                destination_id=dest_id,
                transport_type=r["transport_type"],
                operator_name=r["operator_name"],
                departure_time=r["departure_time"],
                arrival_time=r["arrival_time"],
                duration_hours=r["duration_hours"],
                price=r["price"],
                departure_location=r["departure_location"],
                arrival_location=r["arrival_location"],
                booking_url=r.get("booking_url"),
                recommendation_badge=r.get("recommendation_badge", "Curated Schedule"),
                source=r.get("source", "vanvas_curated"),
                source_id=r.get("source_id", "curated-schedule"),
                is_live=r.get("is_live", False),
                schedule_type=r.get("schedule_type", "curated_schedule"),
                action_links=action_links,
                data_state=r.get("data_state", "VERIFIED"),
                trust_source=r.get("trust_source", "VANVAS_CURATED"),
            ))

    return results

@router.post("/arrival-optimizer", response_model=ArrivalOptimizerResponse)
def optimize_arrival_timing(
    req: ArrivalOptimizerRequest,
    db: Session = Depends(get_db)
):
    destination = db.query(Destination).filter(
        (Destination.id == req.destination_id) | (Destination.slug == req.destination_id)
    ).first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")

    query = db.query(TransportOption).filter(
        TransportOption.destination_id == destination.id,
        TransportOption.origin_city.ilike(f"%{req.origin_city}%")
    )
    if req.preferred_mode and req.preferred_mode != "All":
        query = query.filter(TransportOption.transport_type.ilike(f"%{req.preferred_mode}%"))

    options = query.all()
    hotel = db.query(Hotel).filter(Hotel.destination_id == destination.id).first()

    result = arrival_optimizer.optimize_arrival(
        destination_name=destination.name,
        transport_options=options,
        hotel=hotel
    )

    return result

@router.get("/hotels", response_model=List[HotelResponse])
async def get_hotels(
    destination_id: str,
    style: Optional[str] = None,
    traveller_profile: Optional[str] = None,
    max_price: Optional[float] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 1,
    children: int = 0,
    db: Session = Depends(get_db)
):
    from app.services.stay_matching_service import StayMatchingService
    return await StayMatchingService.match_stays(
        db=db,
        destination_id=destination_id,
        style=style,
        traveller_profile=traveller_profile,
        max_price=max_price,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        children=children,
    )

@router.get("/rentals", response_model=List[RentalOptionResponse])
async def get_rentals(
    destination_id: str,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from app.services.mobility_service import MobilityService
    listings = await MobilityService.get_mobility_listings(
        db=db,
        destination_slug_or_id=destination_id,
        vehicle_type=vehicle_type,
    )
    return listings

