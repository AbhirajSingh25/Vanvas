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
            "destination_id": dest.id,
            "canonical_slug": dest.slug,
            "name": dest.name,
            "slug": dest.slug,
            "hindi_name": dest.hindi_name,
            "city": dest.name,
            "display_name": f"{dest.name}, {dest.state}",
            "state": dest.state,
            "country": "India",
            "region": dest.region,
            "tagline": dest.tagline,
            "hero_image": dest.hero_image,
            "latitude": dest.latitude,
            "longitude": dest.longitude,
            "altitude_meters": dest.altitude_meters,
            "weather_type": dest.weather_type,
            "is_curated": bool(dest.is_featured),
            "is_dynamic": not bool(dest.is_featured),
            "source": "curated" if dest.is_featured else "database"
        }

    dyn = await DestinationIntelligenceService.resolve_dynamic_destination(query)
    if not dyn:
        raise HTTPException(status_code=404, detail=f"Could not resolve destination '{query}'")
    return {
        "id": dyn["id"],
        "destination_id": dyn["id"],
        "canonical_slug": dyn["canonical_slug"],
        "name": dyn["name"],
        "slug": dyn["slug"],
        "city": dyn.get("city", dyn["name"]),
        "display_name": dyn.get("display_name", f"{dyn['name']}, {dyn['state']}"),
        "state": dyn["state"],
        "country": dyn.get("country", "India"),
        "region": dyn["region"],
        "tagline": dyn["tagline"],
        "hero_image": dyn["hero_image"],
        "latitude": dyn["latitude"],
        "longitude": dyn["longitude"],
        "altitude_meters": dyn["altitude_meters"],
        "weather_type": dyn["weather_type"],
        "is_curated": False,
        "is_dynamic": True,
        "source": dyn.get("source", "live_geocoding")
    }

@router.get("", response_model=List[DestinationResponse])
def get_destinations(
    featured_only: bool = True,
    region: Optional[str] = None,
    search: Optional[str] = None,
    include_dynamic: bool = False,
    db: Session = Depends(get_db)
):
    """
    Returns strictly approved VANVAS curated destinations.
    Dynamic search destinations will NEVER enter this catalogue.
    """
    query = db.query(Destination)
    if featured_only:
        query = query.filter(Destination.is_featured == True)
    elif not include_dynamic:
        query = query.filter(
            (Destination.is_featured == True) |
            (Destination.id.like("dest-%")) |
            (~Destination.id.like("dyn-%"))
        )

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
            "hindi_name": d.hindi_name,
            "name_en": d.name_en or d.name,
            "name_hi": d.name_hi or d.hindi_name,
            "subtitle_en": d.subtitle_en or d.tagline,
            "subtitle_hi": d.subtitle_hi,
            "description_en": d.description_en or d.description,
            "description_hi": d.description_hi,
            "hero_artwork": d.hero_artwork or d.hero_image,
            "hero_photo": d.hero_photo or d.hero_image,
            "one_day_available": d.one_day_available if d.one_day_available is not None else True,
            "trek_available": d.trek_available if d.trek_available is not None else False,
            "nearby_available": d.nearby_available if d.nearby_available is not None else True,
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

    CANONICAL_SLUG_ORDER = [
        "manali", "rishikesh", "tungnath-chandrashila", "kainchi-dham", "kasol", "dharamshala",
        "goa", "jaipur", "murthal", "agra", "mathura-vrindavan", "neemrana", "damdama-sohna",
        "alwar-siliserh", "sariska-bhangarh", "dehradun", "chandigarh", "morni-hills",
        "lansdowne", "mussoorie", "udaipur", "varanasi", "leh", "spiti", "munnar"
    ]
    results.sort(key=lambda d: CANONICAL_SLUG_ORDER.index(d["slug"]) if d["slug"] in CANONICAL_SLUG_ORDER else 999)
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
            try:
                await DestinationIntelligenceService._ensure_weather(dest, db)
                weather_snapshots = db.query(WeatherSnapshot).filter(WeatherSnapshot.destination_id == dest.id).all()
            except Exception:
                weather_snapshots = []
        
        return {
            "destination": dest,
            "is_curated": bool(dest.is_featured),
            "is_dynamic": not bool(dest.is_featured),
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
    
    # Fetch live points of interest and accommodation
    live_places = []
    live_hotels = []
    try:
        places_provider = ProviderFactory.get_places_provider()
        live_places_raw = await places_provider.get_nearby_places(dyn_dest["latitude"], dyn_dest["longitude"], radius_km=15.0)
        for lp in live_places_raw:
            live_places.append({
                "id": lp.get("id", f"live-{lp.get('source_id', lp.get('name'))}"),
                "destination_id": dyn_dest["id"],
                "category": lp.get("category", "Attractions"),
                "name": lp.get("name"),
                "slug": lp.get("name", "").lower().replace(" ", "-"),
                "description": lp.get("address") or f"Point of interest in {dyn_dest['name']}",
                "address": lp.get("address"),
                "latitude": lp.get("latitude"),
                "longitude": lp.get("longitude"),
                "price_level": lp.get("price_level", "₹₹"),
                "approx_cost": lp.get("approx_cost", 0.0),
                "rating": lp.get("rating"),
                "review_count": lp.get("review_count"),
                "opening_time": lp.get("opening_time"),
                "closing_time": lp.get("closing_time"),
                "hours_available": lp.get("hours_available", False),
                "is_open_now": lp.get("is_open_now"),
                "phone": lp.get("phone"),
                "website": lp.get("website"),
                "recommended_duration_mins": lp.get("recommended_duration_mins", 60),
                "tags": lp.get("category", ""),
                "image_url": lp.get("image_url"),
                "why_vanvas_recommends": None,
                "booking_url": lp.get("website"),
                "is_must_visit": False,
                "is_hidden_gem": False,
                "is_indoor": lp.get("is_indoor", False),
                "is_saved": False,
                "action_links": lp.get("action_links", []),
                "data_state": lp.get("data_state", "LIVE"),
                "trust_source": lp.get("trust_source", "OPENSTREETMAP"),
                "is_live": True,
            })
    except Exception as e:
        logger.warning(f"Could not load live places for {dyn_dest['name']}: {e}")

    return {
        "destination": dyn_dest,
        "is_curated": False,
        "is_dynamic": True,
        "places": live_places,
        "hotels": live_hotels,
        "rentals": [],
        "weather": dyn_dest.get("weather", []),
        "places_count": len(live_places),
        "hotels_count": len(live_hotels),
        "rentals_count": 0
    }

from app.services.operating_hours_engine import OperatingHoursEngine
from app.services.action_link_generator import ActionLinkGenerator

@router.get("/{destination_id}/places", response_model=List[PlaceResponse])
async def get_destination_places(
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
        # Dynamic destination resolution for non-curated destination places
        dyn_dest = await DestinationIntelligenceService.resolve_dynamic_destination(destination_id)
        if not dyn_dest:
            return []
        try:
            places_provider = ProviderFactory.get_places_provider()
            cat_filter = category if (category and category != "all") else None
            live_places_raw = await places_provider.get_nearby_places(
                dyn_dest["latitude"],
                dyn_dest["longitude"],
                radius_km=15.0,
                category_filter=cat_filter
            )
            dyn_results: List[PlaceResponse] = []
            for lp in live_places_raw:
                if search and search.lower() not in lp.get("name", "").lower():
                    continue
                if is_indoor is not None and lp.get("is_indoor") != is_indoor:
                    continue
                hours_eval = OperatingHoursEngine.evaluate_simple_hours(
                    lp.get("opening_time"),
                    lp.get("closing_time"),
                    lp.get("latitude") or dyn_dest["latitude"],
                    lp.get("longitude") or dyn_dest["longitude"],
                )
                action_links = lp.get("action_links") or ActionLinkGenerator.generate_place_action_links(
                    name=lp.get("name", ""),
                    latitude=lp.get("latitude") or dyn_dest["latitude"],
                    longitude=lp.get("longitude") or dyn_dest["longitude"],
                    website=lp.get("website"),
                    phone=lp.get("phone"),
                    booking_url=lp.get("website"),
                    source=lp.get("source", "openstreetmap"),
                    source_id=lp.get("source_id", ""),
                )
                dyn_results.append(PlaceResponse(
                    id=lp.get("id", f"live-{lp.get('source_id', lp.get('name'))}"),
                    destination_id=dyn_dest["id"],
                    category=lp.get("category", "Attractions"),
                    name=lp.get("name", "Local Landmark"),
                    slug=lp.get("name", "").lower().replace(" ", "-"),
                    description=lp.get("address") or f"Point of interest in {dyn_dest['name']}",
                    address=lp.get("address"),
                    latitude=lp.get("latitude") or dyn_dest["latitude"],
                    longitude=lp.get("longitude") or dyn_dest["longitude"],
                    price_level=lp.get("price_level", "₹₹"),
                    approx_cost=lp.get("approx_cost", 0.0),
                    rating=lp.get("rating"),
                    review_count=lp.get("review_count"),
                    opening_time=lp.get("opening_time"),
                    closing_time=lp.get("closing_time"),
                    hours_available=hours_eval.hours_available,
                    is_open_now=hours_eval.is_open_now,
                    phone=lp.get("phone"),
                    website=lp.get("website"),
                    recommended_duration_mins=lp.get("recommended_duration_mins", 60),
                    tags=lp.get("category", ""),
                    image_url=lp.get("image_url"),
                    why_vanvas_recommends=None,
                    booking_url=lp.get("website"),
                    is_must_visit=False,
                    is_hidden_gem=False,
                    is_indoor=lp.get("is_indoor", False),
                    is_saved=False,
                    action_links=action_links,
                    data_state="LIVE",
                    trust_source="OPENSTREETMAP",
                ))
            return dyn_results
        except Exception as e:
            logger.warning(f"Error resolving dynamic places for {destination_id}: {e}")
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
    places = query.all()
    results = []
    for p in places:
        hours_eval = OperatingHoursEngine.evaluate_simple_hours(p.opening_time, p.closing_time, p.latitude, p.longitude)
        action_links = ActionLinkGenerator.generate_place_action_links(
            name=p.name,
            latitude=p.latitude,
            longitude=p.longitude,
            website=p.booking_url,
            phone=None,
            booking_url=p.booking_url,
            source="vanvas_curated",
            source_id=p.id,
        )
        results.append(PlaceResponse(
            id=p.id,
            destination_id=p.destination_id,
            category=p.category,
            name=p.name,
            slug=p.slug,
            description=p.description,
            address=p.address,
            latitude=p.latitude,
            longitude=p.longitude,
            price_level=p.price_level,
            approx_cost=p.approx_cost,
            rating=p.rating,
            review_count=p.review_count,
            opening_time=p.opening_time,
            closing_time=p.closing_time,
            hours_available=hours_eval.hours_available,
            is_open_now=hours_eval.is_open_now,
            phone=None,
            website=p.booking_url,
            recommended_duration_mins=p.recommended_duration_mins,
            tags=p.tags,
            image_url=p.image_url,
            why_vanvas_recommends=p.why_vanvas_recommends,
            booking_url=p.booking_url,
            is_must_visit=p.is_must_visit,
            is_hidden_gem=p.is_hidden_gem,
            is_indoor=p.is_indoor,
            is_saved=False,
            action_links=action_links,
            data_state="VERIFIED",
            trust_source="VANVAS_CURATED",
        ))
    return results
