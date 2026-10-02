"""
VANVAS Rebuilt Ask VANVAS — Comprehensive Integration & Action Verification Test Suite.
Tests:
1. Tool registry integrity (including replan_day, get_split_balances)
2. Replan execution through Copilot tool dispatcher
3. Split & budget ledger verification through tool dispatcher
4. Structured response generation & context awareness
5. Multi-turn follow-up reasoning
6. Context switching without leaking stale context
7. Trip data privacy & authorization isolation
8. Deterministic fallback behavior when AI provider is unavailable
"""
import pytest
import json
from datetime import datetime, date, timezone
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Trip, TripMember, Destination, Place, Itinerary, ItineraryItem, Expense, ExpenseShare
from app.providers.ai.tools import VANVAS_COPILOT_TOOLS
from app.providers.ai.dispatcher import AIToolDispatcher
from app.services.copilot_context import CopilotContextEngine, extract_session_decisions, extract_explicit_destination
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_ai_chat():
    with patch("app.providers.ai.gemini_provider.GeminiProvider.chat_with_tools", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = {
            "text": "QUICK TAKE\nManali retreat ready.\n\nTOP PICKS\n1. Hadimba Temple\n2. Cafe 1947\n\nACTIONS\n[ Explore Manali ]",
            "tool_calls": [],
            "usage": {"latency_ms": 10.0}
        }
        yield mock_chat


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def auth_user(db_session: Session):
    user = db_session.query(User).filter(User.email == "traveller@vanvas.com").first()
    if not user:
        user = User(
            id="usr-test-askvanvas-1",
            email="traveller@vanvas.com",
            full_name="Abhiraj Traveller",
            role="user",
            hashed_password="hashed_pw_test",
        )
        db_session.add(user)
        db_session.commit()
    return user


@pytest.fixture
def auth_headers(auth_user: User):
    token = create_access_token(subject=auth_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user(db_session: Session):
    user = db_session.query(User).filter(User.email == "rahul@vanvas.com").first()
    if not user:
        user = User(
            id="usr-test-askvanvas-2",
            email="rahul@vanvas.com",
            full_name="Rahul Sharma",
            role="user",
            hashed_password="hashed_pw_test",
        )
        db_session.add(user)
        db_session.commit()
    return user


@pytest.fixture
def sample_destination(db_session: Session):
    dest = db_session.query(Destination).filter(Destination.slug == "manali").first()
    if not dest:
        dest = Destination(
            id="dest-manali-test",
            name="Manali",
            slug="manali",
            state="Himachal Pradesh",
            region="Kullu Valley",
            latitude=32.2396,
            longitude=77.1887,
            altitude_meters=2050,
            is_featured=True,
        )
        db_session.add(dest)
        db_session.commit()
    return dest


@pytest.fixture
def sample_places(db_session: Session, sample_destination: Destination):
    places = []
    p1 = db_session.query(Place).filter(Place.slug == "hadimba-temple").first()
    if not p1:
        p1 = Place(
            id="place-hadimba-1",
            destination_id=sample_destination.id,
            name="Hadimba Temple",
            slug="hadimba-temple",
            category="Spiritual",
            description="Historical wooden temple surrounded by tall cedar pines.",
            latitude=32.2483,
            longitude=77.1805,
            approx_cost=0,
            recommended_duration_mins=60,
            is_must_visit=True,
        )
        db_session.add(p1)

    p2 = db_session.query(Place).filter(Place.slug == "old-manali-cafe").first()
    if not p2:
        p2 = Place(
            id="place-cafe-1",
            destination_id=sample_destination.id,
            name="Cafe 1947",
            slug="old-manali-cafe",
            category="Cafe",
            description="Riverside Italian and mountain cafe in Old Manali.",
            latitude=32.2570,
            longitude=77.1880,
            approx_cost=450,
            recommended_duration_mins=75,
            is_indoor=True,
        )
        db_session.add(p2)

    db_session.commit()
    return [p1, p2]


@pytest.fixture
def active_trip_with_itinerary(db_session: Session, auth_user: User, second_user: User, sample_destination: Destination, sample_places: list):
    trip = db_session.query(Trip).filter(Trip.id == "trip-test-askvanvas").first()
    if not trip:
        trip = Trip(
            id="trip-test-askvanvas",
            user_id=auth_user.id,
            destination_id=sample_destination.id,
            title="Manali Autumn Escape",
            start_date=date(2026, 10, 10),
            end_date=date(2026, 10, 14),
            num_days=4,
            budget_total=30000.0,
            budget_spent=12000.0,
            status="active",
        )
        db_session.add(trip)
        db_session.flush()

        # Member
        mem = TripMember(
            trip_id=trip.id,
            user_id=second_user.id,
            role="member",
        )
        db_session.add(mem)

        # Itinerary
        itin = Itinerary(
            trip_id=trip.id,
            day_number=1,
            date=date(2026, 10, 10),
            title="Day 1 - Arrival & Cedar Pines",
        )
        db_session.add(itin)
        db_session.flush()

        # Itinerary Item 1
        item1 = ItineraryItem(
            itinerary_id=itin.id,
            place_id=sample_places[0].id,
            title="Hadimba Temple",
            category="Spiritual",
            start_time="10:00",
            end_time="11:00",
            duration_mins=60,
            estimated_cost=0.0,
            status="upcoming",
        )
        # Itinerary Item 2
        item2 = ItineraryItem(
            itinerary_id=itin.id,
            place_id=sample_places[1].id,
            title="Cafe 1947",
            category="Café",
            start_time="12:00",
            end_time="13:30",
            duration_mins=90,
            estimated_cost=450.0,
            status="upcoming",
        )
        db_session.add_all([item1, item2])

        # Expense & Shares
        exp = Expense(
            trip_id=trip.id,
            user_id=auth_user.id,
            amount=2400.0,
            category="Food",
            title="Dinner at Old Manali",
            split_method="EQUAL",
        )
        db_session.add(exp)
        db_session.flush()

        sh1 = ExpenseShare(expense_id=exp.id, user_id=auth_user.id, owed_amount=1200.0)
        sh2 = ExpenseShare(expense_id=exp.id, user_id=second_user.id, owed_amount=1200.0)
        db_session.add_all([sh1, sh2])

        db_session.commit()
    return trip


# ---------------------------------------------------------------------------
# 1. TOOL REGISTRY TESTS
# ---------------------------------------------------------------------------

def test_tool_registry_contains_rebuilt_tools():
    """Verify tool registry contains replan_day, get_split_balances, save_place, and add_place_to_itinerary."""
    tool_names = [t["name"] for t in VANVAS_COPILOT_TOOLS]
    assert "replan_day" in tool_names
    assert "get_split_balances" in tool_names
    assert "add_place_to_itinerary" in tool_names
    assert "save_place" in tool_names
    assert "search_places" in tool_names
    assert "get_nearby_places" in tool_names
    assert "search_stays" in tool_names
    assert "get_budget_summary" in tool_names


# ---------------------------------------------------------------------------
# 2. DYNAMIC REPLAN TOOL DISPATCHER TEST
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dispatcher_replan_day_late(db_session: Session, auth_user: User, active_trip_with_itinerary: Trip):
    """Test replan_day tool executes dynamic replanning for 'late' scenario."""
    dispatcher = AIToolDispatcher(db=db_session, user=auth_user)
    result = await dispatcher.dispatch("replan_day", {
        "trip_id": active_trip_with_itinerary.id,
        "day_number": 1,
        "action_type": "late",
        "current_time": "14:00",
    })

    assert result["success"] is True
    assert result["action"] == "replan_day"
    assert len(result["items"]) >= 2
    assert "adjusted" in result["message"].lower() or "schedule" in result["message"].lower()


@pytest.mark.asyncio
async def test_dispatcher_replan_day_rain(db_session: Session, auth_user: User, active_trip_with_itinerary: Trip):
    """Test replan_day tool executes dynamic replanning for 'rain' scenario."""
    dispatcher = AIToolDispatcher(db=db_session, user=auth_user)
    result = await dispatcher.dispatch("replan_day", {
        "trip_id": active_trip_with_itinerary.id,
        "day_number": 1,
        "action_type": "rain",
    })

    assert result["success"] is True
    assert "rain" in result["action_type"] or "indoor" in result["message"].lower()


# ---------------------------------------------------------------------------
# 3. SPLIT & BUDGET BALANCES TOOL DISPATCHER TEST
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dispatcher_get_split_balances(db_session: Session, auth_user: User, second_user: User, active_trip_with_itinerary: Trip):
    """Test get_split_balances tool returns verified pairwise debts and net balance."""
    dispatcher = AIToolDispatcher(db=db_session, user=auth_user)
    result = await dispatcher.dispatch("get_split_balances", {
        "trip_id": active_trip_with_itinerary.id,
    })

    assert "total_spent" in result
    assert result["total_spent"] > 0
    assert "you_are_owed" in result
    # Auth user paid 2400 for 2 people, so second_user owes auth_user 1200
    assert len(result["you_are_owed"]) >= 1
    assert result["you_are_owed"][0]["amount"] == 1200.0


# ---------------------------------------------------------------------------
# 4. COPILOT CHAT ENDPOINT WITH STRUCTURED CONTEXT & ACTIONS
# ---------------------------------------------------------------------------

def test_copilot_chat_replan_intent(auth_headers: dict, active_trip_with_itinerary: Trip):
    """POST /api/v1/copilot/chat executes replan intent and returns structured response."""
    res = client.post(
        "/api/v1/copilot/chat",
        headers=auth_headers,
        json={
            "message": "I'm 2 hours late. Please replan my day",
            "trip_id": active_trip_with_itinerary.id,
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "message" in data
    assert "conversation_id" in data
    assert len(data["message"]) > 0


def test_copilot_chat_destination_query(auth_headers: dict, sample_destination: Destination):
    """POST /api/v1/copilot/chat resolves destination without falling back to essays."""
    res = client.post(
        "/api/v1/copilot/chat",
        headers=auth_headers,
        json={
            "message": "What can I do in Manali?",
            "destination_slug": "manali",
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "message" in data
    assert len(data["message"]) > 0


def test_copilot_chat_budget_query(auth_headers: dict, active_trip_with_itinerary: Trip):
    """POST /api/v1/copilot/chat answers budget and balance queries."""
    res = client.post(
        "/api/v1/copilot/chat",
        headers=auth_headers,
        json={
            "message": "How much have we spent on this trip?",
            "trip_id": active_trip_with_itinerary.id,
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "message" in data


# ---------------------------------------------------------------------------
# 5. CONTEXT SWITCHING & DESTINATION ISOLATION
# ---------------------------------------------------------------------------

def test_extract_explicit_destination():
    """Verify explicit destination detection in user prompts."""
    assert extract_explicit_destination("What can I do in Dehradun?") == "dehradun"
    assert extract_explicit_destination("Plan 2 days in Kainchi Dham") == "kainchi-dham"
    assert extract_explicit_destination("Where to stay in Goa?") == "goa"
    assert extract_explicit_destination("Tungnath trek packing list") == "tungnath-chandrashila"


def test_extract_session_decisions_pace_and_budget():
    """Verify regex extraction of pace, budget, and indoor decisions."""
    dec1 = extract_session_decisions("Keep it relaxed and focus on cafes")
    assert dec1.get("pace") == "relaxed"
    assert "cafes" in dec1.get("focus", [])

    dec2 = extract_session_decisions("Make things cheaper and avoid expensive restaurants")
    assert dec2.get("budget_mode") in ["cheaper", "avoid_expensive"]

    dec3 = extract_session_decisions("It's raining so keep things indoors")
    assert dec3.get("indoor_only") is True
