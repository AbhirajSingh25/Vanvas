from typing import List, Optional
from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Trip, TripMember, Destination, ChecklistItem, User, generate_uuid
from app.schemas.schemas import (
    RoadTripPlanRequest, RoadTripPlanResponse, TripDetailResponse, TripSummaryResponse
)
from app.api.deps import get_current_user, get_current_user_optional
from app.services.road_trip_service import RoadTripService

router = APIRouter()

@router.post("/plan", response_model=RoadTripPlanResponse)
def plan_road_trip(
    req: RoadTripPlanRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        plan = RoadTripService.plan_road_trip(req, db_session=db)
        return plan
    except Exception as e:
        import logging
        logging.getLogger("vanvas.road_trip").error(f"Road trip planning error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not calculate road trip: {str(e)}"
        )

@router.post("/save", response_model=TripDetailResponse)
def save_road_trip_as_trip(
    req: RoadTripPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Persist a planned road trip into the persistent trips database so the user
    can return later, track expenses in Trip Ledger, invite friends, and replan.
    """
    try:
        plan = RoadTripService.plan_road_trip(req, db_session=db)
        
        # Check or create destination for terminal point
        dest_slug = req.destination.lower().replace(" ", "-")
        destination = db.query(Destination).filter(
            (Destination.slug == dest_slug) | (Destination.name.ilike(req.destination))
        ).first()

        if not destination:
            d_lat, d_lng, d_name = RoadTripService.resolve_city_coords(req.destination)
            destination = Destination(
                id=f"dest-road-{dest_slug}",
                name=d_name,
                slug=dest_slug,
                state="India",
                region="Road Corridor",
                tagline=f"Road trip terminal destination: {d_name}",
                description=f"Road journey destination reached via {plan.corridor_name}.",
                latitude=d_lat,
                longitude=d_lng,
                is_featured=False
            )
            db.add(destination)
            db.flush()

        # Create persistent Trip
        trip = Trip(
            user_id=current_user.id,
            destination_id=destination.id,
            title=plan.title,
            start_date=plan.start_date,
            end_date=plan.end_date,
            num_days=plan.num_days,
            budget_total=plan.budget_estimate.total_estimated,
            budget_spent=0.0,
            travellers_count=req.travellers_count,
            companion_type="Friends" if req.travellers_count > 1 else "Solo",
            travel_style=req.trip_style,
            wake_up_preference="Early",
            activity_intensity="Balanced",
            interests=f"Road Trip,Highway,Dhabas,{req.vehicle_type}",
            origin_city=plan.origin,
            trip_mode="road_trip",
            vehicle_type=req.vehicle_type,
            vehicle_mileage_kpl=plan.fuel_breakdown.assumed_mileage_kpl,
            fuel_price_per_litre=plan.fuel_breakdown.assumed_fuel_rate_per_litre,
            route_geometry_json=json.dumps(plan.route_geometry),
            road_trip_stops_json=json.dumps([s.model_dump() for s in plan.recommended_stops]),
            budget_breakdown_json=json.dumps(plan.budget_estimate.model_dump()),
            status="active"
        )
        db.add(trip)
        db.flush()

        # Add owner membership
        db.add(TripMember(trip_id=trip.id, user_id=current_user.id, role="owner"))

        # Seed road trip checklist
        road_checks = [
            ("Vehicle", "Check Tire Pressure & Stepney Condition", True),
            ("Vehicle", "Engine Oil, Coolant & Windshield Washer Fluid", True),
            ("Vehicle", "Fastag Recharge & Vehicle RC/Insurance", True),
            ("Essentials", "Offline Google Maps downloaded for route", True),
            ("Essentials", "Car Phone Mount & High-Power 12V Car Charger", True),
            ("Essentials", "Emergency Puncture Kit & Portable Tire Inflator", False),
            ("Essentials", "Cash for Tolls / Remote Highway Dhabas", True),
            ("Essentials", "First Aid Box & Motion Sickness Tablets", False)
        ]
        for cat, item_name, is_chk in road_checks:
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
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger("vanvas.road_trip").error(f"Save road trip failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not persist road trip: {str(e)}"
        )

@router.get("/corridors")
def get_popular_corridors():
    return [
        {
            "id": "delhi-goa",
            "title": "Delhi to Goa Grand Western Highway",
            "origin": "Delhi",
            "destination": "Goa",
            "distance_km": 1850,
            "days_suggested": 5,
            "highlights": ["Neemrana Fort", "Pushkar Lake", "Chittorgarh Fort", "Amboli Waterfall Ghat"],
            "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800"
        },
        {
            "id": "delhi-manali",
            "title": "Delhi to Manali Himalayan Expressway",
            "origin": "Delhi",
            "destination": "Manali",
            "distance_km": 540,
            "days_suggested": 2,
            "highlights": ["Murthal Parathas", "Brahma Sarovar", "Gobind Sagar Lake", "Aut Tunnel Gorge"],
            "image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800"
        },
        {
            "id": "bangalore-goa",
            "title": "Bengaluru to Goa Western Ghats Drive",
            "origin": "Bangalore",
            "destination": "Goa",
            "distance_km": 570,
            "days_suggested": 2,
            "highlights": ["Chitradurga Stone Fort", "Dandeli Rainforest", "Anmod Ghat Switchbacks"],
            "image": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800"
        },
        {
            "id": "delhi-rishikesh",
            "title": "Delhi to Rishikesh Ganga Highway",
            "origin": "Delhi",
            "destination": "Rishikesh",
            "distance_km": 240,
            "days_suggested": 1,
            "highlights": ["Cheetal Grand Garden Cafe", "Har Ki Pauri Ghat", "Tapovan Bridge"],
            "image": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800"
        }
    ]
