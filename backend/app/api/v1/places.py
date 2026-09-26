from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Place, SavedPlace, User, Destination
from app.schemas.schemas import PlaceResponse
from app.api.deps import get_current_user, get_current_user_optional
from app.itinerary.clustering import haversine_distance_km
from app.recommendation.scorer import RecommendationScorer
from app.providers.provider_factory import ProviderFactory
from app.services.operating_hours_engine import OperatingHoursEngine
from app.services.action_link_generator import ActionLinkGenerator
from app.core.rate_limiter import rate_limit

router = APIRouter()
scorer = RecommendationScorer()

from sqlalchemy import or_

def map_category_filter(cat: Optional[str]) -> List[str]:
    if not cat or cat.lower() == "all":
        return []
    c = cat.lower().strip()
    if c in ["food", "dining", "restaurant", "street_food", "local food"]:
        return ["Local Food", "Cafés & Bakery", "Food"]
    elif c in ["coffee", "cafe", "cafes", "bakery", "cafés & bakery"]:
        return ["Cafés & Bakery", "Cafe", "Bakery"]
    elif c in ["attractions", "attraction", "sightseeing"]:
        return ["Attractions", "Culture & Heritage", "Nature & Trails", "Adventure", "Adventure & Sport"]
    elif c in ["spiritual", "temple", "monastery", "church"]:
        return ["Culture & Heritage", "Spiritual", "Temple", "Monastery"]
    elif c in ["nature", "trails", "nature & trails", "viewpoint", "waterfall"]:
        return ["Nature & Trails", "Adventure", "Adventure & Sport"]
    elif c in ["shopping", "market", "bazaar", "shops & markets", "markets & craft"]:
        return ["Shops & Markets", "Markets & Craft", "Shopping"]
    elif c in ["mobility", "transport", "rental", "rentals", "bike", "motorcycle"]:
        return ["Mobility & Transport", "Transport", "Rentals"]
    elif c in ["stay", "stays", "hotel", "hostel", "homestay", "stays & sanctuaries"]:
        return ["Stays & Sanctuaries", "Stay", "Hotel", "Homestay"]
    elif c in ["essentials", "medical", "pharmacy", "hospital", "essentials & medical"]:
        return ["Essentials & Medical", "Essentials", "Medical"]
    return [cat]

def calculate_travel_relevance_score(
    name: str,
    category: str,
    dist_km: float,
    is_must_visit: bool = False,
    is_hidden_gem: bool = False,
    rating: Optional[float] = None,
    review_count: Optional[int] = None,
    tags: str = "",
    source: str = "vanvas_curated"
) -> float:
    """
    Computes a deterministic travel discovery score combining:
    + iconic landmark / historic / cultural significance
    + travel category priority (Attractions, Cafes, Food, Nature, Heritage)
    + genuine rating/review signals
    + distance penalty
    """
    score = 45.0
    if source == "vanvas_curated":
        score += 12.0
    if is_must_visit:
        score += 15.0
    if is_hidden_gem:
        score += 10.0

    name_l = (name or "").lower()
    cat_l = (category or "").lower()

    # Landmark & Heritage recognition signals
    if any(k in name_l for k in ["fort", "palace", "qutub", "gate", "mahal", "temple", "mandir", "monument", "ghat", "falls", "waterfall", "lake", "viewpoint", "monastery", "church", "gurudwara"]):
        score += 12.0
    elif any(k in cat_l for k in ["culture", "heritage", "nature", "trails", "adventure"]):
        score += 8.0
    elif any(k in cat_l for k in ["café", "cafe", "bakery", "local food", "food"]):
        score += 6.0

    # Genuine Provider Rating Signals (if provided)
    if rating is not None and rating >= 4.5:
        score += 5.0
    if review_count is not None and review_count >= 50:
        score += 3.0

    # Balanced distance penalty (prevents distant places from completely dominating, but ensures top landmarks outrank immediate mundane POIs)
    dist_penalty = min(dist_km * 1.5, 25.0)
    score -= dist_penalty

    return max(10.0, min(100.0, round(score, 1)))

@router.get("/nearby", response_model=List[PlaceResponse], dependencies=[Depends(rate_limit(max_requests=60, window_seconds=60))])
async def get_nearby_places(
    lat: float = Query(32.2396, description="Current latitude"),
    lng: float = Query(77.1887, description="Current longitude"),
    radius_km: float = Query(15.0, description="Radius in km"),
    category: Optional[str] = Query(None, description="Category filter"),
    sort_by: Optional[str] = Query("recommended", description="distance, rating, price, recommended"),
    live_only: bool = Query(False, description="If true, returns strictly unique live POIs excluding all curated places"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Place).filter(Place.is_active == True)
    
    cat_terms = map_category_filter(category)
    if cat_terms:
        conditions = [Place.category.ilike(f"%{term}%") for term in cat_terms]
        query = query.filter(or_(*conditions))
    
    all_places = query.all()
    user_saved_ids = set()
    if current_user:
        user_saved_ids = {sp.place_id for sp in db.query(SavedPlace).filter(SavedPlace.user_id == current_user.id).all()}

    curated_nearby = []
    for p in all_places:
        dist = haversine_distance_km(lat, lng, p.latitude, p.longitude)
        if dist <= radius_km:
            match_score = calculate_travel_relevance_score(
                name=p.name,
                category=p.category or "Attractions",
                dist_km=dist,
                is_must_visit=p.is_must_visit or False,
                is_hidden_gem=p.is_hidden_gem or False,
                rating=p.rating,
                review_count=p.review_count,
                tags=p.tags or "",
                source="vanvas_curated"
            )
            
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

            p_res = PlaceResponse(
                id=p.id,
                destination_id=p.destination_id,
                category=p.category or "Attractions",
                name=p.name,
                slug=p.slug,
                description=p.description or "",
                address=p.address,
                latitude=p.latitude,
                longitude=p.longitude,
                price_level=p.price_level or "₹₹",
                approx_cost=p.approx_cost or 0.0,
                rating=p.rating,
                review_count=p.review_count,
                opening_time=p.opening_time,
                closing_time=p.closing_time,
                hours_available=hours_eval.hours_available,
                is_open_now=hours_eval.is_open_now,
                phone=None,
                website=p.booking_url,
                recommended_duration_mins=p.recommended_duration_mins or 60,
                tags=p.tags or "Mountain",
                image_url=p.image_url,
                why_vanvas_recommends=p.why_vanvas_recommends,
                booking_url=p.booking_url,
                is_must_visit=p.is_must_visit or False,
                is_hidden_gem=p.is_hidden_gem or False,
                is_indoor=p.is_indoor or False,
                is_saved=p.id in user_saved_ids,
                match_score=match_score,
                source="vanvas_curated",
                source_id=p.id,
                is_live=False,
                distance_km=round(dist, 1),
                action_links=action_links,
                data_state="VERIFIED",
                trust_source="VANVAS_CURATED",
            )
            curated_nearby.append((dist, p_res))

    # Build initial results
    nearby_results = [] if live_only else list(curated_nearby)

    # Also discover live places from live provider (Google Places / OpenStreetMap)
    try:
        places_provider = ProviderFactory.get_places_provider()
        curated_for_exclusion = [{"name": p_res.name, "latitude": p_res.latitude, "longitude": p_res.longitude} for _, p_res in curated_nearby]
        live_places = await places_provider.get_nearby_places(lat, lng, radius_km, category, excluded_curated=curated_for_exclusion)
        for lp in live_places:
            lp_name = lp.get("name", "").lower().strip()
            lp_lat = lp.get("latitude")
            lp_lng = lp.get("longitude")
            is_dup = False
            for dist_ex, p_ex in curated_nearby:
                p_ex_name = p_ex.name.lower().strip()
                if lp_name and (p_ex_name in lp_name or lp_name in p_ex_name or (hasattr(places_provider, "_are_places_duplicate") and places_provider._are_places_duplicate(lp_name, lp_lat, lp_lng, p_ex_name, p_ex.latitude, p_ex.longitude))):
                    if haversine_distance_km(lp_lat, lp_lng, p_ex.latitude, p_ex.longitude) < 0.4:
                        is_dup = True
                        break
            if not is_dup:
                dist = lp.get("distance_km") or haversine_distance_km(lat, lng, lp["latitude"], lp["longitude"])
                lp_match_score = calculate_travel_relevance_score(
                    name=lp["name"],
                    category=lp.get("category", "Attractions"),
                    dist_km=dist,
                    is_must_visit=lp.get("is_must_visit", False),
                    is_hidden_gem=lp.get("is_hidden_gem", False),
                    rating=lp.get("rating"),
                    review_count=lp.get("review_count"),
                    tags=lp.get("tags", ""),
                    source=lp.get("source", "openstreetmap")
                )
                nearby_results.append((dist, PlaceResponse(
                    id=lp.get("id", f"live-{lp.get('source_id', lp['name'])}"),
                    destination_id="live",
                    category=lp.get("category", "Attractions"),
                    name=lp["name"],
                    slug=lp.get("name", "").lower().replace(" ", "-"),
                    description=lp.get("description", ""),
                    address=lp.get("address"),
                    latitude=lp["latitude"],
                    longitude=lp["longitude"],
                    price_level=lp.get("price_level"),
                    approx_cost=lp.get("approx_cost"),
                    rating=lp.get("rating"),
                    review_count=lp.get("review_count"),
                    opening_time=lp.get("opening_time"),
                    closing_time=lp.get("closing_time"),
                    hours_available=lp.get("hours_available", False),
                    is_open_now=lp.get("is_open_now"),
                    phone=lp.get("phone"),
                    website=lp.get("website"),
                    recommended_duration_mins=lp.get("recommended_duration_mins", 60),
                    tags=lp.get("tags", "Live"),
                    image_url=lp.get("image_url"),
                    why_vanvas_recommends=lp.get("why_vanvas_recommends"),
                    booking_url=lp.get("booking_url"),
                    is_must_visit=lp.get("is_must_visit", False),
                    is_hidden_gem=lp.get("is_hidden_gem", False),
                    is_indoor=lp.get("is_indoor", False),
                    is_saved=lp.get("id") in user_saved_ids if user_saved_ids else False,
                    match_score=lp_match_score,
                    source=lp.get("source", "openstreetmap"),
                    source_id=lp.get("source_id"),
                    is_live=lp.get("is_live", True),
                    distance_km=round(dist, 1),
                    action_links=lp.get("action_links", []),
                    data_state=lp.get("data_state", "LIVE"),
                    trust_source=lp.get("trust_source", "OPENSTREETMAP"),
                )))
    except Exception as e:
        pass

    # Sort
    if sort_by == "distance":
        nearby_results.sort(key=lambda x: x[0])
    elif sort_by == "rating":
        nearby_results.sort(key=lambda x: (x[1].rating is not None, x[1].rating or 0.0), reverse=True)
    elif sort_by == "price":
        nearby_results.sort(key=lambda x: x[1].approx_cost if x[1].approx_cost is not None else 99999)
    else:  # recommended
        nearby_results.sort(key=lambda x: x[1].match_score or 0.0, reverse=True)

    return [p for _, p in nearby_results]

@router.get("/saved", response_model=List[PlaceResponse])
def get_saved_places(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_entries = db.query(SavedPlace).filter(SavedPlace.user_id == current_user.id).all()
    results = []
    for sp in saved_entries:
        p = sp.place
        if p:
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
                is_saved=True,
                action_links=action_links,
                data_state="VERIFIED",
                trust_source="VANVAS_CURATED",
            ))
    return results

@router.post("/saved/{place_id}")
def toggle_save_place(
    place_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        # Dynamically link live POI to support saving arbitrary live discovery results
        fallback_dest = db.query(Destination).first()
        dest_id = fallback_dest.id if fallback_dest else "live"
        dest_lat = fallback_dest.latitude if fallback_dest else 0.0
        dest_lng = fallback_dest.longitude if fallback_dest else 0.0
        clean_name = place_id.replace("osm-", "").replace("gp-", "").replace("live-", "").replace("-", " ").title()
        place = Place(
            id=place_id,
            destination_id=dest_id,
            name=clean_name,
            slug=place_id.lower(),
            category="Attractions",
            description="Saved live point of interest.",
            latitude=dest_lat,
            longitude=dest_lng,
            is_active=True
        )
        db.add(place)
        db.flush()

    existing = db.query(SavedPlace).filter(
        SavedPlace.user_id == current_user.id,
        SavedPlace.place_id == place_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False, "message": f"Removed '{place.name}' from saved places."}
    else:
        new_save = SavedPlace(
            user_id=current_user.id,
            place_id=place.id,
            destination_id=place.destination_id
        )
        db.add(new_save)
        db.commit()
        return {"saved": True, "message": f"Saved '{place.name}' to your travel collection."}

@router.get("/{place_id}", response_model=PlaceResponse)
def get_place_detail(
    place_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        # Handle live place IDs transparently
        if place_id.startswith("osm-") or place_id.startswith("gp-") or place_id.startswith("live-"):
            clean_name = place_id.replace("osm-", "").replace("gp-", "").replace("live-", "").replace("-", " ").title()
            source = "google_places" if place_id.startswith("gp-") else "openstreetmap"
            return PlaceResponse(
                id=place_id,
                destination_id="live",
                category="Attractions",
                name=clean_name,
                slug=place_id.lower(),
                description=f"Verified {source} live discovery landmark.",
                address="Live Verified Location",
                latitude=0.0,
                longitude=0.0,
                price_level=None,
                approx_cost=None,
                rating=None,
                review_count=None,
                opening_time=None,
                closing_time=None,
                hours_available=False,
                is_open_now=None,
                phone=None,
                website=None,
                recommended_duration_mins=60,
                tags=f"Live,{source}",
                image_url=None,
                why_vanvas_recommends=None,
                booking_url=None,
                is_must_visit=False,
                is_hidden_gem=False,
                is_indoor=False,
                is_saved=False,
                action_links=[],
                data_state="LIVE",
                trust_source=source.upper(),
            )
        raise HTTPException(status_code=404, detail="Place not found")

    is_saved = False
    if current_user:
        is_saved = db.query(SavedPlace).filter(
            SavedPlace.user_id == current_user.id,
            SavedPlace.place_id == place_id
        ).first() is not None

    hours_eval = OperatingHoursEngine.evaluate_simple_hours(place.opening_time, place.closing_time, place.latitude, place.longitude)
    action_links = ActionLinkGenerator.generate_place_action_links(
        name=place.name,
        latitude=place.latitude,
        longitude=place.longitude,
        website=place.booking_url,
        phone=None,
        booking_url=place.booking_url,
        source="vanvas_curated",
        source_id=place.id,
    )

    return PlaceResponse(
        id=place.id,
        destination_id=place.destination_id,
        category=place.category,
        name=place.name,
        slug=place.slug,
        description=place.description,
        address=place.address,
        latitude=place.latitude,
        longitude=place.longitude,
        price_level=place.price_level,
        approx_cost=place.approx_cost,
        rating=place.rating,
        review_count=place.review_count,
        opening_time=place.opening_time,
        closing_time=place.closing_time,
        hours_available=hours_eval.hours_available,
        is_open_now=hours_eval.is_open_now,
        phone=None,
        website=place.booking_url,
        recommended_duration_mins=place.recommended_duration_mins,
        tags=place.tags,
        image_url=place.image_url,
        why_vanvas_recommends=place.why_vanvas_recommends,
        booking_url=place.booking_url,
        is_must_visit=place.is_must_visit,
        is_hidden_gem=place.is_hidden_gem,
        is_indoor=place.is_indoor,
        is_saved=is_saved,
        action_links=action_links,
        data_state="VERIFIED",
        trust_source="VANVAS_CURATED",
    )


@router.get("/route")
async def calculate_route_polyline(
    lat1: float = Query(..., description="Origin latitude"),
    lng1: float = Query(..., description="Origin longitude"),
    lat2: float = Query(..., description="Destination latitude"),
    lng2: float = Query(..., description="Destination longitude"),
):
    """
    Phase 12: Route calculation between user position and selected POI.
    Uses OSRM navigation route with mountain tortuosity fallback.
    """
    routing_provider = ProviderFactory.get_routing_provider()
    if hasattr(routing_provider, "calculate_route"):
        route_res = await routing_provider.calculate_route(lat1, lng1, lat2, lng2)
        return route_res
    else:
        # Fallback matrix
        matrix = routing_provider.calculate_distance_matrix([{"lat": lat1, "lng": lng1}, {"lat": lat2, "lng": lng2}])
        res = matrix[0][1]
        return {
            "distance_km": res["distance_km"],
            "duration_mins": res["duration_mins"],
            "is_accurate": False,
            "is_mountain_adjusted": True,
            "geometry": [[lat1, lng1], [lat2, lng2]],
            "source": "internal",
            "source_provider": "internal",
            "data_state": "VERIFIED",
            "trust_source": "INTERNAL_ESTIMATION",
        }

