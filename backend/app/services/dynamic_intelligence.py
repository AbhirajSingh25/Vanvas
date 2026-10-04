"""
VANVAS Dynamic Travel Intelligence Service
Handles real-time itinerary adaptation when reality changes:
- Weather changes (rain, storms, snow)
- Time constraints ("I have 3 hours")
- Delays ("I'm running late")
- Missed activities
- Budget adjustments ("Make today cheaper")
- Pace adjustments ("Make today easier / more active")
- Place additions / removals / swaps
- Full revision versioning and immutable change audit
"""
from __future__ import annotations

import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from app.models.models import (
    Trip, Itinerary, ItineraryItem, Place, Hotel, User,
    TripRevision, Expense, generate_uuid
)
from app.schemas.schemas import (
    ActionPreviewRequest, ActionPreviewResponse, ActionImpactSummary,
    ActionApplyRequest, ActionApplyResponse, TripRevisionResponse,
    CurrentStateResponse, ItineraryItemResponse, TripDetailResponse
)
from app.itinerary.clustering import haversine_distance_km
from app.providers.provider_factory import ProviderFactory

logger = logging.getLogger("vanvas.services.dynamic_intelligence")


def _mins_to_str(mins: int) -> str:
    m = mins % (24 * 60)
    return f"{m // 60:02d}:{m % 60:02d}"


def _str_to_mins(time_str: str, default: int = 540) -> int:
    try:
        parts = time_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return default


class DynamicIntelligenceService:
    @classmethod
    def get_trip_revisions(cls, db: Session, trip_id: str) -> List[TripRevisionResponse]:
        revs = db.query(TripRevision).filter(TripRevision.trip_id == trip_id).order_by(TripRevision.revision_number.desc()).all()
        result = []
        for r in revs:
            changes_dict = {}
            if r.changes_json:
                try:
                    changes_dict = json.loads(r.changes_json)
                except Exception:
                    changes_dict = {"raw": r.changes_json}
            result.append(TripRevisionResponse(
                id=r.id,
                trip_id=r.trip_id,
                user_id=r.user_id,
                revision_number=r.revision_number,
                action_type=r.action_type,
                reason=r.reason,
                changes=changes_dict,
                created_at=r.created_at
            ))
        return result

    @classmethod
    async def preview_action(
        cls,
        db: Session,
        trip: Trip,
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        action = req.action_type.strip().upper()
        target_day = req.target_day_number or 1

        target_itinerary = None
        for it in trip.itineraries:
            if it.day_number == target_day:
                target_itinerary = it
                break
        if not target_itinerary and trip.itineraries:
            target_itinerary = trip.itineraries[0]
            target_day = target_itinerary.day_number

        available_places = db.query(Place).filter(
            Place.destination_id == trip.destination_id,
            Place.is_active == True
        ).all()
        if not available_places:
            available_places = db.query(Place).filter(Place.is_active == True).limit(20).all()

        current_time_str = req.current_time or datetime.now(timezone.utc).strftime("%H:%M")
        curr_mins = _str_to_mins(current_time_str, default=540)

        # Dispatch based on action
        if action in ["SHORT_PLAN", "I_HAVE_X_HOURS"]:
            return cls._preview_short_plan(trip, target_itinerary, available_places, req, curr_mins)
        elif action in ["RUNNING_LATE", "LATE"]:
            return cls._preview_running_late(trip, target_itinerary, req, curr_mins)
        elif action in ["MISSED_ACTIVITY", "MARK_MISSED"]:
            return cls._preview_missed_activity(trip, target_itinerary, available_places, req)
        elif action in ["ADD_PLACE", "ADD_ITINERARY_ITEM"]:
            return cls._preview_add_place(db, trip, target_itinerary, available_places, req)
        elif action in ["REMOVE_ACTIVITY", "REMOVE_ITINERARY_ITEM"]:
            return cls._preview_remove_activity(trip, target_itinerary, req)
        elif action in ["SWAP_ACTIVITY"]:
            return cls._preview_swap_activity(trip, target_itinerary, available_places, req)
        elif action in ["MAKE_TODAY_EASIER", "TIRED", "RELAX"]:
            return cls._preview_make_easier(trip, target_itinerary, available_places, req)
        elif action in ["MAKE_TODAY_CHEAPER", "ADJUST_BUDGET", "LESS_MONEY"]:
            return cls._preview_make_cheaper(db, trip, target_itinerary, available_places, req)
        elif action in ["MAKE_TODAY_MORE_ACTIVE", "MORE_ADVENTURE"]:
            return cls._preview_make_more_active(trip, target_itinerary, available_places, req)
        elif action in ["ADJUST_FOR_WEATHER", "RAIN", "WEATHER"]:
            return await cls._preview_weather_replan(trip, target_itinerary, available_places, req)
        elif action in ["ADJUST_FOR_TRAVELLER_COUNT"]:
            return cls._preview_traveller_count(trip, target_itinerary, req)
        elif action in ["REPLAN_DAY", "REPLAN_TRIP"]:
            return cls._preview_replan_day(trip, target_itinerary, available_places, req, curr_mins)
        else:
            # Generic fallback replan
            return cls._preview_replan_day(trip, target_itinerary, available_places, req, curr_mins)

    # -------------------------------------------------------------------------
    # ACTION PREVIEW IMPLEMENTATIONS
    # -------------------------------------------------------------------------
    @classmethod
    def _preview_short_plan(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest,
        curr_mins: int
    ) -> ActionPreviewResponse:
        hours = float(req.parameters.get("hours_available") or 3.0)
        mode = req.parameters.get("mode") or "replace" # "replace" or "append"

        # Sort places near current coordinates or hotel/destination
        lat = req.current_lat or (trip.destination.latitude if trip.destination else 32.2432)
        lng = req.current_lng or (trip.destination.longitude if trip.destination else 77.1892)

        sorted_places = sorted(places, key=lambda p: haversine_distance_km(lat, lng, p.latitude, p.longitude))

        # Rotate if requested
        variation = int(req.parameters.get("variation") or 0)
        if variation > 0 and len(sorted_places) > 2:
            offset = (variation * 2) % len(sorted_places)
            sorted_places = sorted_places[offset:] + sorted_places[:offset]

        total_window_mins = int(hours * 60)
        end_limit_mins = curr_mins + total_window_mins

        timeline_mins = curr_mins
        proposed: List[ItineraryItemResponse] = []
        added_summary: List[Dict[str, Any]] = []
        cost_sum = 0.0

        for i, p in enumerate(sorted_places[:4]):
            if timeline_mins >= end_limit_mins - 20:
                break
            dur = min(60, max(30, p.recommended_duration_mins or 45))
            if timeline_mins + dur > end_limit_mins:
                dur = max(25, end_limit_mins - timeline_mins)

            start_str = _mins_to_str(timeline_mins)
            end_mins = timeline_mins + dur
            end_str = _mins_to_str(end_mins)

            item_res = ItineraryItemResponse(
                id=f"short-plan-{i+1}",
                itinerary_id=itinerary.id if itinerary else "day-1",
                place_id=p.id,
                title=p.name,
                category=p.category,
                start_time=start_str,
                end_time=end_str,
                duration_mins=dur,
                estimated_cost=p.approx_cost or 0.0,
                travel_time_from_prev_mins=15 if i > 0 else 5,
                distance_from_prev_km=1.2 if i > 0 else 0.4,
                notes=p.description[:120] if p.description else "",
                reason_for_recommendation=f"High proximity fit for your {hours:g}h free window.",
                map_lat=p.latitude,
                map_lng=p.longitude,
                booking_url=p.booking_url,
                opening_hours=f"{p.opening_time} - {p.closing_time}",
                status="PLANNED",
                is_locked=False
            )
            proposed.append(item_res)
            added_summary.append({"title": p.name, "time": f"{start_str} - {end_str}", "cost": p.approx_cost or 0.0})
            cost_sum += (p.approx_cost or 0.0)
            timeline_mins = end_mins + 15

        removed_summary: List[Dict[str, Any]] = []
        if mode == "replace" and itinerary:
            for it_item in itinerary.items:
                if it_item.status not in ["COMPLETED", "completed"] and not it_item.is_locked:
                    removed_summary.append({"title": it_item.title, "time": f"{it_item.start_time} - {it_item.end_time}"})

        return ActionPreviewResponse(
            action_type="SHORT_PLAN",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"{hours:g}-Hour Compact Travel Plan",
            summary=f"Curated {len(proposed)} high-value stops fitting seamlessly into your immediate {hours:g} hour window.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=total_window_mins,
                cost_impact_inr=cost_sum,
                items_added=added_summary,
                items_removed=removed_summary,
                items_moved=[],
                items_kept=[],
                budget_note=f"Estimated activity expense: ₹{cost_sum:,.0f}"
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "SHORT_PLAN",
                "hours_available": hours,
                "mode": mode,
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_running_late(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        req: ActionPreviewRequest,
        curr_mins: int
    ) -> ActionPreviewResponse:
        delay_mins = int(req.parameters.get("delay_minutes") or 120)
        day_items = list(itinerary.items) if itinerary else []

        shifted_mins = curr_mins + 15
        items_removed = []
        items_moved = []
        items_kept = []
        proposed_items: List[ItineraryItemResponse] = []

        for item in day_items:
            if item.status in ["COMPLETED", "completed"]:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed_items.append(ItineraryItemResponse.model_validate(item))
                continue

            item_start = _str_to_mins(item.start_time, default=shifted_mins)
            dur = item.duration_mins or 60

            # If the item was scheduled in the past or conflicts with late arrival
            if item_start < shifted_mins:
                # Check if it is locked
                if item.is_locked:
                    # Keep and move
                    new_start = shifted_mins
                    new_end = new_start + dur
                    items_moved.append({
                        "title": item.title,
                        "old_time": f"{item.start_time} - {item.end_time}",
                        "new_time": f"{_mins_to_str(new_start)} - {_mins_to_str(new_end)}"
                    })
                    item_copy = ItineraryItemResponse.model_validate(item)
                    item_copy.start_time = _mins_to_str(new_start)
                    item_copy.end_time = _mins_to_str(new_end)
                    proposed_items.append(item_copy)
                    shifted_mins = new_end + (item.travel_time_from_prev_mins or 15)
                else:
                    # Compress or drop if too late in evening
                    if shifted_mins > 21 * 60:  # Past 9 PM
                        items_removed.append({
                            "title": item.title,
                            "time": f"{item.start_time} - {item.end_time}",
                            "reason": "Exceeded daylight & operational hours due to delay."
                        })
                    else:
                        compressed_dur = max(40, int(dur * 0.75))
                        new_start = shifted_mins
                        new_end = new_start + compressed_dur
                        items_moved.append({
                            "title": item.title,
                            "old_time": f"{item.start_time} - {item.end_time}",
                            "new_time": f"{_mins_to_str(new_start)} - {_mins_to_str(new_end)}"
                        })
                        item_copy = ItineraryItemResponse.model_validate(item)
                        item_copy.start_time = _mins_to_str(new_start)
                        item_copy.end_time = _mins_to_str(new_end)
                        item_copy.duration_mins = compressed_dur
                        proposed_items.append(item_copy)
                        shifted_mins = new_end + (item.travel_time_from_prev_mins or 15)
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed_items.append(ItineraryItemResponse.model_validate(item))

        return ActionPreviewResponse(
            action_type="RUNNING_LATE",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Schedule Shifted for {delay_mins} min Delay",
            summary=f"Recalculated time buffers, compressed flexible stops, and preserved your important bookings.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=delay_mins,
                cost_impact_inr=0.0,
                items_added=[],
                items_removed=items_removed,
                items_moved=items_moved,
                items_kept=items_kept,
                safety_note="Evening mountain driving avoided; stops shifted within safe daylight hours."
            ),
            proposed_items=proposed_items,
            payload_for_apply={
                "action_type": "RUNNING_LATE",
                "delay_minutes": delay_mins,
                "items": [item.model_dump() for item in proposed_items]
            }
        )

    @classmethod
    def _preview_missed_activity(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        target_id = req.target_item_id or req.parameters.get("target_item_id")
        choice = req.parameters.get("resolution_choice") or "replace" # "move_tomorrow", "replace", "remove"

        day_items = list(itinerary.items) if itinerary else []
        target_item = next((item for item in day_items if item.id == target_id), None)

        if not target_item and day_items:
            target_item = day_items[0]

        items_removed = []
        items_moved = []
        items_added = []
        items_kept = []
        proposed_items: List[ItineraryItemResponse] = []

        if target_item:
            items_removed.append({
                "title": target_item.title,
                "time": f"{target_item.start_time} - {target_item.end_time}",
                "reason": f"Marked as missed ({choice.replace('_', ' ')})."
            })

        for item in day_items:
            if target_item and item.id == target_item.id:
                if choice == "replace":
                    # Find alternative nearby cafe/viewpoint
                    cozy = next((p for p in places if p.id != target_item.place_id and ("café" in p.category.lower() or "viewpoint" in p.category.lower())), places[0] if places else None)
                    if cozy:
                        repl_item = ItineraryItemResponse(
                            id=f"repl-{generate_uuid()[:6]}",
                            itinerary_id=itinerary.id if itinerary else "day-1",
                            place_id=cozy.id,
                            title=f"Spontaneous Stop: {cozy.name}",
                            category=cozy.category,
                            start_time=target_item.start_time,
                            end_time=target_item.end_time,
                            duration_mins=target_item.duration_mins,
                            estimated_cost=cozy.approx_cost or 0.0,
                            travel_time_from_prev_mins=10,
                            distance_from_prev_km=1.0,
                            notes=cozy.description[:120] if cozy.description else "",
                            reason_for_recommendation="Quick replacement for missed stop.",
                            map_lat=cozy.latitude,
                            map_lng=cozy.longitude,
                            booking_url=cozy.booking_url,
                            opening_hours=f"{cozy.opening_time} - {cozy.closing_time}",
                            status="PLANNED",
                            is_locked=False
                        )
                        proposed_items.append(repl_item)
                        items_added.append({"title": repl_item.title, "time": f"{repl_item.start_time} - {repl_item.end_time}"})
                elif choice == "move_tomorrow":
                    # Item will be moved to tomorrow on apply
                    pass
                elif choice == "remove":
                    # Simply skipped/removed
                    pass
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed_items.append(ItineraryItemResponse.model_validate(item))

        headline = f"Missed Stop Resolution: {target_item.title if target_item else 'Activity'}"
        summary = f"Selected resolution '{choice.replace('_', ' ').title()}'. Updated day schedule accordingly."

        return ActionPreviewResponse(
            action_type="MISSED_ACTIVITY",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=headline,
            summary=summary,
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=0.0,
                items_added=items_added,
                items_removed=items_removed,
                items_moved=items_moved,
                items_kept=items_kept
            ),
            proposed_items=proposed_items,
            payload_for_apply={
                "action_type": "MISSED_ACTIVITY",
                "target_item_id": target_item.id if target_item else None,
                "target_place_id": target_item.place_id if target_item else None,
                "target_item_title": target_item.title if target_item else "",
                "resolution_choice": choice,
                "items": [item.model_dump() for item in proposed_items]
            }
        )

    @classmethod
    def _preview_add_place(
        cls,
        db: Session,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        place_id = req.parameters.get("place_id") or ""
        place_name = req.parameters.get("place_name") or ""

        target_place = None
        if place_id:
            target_place = db.query(Place).filter(Place.id == place_id).first()
        if not target_place and place_name:
            clean_name = place_name.strip()
            target_place = db.query(Place).filter(
                (Place.destination_id == trip.destination_id) &
                (Place.name.ilike(f"%{clean_name}%"))
            ).first()
            if not target_place:
                target_place = db.query(Place).filter(Place.name.ilike(f"%{clean_name}%")).first()

        if not target_place and places:
            target_place = places[0]

        if not target_place:
            raise ValueError(f"Could not find place '{place_name or place_id}' to add.")

        day_items = list(itinerary.items) if itinerary else []
        last_item = day_items[-1] if day_items else None
        last_end_mins = _str_to_mins(last_item.end_time, default=600) if last_item else 600

        # Calculate travel time from previous
        prev_lat = (last_item.map_lat if last_item else None) or (trip.destination.latitude if trip.destination else 32.24)
        prev_lng = (last_item.map_lng if last_item else None) or (trip.destination.longitude if trip.destination else 77.18)
        dist_km = round(haversine_distance_km(prev_lat, prev_lng, target_place.latitude, target_place.longitude), 1)
        travel_mins = max(10, min(60, int(dist_km * 3.5)))

        start_mins = last_end_mins + travel_mins
        dur = target_place.recommended_duration_mins or 60
        end_mins = start_mins + dur

        new_item = ItineraryItemResponse(
            id=f"added-{generate_uuid()[:6]}",
            itinerary_id=itinerary.id if itinerary else "day-1",
            place_id=target_place.id,
            title=target_place.name,
            category=target_place.category,
            start_time=_mins_to_str(start_mins),
            end_time=_mins_to_str(end_mins),
            duration_mins=dur,
            estimated_cost=target_place.approx_cost or 0.0,
            travel_time_from_prev_mins=travel_mins,
            distance_from_prev_km=dist_km,
            notes=target_place.description[:120] if target_place.description else "",
            reason_for_recommendation=f"Added by traveler to Day {itinerary.day_number if itinerary else 1}.",
            map_lat=target_place.latitude,
            map_lng=target_place.longitude,
            booking_url=target_place.booking_url,
            opening_hours=f"{target_place.opening_time} - {target_place.closing_time}",
            status="PLANNED",
            is_locked=False
        )

        proposed = [ItineraryItemResponse.model_validate(item) for item in day_items] + [new_item]

        return ActionPreviewResponse(
            action_type="ADD_PLACE",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Adding {target_place.name}",
            summary=f"Inserted into Day {itinerary.day_number if itinerary else 1} schedule with ~{travel_mins}m travel transit.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=dur + travel_mins,
                cost_impact_inr=target_place.approx_cost or 0.0,
                items_added=[{"title": target_place.name, "time": f"{new_item.start_time} - {new_item.end_time}", "cost": target_place.approx_cost}],
                items_removed=[],
                items_moved=[],
                items_kept=[{"title": item.title, "time": f"{item.start_time} - {item.end_time}"} for item in day_items]
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "ADD_PLACE",
                "place_id": target_place.id,
                "new_item": new_item.model_dump(),
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_remove_activity(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        target_id = req.target_item_id or req.parameters.get("target_item_id")
        day_items = list(itinerary.items) if itinerary else []

        target_item = next((item for item in day_items if item.id == target_id), None)
        if not target_item and day_items:
            target_item = day_items[-1]

        items_removed = []
        items_kept = []
        proposed: List[ItineraryItemResponse] = []

        if target_item:
            items_removed.append({
                "title": target_item.title,
                "time": f"{target_item.start_time} - {target_item.end_time}",
                "cost": target_item.estimated_cost
            })

        for item in day_items:
            if target_item and item.id == target_item.id:
                continue
            items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
            proposed.append(ItineraryItemResponse.model_validate(item))

        cost_saved = -(target_item.estimated_cost or 0.0) if target_item else 0.0

        return ActionPreviewResponse(
            action_type="REMOVE_ACTIVITY",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Remove {target_item.title if target_item else 'Stop'}",
            summary=f"Removes stop from Day {itinerary.day_number if itinerary else 1} and recalculates schedule.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=-(target_item.duration_mins or 60) if target_item else 0,
                cost_impact_inr=cost_saved,
                items_added=[],
                items_removed=items_removed,
                items_moved=[],
                items_kept=items_kept,
                budget_note=f"Saves ₹{abs(cost_saved):,.0f}" if cost_saved < 0 else None
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "REMOVE_ACTIVITY",
                "target_item_id": target_item.id if target_item else None,
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_swap_activity(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        target_id = req.target_item_id or req.parameters.get("target_item_id")
        replacement_place_id = req.parameters.get("replacement_place_id")
        day_items = list(itinerary.items) if itinerary else []

        target_item = next((item for item in day_items if item.id == target_id), day_items[0] if day_items else None)

        repl_place = next((p for p in places if p.id == replacement_place_id), None)
        if not repl_place:
            repl_place = next((p for p in places if p.id != getattr(target_item, "place_id", None)), places[0] if places else None)

        if not repl_place or not target_item:
            raise ValueError("Target item or replacement place not available.")

        proposed: List[ItineraryItemResponse] = []
        items_removed = [{"title": target_item.title, "time": f"{target_item.start_time} - {target_item.end_time}"}]
        items_added = [{"title": repl_place.name, "time": f"{target_item.start_time} - {target_item.end_time}", "cost": repl_place.approx_cost}]
        items_kept = []

        for item in day_items:
            if item.id == target_item.id:
                swapped = ItineraryItemResponse(
                    id=target_item.id,
                    itinerary_id=target_item.itinerary_id,
                    place_id=repl_place.id,
                    title=repl_place.name,
                    category=repl_place.category,
                    start_time=target_item.start_time,
                    end_time=target_item.end_time,
                    duration_mins=target_item.duration_mins,
                    estimated_cost=repl_place.approx_cost or 0.0,
                    travel_time_from_prev_mins=target_item.travel_time_from_prev_mins,
                    distance_from_prev_km=target_item.distance_from_prev_km,
                    notes=repl_place.description[:120] if repl_place.description else "",
                    reason_for_recommendation="Swapped per traveler request.",
                    map_lat=repl_place.latitude,
                    map_lng=repl_place.longitude,
                    booking_url=repl_place.booking_url,
                    opening_hours=f"{repl_place.opening_time} - {repl_place.closing_time}",
                    status="PLANNED",
                    is_locked=False
                )
                proposed.append(swapped)
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))

        cost_diff = (repl_place.approx_cost or 0.0) - (target_item.estimated_cost or 0.0)

        return ActionPreviewResponse(
            action_type="SWAP_ACTIVITY",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Swap with {repl_place.name}",
            summary=f"Replaces '{target_item.title}' with '{repl_place.name}'.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=cost_diff,
                items_added=items_added,
                items_removed=items_removed,
                items_moved=[],
                items_kept=items_kept,
                budget_note=f"Estimated cost change: {'+' if cost_diff >= 0 else ''}₹{cost_diff:,.0f}"
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "SWAP_ACTIVITY",
                "target_item_id": target_item.id,
                "replacement_place_id": repl_place.id,
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_make_easier(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        day_items = list(itinerary.items) if itinerary else []
        cafes = [p for p in places if "café" in p.category.lower() or "food" in p.category.lower() or "tea" in (p.tags or "").lower()]
        if not cafes:
            cafes = places

        items_removed = []
        items_added = []
        items_kept = []
        proposed: List[ItineraryItemResponse] = []

        swapped_count = 0
        for item in day_items:
            if item.status in ["COMPLETED", "completed"] or item.is_locked:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))
                continue

            # Check if strenuous
            is_strenuous = any(w in item.title.lower() for w in ["trek", "hike", "climb", "pass", "summit", "steep", "trail", "waterfall"])
            if is_strenuous and cafes:
                repl = cafes[swapped_count % len(cafes)]
                swapped_count += 1
                items_removed.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}", "reason": "High physical exertion."})
                
                easy_item = ItineraryItemResponse(
                    id=item.id,
                    itinerary_id=item.itinerary_id,
                    place_id=repl.id,
                    title=f"Cozy Mountain Chai & Views at {repl.name}",
                    category="Café",
                    start_time=item.start_time,
                    end_time=item.end_time,
                    duration_mins=item.duration_mins or 60,
                    estimated_cost=repl.approx_cost or 150.0,
                    travel_time_from_prev_mins=10,
                    distance_from_prev_km=1.0,
                    notes="Relaxed mountain pacing: ginger honey lemon tea, valley panorama, and unhurried rest.",
                    reason_for_recommendation="Low intensity relaxation swap for strenuous mountain trek.",
                    map_lat=repl.latitude,
                    map_lng=repl.longitude,
                    booking_url=repl.booking_url,
                    opening_hours=f"{repl.opening_time} - {repl.closing_time}",
                    status="PLANNED",
                    is_locked=False
                )
                items_added.append({"title": easy_item.title, "time": f"{easy_item.start_time} - {easy_item.end_time}"})
                proposed.append(easy_item)
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))

        return ActionPreviewResponse(
            action_type="MAKE_TODAY_EASIER",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline="Relaxed Pace & Mountain Comfort",
            summary=f"Swapped strenuous hikes with peaceful riverside cafés and serene mountain view points.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=0.0,
                items_added=items_added,
                items_removed=items_removed,
                items_moved=[],
                items_kept=items_kept,
                safety_note="Reduces altitude fatigue and physical strain."
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "MAKE_TODAY_EASIER",
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_make_cheaper(
        cls,
        db: Session,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        day_items = list(itinerary.items) if itinerary else []
        budget_places = [p for p in places if (p.price_level in ["₹", "Free"]) or ((p.approx_cost or 0) <= 150)]
        if not budget_places:
            budget_places = places

        items_removed = []
        items_added = []
        items_kept = []
        proposed: List[ItineraryItemResponse] = []
        total_savings = 0.0
        swapped_idx = 0

        for item in day_items:
            if item.status in ["COMPLETED", "completed"] or item.is_locked:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))
                continue

            cost = item.estimated_cost or 0.0
            if cost > 300 and budget_places:
                repl = budget_places[swapped_idx % len(budget_places)]
                swapped_idx += 1
                diff = (repl.approx_cost or 0.0) - cost
                total_savings += abs(diff)

                items_removed.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}", "cost": cost})
                cheap_item = ItineraryItemResponse(
                    id=item.id,
                    itinerary_id=item.itinerary_id,
                    place_id=repl.id,
                    title=f"Pocket-Friendly: {repl.name}",
                    category=repl.category,
                    start_time=item.start_time,
                    end_time=item.end_time,
                    duration_mins=item.duration_mins or 60,
                    estimated_cost=repl.approx_cost or 0.0,
                    travel_time_from_prev_mins=item.travel_time_from_prev_mins,
                    distance_from_prev_km=item.distance_from_prev_km,
                    notes=repl.description[:120] if repl.description else "Authentic local spot with zero overhead.",
                    reason_for_recommendation="Cost optimized: Authentic local experience with near-zero entry cost.",
                    map_lat=repl.latitude,
                    map_lng=repl.longitude,
                    booking_url=repl.booking_url,
                    opening_hours=f"{repl.opening_time} - {repl.closing_time}",
                    status="PLANNED",
                    is_locked=False
                )
                items_added.append({"title": cheap_item.title, "time": f"{cheap_item.start_time} - {cheap_item.end_time}", "cost": repl.approx_cost or 0.0})
                proposed.append(cheap_item)
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))

        # Real budget stats
        spent = sum(e.amount for e in trip.expenses) if trip.expenses else 0.0
        remaining_budget = max(0.0, (trip.budget_total or 10000.0) - spent)

        return ActionPreviewResponse(
            action_type="MAKE_TODAY_CHEAPER",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Optimized Savings Plan (-₹{total_savings:,.0f})",
            summary=f"Swapped high-cost activities with authentic local dhabas and free scenic viewpoints.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=-total_savings,
                items_added=items_added,
                items_removed=items_removed,
                items_moved=[],
                items_kept=items_kept,
                budget_note=f"Projected remaining budget: ₹{remaining_budget:,.0f}. Daily savings: ₹{total_savings:,.0f}."
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "MAKE_TODAY_CHEAPER",
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_make_more_active(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        day_items = list(itinerary.items) if itinerary else []
        adv_places = [p for p in places if "adventure" in p.category.lower() or "nature" in p.category.lower() or "trek" in (p.tags or "").lower()]
        if not adv_places:
            adv_places = places

        items_removed = []
        items_added = []
        items_kept = []
        proposed: List[ItineraryItemResponse] = []
        injected = False

        for item in day_items:
            if not injected and item.status not in ["COMPLETED", "completed"] and not item.is_locked and "café" in item.category.lower() and adv_places:
                adv = adv_places[0]
                items_removed.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                act_item = ItineraryItemResponse(
                    id=item.id,
                    itinerary_id=item.itinerary_id,
                    place_id=adv.id,
                    title=f"Adrenaline & Trail: {adv.name}",
                    category="Adventure",
                    start_time=item.start_time,
                    end_time=item.end_time,
                    duration_mins=item.duration_mins or 90,
                    estimated_cost=adv.approx_cost or 400.0,
                    travel_time_from_prev_mins=15,
                    distance_from_prev_km=2.0,
                    notes=adv.description[:120] if adv.description else "Thrilling mountain trek and active exploration.",
                    reason_for_recommendation="Added high-energy outdoor mountain activity.",
                    map_lat=adv.latitude,
                    map_lng=adv.longitude,
                    booking_url=adv.booking_url,
                    opening_hours=f"{adv.opening_time} - {adv.closing_time}",
                    status="PLANNED",
                    is_locked=False
                )
                items_added.append({"title": act_item.title, "time": f"{act_item.start_time} - {act_item.end_time}", "cost": act_item.estimated_cost})
                proposed.append(act_item)
                injected = True
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))

        return ActionPreviewResponse(
            action_type="MAKE_TODAY_MORE_ACTIVE",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline="High-Energy Mountain Adventure",
            summary="Injected thrilling outdoor trail and adventure sports into your schedule.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=0.0,
                items_added=items_added,
                items_removed=items_removed,
                items_moved=[],
                items_kept=items_kept
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "MAKE_TODAY_MORE_ACTIVE",
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    async def _preview_weather_replan(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        dest = trip.destination
        lat = dest.latitude if dest else 32.24
        lng = dest.longitude if dest else 77.18
        dest_name = dest.name if dest else "Himalayan Sanctuary"

        # Fetch truthful live weather
        weather_provider = ProviderFactory.get_weather_provider()
        weather_info = None
        weather_note = ""
        is_inclement = True

        try:
            forecast_data = await weather_provider.get_forecast(lat, lng, days=2)
            if forecast_data:
                day0 = forecast_data[0] if isinstance(forecast_data, list) and forecast_data else forecast_data
                weather_info = day0
                cond = day0.get("condition", "Rain Showers")
                is_inclement = day0.get("is_rain", True) or "rain" in cond.lower() or "snow" in cond.lower() or "storm" in cond.lower()
                weather_note = f"Live Open-Meteo: {cond}, {day0.get('temp_c', day0.get('temperature_c', 16))}°C."
        except Exception as e:
            logger.warning(f"Weather provider check: {e}")
            weather_note = "Weather provider unavailable. Truthful safety replan applied for mountain precipitation."

        day_items = list(itinerary.items) if itinerary else []
        indoor_places = [p for p in places if p.is_indoor or p.category.lower() in ["café", "culture", "market", "food", "monastery", "museum"]]
        if not indoor_places:
            indoor_places = places

        items_removed = []
        items_added = []
        items_kept = []
        proposed: List[ItineraryItemResponse] = []
        swap_idx = 0

        for item in day_items:
            if item.status in ["COMPLETED", "completed"] or item.is_locked:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))
                continue

            is_outdoor_risk = any(w in item.title.lower() for w in ["peak", "pass", "viewpoint", "trek", "outdoor", "climb", "ridge", "waterfall"])
            if is_outdoor_risk and indoor_places:
                repl = indoor_places[swap_idx % len(indoor_places)]
                swap_idx += 1
                items_removed.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}", "reason": "Exposed outdoor terrain during rain."})
                
                sheltered_item = ItineraryItemResponse(
                    id=item.id,
                    itinerary_id=item.itinerary_id,
                    place_id=repl.id,
                    title=f"Indoor Sanctuary: {repl.name}",
                    category=repl.category,
                    start_time=item.start_time,
                    end_time=item.end_time,
                    duration_mins=item.duration_mins or 60,
                    estimated_cost=repl.approx_cost or 0.0,
                    travel_time_from_prev_mins=10,
                    distance_from_prev_km=1.0,
                    notes=f"Sheltered cultural & gastronomic haven. {repl.description[:100]}",
                    reason_for_recommendation="Weather-adaptive swap: cozy indoor shelter with authentic valley culture.",
                    map_lat=repl.latitude,
                    map_lng=repl.longitude,
                    booking_url=repl.booking_url,
                    opening_hours=f"{repl.opening_time} - {repl.closing_time}",
                    status="PLANNED",
                    is_locked=False
                )
                items_added.append({"title": sheltered_item.title, "time": f"{sheltered_item.start_time} - {sheltered_item.end_time}"})
                proposed.append(sheltered_item)
            else:
                items_kept.append({"title": item.title, "time": f"{item.start_time} - {item.end_time}"})
                proposed.append(ItineraryItemResponse.model_validate(item))

        return ActionPreviewResponse(
            action_type="ADJUST_FOR_WEATHER",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline="Rain-Safe Itinerary Adjustment",
            summary=f"Replaced exposed mountain trails and high ridge viewpoints with cozy indoor sanctuaries and covered bazaars.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=0.0,
                items_added=items_added,
                items_removed=items_removed,
                items_moved=[],
                items_kept=items_kept,
                weather_note=weather_note or "Precipitation expected in alpine zone.",
                safety_note="Avoids slick mountain rocks, landslide-prone tracks, and sudden temperature drops."
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "ADJUST_FOR_WEATHER",
                "weather_note": weather_note,
                "items": [item.model_dump() for item in proposed]
            }
        )

    @classmethod
    def _preview_traveller_count(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        req: ActionPreviewRequest
    ) -> ActionPreviewResponse:
        new_count = int(req.parameters.get("travellers_count") or max(1, (trip.travellers_count or 1) - 1))
        old_count = trip.travellers_count or 1
        diff = new_count - old_count

        day_items = list(itinerary.items) if itinerary else []
        proposed = [ItineraryItemResponse.model_validate(item) for item in day_items]

        return ActionPreviewResponse(
            action_type="ADJUST_FOR_TRAVELLER_COUNT",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Adjust Group Size to {new_count} Travelers",
            summary=f"Updated group head-count ({'+' if diff > 0 else ''}{diff}). Recalculated per-person budget splits.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=0.0,
                items_added=[],
                items_removed=[],
                items_moved=[],
                items_kept=[{"title": item.title, "time": f"{item.start_time} - {item.end_time}"} for item in day_items],
                budget_note=f"Per-person allocation adjusted for {new_count} members."
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "ADJUST_FOR_TRAVELLER_COUNT",
                "new_travellers_count": new_count
            }
        )

    @classmethod
    def _preview_replan_day(
        cls,
        trip: Trip,
        itinerary: Optional[Itinerary],
        places: List[Place],
        req: ActionPreviewRequest,
        curr_mins: int
    ) -> ActionPreviewResponse:
        day_items = list(itinerary.items) if itinerary else []
        proposed = [ItineraryItemResponse.model_validate(item) for item in day_items]

        return ActionPreviewResponse(
            action_type="REPLAN_DAY",
            target_day_number=itinerary.day_number if itinerary else 1,
            headline=f"Rebalance Day {itinerary.day_number if itinerary else 1} Schedule",
            summary="Optimized travel transitions and refreshed time allocations for smooth flow.",
            requires_confirmation=True,
            impact=ActionImpactSummary(
                time_impact_mins=0,
                cost_impact_inr=0.0,
                items_added=[],
                items_removed=[],
                items_moved=[],
                items_kept=[{"title": item.title, "time": f"{item.start_time} - {item.end_time}"} for item in day_items]
            ),
            proposed_items=proposed,
            payload_for_apply={
                "action_type": "REPLAN_DAY",
                "items": [item.model_dump() for item in proposed]
            }
        )

    # -------------------------------------------------------------------------
    # ACTION APPLY & MUTATION
    # -------------------------------------------------------------------------
    @classmethod
    def apply_action(
        cls,
        db: Session,
        trip: Trip,
        user: Optional[User],
        req: ActionApplyRequest
    ) -> ActionApplyResponse:
        action = req.action_type.strip().upper()
        target_day = req.target_day_number or 1

        target_itinerary = next((it for it in trip.itineraries if it.day_number == target_day), trip.itineraries[0] if trip.itineraries else None)
        if not target_itinerary:
            raise ValueError("No active itinerary found to apply mutation.")

        payload = req.payload_for_apply or {}
        items_payload = payload.get("items") or req.parameters.get("items")

        changes_summary: Dict[str, Any] = {
            "action_type": action,
            "target_day": target_day,
            "reason": req.reason,
            "applied_at": datetime.now(timezone.utc).isoformat()
        }

        # 1. Traveler count mutation
        if action == "ADJUST_FOR_TRAVELLER_COUNT" or "new_travellers_count" in payload:
            new_count = int(payload.get("new_travellers_count") or req.parameters.get("travellers_count") or 1)
            trip.travellers_count = max(1, new_count)
            changes_summary["travellers_count"] = trip.travellers_count

        # 2. Missed activity move to tomorrow
        elif action in ["MISSED_ACTIVITY", "MARK_MISSED"] and payload.get("resolution_choice") == "move_tomorrow":
            target_item_id = payload.get("target_item_id") or req.target_item_id
            target_place_id = payload.get("target_place_id")
            target_title = payload.get("target_item_title") or "Moved Stop"

            # Mark today's item as MISSED
            for it_item in target_itinerary.items:
                if it_item.id == target_item_id:
                    it_item.status = "MISSED"

            # Find or create tomorrow's itinerary
            tomorrow_it = next((it for it in trip.itineraries if it.day_number == target_day + 1), None)
            if tomorrow_it:
                last_tm_item = list(tomorrow_it.items)[-1] if tomorrow_it.items else None
                start_m = _str_to_mins(last_tm_item.end_time, default=600) + 15 if last_tm_item else 600
                new_it_item = ItineraryItem(
                    itinerary_id=tomorrow_it.id,
                    place_id=target_place_id,
                    title=f"[Moved] {target_title}",
                    category="Attraction",
                    start_time=_mins_to_str(start_m),
                    end_time=_mins_to_str(start_m + 60),
                    duration_mins=60,
                    estimated_cost=0.0,
                    travel_time_from_prev_mins=15,
                    distance_from_prev_km=2.0,
                    notes="Rescheduled from previous day.",
                    reason_for_recommendation="Moved from yesterday's missed slot.",
                    status="PLANNED",
                    is_locked=False
                )
                db.add(new_it_item)
                changes_summary["moved_to_day"] = target_day + 1
            else:
                changes_summary["note"] = "Target was last day; marked as missed."

        # 3. Short plan replace / append or proposed items update
        elif items_payload:
            mode = payload.get("mode", "replace")
            if mode == "append":
                # Append new items to today's existing items
                for item_dict in items_payload:
                    new_it_item = ItineraryItem(
                        itinerary_id=target_itinerary.id,
                        place_id=item_dict.get("place_id"),
                        title=item_dict["title"],
                        category=item_dict.get("category", "Attraction"),
                        start_time=item_dict["start_time"],
                        end_time=item_dict["end_time"],
                        duration_mins=item_dict.get("duration_mins", 60),
                        estimated_cost=item_dict.get("estimated_cost", 0.0),
                        travel_time_from_prev_mins=item_dict.get("travel_time_from_prev_mins", 15),
                        distance_from_prev_km=item_dict.get("distance_from_prev_km", 1.5),
                        notes=item_dict.get("notes"),
                        reason_for_recommendation=item_dict.get("reason_for_recommendation"),
                        map_lat=item_dict.get("map_lat"),
                        map_lng=item_dict.get("map_lng"),
                        booking_url=item_dict.get("booking_url"),
                        opening_hours=item_dict.get("opening_hours"),
                        status=item_dict.get("status", "PLANNED"),
                        is_locked=item_dict.get("is_locked", False)
                    )
                    db.add(new_it_item)
            else:
                # Replace uncompleted items with proposed items
                # First delete existing items for this itinerary day that are not completed / locked
                for existing_item in list(target_itinerary.items):
                    if existing_item.status not in ["COMPLETED", "completed"] and not existing_item.is_locked:
                        db.delete(existing_item)
                db.flush()

                # Add new items
                for item_dict in items_payload:
                    # Skip if completed existing item is already there
                    existing_match = next((ei for ei in target_itinerary.items if ei.id == item_dict.get("id")), None)
                    if existing_match:
                        existing_match.start_time = item_dict["start_time"]
                        existing_match.end_time = item_dict["end_time"]
                        existing_match.duration_mins = item_dict.get("duration_mins", existing_match.duration_mins)
                        existing_match.title = item_dict["title"]
                        existing_match.status = item_dict.get("status", existing_match.status)
                    else:
                        new_it_item = ItineraryItem(
                            itinerary_id=target_itinerary.id,
                            place_id=item_dict.get("place_id"),
                            title=item_dict["title"],
                            category=item_dict.get("category", "Attraction"),
                            start_time=item_dict["start_time"],
                            end_time=item_dict["end_time"],
                            duration_mins=item_dict.get("duration_mins", 60),
                            estimated_cost=item_dict.get("estimated_cost", 0.0),
                            travel_time_from_prev_mins=item_dict.get("travel_time_from_prev_mins", 15),
                            distance_from_prev_km=item_dict.get("distance_from_prev_km", 1.5),
                            notes=item_dict.get("notes"),
                            reason_for_recommendation=item_dict.get("reason_for_recommendation"),
                            map_lat=item_dict.get("map_lat"),
                            map_lng=item_dict.get("map_lng"),
                            booking_url=item_dict.get("booking_url"),
                            opening_hours=item_dict.get("opening_hours"),
                            status=item_dict.get("status", "PLANNED"),
                            is_locked=item_dict.get("is_locked", False)
                        )
                        db.add(new_it_item)

            changes_summary["items_count"] = len(items_payload)

        # Create Revision Record
        existing_rev_count = db.query(TripRevision).filter(TripRevision.trip_id == trip.id).count()
        rev_num = existing_rev_count + 1

        revision = TripRevision(
            trip_id=trip.id,
            user_id=user.id if user else None,
            revision_number=rev_num,
            action_type=action,
            reason=req.reason or f"Applied {action.replace('_', ' ').title()}",
            changes_json=json.dumps(changes_summary)
        )
        db.add(revision)
        db.commit()
        db.refresh(trip)
        db.refresh(revision)

        rev_response = TripRevisionResponse(
            id=revision.id,
            trip_id=revision.trip_id,
            user_id=revision.user_id,
            revision_number=revision.revision_number,
            action_type=revision.action_type,
            reason=revision.reason,
            changes=changes_summary,
            created_at=revision.created_at
        )

        return ActionApplyResponse(
            success=True,
            message=f"Plan revised to v{rev_num}: {req.reason or action.replace('_', ' ').title()}.",
            revision=rev_response,
            trip=TripDetailResponse.model_validate(trip)
        )

    # -------------------------------------------------------------------------
    # CURRENT STATE GETTER
    # -------------------------------------------------------------------------
    @classmethod
    async def get_current_state(
        cls,
        db: Session,
        trip: Trip,
        current_time_str: Optional[str] = None,
        current_lat: Optional[float] = None,
        current_lng: Optional[float] = None
    ) -> CurrentStateResponse:
        now_time = current_time_str or datetime.now(timezone.utc).strftime("%H:%M")
        curr_mins = _str_to_mins(now_time, default=600)

        # Calculate active day
        active_day = 1
        all_items: List[ItineraryItem] = []
        for it in trip.itineraries:
            all_items.extend(it.items)

        completed_count = sum(1 for item in all_items if item.status in ["COMPLETED", "completed"])
        missed_count = sum(1 for item in all_items if item.status in ["MISSED", "missed", "SKIPPED", "skipped"])
        pending_count = len(all_items) - completed_count - missed_count

        # Find upcoming item for today
        active_it = next((it for it in trip.itineraries if it.day_number == active_day), trip.itineraries[0] if trip.itineraries else None)
        upcoming_item: Optional[ItineraryItemResponse] = None

        if active_it:
            for item in active_it.items:
                if item.status not in ["COMPLETED", "completed", "MISSED", "missed"]:
                    upcoming_item = ItineraryItemResponse.model_validate(item)
                    break

        # Budget summary
        spent = sum(e.amount for e in trip.expenses) if trip.expenses else 0.0
        total_budget = trip.budget_total or 10000.0
        projected = spent + sum(item.estimated_cost or 0.0 for item in all_items if item.status not in ["COMPLETED", "completed"])
        remaining = max(0.0, total_budget - spent)

        # Weather snapshot
        dest = trip.destination
        dest_lat = dest.latitude if dest else 32.24
        dest_lng = dest.longitude if dest else 77.18
        dest_name = dest.name if dest else "Himalayan Destination"

        weather_provider = ProviderFactory.get_weather_provider()
        weather_dict = None
        try:
            forecast = await weather_provider.get_forecast(dest_lat, dest_lng, days=1)
            if forecast and isinstance(forecast, list):
                day0 = forecast[0]
                weather_dict = {
                    "condition": day0.get("condition", "Pleasant"),
                    "temperature_c": day0.get("temp_c", day0.get("temperature_max", 18)),
                    "advisory": day0.get("advisory", "Mountain weather: Dress in layers."),
                    "is_rain": day0.get("is_rain", False)
                }
            elif isinstance(forecast, dict):
                weather_dict = forecast
        except Exception:
            weather_dict = {
                "condition": dest.weather_type if dest else "Cool / Mountain",
                "temperature_c": 18,
                "advisory": "Mountain weather: Dress in layers."
            }

        # Safety alerts
        safety_alerts: List[str] = []
        if (dest.altitude_meters or 0) > 2800:
            safety_alerts.append(f"High altitude ({dest.altitude_meters}m): Stay hydrated and avoid sudden exertion.")
        if weather_dict and weather_dict.get("is_rain"):
            safety_alerts.append("Rain alert: Mountain roads may be slick; caution around riverside trails.")

        # Recent revisions
        recent_revisions = cls.get_trip_revisions(db, trip.id)[:5]

        return CurrentStateResponse(
            trip_id=trip.id,
            active_day_number=active_day,
            current_time_str=now_time,
            current_location_name=trip.destination.name if trip.destination else "Manali",
            current_weather=weather_dict,
            budget_spent=spent,
            budget_total=total_budget,
            budget_projected=projected,
            budget_remaining=remaining,
            completed_count=completed_count,
            missed_count=missed_count,
            pending_count=pending_count,
            total_items_count=len(all_items),
            upcoming_item=upcoming_item,
            safety_alerts=safety_alerts,
            recent_revisions=recent_revisions
        )
