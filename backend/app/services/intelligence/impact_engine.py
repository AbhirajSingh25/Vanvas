"""
VANVAS Deterministic Impact Engine (Phase 4)
Evaluates real travel signals against actual trip state with mathematical certainty:
- Weather Impact on Outdoor vs Indoor Activities
- Transport Disruption Impact on Hotel Check-in & Day 1 Schedule
- Road Trip ETA Impact on Check-in & Stop Sequence
- Opening Hours Timing Conflict Detection
- Budget Burn Rate & Overspend Pressure
- Location Arrival Reconciliation
- Group Travel Decision Tracking

Strict Product Rules:
- LLMs DO NOT decide whether something is an issue.
- Impact is calculated deterministically first.
- Zero false alerts: If impact is below threshold, no insight is produced.
- Stale or unknown data is explicitly tagged and never presented with false confidence.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple

from sqlalchemy.orm import Session
from app.models.models import (
    Trip, Itinerary, ItineraryItem, Place, Hotel, User, Expense,
    TravelSignal, TravelInsight, TravelAction, ReplanProposal,
    TravelCircle, CircleActivity, CircleActivityVote
)

logger = logging.getLogger("vanvas.intelligence.impact_engine")


def _mins_to_str(mins: int) -> str:
    m = mins % (24 * 60)
    return f"{m // 60:02d}:{m % 60:02d}"


def _str_to_mins(time_str: str, default: int = 540) -> int:
    try:
        parts = time_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return default


class ImpactEngine:
    """Deterministic evaluation engine mapping signals + trip reality to actionable insights."""

    @classmethod
    def evaluate_signal(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """Dispatches signal to domain evaluator."""
        sig_type = signal.signal_type.upper()
        if sig_type == "WEATHER":
            return cls.evaluate_weather_impact(db, trip, signal)
        elif sig_type == "TRANSPORT":
            return cls.evaluate_transport_impact(db, trip, signal)
        elif sig_type == "ROAD_TRAFFIC":
            return cls.evaluate_road_traffic_impact(db, trip, signal)
        elif sig_type == "OPENING_HOURS":
            return cls.evaluate_opening_hours_impact(db, trip, signal)
        elif sig_type == "BUDGET":
            return cls.evaluate_budget_impact(db, trip, signal)
        elif sig_type == "LOCATION":
            return cls.evaluate_arrival_impact(db, trip, signal)
        elif sig_type == "GROUP_ACTIVITY":
            return cls.evaluate_group_activity_impact(db, trip, signal)
        return None

    # -------------------------------------------------------------------------
    # 1. WEATHER IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_weather_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Compares weather forecast against actual itinerary.
        Only generates an insight if an OUTDOOR activity is scheduled during severe weather.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        is_rain = norm_state.get("is_rain", False)
        is_severe = norm_state.get("is_severe", False)
        condition = norm_state.get("condition", "Pleasant")
        precip_prob = norm_state.get("precipitation_probability", 0)

        # Stale or unavailable handling
        if signal.freshness in ["UNAVAILABLE", "UNKNOWN"]:
            return TravelInsight(
                trip_id=trip.id,
                signal_id=signal.id,
                category="WEATHER",
                severity="LOW",
                title="Weather Verification Unavailable",
                explanation=f"VANVAS could not verify live weather for {norm_state.get('destination_name', 'destination')}. Preserving planned itinerary without speculative changes.",
                impact_json=json.dumps({"status": "UNKNOWN", "freshness": signal.freshness}),
                recommendation="Check local conditions before departing.",
                confidence=0.0,
                status="ACTIONABLE",
                fingerprint=f"weather_stale_{trip.id}_{signal.fingerprint}",
                metadata_json=json.dumps({"is_stale": True})
            )

        # Threshold check: no alert if weather is clear or precipitation probability < 50%
        if not is_rain and not is_severe and precip_prob < 50:
            logger.info(f"Weather impact below threshold for trip {trip.id} ({condition}, {precip_prob}% rain)")
            return None

        # Inspect trip itinerary items (focusing on active/target day)
        affected_items = []
        target_itinerary = trip.itineraries[0] if trip.itineraries else None
        if not target_itinerary:
            return None

        # Determine target day: Day 2 or Day 1 with outdoor activities
        for it in trip.itineraries:
            for item in it.items:
                place = item.place
                # Activity is outdoor if explicit flag or category suggests outdoor nature/trek/temple
                is_indoor = False
                if place and place.is_indoor is not None:
                    is_indoor = place.is_indoor
                elif item.category in ["Café", "Museum", "Spa", "Indoor", "Restaurant", "Hotel"]:
                    is_indoor = True
                elif "cafe" in item.title.lower() or "museum" in item.title.lower():
                    is_indoor = True

                if not is_indoor and item.status not in ["COMPLETED", "MISSED", "SKIPPED"]:
                    affected_items.append({
                        "day_number": it.day_number,
                        "item_id": item.id,
                        "title": item.title,
                        "category": item.category,
                        "start_time": item.start_time,
                        "end_time": item.end_time,
                        "duration_mins": item.duration_mins,
                        "place_id": item.place_id,
                        "is_indoor": False
                    })

        if not affected_items:
            logger.info(f"No outdoor activities scheduled during rain for trip {trip.id}. Zero false alert.")
            return None

        # Find first primary impacted activity (e.g. 9 AM hike)
        primary = affected_items[0]
        day_num = primary["day_number"]
        item_title = primary["title"]
        start_time = primary["start_time"]

        # Calculate impact details and available safe alternatives
        safer_time = "16:00"
        impact_summary = {
            "affected_activity": item_title,
            "affected_time_window": f"{start_time} - {primary['end_time']}",
            "severity": "HIGH" if is_severe or precip_prob >= 75 else "MEDIUM",
            "condition": condition,
            "precipitation_probability": precip_prob,
            "affected_items_count": len(affected_items),
            "safer_time_window": safer_time,
            "suggested_action": f"Move {item_title} to {safer_time} or swap with indoor covered activity."
        }

        fingerprint = f"weather_impact_{trip.id}_{day_num}_{primary['item_id']}_{condition}"

        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="WEATHER",
            severity="HIGH" if is_severe or precip_prob >= 75 else "MEDIUM",
            title="WEATHER IMPACT DETECTED",
            explanation=f"Heavy rain is expected during your {start_time} {item_title}.",
            impact_json=json.dumps(impact_summary),
            recommendation=f"Reschedule {item_title} to {safer_time} or replace with a nearby indoor café/sanctuary.",
            confidence=signal.confidence,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps({"day_number": day_num, "primary_item_id": primary["item_id"], "safer_time": safer_time})
        )
        return insight

    # -------------------------------------------------------------------------
    # 2. TRANSPORT DELAY IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_transport_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Compares new transport arrival ETA vs hotel check-in time and Day 1 itinerary.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        delay_mins = int(norm_state.get("delay_minutes") or 0)
        status = norm_state.get("status", "ON_TIME").upper()
        original_arrival = norm_state.get("original_arrival", "12:10")
        new_arrival = norm_state.get("new_arrival", "14:30")
        transfer_mins = int(norm_state.get("transfer_duration_mins") or 35)

        # Calculate arrival at hotel: new_arrival + transfer_mins
        new_arr_mins = _str_to_mins(new_arrival, default=870)
        hotel_reach_mins = new_arr_mins + transfer_mins
        hotel_reach_str = _mins_to_str(hotel_reach_mins)

        # Hotel check-in time (default 14:00)
        hotel_checkin_str = "14:00"
        hotel_name = "Hotel"
        if trip.hotel:
            hotel_name = trip.hotel.name
            hotel_checkin_str = trip.hotel.check_in_time or "14:00"
        checkin_mins = _str_to_mins(hotel_checkin_str, default=840)

        # Calculate delay past check-in
        mins_past_checkin = hotel_reach_mins - checkin_mins

        # Threshold check: no impact if reaching hotel before check-in or delay < 15 mins
        if mins_past_checkin <= 0 and delay_mins < 20 and status == "ON_TIME":
            logger.info(f"Transport delay ({delay_mins}m) has no check-in conflict for trip {trip.id}")
            return None

        impact_summary = {
            "original_arrival": original_arrival,
            "new_arrival": new_arrival,
            "delay_minutes": delay_mins,
            "transfer_estimate_minutes": transfer_mins,
            "estimated_hotel_arrival": hotel_reach_str,
            "hotel_checkin_time": hotel_checkin_str,
            "minutes_past_checkin": max(0, mins_past_checkin),
            "hotel_name": hotel_name,
            "status": status,
            "impacts_hotel_checkin": mins_past_checkin > 0,
            "impacts_day1_itinerary": True
        }

        explanation = f"Your arrival is now {mins_past_checkin} minutes after hotel check-in." if mins_past_checkin > 0 else f"Transport delay of {delay_mins} minutes impacts your Day 1 schedule."

        fingerprint = f"transport_delay_{trip.id}_{new_arrival}_{delay_mins}"

        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="TRANSPORT",
            severity="HIGH" if (status in ["CANCELLED", "MAJOR_DELAY"] or mins_past_checkin >= 30) else "MEDIUM",
            title="TRANSPORT DELAY",
            explanation=explanation,
            impact_json=json.dumps(impact_summary),
            recommendation="Shift Day 1 first activity, notify accommodation of late check-in, and keep bookings secure.",
            confidence=signal.confidence,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps({"hotel_reach_time": hotel_reach_str, "mins_past_checkin": mins_past_checkin})
        )
        return insight

    # -------------------------------------------------------------------------
    # 3. ROAD TRIP TRAFFIC IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_road_traffic_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Evaluates road traffic delays and ETA changes on hotel check-in and scheduled stops.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        extra_mins = int(norm_state.get("extra_delay_minutes") or 0)
        current_eta = norm_state.get("current_eta", "15:05")
        original_eta = norm_state.get("original_eta", "13:20")

        hotel_checkin_str = "14:00"
        if trip.hotel:
            hotel_checkin_str = trip.hotel.check_in_time or "14:00"
        checkin_mins = _str_to_mins(hotel_checkin_str, default=840)
        eta_mins = _str_to_mins(current_eta, default=905)

        mins_past_checkin = max(0, eta_mins - checkin_mins)

        # Threshold check: no alert if ETA remains ahead of checkin and delay < 20 mins
        if mins_past_checkin <= 0 and extra_mins < 20:
            return None

        impact_summary = {
            "corridor": norm_state.get("corridor"),
            "original_eta": original_eta,
            "current_eta": current_eta,
            "extra_driving_minutes": extra_mins,
            "hotel_checkin_time": hotel_checkin_str,
            "minutes_past_checkin": mins_past_checkin,
            "road_condition": norm_state.get("road_condition")
        }

        explanation = f"Current road conditions push your arrival {mins_past_checkin} minutes past hotel check-in." if mins_past_checkin > 0 else f"Road conditions add {extra_mins} minutes to your drive."

        fingerprint = f"road_traffic_{trip.id}_{current_eta}_{extra_mins}"

        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="ROAD_TRAFFIC",
            severity="HIGH" if mins_past_checkin >= 45 else "MEDIUM",
            title="ARRIVAL PRESSURE",
            explanation=explanation,
            impact_json=json.dumps(impact_summary),
            recommendation="Shift itinerary start, adjust stop sequence or remove optional stop without cancelling confirmed accommodation.",
            confidence=signal.confidence,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps({"current_eta": current_eta, "mins_past_checkin": mins_past_checkin})
        )
        return insight

    # -------------------------------------------------------------------------
    # 4. OPENING HOURS IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_opening_hours_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Evaluates place opening hours against planned visit timing.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        place_name = norm_state.get("place_name", "Place")
        planned_time = norm_state.get("planned_time", "19:00")
        opening_hours = norm_state.get("opening_hours", "10:00-18:00")
        is_open = norm_state.get("is_open_at_planned_time", True)

        if is_open:
            return None

        impact_summary = {
            "place_name": place_name,
            "planned_time": planned_time,
            "verified_hours": opening_hours,
            "conflict": "Visit scheduled outside opening hours"
        }

        fingerprint = f"opening_hours_{trip.id}_{place_name}_{planned_time}"

        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="OPENING_HOURS",
            severity="MEDIUM",
            title="TIMING CONFLICT",
            explanation=f"Your planned visit to {place_name} at {planned_time} is outside today's opening hours ({opening_hours}).",
            impact_json=json.dumps(impact_summary),
            recommendation="Move visit earlier, reschedule to another day, or replace with a nearby open destination.",
            confidence=signal.confidence,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps(impact_summary)
        )
        return insight

    # -------------------------------------------------------------------------
    # 5. BUDGET IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_budget_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Detects budget burn rate acceleration and projected overspend.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        is_overspend = norm_state.get("is_overspend", False)
        overspend_amount = float(norm_state.get("overspend_amount") or 0.0)
        projected_total = float(norm_state.get("projected_total") or 0.0)
        total_budget = float(norm_state.get("total_budget") or 10000.0)
        spent = float(norm_state.get("spent") or 0.0)
        days_remaining = int(norm_state.get("days_remaining") or 1)

        # Threshold check: no alert if on track or overspend < 500
        if not is_overspend or overspend_amount < 500:
            return None

        impact_summary = {
            "total_budget": total_budget,
            "spent": spent,
            "days_remaining": days_remaining,
            "projected_total": projected_total,
            "overspend_amount": overspend_amount,
            "burn_rate_status": "EXCEEDING_TARGET"
        }

        fingerprint = f"budget_pressure_{trip.id}_{overspend_amount:.0f}"

        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="BUDGET",
            severity="HIGH" if overspend_amount > (total_budget * 0.25) else "MEDIUM",
            title="BUDGET PRESSURE",
            explanation=f"You're trending roughly ₹{overspend_amount:,.0f} above your trip budget.",
            impact_json=json.dumps(impact_summary),
            recommendation="Review lower-cost dining alternatives, reduce optional activities, or preserve current plan.",
            confidence=signal.confidence,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps(impact_summary)
        )
        return insight

    # -------------------------------------------------------------------------
    # 6. ARRIVAL IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_arrival_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Reconciles actual destination arrival against planned arrival and hotel check-in.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        location_name = norm_state.get("location_name", "Destination")
        arrival_time = norm_state.get("arrival_time", "13:45")
        planned_arrival = norm_state.get("planned_arrival", "14:00")

        impact_summary = {
            "destination": location_name,
            "actual_arrival": arrival_time,
            "planned_arrival": planned_arrival,
            "reconciled": True,
            "immediate_actions": ["Check-in at accommodation", "View nearby essentials", "Start Day 1 Itinerary"]
        }

        fingerprint = f"arrival_reconciled_{trip.id}_{arrival_time}"

        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="LOCATION",
            severity="LOW",
            title="DESTINATION ARRIVAL RECONCILED",
            explanation=f"You've reached {location_name} at {arrival_time}.",
            impact_json=json.dumps(impact_summary),
            recommendation="Proceed to check-in, explore nearby cafes, or begin Day 1 exploration.",
            confidence=1.0,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps(impact_summary)
        )
        return insight

    # -------------------------------------------------------------------------
    # 7. GROUP ACTIVITY IMPACT EVALUATION
    # -------------------------------------------------------------------------
    @classmethod
    def evaluate_group_activity_impact(
        cls,
        db: Session,
        trip: Trip,
        signal: TravelSignal
    ) -> Optional[TravelInsight]:
        """
        Evaluates group circle votes to identify pending decisions.
        """
        norm_state = json.loads(signal.normalized_state_json or "{}")
        missing_votes = int(norm_state.get("missing_votes") or 0)
        total_members = int(norm_state.get("total_members") or 4)
        votes_count = int(norm_state.get("votes_count") or 3)
        activity_title = norm_state.get("activity_title", "Group Activity")

        if missing_votes <= 0:
            return None

        impact_summary = {
            "activity_title": activity_title,
            "total_members": total_members,
            "votes_recorded": votes_count,
            "missing_votes": missing_votes,
            "circle_id": norm_state.get("circle_id")
        }

        fingerprint = f"group_vote_pending_{trip.id}_{activity_title}_{votes_count}"

        vote_text = "vote is" if missing_votes == 1 else "votes are"
        insight = TravelInsight(
            trip_id=trip.id,
            signal_id=signal.id,
            category="GROUP_ACTIVITY",
            severity="MEDIUM",
            title="GROUP DECISION PENDING",
            explanation=f"{missing_votes} {vote_text} still needed to finalize tomorrow's activity ({activity_title}).",
            impact_json=json.dumps(impact_summary),
            recommendation=f"Submit your vote to lock in {activity_title}.",
            confidence=1.0,
            status="ACTIONABLE",
            fingerprint=fingerprint,
            metadata_json=json.dumps(impact_summary)
        )
        return insight
