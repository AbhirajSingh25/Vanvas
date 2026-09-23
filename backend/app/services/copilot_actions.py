"""
VANVAS Copilot Action Service (Phase 7)
Deterministic, allowlisted, authorized action validation and execution.
Enforces strict security:
- Zero direct database writes by LLMs
- Strict action allowlist: ONLY 'save_place' and 'add_place_to_itinerary'
- Multi-layer authorization (owner / active trip member)
- Place grounding against canonical database records (never creates fake places)
- Itinerary day and structure validation (preserves locked and existing items)
- Sanitized, structured outputs with zero stack traces or secret leakage
"""
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.models import User, Trip, TripMember, Place, Destination, SavedPlace, Itinerary, ItineraryItem

logger = logging.getLogger("vanvas.services.copilot_actions")

ALLOWLISTED_ACTIONS = {"save_place", "add_place_to_itinerary"}


class CopilotActionService:
    """Authorized action validator and executor for VANVAS Copilot."""

    @classmethod
    def execute_action(
        cls,
        db: Session,
        user: Optional[User],
        action_name: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Validates and safely executes an allowlisted action on behalf of an authenticated user.
        Always returns a structured response dictionary.
        """
        clean_action = (action_name or "").strip().lower()

        # 1. Allowlist Validation
        if clean_action not in ALLOWLISTED_ACTIONS:
            logger.warning(f"Rejected non-allowlisted action attempt: '{clean_action}'")
            return {
                "success": False,
                "action": clean_action,
                "error_code": "UNKNOWN_ACTION",
                "message": f"Action '{clean_action}' is not supported or allowlisted.",
            }

        # 2. Authentication Validation
        if not user or not getattr(user, "id", None):
            return {
                "success": False,
                "action": clean_action,
                "error_code": "UNAUTHENTICATED",
                "message": "User authentication is required to execute actions.",
            }

        try:
            if clean_action == "save_place":
                return cls._execute_save_place(db=db, user=user, payload=payload)
            elif clean_action == "add_place_to_itinerary":
                return cls._execute_add_place_to_itinerary(db=db, user=user, payload=payload)
            else:
                return {
                    "success": False,
                    "action": clean_action,
                    "error_code": "UNKNOWN_ACTION",
                    "message": f"Unsupported action: {clean_action}",
                }
        except Exception as e:
            logger.error(f"Error executing action '{clean_action}': {e}", exc_info=True)
            return {
                "success": False,
                "action": clean_action,
                "error_code": "ACTION_EXECUTION_ERROR",
                "message": "An unexpected error occurred while executing the travel action.",
            }

    @classmethod
    def _execute_save_place(
        cls,
        db: Session,
        user: User,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Saves a verified canonical place for the authenticated user.
        Safe idempotent operation.
        """
        raw_place_id = str(payload.get("place_id") or "").strip()
        if not raw_place_id:
            return {
                "success": False,
                "action": "save_place",
                "error_code": "MISSING_PLACE_ID",
                "message": "Missing required parameter 'place_id'.",
            }

        # Verify place exists in database (exact ID or canonical slug)
        place = db.query(Place).filter(
            (Place.id == raw_place_id) | (Place.slug == raw_place_id)
        ).first()

        if not place:
            logger.warning(f"save_place failed: place '{raw_place_id}' not found in database.")
            return {
                "success": False,
                "action": "save_place",
                "error_code": "PLACE_NOT_FOUND",
                "message": f"Place '{raw_place_id}' does not exist in verified sanctuary places.",
            }

        # Check if already saved (idempotent)
        existing_save = db.query(SavedPlace).filter(
            SavedPlace.user_id == user.id,
            SavedPlace.place_id == place.id,
        ).first()

        if existing_save:
            return {
                "success": True,
                "action": "save_place",
                "already_saved": True,
                "place": {
                    "id": place.id,
                    "name": place.name,
                    "category": place.category,
                },
                "message": f"'{place.name}' is already in your saved places.",
            }

        # Persist new saved place
        new_save = SavedPlace(
            user_id=user.id,
            place_id=place.id,
            destination_id=place.destination_id,
        )
        db.add(new_save)
        db.commit()

        logger.info(f"User {user.id} saved place {place.id} ('{place.name}')")

        return {
            "success": True,
            "action": "save_place",
            "already_saved": False,
            "place": {
                "id": place.id,
                "name": place.name,
                "category": place.category,
            },
            "message": f"Saved '{place.name}' to your travel collection.",
        }

    @classmethod
    def _execute_add_place_to_itinerary(
        cls,
        db: Session,
        user: User,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Adds a verified canonical place to a specific day of an authorized trip itinerary.
        Preserves existing and locked itinerary items.
        """
        trip_id = str(payload.get("trip_id") or "").strip()
        raw_place_id = str(payload.get("place_id") or "").strip()
        raw_day = payload.get("day")

        if not trip_id:
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "MISSING_TRIP_ID",
                "message": "Missing required parameter 'trip_id'.",
            }

        if not raw_place_id:
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "MISSING_PLACE_ID",
                "message": "Missing required parameter 'place_id'.",
            }

        try:
            day_number = int(raw_day)
        except (ValueError, TypeError):
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "INVALID_DAY",
                "message": "Parameter 'day' must be a valid positive integer.",
            }

        if day_number < 1:
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "INVALID_DAY",
                "message": f"Day {day_number} is invalid. Day must be 1 or greater.",
            }

        # 1. Resolve Trip
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "TRIP_NOT_FOUND",
                "message": f"Trip '{trip_id}' not found.",
            }

        # 2. Authorization Check (Creator OR active TripMember OR admin)
        is_creator = (trip.user_id == user.id)
        is_member = bool(db.query(TripMember).filter(
            TripMember.trip_id == trip.id, TripMember.user_id == user.id
        ).first())
        is_admin = (getattr(user, "role", "") == "admin")

        if not is_creator and not is_member and not is_admin:
            logger.warning(f"Unauthorized mutation attempt by user {user.id} on trip {trip.id}")
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "TRIP_NOT_AUTHORIZED",
                "message": "You are not authorized to modify this trip.",
            }

        # 3. Resolve Place (Strict Grounding: Never fabricate places)
        place = db.query(Place).filter(
            (Place.id == raw_place_id) | (Place.slug == raw_place_id)
        ).first()

        if not place:
            logger.warning(f"add_place_to_itinerary failed: place '{raw_place_id}' not found in database.")
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "PLACE_NOT_FOUND",
                "message": f"Place '{raw_place_id}' does not exist in verified sanctuary places.",
            }

        # 4. Destination Compatibility Check
        if place.destination_id and trip.destination_id and place.destination_id != trip.destination_id:
            trip_dest = trip.destination.name if trip.destination else "trip destination"
            place_dest = place.destination.name if place.destination else "other region"
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "DESTINATION_MISMATCH",
                "message": f"Place '{place.name}' ({place_dest}) does not belong to this trip's destination ({trip_dest}).",
            }

        # 5. Day Number Validation
        if trip.num_days and day_number > trip.num_days:
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "INVALID_DAY",
                "message": f"Day {day_number} exceeds the total duration of this trip ({trip.num_days} days).",
            }

        # 6. Resolve Itinerary Record for the Day
        target_itinerary = db.query(Itinerary).filter(
            Itinerary.trip_id == trip.id,
            Itinerary.day_number == day_number
        ).first()

        if not target_itinerary and trip.itineraries:
            for it in trip.itineraries:
                if it.day_number == day_number:
                    target_itinerary = it
                    break

        if not target_itinerary:
            return {
                "success": False,
                "action": "add_place_to_itinerary",
                "error_code": "ITINERARY_DAY_NOT_FOUND",
                "message": f"No itinerary schedule found for Day {day_number} of this trip.",
            }

        # 7. Calculate Time Slot while Preserving Existing & Locked Items
        existing_items = db.query(ItineraryItem).filter(
            ItineraryItem.itinerary_id == target_itinerary.id
        ).all()
        duration_mins = min(120, max(30, place.recommended_duration_mins or 60))

        if existing_items:
            # Parse end times of existing items
            def parse_time_mins(time_str: Optional[str]) -> int:
                if not time_str:
                    return 600
                try:
                    parts = time_str.strip().split(":")
                    return int(parts[0]) * 60 + int(parts[1])
                except Exception:
                    return 600

            max_end_mins = max(parse_time_mins(item.end_time) for item in existing_items)
            start_mins = min(max_end_mins + 15, 23 * 60)  # 15 mins travel buffer, max 23:00
        else:
            # First item of the day
            wake_pref = (trip.wake_up_preference or "Normal").lower()
            if wake_pref == "early":
                start_mins = 8 * 60 + 30  # 08:30
            elif wake_pref == "late":
                start_mins = 10 * 60 + 30  # 10:30
            else:
                start_mins = 9 * 60 + 30  # 09:30

        end_mins = min(start_mins + duration_mins, 23 * 60 + 59)
        start_str = f"{(start_mins // 60) % 24:02d}:{start_mins % 60:02d}"
        end_str = f"{(end_mins // 60) % 24:02d}:{end_mins % 60:02d}"

        # 8. Create and Persist ItineraryItem
        new_item = ItineraryItem(
            itinerary_id=target_itinerary.id,
            place_id=place.id,
            title=place.name,
            category=place.category or "Attraction",
            start_time=start_str,
            end_time=end_str,
            duration_mins=duration_mins,
            estimated_cost=place.approx_cost or 0.0,
            travel_time_from_prev_mins=15 if existing_items else 0,
            distance_from_prev_km=2.0 if existing_items else 0.0,
            notes=place.why_vanvas_recommends or place.description or "Added via VANVAS Copilot.",
            reason_for_recommendation="Curated addition by VANVAS Copilot.",
            map_lat=place.latitude,
            map_lng=place.longitude,
            booking_url=place.booking_url,
            opening_hours=f"{place.opening_time} - {place.closing_time}" if place.opening_time and place.closing_time else None,
            status="upcoming",
            is_locked=False,
        )

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        logger.info(
            f"User {user.id} added place {place.id} to Day {day_number} of trip {trip.id} (ItineraryItem: {new_item.id})"
        )

        return {
            "success": True,
            "action": "add_place_to_itinerary",
            "trip_id": trip.id,
            "day": day_number,
            "place": {
                "id": place.id,
                "name": place.name,
                "category": place.category,
            },
            "itinerary_item_id": new_item.id,
            "message": f"Added '{place.name}' to Day {day_number} of '{trip.title}'.",
        }
