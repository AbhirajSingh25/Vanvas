"""
Focused tests for VANVAS Persistent Context & Memory Engine (Phase 6.9.3).
Verifies:
1. Four memory layers (Verified facts, Session decisions, Temporary context, Conversation summary).
2. Authorization & user scoping.
3. Decision extraction & non-destructive merging.
4. Temporary context timestamp validation & 24h expiration.
5. Recent message windowing (chronological, capped at 6).
6. Malformed JSON recovery.
7. Secret exclusion & zero credential leakage.
"""
import pytest
import json
from datetime import date, datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.session import Base
from app.models.models import (
    User, Destination, Place, Trip, TripMember, UserPreference,
    Conversation, ConversationMessage, Expense, Itinerary, ItineraryItem
)
from app.core.security import get_password_hash
from app.services.copilot_context import (
    CopilotContextEngine,
    build_verified_context,
    build_copilot_context,
    extract_session_decisions,
    merge_session_decisions,
    is_temporary_context_valid,
    filter_valid_temporary_context,
    prepare_recent_messages,
    RECENT_MESSAGES_LIMIT,
)


@pytest.fixture
def db():
    """Isolated SQLite in-memory DB for unit testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionClass = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionClass()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def user_a(db):
    user = User(
        email="aarav@vanvas.com",
        hashed_password=get_password_hash("SuperSecurePass123!"),
        full_name="Aarav Mehta",
        role="traveller",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    prefs = UserPreference(
        user_id=user.id,
        preferred_travel_style="Comfort",
        wake_up_preference="Normal",
        activity_intensity="Balanced",
        dietary_preference="Veg",
        interests="Cafes,Scenic viewpoints,Nature",
        accommodation_preference="Boutique Heritage Stay",
        transport_preference="Self-Drive",
        companion_style="Couple",
    )
    db.add(prefs)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_b(db):
    user = User(
        email="sneha@vanvas.com",
        hashed_password=get_password_hash("AnotherSecret456!"),
        full_name="Sneha Kapoor",
        role="traveller",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def destination_mussoorie(db):
    dest = Destination(
        name="Mussoorie",
        slug="mussoorie",
        state="Uttarakhand",
        region="Garhwal Himalayas",
        tagline="Queen of the Hills",
        description="Mist-covered cedar ridges with vintage colonial bakeries.",
        latitude=30.4598,
        longitude=78.0644,
        altitude_meters=2005,
        weather_type="Cool Mountain",
    )
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


@pytest.fixture
def trip_mussoorie(db, user_a, destination_mussoorie):
    trip = Trip(
        user_id=user_a.id,
        destination_id=destination_mussoorie.id,
        title="Mussoorie Autumn Retreat",
        start_date=date(2026, 10, 10),
        end_date=date(2026, 10, 13),
        num_days=3,
        budget_total=18000.0,
        budget_spent=2500.0,
        travel_style="Comfort",
        activity_intensity="Balanced",
        companion_type="Couple",
    )
    db.add(trip)
    db.commit()

    itin_day = Itinerary(
        trip_id=trip.id,
        day_number=1,
        date=date(2026, 10, 10),
        title="Landour Heritage & Bakeries",
    )
    db.add(itin_day)
    db.commit()

    item = ItineraryItem(
        itinerary_id=itin_day.id,
        title="Landour Bakehouse",
        category="Café",
        start_time="10:00",
        end_time="11:30",
        duration_mins=90,
        is_locked=True,
    )
    db.add(item)

    exp = Expense(
        trip_id=trip.id,
        user_id=user_a.id,
        title="Fuel & Tolls",
        category="Transport",
        amount=2500.0,
        payment_method="UPI",
    )
    db.add(exp)
    db.commit()
    db.refresh(trip)
    return trip


# =========================================================================
# 1. Context Builds: No Trip vs Linked Trip
# =========================================================================

def test_context_builds_without_trip(db, user_a, destination_mussoorie):
    """Context successfully builds for spontaneous queries with only destination."""
    ctx = CopilotContextEngine.build_full_context(
        db=db,
        user=user_a,
        destination_slug="mussoorie",
    )
    assert ctx["verified_facts"]["trip"] is None
    assert ctx["verified_facts"]["destination"]["slug"] == "mussoorie"
    assert ctx["verified_facts"]["user_preferences"]["travel_style"] == "Comfort"
    assert "QUEEN OF THE HILLS" in ctx["system_instruction"].upper() or "Mussoorie" in ctx["system_instruction"]


def test_context_builds_with_linked_trip(db, user_a, trip_mussoorie):
    """Context includes rich verified trip facts when authorized."""
    ctx = CopilotContextEngine.build_full_context(
        db=db,
        user=user_a,
        trip_id=trip_mussoorie.id,
    )
    trip_data = ctx["verified_facts"]["trip"]
    assert trip_data is not None
    assert trip_data["trip_id"] == trip_mussoorie.id
    assert trip_data["budget_total"] == 18000.0
    assert trip_data["budget_spent"] == 2500.0
    assert len(trip_data["itinerary_days"]) == 1
    assert trip_data["itinerary_days"][0]["items"][0]["title"] == "Landour Bakehouse"
    assert "Landour Heritage & Bakeries" in ctx["system_instruction"]


# =========================================================================
# 2. Verified Facts Inclusion
# =========================================================================

def test_verified_user_preferences_included(db, user_a):
    """Verified user preferences are accurately mapped."""
    verified = build_verified_context(db=db, user=user_a)
    prefs = verified["user_preferences"]
    assert prefs["user_id"] == user_a.id
    assert prefs["full_name"] == "Aarav Mehta"
    assert prefs["dietary_preference"] == "Veg"
    assert "Cafes" in prefs["interests"]
    assert prefs["accommodation_preference"] == "Boutique Heritage Stay"


# =========================================================================
# 3. Decision Extraction & Merge Rules
# =========================================================================

def test_explicit_session_decisions_extracted():
    """Extracts explicit user decisions across pace, budget, focus, indoor, time, and diet."""
    d1 = extract_session_decisions("Please keep day 1 relaxed and make it cheaper.")
    assert d1["pace"] == "relaxed"
    assert d1["budget_mode"] == "cheaper"

    d2 = extract_session_decisions("Focus on cafes and bakeries, and keep it indoors since it's raining.")
    assert "cafes" in d2["focus"]
    assert d2["indoor_only"] is True

    d3 = extract_session_decisions("I only have 3 hours free and prefer no early mornings.")
    assert d3["hours_available"] == 3.0
    assert d3["wake_up_preference"] == "Late"

    d4 = extract_session_decisions("We are vegetarian only and don't include nightlife.")
    assert d4["dietary_override"] == "Veg"
    assert "nightlife" in d4["avoid"]


def test_decisions_merge_non_destructively():
    """New decisions merge into existing dictionary without deleting unrelated keys."""
    existing = {"pace": "relaxed", "focus": ["cafes"]}
    new_dec = {"budget_mode": "cheaper"}
    merged = merge_session_decisions(existing, new_dec)

    assert merged["pace"] == "relaxed"
    assert merged["focus"] == ["cafes"]
    assert merged["budget_mode"] == "cheaper"


def test_later_conflicting_decision_overrides_earlier():
    """A newer conflicting decision (e.g. pace = packed) replaces previous pace."""
    state1 = {"pace": "relaxed", "budget_mode": "cheaper"}
    state2 = {"pace": "packed"}
    merged = merge_session_decisions(state1, state2)

    assert merged["pace"] == "packed"
    assert merged["budget_mode"] == "cheaper"


def test_assistant_suggestions_not_treated_as_decisions():
    """Passing empty or non-user text does not extract phantom decisions."""
    assert extract_session_decisions("") == {}
    assert extract_session_decisions(None) == {}
    # Random informational assistant reply
    assistant_text = "I recommend visiting Gun Hill viewpoint at 4:00 PM for sunset."
    assert extract_session_decisions(assistant_text) == {}


# =========================================================================
# 4. Temporary Context Expiration (<24h vs >24h)
# =========================================================================

def test_temporary_context_validity_under_24h():
    """Temporary context recorded 2 hours ago is valid."""
    now = datetime.now(timezone.utc)
    fresh_item = {
        "type": "weather_alert",
        "note": "Sudden fog on Landour ridge",
        "recorded_at": (now - timedelta(hours=2)).isoformat(),
    }
    assert is_temporary_context_valid(fresh_item, max_age_hours=24.0, now=now) is True


def test_temporary_context_expiration_over_24h():
    """Temporary context older than 24 hours is considered stale and filtered out."""
    now = datetime.now(timezone.utc)
    stale_item = {
        "type": "rain_alert",
        "note": "Raining yesterday",
        "recorded_at": (now - timedelta(hours=26)).isoformat(),
    }
    fresh_item = {
        "type": "sunset_note",
        "note": "Clear sunset today",
        "recorded_at": (now - timedelta(hours=1)).isoformat(),
    }

    filtered = filter_valid_temporary_context([stale_item, fresh_item], max_age_hours=24.0, now=now)
    assert len(filtered) == 1
    assert filtered[0]["note"] == "Clear sunset today"


# =========================================================================
# 5. Recent Message Windowing & Chronological Order
# =========================================================================

def test_recent_message_window_limits_and_orders(db, user_a):
    """Loads at most 6 recent messages in strict chronological order."""
    conv = Conversation(user_id=user_a.id, title="Window Test")
    db.add(conv)
    db.commit()

    base_time = datetime(2026, 9, 17, 10, 0, 0, tzinfo=timezone.utc)
    for i in range(10):
        msg = ConversationMessage(
            conversation_id=conv.id,
            role="user" if i % 2 == 0 else "assistant",
            content=f"Message number {i + 1}",
            created_at=base_time + timedelta(minutes=i * 5),
        )
        db.add(msg)
    db.commit()
    db.refresh(conv)

    prepared = prepare_recent_messages(conv.messages, max_messages=6)
    assert len(prepared) == 6
    # Oldest in the 6-item slice should be Message number 5
    assert prepared[0]["content"] == "Message number 5"
    # Newest should be Message number 10
    assert prepared[-1]["content"] == "Message number 10"


# =========================================================================
# 6. Precedence: DB Facts vs Conversation Summary
# =========================================================================

def test_db_facts_precedence_over_summary(db, user_a, trip_mussoorie):
    """Verified DB budget and days are directly surfaced regardless of what summary says."""
    conv = Conversation(
        user_id=user_a.id,
        trip_id=trip_mussoorie.id,
        title="Precedence Test",
        summary="User previously discussed a ₹10,000 budget for 2 days in Manali.",
    )
    db.add(conv)
    db.commit()

    ctx = CopilotContextEngine.build_full_context(
        db=db,
        user=user_a,
        conversation_id=conv.id,
        trip_id=trip_mussoorie.id,
    )

    # The verified database facts must contain the real Mussoorie trip facts
    assert ctx["verified_facts"]["trip"]["budget_total"] == 18000.0
    assert ctx["verified_facts"]["trip"]["num_days"] == 3
    assert ctx["verified_facts"]["trip"]["destination_name"] == "Mussoorie"
    # Summary is present in its separate layer
    assert "₹10,000" in ctx["conversation_summary"]


# =========================================================================
# 7. Malformed JSON Recovery
# =========================================================================

def test_malformed_context_state_does_not_crash(db, user_a):
    """Corrupted context_state string is safely handled without raising unhandled exceptions."""
    conv = Conversation(
        user_id=user_a.id,
        title="Corrupted State Test",
        context_state="INVALID_JSON_{{::broken",
    )
    db.add(conv)
    db.commit()

    state = CopilotContextEngine.load_conversation_state(db, user_a, conv.id)
    assert state is not None
    assert state["decisions"] == {}
    assert state["temporary_context"] == []

    # Full context build succeeds cleanly
    ctx = CopilotContextEngine.build_full_context(db, user_a, conversation_id=conv.id)
    assert ctx is not None
    assert ctx["session_decisions"] == {}


# =========================================================================
# 8. Security & Authorization Checks
# =========================================================================

def test_cross_user_conversation_access_rejected(db, user_a, user_b):
    """User B cannot load or inspect User A's conversation context."""
    conv_a = Conversation(
        user_id=user_a.id,
        title="User A Secret Expedition",
        context_state=json.dumps({"decisions": {"secret_spot": "hidden_waterfall"}}),
    )
    db.add(conv_a)
    db.commit()

    # User B tries to load User A's conversation
    state_for_b = CopilotContextEngine.load_conversation_state(db, user_b, conv_a.id)
    assert state_for_b is None

    # Full context for User B does not load User A's session decisions
    ctx_b = CopilotContextEngine.build_full_context(db, user_b, conversation_id=conv_a.id)
    assert ctx_b["session_decisions"] == {}
    assert ctx_b["recent_messages"] == []


def test_cross_user_trip_context_rejected(db, user_b, trip_mussoorie):
    """User B cannot see User A's trip facts if not a member or creator."""
    verified_b = build_verified_context(db=db, user=user_b, trip_id=trip_mussoorie.id)
    assert verified_b["trip"] is None


def test_context_serialization_contains_no_secrets(db, user_a, trip_mussoorie):
    """Context structures never contain hashed passwords, raw credentials, or auth headers."""
    ctx = CopilotContextEngine.build_full_context(
        db=db,
        user=user_a,
        trip_id=trip_mussoorie.id,
    )
    dumped = json.dumps(ctx, default=str)

    assert "hashed_password" not in dumped
    assert "SuperSecurePass123!" not in dumped
    assert "Bearer" not in dumped
    assert "Authorization" not in dumped
    assert "GEMINI_API_KEY" not in dumped
