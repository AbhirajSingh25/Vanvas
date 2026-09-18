"""
VANVAS Persistent Context & Memory Engine (Phase 6.9.3)
Maintains strict separation between:
1. VERIFIED_FACTS (Authoritative database ground truth)
2. SESSION_DECISIONS (Explicit conversational decisions in Conversation.context_state)
3. TEMPORARY_CONTEXT (Timestamped ephemeral context with 24h expiration)
4. CONVERSATION_SUMMARY (Rolling natural-language compression of older turns)

Precedence:
1. Current verified database facts
2. Current explicit user session decisions
3. Fresh temporary runtime context (<24h)
4. Conversation summary
5. Older conversational assumptions
"""
import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Union

from sqlalchemy.orm import Session
from app.models.models import (
    User, Trip, TripMember, Destination, UserPreference,
    Conversation, ConversationMessage, Expense, SavedPlace, Vote
)

logger = logging.getLogger("vanvas.services.copilot_context")

RECENT_MESSAGES_LIMIT = 6
TEMPORARY_CONTEXT_TTL_HOURS = 24.0


# ---------------------------------------------------------------------------
# 1. VERIFIED DATABASE FACTS
# ---------------------------------------------------------------------------

def build_verified_context(
    db: Session,
    user: User,
    trip_id: Optional[str] = None,
    destination_slug: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Builds clean, structured verified facts from database records.
    Strictly validates trip access and avoids secret leakage.
    """
    # 1. User Preferences
    prefs: Optional[UserPreference] = user.preferences
    user_facts = {
        "user_id": user.id,
        "full_name": user.full_name,
        "travel_style": prefs.preferred_travel_style if prefs else "Balanced",
        "wake_up_preference": prefs.wake_up_preference if prefs else "Normal",
        "activity_intensity": prefs.activity_intensity if prefs else "Balanced",
        "dietary_preference": prefs.dietary_preference if prefs else "All",
        "interests": [i.strip() for i in (prefs.interests or "").split(",") if i.strip()] if prefs else ["Nature", "Cafes", "Scenery"],
        "accommodation_preference": prefs.accommodation_preference if prefs else "Riverside & Forest Stays",
        "transport_preference": prefs.transport_preference if prefs else "Volvo Bus",
        "companion_style": prefs.companion_style if prefs else "Solo",
    }

    # 2. Trip Facts (with authorization verification)
    trip_facts = None
    target_dest_slug = destination_slug

    if trip_id:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if trip:
            is_creator = (trip.user_id == user.id)
            is_member = bool(db.query(TripMember).filter(
                TripMember.trip_id == trip.id, TripMember.user_id == user.id
            ).first())

            if is_creator or is_member:
                # Itinerary summary
                itinerary_days = []
                for it in trip.itineraries:
                    items_summary = []
                    for item in it.items:
                        items_summary.append({
                            "item_id": item.id,
                            "title": item.title,
                            "category": item.category,
                            "start_time": item.start_time,
                            "end_time": item.end_time,
                            "is_locked": item.is_locked,
                            "status": item.status,
                        })
                    itinerary_days.append({
                        "day_number": it.day_number,
                        "date": str(it.date),
                        "title": it.title,
                        "theme": it.theme,
                        "status": it.status,
                        "items_count": len(it.items),
                        "items": items_summary[:6],  # compact
                    })

                # Budget summary
                expenses_count = db.query(Expense).filter(Expense.trip_id == trip.id).count()

                trip_facts = {
                    "trip_id": trip.id,
                    "title": trip.title,
                    "destination_name": trip.destination.name if trip.destination else "Himalayas",
                    "destination_slug": trip.destination.slug if trip.destination else "manali",
                    "start_date": str(trip.start_date),
                    "end_date": str(trip.end_date),
                    "num_days": trip.num_days,
                    "budget_total": trip.budget_total,
                    "budget_spent": trip.budget_spent,
                    "companion_type": trip.companion_type,
                    "travel_style": trip.travel_style,
                    "wake_up_preference": trip.wake_up_preference,
                    "activity_intensity": trip.activity_intensity,
                    "status": trip.status,
                    "itinerary_days": itinerary_days,
                    "expenses_count": expenses_count,
                }
                if not target_dest_slug and trip.destination:
                    target_dest_slug = trip.destination.slug

    # 3. Destination Facts
    dest_facts = None
    if target_dest_slug:
        dest = db.query(Destination).filter(
            (Destination.slug == target_dest_slug.lower()) |
            (Destination.name.ilike(target_dest_slug))
        ).first()
        if dest:
            dest_facts = {
                "destination_id": dest.id,
                "name": dest.name,
                "slug": dest.slug,
                "state": dest.state,
                "region": dest.region,
                "altitude_meters": dest.altitude_meters,
                "weather_type": dest.weather_type,
                "best_time_to_visit": dest.best_time_to_visit,
                "tagline": dest.tagline,
                "coordinates": {"lat": dest.latitude, "lng": dest.longitude},
            }

    # 4. Saved Places & User Votes (Compact)
    saved = db.query(SavedPlace).filter(SavedPlace.user_id == user.id).limit(6).all()
    saved_places_summary = [
        {"place_id": sp.place_id, "name": sp.place.name if sp.place else sp.place_id}
        for sp in saved
    ]

    return {
        "user_preferences": user_facts,
        "trip": trip_facts,
        "destination": dest_facts,
        "saved_places": saved_places_summary,
    }


# ---------------------------------------------------------------------------
# 2. SESSION DECISION EXTRACTION & MERGE
# ---------------------------------------------------------------------------

def extract_session_decisions(message_text: str) -> Dict[str, Any]:
    """
    Deterministically extracts explicit user decisions and planning constraints from text.
    Conservative regex/keyword matching to prevent hallucinated or inferred profiles.
    """
    if not message_text or not isinstance(message_text, str):
        return {}

    text = message_text.lower().strip()
    decisions: Dict[str, Any] = {}

    # Pace decisions
    if re.search(r"\b((keep|make|give me a)? ?(it|things|day \d+|trip|plan|itinerary)? ?(relaxed|slow|easy|chill)|relaxed (pace|plan|trip|schedule|itinerary)|slow pace|chill pace)\b", text):
        decisions["pace"] = "relaxed"
    elif re.search(r"\b((keep|make|give me a)? ?(it|things|day \d+|trip|plan|itinerary)? ?(energetic|packed|fast|action-packed)|(energetic|packed|fast|high energy) (pace|plan|itinerary|schedule)|more activities)\b", text):
        decisions["pace"] = "packed"
    elif re.search(r"\b((keep|make|give me a)? ?(it|things|day \d+|trip|plan|itinerary)? ?(moderate|balanced)|(moderate|balanced|normal) (pace|plan|itinerary|schedule))\b", text):
        decisions["pace"] = "balanced"

    # Budget mode decisions
    if re.search(r"\b(make (it|things)? ?cheaper|lower budget|cut budget|budget-friendly|on a budget|cheap stay|cheaper stay)\b", text):
        decisions["budget_mode"] = "cheaper"
    elif re.search(r"\b(avoid expensive|no expensive|skip luxury|avoid fine dining)\b", text):
        decisions["budget_mode"] = "avoid_expensive"
    elif re.search(r"\b(luxury stay|premium stay|high-end stay|boutique stay|splurge)\b", text):
        decisions["budget_mode"] = "premium"

    # Focus / Interest decisions (requires explicit intent verb/prefix)
    focus_list: List[str] = []
    if re.search(r"\b(focus on|prefer|interested in|prioritize|want|more) (cafes?|baker(y|ies)|coffee)\b|\bcafe hopping\b", text):
        focus_list.append("cafes")
    if re.search(r"\b(focus on|prefer|interested in|prioritize|want|more) (nature|scenery|scenic spots?|viewpoints?|mountain views?|waterfalls?)\b", text):
        focus_list.append("nature")
    if re.search(r"\b(focus on|prefer|interested in|prioritize|want|more) (adventure|trekking|hiking|river rafting|paragliding)\b", text):
        focus_list.append("adventure")
    if re.search(r"\b(focus on|prefer|interested in|prioritize|want|more) (spirituality|peace|temples|ashrams|monasteries|yoga)\b", text):
        focus_list.append("spiritual")
    if re.search(r"\b(focus on|prefer|interested in|prioritize|want|more) (local food|street food|dhabas?|pahadi food|food tour)\b", text):
        focus_list.append("local_food")
    if focus_list:
        decisions["focus"] = focus_list

    # Indoor / Rain decisions
    if re.search(r"\b(keep (it|things)? ?indoors?|indoor (places|only|spots?|activities)|sheltered only|prefer indoors?|it'?s raining|bad weather outside)\b", text):
        decisions["indoor_only"] = True
    elif re.search(r"\b(keep (it|things)? ?outdoors?|outdoor (places|only|spots?)|prefer outdoors?)\b", text):
        decisions["indoor_only"] = False

    # Wake up / schedule preference
    if re.search(r"\b(no early mornings?|late start|start after 10|sleep in|relaxed morning)\b", text):
        decisions["wake_up_preference"] = "Late"
    elif re.search(r"\b(early morning|sunrise start|start (early|at [5-7]))\b", text):
        decisions["wake_up_preference"] = "Early"

    # Available time window
    time_match = re.search(r"\b(only have|have only|free for|available for|limit to) (\d+(\.\d+)?) ?hours?\b", text)
    if time_match:
        try:
            decisions["hours_available"] = float(time_match.group(2))
        except ValueError:
            pass

    # Avoid / negative constraints
    avoid_list: List[str] = []
    if re.search(r"\b(don'?t include nightlife|no nightlife|no clubs?|no part(y|ies)|avoid nightlife)\b", text):
        avoid_list.append("nightlife")
    if re.search(r"\b(avoid crowds?|no crowded (places?|spots?)|offbeat only|away from tourists)\b", text):
        avoid_list.append("crowded_places")
    if re.search(r"\b(no treks?|avoid (steep|strenuous|long) (treks?|climbing|walks?))\b", text):
        avoid_list.append("strenuous_treks")
    if avoid_list:
        decisions["avoid"] = avoid_list

    # Dietary override
    if re.search(r"\b(pure veg|vegetarian only|strictly veg|veg only|no meat|no non-?veg)\b", text):
        decisions["dietary_override"] = "Veg"
    elif re.search(r"\b(vegan only|strictly vegan)\b", text):
        decisions["dietary_override"] = "Vegan"

    # Companion notes
    if re.search(r"\b(traveling with kids|with children|family with (kids|children)|baby on board)\b", text):
        decisions["companion_notes"] = "traveling with kids"
    elif re.search(r"\b(traveling solo|solo trip|solo traveller|just me)\b", text):
        decisions["companion_notes"] = "solo"

    return decisions


def merge_session_decisions(existing: Dict[str, Any], new_decisions: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safely merges new session decisions into existing decisions.
    Overwrites specific keys (e.g., pace, budget_mode) without erasing unrelated keys.
    """
    merged = dict(existing or {})
    for k, v in (new_decisions or {}).items():
        if v is not None:
            merged[k] = v
    return merged


# ---------------------------------------------------------------------------
# 3. TEMPORARY CONTEXT & EXPIRATION
# ---------------------------------------------------------------------------

def is_temporary_context_valid(
    temp_item: Dict[str, Any],
    max_age_hours: float = TEMPORARY_CONTEXT_TTL_HOURS,
    now: Optional[datetime] = None,
) -> bool:
    """
    Checks if a temporary context entry is younger than max_age_hours (default 24h).
    """
    if not isinstance(temp_item, dict):
        return False

    recorded_at_raw = temp_item.get("recorded_at")
    if not recorded_at_raw:
        return False

    now_utc = now or datetime.now(timezone.utc)

    try:
        if isinstance(recorded_at_raw, datetime):
            recorded_dt = recorded_at_raw
        else:
            recorded_dt = datetime.fromisoformat(str(recorded_at_raw).replace("Z", "+00:00"))

        if recorded_dt.tzinfo is None:
            recorded_dt = recorded_dt.replace(tzinfo=timezone.utc)

        age = now_utc - recorded_dt
        return age.total_seconds() <= max_age_hours * 3600 and age.total_seconds() >= -60
    except Exception:
        return False


def filter_valid_temporary_context(
    temp_list: List[Dict[str, Any]],
    max_age_hours: float = TEMPORARY_CONTEXT_TTL_HOURS,
    now: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """Filters a list of temporary context entries to only valid, non-stale entries."""
    if not temp_list or not isinstance(temp_list, list):
        return []
    return [item for item in temp_list if is_temporary_context_valid(item, max_age_hours, now)]


# ---------------------------------------------------------------------------
# 4. RECENT MESSAGE WINDOW & SUMMARIZATION FOUNDATION
# ---------------------------------------------------------------------------

def prepare_recent_messages(
    messages: List[ConversationMessage],
    max_messages: int = RECENT_MESSAGES_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Loads up to max_messages recent turns in chronological order with compact payloads.
    Prevents prompt explosion from large tool outputs.
    """
    if not messages:
        return []

    # Sort chronologically by created_at
    sorted_msgs = sorted(messages, key=lambda m: m.created_at if m.created_at else datetime.min)
    slice_msgs = sorted_msgs[-max_messages:]

    prepared: List[Dict[str, Any]] = []
    for msg in slice_msgs:
        item: Dict[str, Any] = {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
        }
        if msg.tool_calls:
            # Compact tool calls
            item["tool_calls"] = msg.tool_calls[:300] if len(msg.tool_calls) > 300 else msg.tool_calls
        if msg.tool_results:
            # Compact tool results
            item["tool_results"] = msg.tool_results[:300] if len(msg.tool_results) > 300 else msg.tool_results
        prepared.append(item)

    return prepared


def create_deterministic_summary(older_messages: List[ConversationMessage]) -> str:
    """
    Creates a deterministic, non-hallucinated summary for messages falling outside the recent window.
    Only states explicit topics discussed without fabricating facts.
    """
    if not older_messages:
        return ""

    user_topics = []
    for m in older_messages:
        if m.role == "user" and m.content:
            clean = m.content.strip()
            if len(clean) > 80:
                clean = clean[:77] + "..."
            user_topics.append(clean)

    if not user_topics:
        return ""

    return "Previous discussion topics: " + "; ".join(user_topics[:5])


# ---------------------------------------------------------------------------
# 5. REUSABLE CONTEXT ENGINE SERVICE
# ---------------------------------------------------------------------------

class CopilotContextEngine:
    """
    Unified context management engine enforcing memory layers and priority rules.
    """

    @staticmethod
    def load_conversation_state(
        db: Session,
        user: User,
        conversation_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Loads and safely decodes Conversation.context_state with strict user scoping.
        Recovers gracefully from corrupted/malformed JSON strings.
        """
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            return None

        # Strict security & ownership check
        if conv.user_id != user.id:
            logger.warning(f"User {user.id} attempted to load conversation {conversation_id} owned by {conv.user_id}")
            return None

        # Parse context_state safely
        decisions: Dict[str, Any] = {}
        temp_context: List[Dict[str, Any]] = []

        if conv.context_state:
            try:
                parsed = json.loads(conv.context_state)
                if isinstance(parsed, dict):
                    decisions = parsed.get("decisions", {})
                    temp_context = parsed.get("temporary_context", [])
            except Exception as e:
                logger.warning(f"Malformed context_state in conversation {conversation_id}: {e}")
                decisions = {}
                temp_context = []

        # Filter valid temporary context (<24h)
        valid_temp = filter_valid_temporary_context(temp_context)

        return {
            "conversation_id": conv.id,
            "user_id": conv.user_id,
            "trip_id": conv.trip_id,
            "destination_slug": conv.destination_slug,
            "title": conv.title,
            "summary": conv.summary or "",
            "decisions": decisions,
            "temporary_context": valid_temp,
            "messages_count": len(conv.messages),
        }

    @staticmethod
    def update_conversation_decisions(
        db: Session,
        user: User,
        conversation_id: str,
        new_decisions: Dict[str, Any],
        new_temporary: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Persists newly extracted decisions and optional temporary context into Conversation.context_state.
        """
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id, Conversation.user_id == user.id
        ).first()
        if not conv:
            return False

        # Load existing
        current_decisions: Dict[str, Any] = {}
        current_temp: List[Dict[str, Any]] = []

        if conv.context_state:
            try:
                parsed = json.loads(conv.context_state)
                if isinstance(parsed, dict):
                    current_decisions = parsed.get("decisions", {})
                    current_temp = parsed.get("temporary_context", [])
            except Exception:
                current_decisions = {}
                current_temp = []

        # Merge decisions
        merged_decisions = merge_session_decisions(current_decisions, new_decisions)

        # Append valid temporary item if present
        valid_temp = filter_valid_temporary_context(current_temp)
        if new_temporary and isinstance(new_temporary, dict):
            if "recorded_at" not in new_temporary:
                new_temporary["recorded_at"] = datetime.now(timezone.utc).isoformat()
            valid_temp.append(new_temporary)

        state_payload = {
            "decisions": merged_decisions,
            "temporary_context": valid_temp,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        conv.context_state = json.dumps(state_payload)
        conv.updated_at = datetime.now(timezone.utc)
        db.add(conv)
        db.commit()
        return True

    @staticmethod
    def build_full_context(
        db: Session,
        user: User,
        conversation_id: Optional[str] = None,
        trip_id: Optional[str] = None,
        destination_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Builds the complete 4-layer context payload conforming to priority rules.
        """
        # 1. Verified Facts (Authoritative DB Ground Truth)
        verified_facts = build_verified_context(
            db=db,
            user=user,
            trip_id=trip_id,
            destination_slug=destination_slug,
        )

        # 2. Load Conversation Layer (if conversation_id provided)
        conversation_state = None
        recent_messages: List[Dict[str, Any]] = []
        conversation_summary = ""
        session_decisions: Dict[str, Any] = {}
        valid_temp_context: List[Dict[str, Any]] = []

        if conversation_id:
            conv = db.query(Conversation).filter(
                Conversation.id == conversation_id, Conversation.user_id == user.id
            ).first()
            if conv:
                conversation_state = CopilotContextEngine.load_conversation_state(db, user, conversation_id)
                if conversation_state:
                    session_decisions = conversation_state.get("decisions", {})
                    valid_temp_context = conversation_state.get("temporary_context", [])
                    conversation_summary = conversation_state.get("summary", "")

                recent_messages = prepare_recent_messages(conv.messages, max_messages=RECENT_MESSAGES_LIMIT)

                # Fallback deterministic summary if summary is empty and messages exceed window
                if not conversation_summary and len(conv.messages) > RECENT_MESSAGES_LIMIT:
                    older_slice = sorted(conv.messages, key=lambda m: m.created_at)[:-RECENT_MESSAGES_LIMIT]
                    conversation_summary = create_deterministic_summary(older_slice)

        # 3. Construct Anti-Hallucination System Instruction with Strict Precedence
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
            "6. CONTEXT PRECEDENCE: Current Verified Database Facts > Active User Decisions > Fresh Temporary Context > Conversation Summary.\n"
            "7. CONTROLLED AI ACTIONS: When the user instructs to save a place (e.g. 'save this place', 'save cafe'), invoke the 'save_place' tool with its canonical place_id. "
            "When the user instructs to add a place to their trip or day itinerary (e.g. 'add to day 2 of my trip'), invoke 'add_place_to_itinerary' with the verified trip_id, canonical place_id, and day number. Never fabricate IDs or attempt unapproved actions.\n\n"
            f"1. VERIFIED TRAVELLER PROFILE: {verified_facts['user_preferences']}\n"

        )

        if verified_facts.get("trip"):
            system_instruction += f"2. VERIFIED ACTIVE TRIP: {verified_facts['trip']}\n"
        if verified_facts.get("destination"):
            system_instruction += f"3. VERIFIED DESTINATION: {verified_facts['destination']}\n"

        if session_decisions:
            system_instruction += f"4. ACTIVE USER DECISIONS (Current Session): {session_decisions}\n"

        if valid_temp_context:
            system_instruction += f"5. FRESH TEMPORARY CONTEXT (<24h): {valid_temp_context}\n"

        if conversation_summary:
            system_instruction += f"6. CONVERSATION SUMMARY: {conversation_summary}\n"

        return {
            "system_instruction": system_instruction,
            "verified_facts": verified_facts,
            "session_decisions": session_decisions,
            "temporary_context": valid_temp_context,
            "conversation_summary": conversation_summary,
            "recent_messages": recent_messages,
            "user_context": verified_facts["user_preferences"],
            "trip_context": verified_facts.get("trip"),
            "destination_context": verified_facts.get("destination"),
        }


# ---------------------------------------------------------------------------
# Backward-Compatible Function Alias
# ---------------------------------------------------------------------------

def build_copilot_context(
    db: Session,
    user: User,
    trip_id: Optional[str] = None,
    destination_slug: Optional[str] = None,
    conversation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Backward-compatible wrapper for existing endpoints while delegating to the new engine.
    """
    return CopilotContextEngine.build_full_context(
        db=db,
        user=user,
        conversation_id=conversation_id,
        trip_id=trip_id,
        destination_slug=destination_slug,
    )
