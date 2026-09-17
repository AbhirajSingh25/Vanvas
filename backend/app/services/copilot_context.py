"""
VANVAS Copilot Context Assembler
Builds high-signal, concise travel context and strict anti-hallucination system instructions.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import User, Trip, TripMember, Destination, UserPreference


def build_copilot_context(
    db: Session,
    user: User,
    trip_id: Optional[str] = None,
    destination_slug: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Assembles relevant travel context for the active user, trip, and destination.
    Avoids large database dumps to conserve tokens and maintain high reasoning precision.
    """
    # 1. User Profile Snapshot
    prefs: Optional[UserPreference] = user.preferences
    user_context = {
        "user_name": user.full_name,
        "travel_style": prefs.preferred_travel_style if prefs else "Balanced",
        "wake_up_preference": prefs.wake_up_preference if prefs else "Normal",
        "activity_intensity": prefs.activity_intensity if prefs else "Balanced",
        "dietary_preference": prefs.dietary_preference if prefs else "All",
        "interests": prefs.interests if prefs else "Nature,Cafes,Scenery",
        "companion_style": prefs.companion_style if prefs else "Solo",
    }

    # 2. Trip Snapshot (if trip_id is provided and user has access)
    trip_context = None
    target_dest_slug = destination_slug

    if trip_id:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if trip:
            # Authorization verification
            is_creator = (trip.user_id == user.id)
            is_member = bool(db.query(TripMember).filter(
                TripMember.trip_id == trip.id, TripMember.user_id == user.id
            ).first())

            if is_creator or is_member:
                trip_context = {
                    "trip_id": trip.id,
                    "title": trip.title,
                    "destination_name": trip.destination.name if trip.destination else "Himalayas",
                    "destination_slug": trip.destination.slug if trip.destination else "manali",
                    "start_date": str(trip.start_date),
                    "end_date": str(trip.end_date),
                    "num_days": trip.num_days,
                    "budget_total": trip.budget_total,
                    "budget_spent": trip.budget_spent,
                    "status": trip.status,
                    "travel_style": trip.travel_style,
                    "activity_intensity": trip.activity_intensity,
                }
                if not target_dest_slug and trip.destination:
                    target_dest_slug = trip.destination.slug

    # 3. Destination Snapshot
    destination_context = None
    if target_dest_slug:
        dest = db.query(Destination).filter(
            (Destination.slug == target_dest_slug.lower()) | 
            (Destination.name.ilike(target_dest_slug))
        ).first()
        if dest:
            destination_context = {
                "destination_name": dest.name,
                "destination_slug": dest.slug,
                "state": dest.state,
                "region": dest.region,
                "altitude_meters": dest.altitude_meters,
                "weather_type": dest.weather_type,
                "tagline": dest.tagline,
                "coordinates": {"lat": dest.latitude, "lng": dest.longitude}
            }

    # 4. Strict System Instruction
    system_instruction = (
        "You are VANVAS Copilot (यात्रा साथी), an intelligent, calm, and grounded travel assistant "
        "for Indian and Himalayan journeys.\n\n"
        "CORE RULES:\n"
        "1. DATA IS THE SOURCE OF TRUTH: Never invent places, prices, ratings, reviews, opening hours, or contact details. "
        "All factual recommendations MUST come from VANVAS tools.\n"
        "2. CANONICAL PLACE IDENTITY: When recommending a place, reference its exact name and canonical place_id.\n"
        "3. HONESTY OVER COMPLETENESS: If no places match a query or conditions, state that clearly rather than inventing a place.\n"
        "4. TRAVEL PHILOSOPHY: Emphasize slow, scenic, authentic mountain experiences. Avoid rushed itineraries.\n"
        "5. TOOL FIRST: If the user asks for plans, weather, places, budget, or routing, invoke the corresponding tool before finalizing your advice.\n"
        f"CURRENT TRAVELLER CONTEXT: {user_context}\n"
    )

    if trip_context:
        system_instruction += f"ACTIVE TRIP CONTEXT: {trip_context}\n"
    if destination_context:
        system_instruction += f"ACTIVE DESTINATION CONTEXT: {destination_context}\n"

    return {
        "system_instruction": system_instruction,
        "user_context": user_context,
        "trip_context": trip_context,
        "destination_context": destination_context,
    }
