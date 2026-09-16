from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Trip, Place, User
from app.schemas.schemas import CopilotMessageRequest, CopilotMessageResponse, PlaceResponse
from app.api.deps import get_current_user
from app.itinerary.clustering import haversine_distance_km

router = APIRouter()

@router.post("/{trip_id}/assistant", response_model=CopilotMessageResponse)
def chat_with_assistant(
    trip_id: str,
    req: CopilotMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    query_lower = req.message.lower().strip()
    dest = trip.destination
    remaining_budget = max(0.0, (trip.budget_total or 10000.0) - (trip.budget_spent or 0.0))

    places = db.query(Place).filter(Place.destination_id == dest.id).all()
    suggested_actions = []
    relevant_places = []
    reply = ""

    # Contextual Intent Classification
    if any(k in query_lower for k in ["eat", "food", "hungry", "lunch", "dinner", "breakfast", "cafe", "café"]):
        food_places = [p for p in places if p.category.lower() in ["café", "food", "cafés & bakery", "local food"]]
        if food_places:
            top_spot = food_places[0]
            second_spot = food_places[1] if len(food_places) > 1 else top_spot
            reply = (
                f"Based on your location in {dest.name} and your remaining budget (₹{int(remaining_budget):,}), "
                f"I recommend heading to **{top_spot.name}** ({top_spot.category}, ~₹{int(top_spot.approx_cost)}). "
                f"{top_spot.why_vanvas_recommends} Alternatively, **{second_spot.name}** is a fantastic choice nearby."
            )
            relevant_places = [PlaceResponse.model_validate(p) for p in [top_spot, second_spot]]
            suggested_actions = [
                {"label": "Add to Itinerary", "action": "add_place"},
                {"label": "Under ₹200 Options", "action": "filter_budget_food"}
            ]

    elif any(k in query_lower for k in ["tired", "exhausted", "rest", "sleep"]):
        reply = (
            f"No worries at all! I've marked your evening to relax. Your hotel ({trip.hotel.name if trip.hotel else 'stay'}) "
            f"is only a short distance away. Skip the intense treks for today—I've slotted a calming herbal tea session "
            f"at a cozy riverside spot nearby instead."
        )
        suggested_actions = [
            {"label": "Apply 'I'm Tired' Replanning", "action": "tired"},
            {"label": "Navigate to Hotel", "action": "open_hotel_map"}
        ]

    elif any(k in query_lower for k in ["late", "behind", "delayed", "missed"]):
        reply = (
            f"Travel happens! You don't need to stress. I can automatically shift your upcoming stops forward by 45 minutes "
            f"and trim lower-priority detours so you reach your sunset spot right on time."
        )
        suggested_actions = [
            {"label": "Auto-Shift Itinerary (I'm Late)", "action": "late"}
        ]

    elif any(k in query_lower for k in ["rain", "raining", "weather", "shower", "cold"]):
        reply = (
            f"Looks like mountain mist and rain are rolling into {dest.name}. I've picked out indoor sanctuaries for you: "
            f"warm wooden book cafés, covered local art bazaars, and traditional hot Siddu counters."
        )
        suggested_actions = [
            {"label": "Switch to Rain-Friendly Mode", "action": "rain"}
        ]

    elif any(k in query_lower for k in ["budget", "money", "expensive", "cost", "left"]):
        reply = (
            f"You have **₹{int(remaining_budget):,} remaining** out of your ₹{int(trip.budget_total):,} budget. "
            f"Your daily average spend is ₹{int((trip.budget_spent or 0) / max(1, trip.num_days)):,}. "
            f"Would you like me to prioritize free viewpoints and authentic local dhabas for tomorrow?"
        )
        suggested_actions = [
            {"label": "Trim Budget on Remaining Days", "action": "less_money"},
            {"label": "Log a New Expense", "action": "add_expense"}
        ]

    else:
        reply = (
            f"I'm keeping an eye on your journey across {dest.name}. "
            f"You're currently traveling {trip.companion_type} with a {trip.travel_style} style. "
            f"Ask me for immediate food spots, quick 2-hour plans, or tell me if you're late, tired, or caught in the rain!"
        )
        suggested_actions = [
            {"label": "I Have 2 Hours", "action": "quick_2h"},
            {"label": "Where Should I Eat?", "action": "find_food"},
            {"label": "I'm Here Mode", "action": "im_here"}
        ]

    return CopilotMessageResponse(
        reply=reply,
        suggested_actions=suggested_actions,
        relevant_places=relevant_places
    )
