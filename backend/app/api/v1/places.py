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

router = APIRouter()
scorer = RecommendationScorer()

@router.get("/nearby", response_model=List[PlaceResponse])
async def get_nearby_places(
    lat: float = Query(32.2396, description="Current latitude"),
    lng: float = Query(77.1887, description="Current longitude"),
    radius_km: float = Query(15.0, description="Radius in km"),
    category: Optional[str] = Query(None, description="Category filter"),
    sort_by: Optional[str] = Query("recommended", description="distance, rating, price, recommended"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Place).filter(Place.is_active == True)
    
    if category and category.lower() != "all":
        query = query.filter(Place.category.ilike(f"%{category}%"))
    
    all_places = query.all()
    user_saved_ids = set()
    if current_user:
        user_saved_ids = {sp.place_id for sp in db.query(SavedPlace).filter(SavedPlace.user_id == current_user.id).all()}

    nearby_results = []
    for p in all_places:
        dist = haversine_distance_km(lat, lng, p.latitude, p.longitude)
        if dist <= radius_km:
            match_score = scorer.score_place(
                place=p,
                user_interests=["Nature", "Cafés", "Adventure", "Food"],
                user_budget_tier="Balanced",
                current_lat=lat,
                current_lng=lng
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
                phone=None,
                website=None,
                recommended_duration_mins=p.recommended_duration_mins or 60,
                tags=p.tags or "Mountain",
                image_url=p.image_url,
                why_vanvas_recommends=p.why_vanvas_recommends,
                booking_url=p.booking_url,
                is_must_visit=p.is_must_visit or False,
                is_hidden_gem=p.is_hidden_gem or False,
                is_indoor=p.is_indoor or False,
                is_saved=p.id in user_saved_ids,
                match_score=round(match_score * 100, 1),
                source="vanvas_curated",
                source_id=p.id,
                is_live=False,
                distance_km=round(dist, 1)
            )
            nearby_results.append((dist, p_res))

    # Also discover live places from live provider (Google Places / OpenStreetMap)
    try:
        places_provider = ProviderFactory.get_places_provider()
        live_places = await places_provider.get_nearby_places(lat, lng, radius_km, category)
        for lp in live_places:
            lp_name = lp.get("name", "").lower().strip()
            lp_lat = lp.get("latitude")
            lp_lng = lp.get("longitude")
            is_dup = False
            for dist_ex, p_ex in nearby_results:
                p_ex_name = p_ex.name.lower().strip()
                if lp_name and (p_ex_name in lp_name or lp_name in p_ex_name):
                    if haversine_distance_km(lp_lat, lp_lng, p_ex.latitude, p_ex.longitude) < 0.2:
                        is_dup = True
                        break
            if not is_dup:
                dist = lp.get("distance_km") or haversine_distance_km(lat, lng, lp["latitude"], lp["longitude"])
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
                    is_saved=False,
                    match_score=85.0,
                    source=lp.get("source", "openstreetmap"),
                    source_id=lp.get("source_id"),
                    is_live=lp.get("is_live", True),
                    distance_km=round(dist, 1)
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
                recommended_duration_mins=p.recommended_duration_mins,
                tags=p.tags,
                image_url=p.image_url,
                why_vanvas_recommends=p.why_vanvas_recommends,
                booking_url=p.booking_url,
                is_must_visit=p.is_must_visit,
                is_hidden_gem=p.is_hidden_gem,
                is_indoor=p.is_indoor,
                is_saved=True
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
        raise HTTPException(status_code=404, detail="Place not found")

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
        raise HTTPException(status_code=404, detail="Place not found")

    is_saved = False
    if current_user:
        is_saved = db.query(SavedPlace).filter(
            SavedPlace.user_id == current_user.id,
            SavedPlace.place_id == place_id
        ).first() is not None

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
        recommended_duration_mins=place.recommended_duration_mins,
        tags=place.tags,
        image_url=place.image_url,
        why_vanvas_recommends=place.why_vanvas_recommends,
        booking_url=place.booking_url,
        is_must_visit=place.is_must_visit,
        is_hidden_gem=place.is_hidden_gem,
        is_indoor=place.is_indoor,
        is_saved=is_saved
    )
