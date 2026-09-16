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

router = APIRouter()
arrival_optimizer = ArrivalOptimizer()

@router.get("/transport", response_model=List[TransportOptionResponse])
def get_transport_options(
    destination_id: str,
    origin_city: Optional[str] = "Delhi",
    transport_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TransportOption).filter(
        TransportOption.destination_id == destination_id,
        TransportOption.origin_city.ilike(f"%{origin_city}%")
    )
    if transport_type and transport_type != "All":
        query = query.filter(TransportOption.transport_type.ilike(f"%{transport_type}%"))
    
    return query.order_by(TransportOption.price.asc()).all()

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
def get_hotels(
    destination_id: str,
    style: Optional[str] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Hotel).filter(Hotel.destination_id == destination_id)
    if style and style != "All":
        query = query.filter(Hotel.hotel_style.ilike(f"%{style}%"))
    if max_price:
        query = query.filter(Hotel.price_per_night <= max_price)
    
    return query.order_by(Hotel.rating.desc()).all()

@router.get("/rentals", response_model=List[RentalOptionResponse])
def get_rentals(
    destination_id: str,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RentalOption).filter(RentalOption.destination_id == destination_id)
    if vehicle_type and vehicle_type != "All":
        query = query.filter(RentalOption.vehicle_type.ilike(f"%{vehicle_type}%"))
    
    return query.order_by(RentalOption.price_per_day.asc()).all()
