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
            schedule_type="curated_schedule"
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
                schedule_type=r.get("schedule_type", "curated_schedule")
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
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(
        (Destination.id == destination_id) | (Destination.slug == destination_id)
    ).first()
    dest_id = dest.id if dest else destination_id

    # 1. Fetch curated DB stays
    query = db.query(Hotel).filter(Hotel.destination_id == dest_id)
    if style and style != "All":
        query = query.filter(Hotel.hotel_style.ilike(f"%{style}%"))
    if max_price:
        query = query.filter(Hotel.price_per_night <= max_price)
    
    curated_hotels = query.order_by(Hotel.rating.desc()).all()
    results: List[HotelResponse] = []
    seen_names = set()

    for h in curated_hotels:
        seen_names.add(h.name.lower().strip())
        results.append(HotelResponse(
            id=h.id,
            destination_id=h.destination_id,
            name=h.name,
            address=h.address,
            latitude=h.latitude,
            longitude=h.longitude,
            price_per_night=h.price_per_night,
            rating=h.rating,
            review_count=120,
            hotel_style=h.hotel_style or "Boutique / Mountain Stay",
            amenities=h.amenities or "WiFi,Hot Water",
            check_in_time=h.check_in_time or "11:00 AM",
            check_out_time=h.check_out_time or "10:00 AM",
            image_url=h.image_url,
            booking_url=h.booking_url,
            badge=h.badge or "Curated Sanctuary",
            phone=None,
            website=h.booking_url,
            source="vanvas_curated",
            source_id=h.id,
            is_live=False,
            price_verified=True,
            distance_km=None
        ))

    # 2. Query Live Accommodation Provider (OSM Overpass / Google Places)
    try:
        hotels_provider = ProviderFactory.get_hotels_provider()
        target_name = dest.name if dest else destination_id
        target_lat = dest.latitude if dest else None
        target_lng = dest.longitude if dest else None
        live_stays = await asyncio.wait_for(
            hotels_provider.search_hotels(
                destination=target_name,
                lat=target_lat,
                lng=target_lng,
                radius_km=15.0
            ),
            timeout=3.5
        )
        for ls in live_stays:
            norm = ls.get("name", "").lower().strip()
            if any(norm in s or s in norm for s in seen_names):
                continue
            if style and style != "All" and style.lower() not in ls.get("hotel_style", "").lower():
                continue
            seen_names.add(norm)
            results.append(HotelResponse(
                id=ls.get("id", f"live-stay-{ls.get('source_id', norm[:12])}"),
                destination_id=dest_id,
                name=ls["name"],
                address=ls.get("address", "Local Area"),
                latitude=ls["latitude"],
                longitude=ls["longitude"],
                price_per_night=ls.get("price_per_night"),
                rating=ls.get("rating"),
                review_count=ls.get("review_count"),
                hotel_style=ls.get("hotel_style", "Mountain Stay"),
                amenities=ls.get("amenities", "Mountain Views"),
                check_in_time=ls.get("check_in_time", "12:00 PM"),
                check_out_time=ls.get("check_out_time", "10:00 AM"),
                image_url=ls.get("image_url", f"/images/places/{dest.slug if dest else 'manali'}/categories/stay.webp"),
                booking_url=ls.get("booking_url"),
                badge=ls.get("badge", "Live POI Stay"),
                phone=ls.get("phone"),
                website=ls.get("website"),
                source=ls.get("source", "openstreetmap"),
                source_id=ls.get("source_id"),
                is_live=ls.get("is_live", True),
                price_verified=ls.get("price_verified", False),
                distance_km=ls.get("distance_km")
            ))
    except Exception:
        pass

    return results

@router.get("/rentals", response_model=List[RentalOptionResponse])
async def get_rentals(
    destination_id: str,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(
        (Destination.id == destination_id) | (Destination.slug == destination_id)
    ).first()
    dest_id = dest.id if dest else destination_id

    # 1. Fetch curated DB rentals
    query = db.query(RentalOption).filter(RentalOption.destination_id == dest_id)
    if vehicle_type and vehicle_type != "All":
        query = query.filter(RentalOption.vehicle_type.ilike(f"%{vehicle_type}%"))
    
    curated_rentals = query.order_by(RentalOption.price_per_day.asc()).all()
    results: List[RentalOptionResponse] = []
    seen_names = set()

    for r in curated_rentals:
        seen_names.add(r.vehicle_name.lower().strip())
        results.append(RentalOptionResponse(
            id=r.id,
            destination_id=r.destination_id,
            provider_name=r.provider_name,
            vehicle_type=r.vehicle_type,
            vehicle_name=r.vehicle_name,
            price_per_day=r.price_per_day,
            deposit_amount=r.deposit_amount,
            location=r.location,
            latitude=r.latitude,
            longitude=r.longitude,
            opening_hours=r.opening_hours or "08:00 AM - 08:00 PM",
            hours_available=True,
            rating=r.rating,
            image_url=r.image_url,
            phone=None,
            website=None,
            source="vanvas_curated",
            source_id=r.id,
            is_live=False,
            inventory_verified=True,
            distance_km=None
        ))

    # 2. Query Live Rentals Provider (OSM mobility hubs)
    try:
        rentals_provider = ProviderFactory.get_rentals_provider()
        target_name = dest.name if dest else destination_id
        target_lat = dest.latitude if dest else None
        target_lng = dest.longitude if dest else None
        live_rentals = await asyncio.wait_for(
            rentals_provider.search_rentals(
                destination=target_name,
                vehicle_type=vehicle_type,
                lat=target_lat,
                lng=target_lng,
                radius_km=15.0
            ),
            timeout=3.5
        )
        for lr in live_rentals:
            norm = lr.get("vehicle_name", "").lower().strip()
            if any(norm in s or s in norm for s in seen_names):
                continue
            seen_names.add(norm)
            results.append(RentalOptionResponse(
                id=lr.get("id", f"live-rent-{lr.get('source_id', norm[:12])}"),
                destination_id=dest_id,
                provider_name=lr["provider_name"],
                vehicle_type=lr.get("vehicle_type", "Scooter / Motorcycle"),
                vehicle_name=lr["vehicle_name"],
                price_per_day=lr.get("price_per_day"),
                deposit_amount=lr.get("deposit_amount"),
                location=lr.get("location", "Local Area"),
                latitude=lr["latitude"],
                longitude=lr["longitude"],
                opening_hours=lr.get("opening_hours", "Hours not listed"),
                hours_available=lr.get("hours_available", False),
                rating=lr.get("rating"),
                image_url=lr.get("image_url", "/images/vehicles/automatic_scooter.svg"),
                phone=lr.get("phone"),
                website=lr.get("website"),
                source=lr.get("source", "openstreetmap"),
                source_id=lr.get("source_id"),
                is_live=lr.get("is_live", True),
                inventory_verified=lr.get("inventory_verified", False),
                distance_km=lr.get("distance_km")
            ))
    except Exception:
        pass

    return results
