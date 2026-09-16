from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Destination, Place, Hotel, RentalOption, WeatherSnapshot
from app.schemas.schemas import DestinationResponse, PlaceResponse, HotelResponse, RentalOptionResponse
from app.providers.provider_factory import ProviderFactory
from app.services.destination_intelligence import DestinationIntelligenceService

router = APIRouter()

@router.get("/search")
async def search_destinations_autocomplete(
    q: str = Query(..., min_length=1, description="Search query for destinations, regions, or landmarks"),
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Live autocomplete search supporting curated and arbitrary global/Indian destinations.
    City / locality ranking prioritized over country matches.
    """
    geocoder = ProviderFactory.get_geocoding_provider()
    results = await geocoder.autocomplete(q, limit=limit)
    return results

@router.post("/resolve")
async def resolve_destination(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Resolves destination metadata without mutating the database.
    If curated in DB, returns curated record; if unseeded, returns dynamic geocoding.
    """
    dest = await DestinationIntelligenceService.resolve_destination(query, db)
    if dest:
        return {
            "id": dest.id,
            "name": dest.name,
            "slug": dest.slug,
            "state": dest.state,
            "region": dest.region,
            "tagline": dest.tagline,
            "hero_image": dest.hero_image,
            "latitude": dest.latitude,
            "longitude": dest.longitude,
            "altitude_meters": dest.altitude_meters,
            "weather_type": dest.weather_type,
            "is_curated": True,
            "is_dynamic": False
        }

    dyn = await DestinationIntelligenceService.resolve_dynamic_destination(query)
    if not dyn:
        raise HTTPException(status_code=404, detail=f"Could not resolve destination '{query}'")
    return {
        "id": dyn["id"],
        "name": dyn["name"],
        "slug": dyn["slug"],
        "state": dyn["state"],
        "region": dyn["region"],
        "tagline": dyn["tagline"],
        "hero_image": dyn["hero_image"],
        "latitude": dyn["latitude"],
        "longitude": dyn["longitude"],
        "altitude_meters": dyn["altitude_meters"],
        "weather_type": dyn["weather_type"],
        "is_curated": False,
        "is_dynamic": True
    }

@router.get("", response_model=List[DestinationResponse])
def get_destinations(
    featured_only: bool = False,
    region: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns strictly approved VANVAS curated destinations.
    Dynamic search destinations will NEVER enter this catalogue.
    """
    query = db.query(Destination)
    if featured_only:
        query = query.filter(Destination.is_featured == True)
    if region and region != "All":
        query = query.filter(Destination.region.ilike(f"%{region}%"))
    if search:
        query = query.filter(
            (Destination.name.ilike(f"%{search}%")) |
            (Destination.state.ilike(f"%{search}%")) |
            (Destination.tagline.ilike(f"%{search}%"))
        )
    
    destinations = query.all()
    results = []
    for d in destinations:
        d_dict = {
            "id": d.id,
            "name": d.name,
            "slug": d.slug,
            "state": d.state,
            "region": d.region,
            "tagline": d.tagline,
            "description": d.description,
            "hero_image": d.hero_image,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "altitude_meters": d.altitude_meters,
            "best_time_to_visit": d.best_time_to_visit,
            "weather_type": d.weather_type,
            "is_featured": d.is_featured,
            "places_count": len(d.places),
            "hotels_count": len(d.hotels),
            "rentals_count": len(d.rentals)
        }
        results.append(d_dict)
    return results

@router.get("/{slug_or_id}")
async def get_destination_detail(
    slug_or_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns curated destination details if approved, or transient live discovery
    if dynamic (e.g. /explore/indore).
    """
    dest = db.query(Destination).filter(
        (Destination.slug == slug_or_id) | (Destination.id == slug_or_id)
    ).first()
    
    if dest:
        places = db.query(Place).filter(Place.destination_id == dest.id, Place.is_active == True).all()
        hotels = db.query(Hotel).filter(Hotel.destination_id == dest.id).all()
        rentals = db.query(RentalOption).filter(RentalOption.destination_id == dest.id).all()
        weather_snapshots = db.query(WeatherSnapshot).filter(WeatherSnapshot.destination_id == dest.id).all()
        
        if not weather_snapshots:
            await DestinationIntelligenceService._ensure_weather(dest, db)
            weather_snapshots = db.query(WeatherSnapshot).filter(WeatherSnapshot.destination_id == dest.id).all()
        
        return {
            "destination": dest,
            "is_curated": True,
            "is_dynamic": False,
            "places": places,
            "hotels": hotels,
            "rentals": rentals,
            "weather": weather_snapshots,
            "places_count": len(places),
            "hotels_count": len(hotels),
            "rentals_count": len(rentals)
        }
    
    # Dynamic destination resolution (transient, never inserted into DB)
    dyn_dest = await DestinationIntelligenceService.resolve_dynamic_destination(slug_or_id)
    if not dyn_dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    return {
        "destination": dyn_dest,
        "is_curated": False,
        "is_dynamic": True,
        "places": [],
        "hotels": [],
        "rentals": [],
        "weather": dyn_dest.get("weather", []),
        "places_count": 0,
        "hotels_count": 0,
        "rentals_count": 0
    }

@router.get("/{destination_id}/places", response_model=List[PlaceResponse])
def get_destination_places(
    destination_id: str,
    category: Optional[str] = None,
    is_must_visit: Optional[bool] = None,
    is_hidden_gem: Optional[bool] = None,
    is_indoor: Optional[bool] = None,
    price_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(
        (Destination.id == destination_id) | (Destination.slug == destination_id)
    ).first()
    if not dest:
        return []

    query = db.query(Place).filter(Place.destination_id == dest.id, Place.is_active == True)
    if category and category != "all":
        query = query.filter(Place.category.ilike(f"%{category}%"))
    if is_must_visit is not None:
        query = query.filter(Place.is_must_visit == is_must_visit)
    if is_hidden_gem is not None:
        query = query.filter(Place.is_hidden_gem == is_hidden_gem)
    if is_indoor is not None:
        query = query.filter(Place.is_indoor == is_indoor)
    if price_level:
        query = query.filter(Place.price_level == price_level)
    if search:
        query = query.filter(
            (Place.name.ilike(f"%{search}%")) |
            (Place.description.ilike(f"%{search}%")) |
            (Place.tags.ilike(f"%{search}%"))
        )
    return query.all()
