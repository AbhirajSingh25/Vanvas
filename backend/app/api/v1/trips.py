import json
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
    TripMemberResponse, ActionPreviewRequest, ActionPreviewResponse,
    ActionApplyRequest, ActionApplyResponse, TripRevisionResponse,
    CurrentStateResponse, TripBudgetUpdateRequest, BookingResponse
)
from app.api.deps import get_current_user, get_current_user_optional
from app.itinerary.generator import ItineraryEngine
from app.itinerary.dynamic_replanner import DynamicReplanner
from app.itinerary.clustering import haversine_distance_km

from app.services.destination_intelligence import DestinationIntelligenceService
from app.services.dynamic_intelligence import DynamicIntelligenceService
from app.providers.provider_factory import ProviderFactory

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
            destination_id=t.destination_id,
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
            origin_city=t.origin_city,
            trip_mode=t.trip_mode or "standard",
            transport_mode=t.transport_mode,
            status=t.status
        ))
    return summaries

@router.post("", response_model=TripDetailResponse)
async def create_trip(
    trip_in: TripCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        raw_dest_id = trip_in.destination_id.strip()
        clean_slug = DestinationIntelligenceService._clean_query(raw_dest_id).lower().replace(" ", "-")

        destination = db.query(Destination).filter(
            (Destination.id == raw_dest_id) |
            (Destination.id == f"dest-{clean_slug}") |
            (Destination.id == f"dyn-{clean_slug}") |
            (Destination.slug == clean_slug) |
            (Destination.name.ilike(clean_slug.replace("-", " ")))
        ).first()

        if not destination:
            # Resolve dynamic destination across India
            dyn = await DestinationIntelligenceService.resolve_dynamic_destination(raw_dest_id)
            if not dyn:
                raise HTTPException(status_code=404, detail=f"Destination '{trip_in.destination_id}' not found")

            # Check if already in DB by canonical slug
            canonical_slug = dyn.get("canonical_slug") or dyn["slug"]
            existing = db.query(Destination).filter(
                (Destination.slug == canonical_slug) |
                (Destination.id == f"dyn-{canonical_slug}")
            ).first()
            if existing:
                destination = existing
            else:
                destination = Destination(
                    id=dyn["id"],
                    name=dyn["name"],
                    slug=canonical_slug,
                    state=dyn["state"],
                    region=dyn["region"],
                    tagline=dyn["tagline"],
                    description=dyn["description"],
                    hero_image=dyn.get("hero_image"),
                    latitude=dyn["latitude"],
                    longitude=dyn["longitude"],
                    altitude_meters=dyn.get("altitude_meters", 550),
                    weather_type=dyn.get("weather_type", "Live Dynamic"),
                    is_featured=False
                )
                db.add(destination)
                db.flush()

        # If dynamic destination has no persisted places yet, fetch & persist live places idempotently
        existing_places_count = db.query(Place).filter(Place.destination_id == destination.id).count()
        if existing_places_count == 0 and (destination.id.startswith("dyn-") or getattr(destination, "is_dynamic", False)):
            try:
                places_provider = ProviderFactory.get_places_provider()
                live_places_raw = await places_provider.get_nearby_places(destination.latitude, destination.longitude, radius_km=15.0)
                with db.begin_nested():
                    for lp in live_places_raw:
                        p_name = lp.get("name")
                        if not p_name:
                            continue

                        raw_id = str(lp.get("id") or lp.get("source_id") or f"live-{abs(hash(p_name)) % 10000000}").strip()
                        # Ensure deterministic, destination-scoped place id (e.g. "dyn-gokarna:osm-node-1700348")
                        if raw_id.startswith(f"{destination.id}:"):
                            scoped_id = raw_id
                        elif raw_id.startswith(f"{destination.slug}:"):
                            scoped_id = f"{destination.id}:{raw_id.split(':', 1)[1]}"
                        else:
                            scoped_id = f"{destination.id}:{raw_id}"
                        scoped_id = scoped_id[:100]

                        # Idempotent lookup: reuse existing place if already stored for this destination
                        p_exist = db.query(Place).filter(
                            (Place.id == scoped_id) |
                            ((Place.destination_id == destination.id) & (Place.name == p_name))
                        ).first()

                        if not p_exist:
                            new_p = Place(
                                id=scoped_id,
                                destination_id=destination.id,
                                category=lp.get("category", "Attractions"),
                                name=p_name,
                                slug=p_name.lower().replace(" ", "-")[:255],
                                description=lp.get("address") or f"Point of interest in {destination.name}",
                                address=lp.get("address"),
                                latitude=lp.get("latitude") or destination.latitude,
                                longitude=lp.get("longitude") or destination.longitude,
                                price_level=lp.get("price_level", "₹₹"),
                                approx_cost=lp.get("approx_cost", 0.0),
                                rating=lp.get("rating"),
                                review_count=lp.get("review_count"),
                                opening_time=lp.get("opening_time") or "09:00",
                                closing_time=lp.get("closing_time") or "20:00",
                                booking_url=lp.get("website"),
                                is_active=True
                            )
                            db.add(new_p)
                    db.flush()
            except Exception as e:
                import logging
                logging.getLogger("vanvas.trips").warning(f"Could not persist live places for {destination.id}: {e}")

        num_days = max(1, (trip_in.end_date - trip_in.start_date).days + 1)

        # Auto-select best hotel and rental matching budget style
        hotel = db.query(Hotel).filter(Hotel.destination_id == destination.id).first()
        rental = db.query(RentalOption).filter(RentalOption.destination_id == destination.id).first()

        # Map transport_mode and details
        chosen_transport_mode = trip_in.transport_mode.strip().lower().replace(" ", "_")
        transport_details_str = json.dumps(trip_in.transport_details) if trip_in.transport_details else None

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
            origin_city=trip_in.origin_city.strip(),
            trip_mode="road_trip" if chosen_transport_mode == "road_trip" else "standard",
            transport_mode=chosen_transport_mode,
            transport_details_json=transport_details_str,
            hotel_id=hotel.id if hotel else None,
            rental_id=rental.id if rental else None,
            status="active"
        )
        db.add(trip)
        db.flush()

        # Add owner member
        db.add(TripMember(trip_id=trip.id, user_id=current_user.id, role="owner"))

        # Load Active Traveller Memory Preferences (Phase 5)
        from app.services.traveller_memory_service import TravellerMemoryService
        memory_ctx = TravellerMemoryService.build_personalization_context(
            db=db,
            user_id=current_user.id,
            destination_slug=destination.slug
        )
        mem_prefs = memory_ctx.get("active_preferences_map", {})

        # Record observations for selected hotel / transport (Phase 5)
        if hotel:
            try:
                TravellerMemoryService.record_observation(
                    db=db,
                    user_id=current_user.id,
                    event_type="HOTEL_SELECTED",
                    category="accommodation",
                    observed_key="stay_category",
                    observed_value=hotel.hotel_style or "Hotel",
                    trip_id=trip.id,
                    source_id=hotel.id,
                    metadata={"hotel_name": hotel.name}
                )
            except Exception:
                pass

        if chosen_transport_mode:
            try:
                TravellerMemoryService.record_observation(
                    db=db,
                    user_id=current_user.id,
                    event_type="TRANSPORT_SELECTED",
                    category="transport",
                    observed_key="transport_mode",
                    observed_value=chosen_transport_mode,
                    trip_id=trip.id,
                    metadata={"transport_mode": chosen_transport_mode}
                )
            except Exception:
                pass

        # Generate Itinerary with Personalization Layer
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
            rental=rental,
            planning_mode=getattr(trip_in, "planning_mode", "multi_day") or "multi_day",
            transport_mode=chosen_transport_mode,
            transport_details=trip_in.transport_details,
            memory_preferences=mem_prefs
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
    except Exception as exc:
        db.rollback()
        import logging
        logging.getLogger("vanvas.trips").error(f"Trip creation failed for {trip_in.destination_id}: {exc}", exc_info=True)
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trip itinerary generation could not complete: {str(exc)}"
        )

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
 
@router.post("/{trip_id}/actions/preview", response_model=ActionPreviewResponse)
async def preview_trip_action(
    trip_id: str,
    req: ActionPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only trip members can adapt the itinerary.")

    try:
        return await DynamicIntelligenceService.preview_action(db=db, trip=trip, req=req)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger = logging.getLogger("vanvas.trips")
        logger.error(f"Action preview failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Action preview could not complete: {str(e)}")

@router.post("/{trip_id}/actions/apply", response_model=ActionApplyResponse)
def apply_trip_action(
    trip_id: str,
    req: ActionApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only trip members can mutate the itinerary.")

    try:
        return DynamicIntelligenceService.apply_action(db=db, trip=trip, user=current_user, req=req)
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        logger = logging.getLogger("vanvas.trips")
        logger.error(f"Action apply failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Action apply could not complete: {str(e)}")

@router.get("/{trip_id}/revisions", response_model=List[TripRevisionResponse])
def get_trip_revisions(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only trip members can view revision history.")

    return DynamicIntelligenceService.get_trip_revisions(db=db, trip_id=trip_id)

@router.get("/{trip_id}/current-state", response_model=CurrentStateResponse)
async def get_current_trip_state(
    trip_id: str,
    current_time: Optional[str] = None,
    current_lat: Optional[float] = None,
    current_lng: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only trip members can view current trip state.")

    return await DynamicIntelligenceService.get_current_state(
        db=db,
        trip=trip,
        current_time_str=current_time,
        current_lat=current_lat,
        current_lng=current_lng
    )

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

    dest_lat = trip.destination.latitude if (trip.destination and trip.destination.latitude is not None) else 28.6139
    dest_lng = trip.destination.longitude if (trip.destination and trip.destination.longitude is not None) else 77.2090
    lat = req.current_lat or dest_lat
    lng = req.current_lng or dest_lng

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: You must be a member of this trip to update items.")

    item = db.query(ItineraryItem).join(Itinerary).filter(
        ItineraryItem.id == item_id,
        Itinerary.trip_id == trip.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found in this trip")

    if status is not None:
        item.status = status
    if is_locked is not None:
        item.is_locked = is_locked

    # Record revision
    try:
        from app.models.models import TripRevision
        revision = TripRevision(
            trip_id=trip.id,
            user_id=current_user.id,
            action_type="UPDATE_ACTIVITY",
            description=f"Updated '{item.title}' (status={item.status}, locked={item.is_locked})",
            payload_json=json.dumps({"item_id": item_id, "status": item.status, "is_locked": item.is_locked})
        )
        db.add(revision)
    except Exception:
        pass

    db.commit()
    return {"success": True, "item_id": item.id, "status": item.status, "is_locked": item.is_locked}

@router.post("/{trip_id}/itineraries/{day_number}/places/{place_id}", response_model=ItineraryItemResponse)
def add_place_to_trip_itinerary(
    trip_id: str,
    day_number: int,
    place_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deterministic REST endpoint to add a canonical place to a trip's day itinerary.
    Authenticates, authorizes membership, computes scheduling slot, and creates item.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: You must be a member of this trip to add places.")

    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        # Check by slug
        place = db.query(Place).filter(Place.slug == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found")

    itinerary = db.query(Itinerary).filter(Itinerary.trip_id == trip.id, Itinerary.day_number == day_number).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail=f"Day {day_number} itinerary not found for trip")

    # Check if place already added to this day
    existing_item = db.query(ItineraryItem).filter(
        ItineraryItem.itinerary_id == itinerary.id,
        ItineraryItem.place_id == place.id
    ).first()
    if existing_item:
        return ItineraryItemResponse.model_validate(existing_item)

    # Determine distance and travel time from previous item or basecamp/hotel
    existing_items = sorted(itinerary.items, key=lambda x: x.start_time or "09:00")
    prev_lat, prev_lng = None, None
    if existing_items:
        last_item = existing_items[-1]
        prev_lat = last_item.map_lat
        prev_lng = last_item.map_lng

    if prev_lat is None or prev_lng is None:
        if trip.hotel and trip.hotel.latitude and trip.hotel.longitude:
            prev_lat = trip.hotel.latitude
            prev_lng = trip.hotel.longitude
        elif trip.destination and trip.destination.latitude and trip.destination.longitude:
            prev_lat = trip.destination.latitude
            prev_lng = trip.destination.longitude

    if prev_lat is not None and prev_lng is not None and place.latitude is not None and place.longitude is not None:
        dist_km = round(haversine_distance_km(prev_lat, prev_lng, place.latitude, place.longitude), 2)
        travel_time_mins = max(5, int((dist_km / 25.0) * 60) + 5) if dist_km > 0 else 0
    else:
        dist_km = None
        travel_time_mins = None

    if existing_items:
        last_item = existing_items[-1]
        try:
            last_end_parts = (last_item.end_time or "16:00").split(":")
            buf = travel_time_mins if travel_time_mins is not None else 15
            start_mins = int(last_end_parts[0]) * 60 + int(last_end_parts[1]) + buf
        except Exception:
            start_mins = 16 * 60
    else:
        start_mins = 10 * 60

    duration = place.recommended_duration_mins or 60
    end_mins = start_mins + duration

    start_str = f"{(start_mins // 60) % 24:02d}:{start_mins % 60:02d}"
    end_str = f"{(end_mins // 60) % 24:02d}:{end_mins % 60:02d}"

    new_item = ItineraryItem(
        itinerary_id=itinerary.id,
        place_id=place.id,
        title=place.name,
        category=place.category or "Attraction",
        start_time=start_str,
        end_time=end_str,
        duration_mins=duration,
        estimated_cost=place.approx_cost or 0.0,
        travel_time_from_prev_mins=travel_time_mins,
        distance_from_prev_km=dist_km,
        notes=place.description[:120] if place.description else f"Explore {place.name}",
        reason_for_recommendation=f"Added by explorer to Day {day_number}.",
        map_lat=place.latitude,
        map_lng=place.longitude,
        booking_url=place.booking_url,
        opening_hours=f"{place.opening_time or '09:00'} - {place.closing_time or '20:00'}",
        status="upcoming",
        is_locked=False
    )
    db.add(new_item)

    # Record revision
    try:
        from app.models.models import TripRevision
        revision = TripRevision(
            trip_id=trip.id,
            user_id=current_user.id,
            action_type="ADD_ACTIVITY",
            description=f"Added '{place.name}' to Day {day_number}",
            payload_json=json.dumps({"place_id": place.id, "day_number": day_number})
        )
        db.add(revision)
    except Exception:
        pass

    db.commit()
    db.refresh(new_item)
    return ItineraryItemResponse.model_validate(new_item)

@router.delete("/{trip_id}/items/{item_id}")
def delete_trip_itinerary_item(
    trip_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deterministic REST endpoint to delete an itinerary item from a trip.
    Authenticates, authorizes membership, removes item, records revision.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: You must be a member of this trip to delete items.")

    item = db.query(ItineraryItem).join(Itinerary).filter(
        ItineraryItem.id == item_id,
        Itinerary.trip_id == trip.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found in this trip")

    deleted_title = item.title
    db.delete(item)

    # Record revision
    try:
        from app.models.models import TripRevision
        revision = TripRevision(
            trip_id=trip.id,
            user_id=current_user.id,
            action_type="REMOVE_ACTIVITY",
            description=f"Removed '{deleted_title}' from itinerary",
            payload_json=json.dumps({"item_id": item_id, "title": deleted_title})
        )
        db.add(revision)
    except Exception:
        pass

    db.commit()
    return {"success": True, "message": f"Successfully removed '{deleted_title}' from trip.", "item_id": item_id}

@router.patch("/{trip_id}/budget", response_model=TripDetailResponse)
def update_trip_budget(
    trip_id: str,
    budget_req: TripBudgetUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update interactive trip budget assumptions, fuel settings, stay, food, custom expenses,
    and persist configuration to database.
    Enforces authenticated user and trip membership verification.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(TripMember.trip_id == trip.id, TripMember.user_id == current_user.id).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: You must be a member of this trip to update its budget.")

    if budget_req.travellers_count is not None and budget_req.travellers_count >= 1:
        trip.travellers_count = budget_req.travellers_count

    if budget_req.vehicle_type is not None:
        trip.vehicle_type = budget_req.vehicle_type

    if budget_req.fuel_efficiency is not None:
        trip.vehicle_mileage_kpl = budget_req.fuel_efficiency

    if budget_req.fuel_rate is not None:
        trip.fuel_price_per_litre = budget_req.fuel_rate

    if budget_req.budget_total is not None and budget_req.budget_total >= 0:
        trip.budget_total = budget_req.budget_total

    if budget_req.budget_breakdown is not None:
        trip.budget_breakdown_json = json.dumps(budget_req.budget_breakdown)

    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}/bookings", response_model=List[BookingResponse])
def get_trip_bookings(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all bookings attached to a trip.
    Accessible only to authorized trip members and creator.
    """
    from app.services.booking_service import BookingService
    bookings = BookingService.get_trip_bookings(db=db, trip_id=trip_id, user=current_user)
    return bookings


