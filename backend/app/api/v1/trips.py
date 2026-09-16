from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import (
    Trip, TripMember, TripInvite, Destination, Place, Hotel, RentalOption,
    Itinerary, ItineraryItem, ChecklistItem, User, generate_uuid
)
from app.schemas.schemas import (
    TripCreateRequest, TripSummaryResponse, TripDetailResponse,
    DynamicReplanRequest, QuickPlanRequest, QuickPlanResponse,
    ImHereRequest, ImHereResponse, PlaceResponse, ItineraryItemResponse,
    TripInvitePreviewResponse, TripInviteCreateResponse, TripMemberActionResponse,
    TripMemberResponse
)
from app.api.deps import get_current_user, get_current_user_optional
from app.itinerary.generator import ItineraryEngine
from app.itinerary.dynamic_replanner import DynamicReplanner
from app.itinerary.clustering import haversine_distance_km

router = APIRouter()
itinerary_engine = ItineraryEngine()
replanner = DynamicReplanner()

@router.get("", response_model=List[TripSummaryResponse])
def get_user_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find all trips created by user or where user is member
    member_trip_ids = [m[0] for m in db.query(TripMember.trip_id).filter(TripMember.user_id == current_user.id).all()]
    user_trips = db.query(Trip).filter(
        (Trip.user_id == current_user.id) | (Trip.id.in_(member_trip_ids))
    ).order_by(Trip.start_date.desc()).all()
    
    # Deduplicate trips by id
    seen_ids = set()
    unique_trips = []
    for t in user_trips:
        if t.id not in seen_ids:
            seen_ids.add(t.id)
            unique_trips.append(t)
    
    summaries = []
    for t in unique_trips:
        summaries.append(TripSummaryResponse(
            id=t.id,
            title=t.title,
            destination_name=t.destination.name if t.destination else "Himalayan Journey",
            destination_slug=t.destination.slug if t.destination else "manali",
            hero_image=t.destination.hero_image if t.destination else None,
            start_date=t.start_date,
            end_date=t.end_date,
            num_days=t.num_days,
            budget_total=t.budget_total,
            budget_spent=t.budget_spent,
            companion_type=t.companion_type,
            travel_style=t.travel_style,
            status=t.status
        ))
    return summaries

@router.post("", response_model=TripDetailResponse)
def create_trip(
    trip_in: TripCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    destination = db.query(Destination).filter(
        (Destination.id == trip_in.destination_id) | (Destination.slug == trip_in.destination_id)
    ).first()
    
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    num_days = max(1, (trip_in.end_date - trip_in.start_date).days + 1)
    
    # Auto-select best hotel and rental matching budget style
    hotel = db.query(Hotel).filter(Hotel.destination_id == destination.id).first()
    rental = db.query(RentalOption).filter(RentalOption.destination_id == destination.id).first()

    trip = Trip(
        user_id=current_user.id,
        destination_id=destination.id,
        title=f"Spontaneous Journey to {destination.name}",
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        num_days=num_days,
        budget_total=trip_in.budget,
        budget_spent=0.0,
        travellers_count=trip_in.travellers_count,
        companion_type=trip_in.companion_type,
        travel_style=trip_in.travel_style,
        wake_up_preference=trip_in.wake_up_preference,
        activity_intensity=trip_in.activity_intensity,
        interests=",".join(trip_in.interests),
        hotel_id=hotel.id if hotel else None,
        rental_id=rental.id if rental else None,
        status="active"
    )
    db.add(trip)
    db.flush()

    # Add owner member
    db.add(TripMember(trip_id=trip.id, user_id=current_user.id, role="owner"))

    # Generate Itinerary
    all_places = db.query(Place).filter(Place.destination_id == destination.id, Place.is_active == True).all()
    
    generated_days = itinerary_engine.generate_trip_itinerary(
        destination=destination,
        all_places=all_places,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        budget=trip_in.budget,
        companion_type=trip_in.companion_type,
        travel_style=trip_in.travel_style,
        wake_up_preference=trip_in.wake_up_preference,
        activity_intensity=trip_in.activity_intensity,
        interests=trip_in.interests,
        hotel=hotel,
        rental=rental
    )

    for day_dict in generated_days:
        it = Itinerary(
            trip_id=trip.id,
            day_number=day_dict["day_number"],
            date=day_dict["date"],
            title=day_dict["title"],
            theme=day_dict["theme"],
            status=day_dict["status"]
        )
        db.add(it)
        db.flush()

        for item_dict in day_dict["items"]:
            it_item = ItineraryItem(
                itinerary_id=it.id,
                place_id=item_dict.get("place_id"),
                title=item_dict["title"],
                category=item_dict["category"],
                start_time=item_dict["start_time"],
                end_time=item_dict["end_time"],
                duration_mins=item_dict["duration_mins"],
                estimated_cost=item_dict["estimated_cost"],
                travel_time_from_prev_mins=item_dict["travel_time_from_prev_mins"],
                distance_from_prev_km=item_dict["distance_from_prev_km"],
                notes=item_dict.get("notes"),
                reason_for_recommendation=item_dict.get("reason_for_recommendation"),
                map_lat=item_dict.get("map_lat"),
                map_lng=item_dict.get("map_lng"),
                booking_url=item_dict.get("booking_url"),
                opening_hours=item_dict.get("opening_hours"),
                status=item_dict.get("status", "upcoming"),
                is_locked=item_dict.get("is_locked", False)
            )
            db.add(it_item)

    # Seed Checklist Items
    default_checks = [
        ("Essentials", "Government Photo ID & Driving License", True),
        ("Essentials", "Fast Charger & 20,000mAh Power Bank", True),
        ("Clothing", "Warm Fleece / Windproof Mountain Jacket", False),
        ("Clothing", "Comfortable Grippy Walking/Trek Shoes", False),
        ("Medicine", "Motion Sickness / Altitude Acclimatization Pills", False),
        ("Essentials", "Emergency Cash (Mountain ATMs can run empty)", True),
        ("Toiletries", "Sunscreen SPF 50 & Lip Balm (Alpine UV)", False)
    ]
    for cat, item_name, is_chk in default_checks:
        db.add(ChecklistItem(
            trip_id=trip.id,
            category=cat,
            item_name=item_name,
            is_checked=is_chk,
            is_custom=False
        ))

    db.commit()
    db.refresh(trip)
    return trip

def _is_expired(expires_at: Optional[datetime]) -> bool:
    if not expires_at:
        return False
    if expires_at.tzinfo is not None:
        return expires_at < datetime.now(timezone.utc)
    return expires_at < datetime.now(timezone.utc).replace(tzinfo=None)

@router.get("/invite/{code}", response_model=TripInvitePreviewResponse)
def preview_trip_invite(
    code: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    clean_code = code.strip().upper()
    invite = db.query(TripInvite).filter(TripInvite.code == clean_code, TripInvite.revoked == False).first()
    trip = None
    if invite:
        if _is_expired(invite.expires_at):
            raise HTTPException(status_code=400, detail="This trip invite has expired.")
        trip = invite.trip
    else:
        trip = db.query(Trip).filter(Trip.invite_code == clean_code).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Invalid or expired trip invite code.")

    is_mem = False
    if current_user:
        existing = db.query(TripMember).filter(
            TripMember.trip_id == trip.id,
            TripMember.user_id == current_user.id
        ).first()
        is_mem = bool(existing) or (trip.user_id == current_user.id)

    members_count = db.query(TripMember).filter(TripMember.trip_id == trip.id).count()
    owner_name = trip.creator.full_name if trip.creator else "VANVAS Explorer"

    return TripInvitePreviewResponse(
        trip_id=trip.id,
        title=trip.title,
        destination_name=trip.destination.name if trip.destination else "Himalayas",
        destination_slug=trip.destination.slug if trip.destination else "manali",
        destination_hero_image=trip.destination.hero_image if trip.destination else None,
        state=trip.destination.state if trip.destination else "Himachal Pradesh",
        region=trip.destination.region if trip.destination else "Himalayan Valley",
        start_date=trip.start_date,
        end_date=trip.end_date,
        num_days=trip.num_days,
        companion_type=trip.companion_type,
        travel_style=trip.travel_style,
        owner_name=owner_name,
        members_count=max(1, members_count),
        is_member=is_mem,
        invite_code=clean_code
    )

@router.post("/join/{code}", response_model=TripMemberActionResponse)
def join_trip_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean_code = code.strip().upper()
    invite = db.query(TripInvite).filter(TripInvite.code == clean_code, TripInvite.revoked == False).first()
    trip = None
    if invite:
        if _is_expired(invite.expires_at):
            raise HTTPException(status_code=400, detail="This trip invite has expired.")
        trip = invite.trip
    else:
        trip = db.query(Trip).filter(Trip.invite_code == clean_code).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Invalid trip invite code.")

    existing_member = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == current_user.id
    ).first()

    if existing_member:
        return TripMemberActionResponse(
            success=True,
            message="You are already part of this expedition.",
            trip_id=trip.id,
            already_joined=True
        )

    # Add as member
    new_member = TripMember(
        trip_id=trip.id,
        user_id=current_user.id,
        role="member"
    )
    db.add(new_member)
    trip.travellers_count = (trip.travellers_count or 1) + 1
    db.commit()

    return TripMemberActionResponse(
        success=True,
        message=f"Welcome aboard! You have joined {trip.title}.",
        trip_id=trip.id,
        already_joined=False
    )

@router.post("/{trip_id}/invites", response_model=TripInviteCreateResponse)
def create_or_get_trip_invite(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    member = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == current_user.id
    ).first()
    if not member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only trip members can generate invite links.")

    invite = db.query(TripInvite).filter(
        TripInvite.trip_id == trip.id,
        TripInvite.revoked == False
    ).order_by(TripInvite.created_at.desc()).first()

    if not invite:
        code = trip.invite_code or generate_uuid()[:8].upper()
        invite = TripInvite(
            trip_id=trip.id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db.add(invite)
        if not trip.invite_code:
            trip.invite_code = code
        db.commit()
        db.refresh(invite)

    return TripInviteCreateResponse(
        code=invite.code,
        invite_url=f"/join/{invite.code}",
        expires_at=invite.expires_at
    )

@router.delete("/{trip_id}/members/{user_id}", response_model=TripMemberActionResponse)
def remove_trip_member(
    trip_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    current_membership = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == current_user.id
    ).first()

    is_owner = (current_membership and current_membership.role == "owner") or (trip.user_id == current_user.id) or (current_user.role == "admin")
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only the trip owner can remove members.")

    target_member = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == user_id
    ).first()

    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in this trip.")

    if target_member.role == "owner" or user_id == trip.user_id:
        raise HTTPException(status_code=400, detail="The trip owner cannot be removed from the trip.")

    db.delete(target_member)
    trip.travellers_count = max(1, (trip.travellers_count or 1) - 1)
    db.commit()

    return TripMemberActionResponse(
        success=True,
        message="Member successfully removed from the expedition.",
        trip_id=trip.id
    )

@router.post("/{trip_id}/leave", response_model=TripMemberActionResponse)
def leave_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    membership = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="You are not a member of this trip.")

    if membership.role == "owner" or trip.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="The trip owner cannot leave the expedition.")

    db.delete(membership)
    trip.travellers_count = max(1, (trip.travellers_count or 1) - 1)
    db.commit()

    return TripMemberActionResponse(
        success=True,
        message="You have successfully left the expedition.",
        trip_id=trip.id
    )

@router.get("/{trip_id}", response_model=TripDetailResponse)
def get_trip_detail(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == current_user.id
    ).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this expedition. Join via invite code first."
        )

    return trip

@router.post("/{trip_id}/replan")
def replan_trip(
    trip_id: str,
    replan_in: DynamicReplanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    target_itinerary = None
    for it in trip.itineraries:
        if it.day_number == replan_in.day_number:
            target_itinerary = it
            break
    
    if not target_itinerary and trip.itineraries:
        target_itinerary = trip.itineraries[0]

    if not target_itinerary:
        raise HTTPException(status_code=400, detail="No active itinerary to replan")

    available_places = db.query(Place).filter(Place.destination_id == trip.destination_id).all()
    
    res = replanner.replan_day(
        itinerary=target_itinerary,
        action_type=replan_in.action_type,
        available_places=available_places,
        target_item_id=replan_in.target_item_id,
        current_time_str=replan_in.current_time
    )

    db.commit()
    db.refresh(trip)
    return {
        "success": True,
        "message": res["message"],
        "trip": trip
    }

@router.post("/{trip_id}/quick-plan", response_model=QuickPlanResponse)
def quick_plan(
    trip_id: str,
    req: QuickPlanRequest,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    lat = req.current_lat or trip.destination.latitude
    lng = req.current_lng or trip.destination.longitude

    # Query nearest places
    places = db.query(Place).filter(Place.destination_id == trip.destination_id).all()
    if not places:
        places = db.query(Place).all()
    
    # Sort by distance
    places.sort(key=lambda p: haversine_distance_km(lat, lng, p.latitude, p.longitude))
    
    # If variation > 0, rotate places list so user gets alternate curated stops
    variation_count = int(getattr(req, "variation", 0) or 0)
    if variation_count > 0 and len(places) > 2:
        offset = (variation_count * 2) % len(places)
        places = places[offset:] + places[:offset]
    
    now_hour = datetime.now(timezone.utc).hour + 5 # IST offset approx
    now_min = datetime.now(timezone.utc).minute + 30
    curr_mins = (now_hour % 24) * 60 + (now_min % 60)

    items = []
    accum_mins = curr_mins
    slots = int(req.hours_available * 60)
    end_limit = curr_mins + slots

    for i, p in enumerate(places[:4]):
        if accum_mins >= end_limit:
            break
        dur = min(60, p.recommended_duration_mins or 45)
        start_str = f"{(accum_mins // 60) % 24:02d}:{accum_mins % 60:02d}"
        end_mins = accum_mins + dur
        end_str = f"{(end_mins // 60) % 24:02d}:{end_mins % 60:02d}"

        items.append(ItineraryItemResponse(
            id=f"quick-{variation_count}-{i}",
            itinerary_id="quick-plan",
            place_id=p.id,
            title=p.name,
            category=p.category,
            start_time=start_str,
            end_time=end_str,
            duration_mins=dur,
            estimated_cost=p.approx_cost,
            travel_time_from_prev_mins=10,
            distance_from_prev_km=1.2,
            notes=p.description[:120] if p.description else "",
            reason_for_recommendation=f"High proximity match ({req.hours_available}h window - Option #{variation_count + 1}).",
            map_lat=p.latitude,
            map_lng=p.longitude,
            booking_url=p.booking_url,
            opening_hours=f"{p.opening_time} - {p.closing_time}",
            status="upcoming",
            is_locked=False
        ))
        accum_mins = end_mins + 15

    return QuickPlanResponse(
        headline=f"Spontaneous {int(req.hours_available)}-Hour Micro Plan",
        summary=f"Curated {len(items)} nearby stops that fit your immediate {int(req.hours_available)} hour window without rushing.",
        duration_hours=req.hours_available,
        items=items
    )

@router.post("/{trip_id}/im-here", response_model=ImHereResponse)
def im_here_mode(
    trip_id: str,
    req: ImHereRequest,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    dest = trip.destination
    curr_lat = req.current_lat or dest.latitude
    curr_lng = req.current_lng or dest.longitude
    curr_loc_name = req.current_location_name or f"{dest.name} Bus Stand / Main Arrival Hub"

    hotel = getattr(trip, "hotel", None)
    if not hotel and dest and getattr(dest, "hotels", None):
        hotel = dest.hotels[0]

    hotel_info = None
    if hotel:
        hotel_info = {
            "name": hotel.name,
            "address": hotel.address,
            "check_in_time": hotel.check_in_time,
            "distance_km": haversine_distance_km(curr_lat, curr_lng, hotel.latitude, hotel.longitude)
        }

    # Fetch nearby food and attractions
    places = db.query(Place).filter(Place.destination_id == dest.id).all()
    food_places = [p for p in places if p.category.lower() in ["café", "food", "cafés & bakery", "local food"]]
    attractions = [p for p in places if p.category.lower() not in ["café", "food", "cafés & bakery", "local food", "essentials & medical"]]

    # Sort by proximity
    food_places.sort(key=lambda p: haversine_distance_km(curr_lat, curr_lng, p.latitude, p.longitude))
    attractions.sort(key=lambda p: haversine_distance_km(curr_lat, curr_lng, p.latitude, p.longitude))

    hotel_name = hotel.name if hotel else "Hotel / Mountain Stay"
    hotel_lat = hotel.latitude if hotel else curr_lat
    hotel_lng = hotel.longitude if hotel else curr_lng

    # Immediate 3-Hour Plan
    micro_items = [
        ItineraryItemResponse(
            id="here-1",
            itinerary_id="here",
            place_id=food_places[0].id if food_places else None,
            title=f"Breakfast & Mountain Chai at {food_places[0].name}" if food_places else "Arrival Breakfast",
            category="Food",
            start_time="08:30",
            end_time="09:30",
            duration_mins=60,
            estimated_cost=food_places[0].approx_cost if food_places else 150.0,
            travel_time_from_prev_mins=5,
            distance_from_prev_km=0.4,
            notes="Stretch after travel, order hot Himalayan tea and fresh breakfast.",
            reason_for_recommendation="Nearest top-rated morning food spot from your arrival point.",
            map_lat=food_places[0].latitude if food_places else curr_lat,
            map_lng=food_places[0].longitude if food_places else curr_lng,
            booking_url=None,
            opening_hours="07:30 - 22:00",
            status="upcoming",
            is_locked=False
        ),
        ItineraryItemResponse(
            id="here-2",
            itinerary_id="here",
            place_id=None,
            title=f"Leave Luggage at {hotel_name}",
            category="Stay",
            start_time="09:45",
            end_time="10:15",
            duration_mins=30,
            estimated_cost=0.0,
            travel_time_from_prev_mins=15,
            distance_from_prev_km=1.8,
            notes="Drop heavy backpacks at reception desk. Official room check-in starts at 11:00 AM.",
            reason_for_recommendation="Frees you up to explore without carrying heavy luggage.",
            map_lat=hotel_lat,
            map_lng=hotel_lng,
            booking_url=None,
            opening_hours="24/7",
            status="upcoming",
            is_locked=True
        ),
        ItineraryItemResponse(
            id="here-3",
            itinerary_id="here",
            place_id=attractions[0].id if attractions else None,
            title=f"Scenic Walk: {attractions[0].name}" if attractions else "Old Village Stroll",
            category="Attraction",
            start_time="10:30",
            end_time="11:45",
            duration_mins=75,
            estimated_cost=0.0,
            travel_time_from_prev_mins=15,
            distance_from_prev_km=1.2,
            notes="Gentle stroll through cedar forest and ancient alleys.",
            reason_for_recommendation="Close to stay and low physical intensity after travel.",
            map_lat=attractions[0].latitude if attractions else curr_lat,
            map_lng=attractions[0].longitude if attractions else curr_lng,
            booking_url=None,
            opening_hours="08:00 - 19:00",
            status="upcoming",
            is_locked=False
        )
    ]

    return ImHereResponse(
        current_location_name=curr_loc_name,
        hotel_info=hotel_info,
        timing_guidance=f"You're in {dest.name}. Your hotel check-in is at {trip.hotel.check_in_time if trip.hotel else '11:00 AM'}. Here is your optimal plan for the next 3 hours.",
        next_3_hours_plan=micro_items,
        nearby_food=[PlaceResponse.model_validate(p) for p in food_places[:4]],
        nearby_attractions=[PlaceResponse.model_validate(p) for p in attractions[:4]],
        local_transport_options=[
            {"mode": "Local Auto / Taxi", "est_fare": "₹100 - ₹150", "tip": "Available right outside the main gate."},
            {"mode": "Scooter Rental", "est_fare": "₹500/day", "tip": "Valley Scooters Hub is 300m walking distance."}
        ]
    )

@router.put("/{trip_id}/items/{item_id}")
def update_itinerary_item(
    trip_id: str,
    item_id: str,
    status: Optional[str] = None,
    is_locked: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    item = db.query(ItineraryItem).filter(ItineraryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    
    if status is not None:
        item.status = status
    if is_locked is not None:
        item.is_locked = is_locked

    db.commit()
    return {"success": True, "item_id": item.id, "status": item.status, "is_locked": item.is_locked}
