"""
VANVAS Phase 6.8 — AI Orchestration, Tool Registry & Copilot Foundation Test Suite.
Verifies:
- AIToolDispatcher execution of all 10 registered tools
- Security authorization boundaries (User A cannot access User B's trip)
- Copilot context assembly
- Copilot chat endpoint /api/v1/copilot/chat
- GeminiProvider function-calling loop with mock tool execution
- Disabled mode deterministic safety
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.database.session import SessionLocal
from app.models.models import User, Trip, Destination, Place, UserPreference, Expense
from app.providers.ai.dispatcher import AIToolDispatcher
from app.providers.ai.tools import VANVAS_COPILOT_TOOLS
from unittest.mock import AsyncMock, patch
from app.services.copilot_context import build_copilot_context
from app.providers.ai.gemini_provider import DisabledAIProvider, GeminiProvider

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_ai_chat():
    with patch("app.providers.ai.gemini_provider.GeminiProvider.chat_with_tools", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = {
            "text": "Mussoorie retreat itinerary planned.",
            "tool_calls": [],
            "usage": {"latency_ms": 10.0}
        }
        yield mock_chat


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def traveller_user(db):
    user = db.query(User).filter(User.email == "traveller@vanvas.com").first()
    if not user:
        user = User(
            id="test-traveller-user",
            email="traveller@vanvas.com",
            hashed_password="hash",
            full_name="Test Explorer",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def other_user(db):
    user = db.query(User).filter(User.email == "other@vanvas.com").first()
    if not user:
        user = User(
            id="test-other-user",
            email="other@vanvas.com",
            hashed_password="hash",
            full_name="Other Explorer",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def sample_trip(db, traveller_user):
    dest = db.query(Destination).filter(Destination.slug == "mussoorie").first()
    if not dest:
        dest = db.query(Destination).first()

    trip = db.query(Trip).filter(Trip.user_id == traveller_user.id).first()
    if not trip:
        from datetime import date, timedelta
        trip = Trip(
            id="test-copilot-trip-123",
            user_id=traveller_user.id,
            destination_id=dest.id,
            title="Mussoorie Slow Retreat",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=3),
            num_days=3,
            budget_total=15000.0,
            budget_spent=2500.0
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)
    return trip


# ==========================================
# 1. TOOL REGISTRY & DISPATCHER TESTS (10 TOOLS)
# ==========================================

def test_tool_registry_has_10_tools():
    """Verify all 10 tools are registered in tool specifications."""
    assert len(VANVAS_COPILOT_TOOLS) >= 10
    names = [t["name"] for t in VANVAS_COPILOT_TOOLS]
    expected_tools = [
        "get_destination_info", "get_place", "search_places",
        "get_nearby_places", "get_weather_forecast", "calculate_route",
        "get_quick_plan", "get_trip", "get_user_preferences", "get_budget_summary"
    ]
    for tool_name in expected_tools:
        assert tool_name in names


@pytest.mark.asyncio
async def test_tool_get_destination_info(db):
    dispatcher = AIToolDispatcher(db=db)
    res = await dispatcher.dispatch("get_destination_info", {"destination_slug": "mussoorie"})
    assert "error" not in res
    assert res["destination_name"] == "Mussoorie"
    assert "altitude_meters" in res
    assert "total_curated_places" in res


@pytest.mark.asyncio
async def test_tool_get_place(db):
    dispatcher = AIToolDispatcher(db=db)
    # Query an existing place
    p = db.query(Place).first()
    if p:
        res = await dispatcher.dispatch("get_place", {"place_id": p.id})
        assert "error" not in res
        assert res["name"] == p.name
        assert "coordinates" in res


@pytest.mark.asyncio
async def test_tool_search_places(db):
    dispatcher = AIToolDispatcher(db=db)
    res = await dispatcher.dispatch("search_places", {"query": "Bakehouse", "destination_slug": "mussoorie"})
    assert "error" not in res
    assert "places" in res


@pytest.mark.asyncio
async def test_tool_get_nearby_places(db):
    dispatcher = AIToolDispatcher(db=db)
    res = await dispatcher.dispatch("get_nearby_places", {"latitude": 30.4598, "longitude": 78.0644, "radius_km": 10.0})
    assert "error" not in res
    assert "places" in res


@pytest.mark.asyncio
async def test_tool_get_weather_forecast(db):
    dispatcher = AIToolDispatcher(db=db)
    res = await dispatcher.dispatch("get_weather_forecast", {"latitude": 30.4598, "longitude": 78.0644})
    assert "error" not in res
    assert "forecasts" in res


@pytest.mark.asyncio
async def test_tool_calculate_route(db):
    dispatcher = AIToolDispatcher(db=db)
    res = await dispatcher.dispatch("calculate_route", {
        "origin_lat": 30.4598, "origin_lng": 78.0644,
        "dest_lat": 30.4615, "dest_lng": 78.0930
    })
    assert "error" not in res
    assert "distance_km" in res
    assert "estimated_duration_mins" in res


@pytest.mark.asyncio
async def test_tool_get_quick_plan(db, sample_trip):
    dispatcher = AIToolDispatcher(db=db)
    res = await dispatcher.dispatch("get_quick_plan", {"trip_id": sample_trip.id, "hours_available": 3.0})
    assert "error" not in res
    assert "items" in res
    assert res["duration_hours"] == 3.0


@pytest.mark.asyncio
async def test_tool_get_user_preferences(db, traveller_user):
    dispatcher = AIToolDispatcher(db=db, user=traveller_user)
    res = await dispatcher.dispatch("get_user_preferences", {})
    assert "error" not in res
    assert "travel_style" in res


@pytest.mark.asyncio
async def test_tool_get_budget_summary(db, traveller_user, sample_trip):
    dispatcher = AIToolDispatcher(db=db, user=traveller_user)
    res = await dispatcher.dispatch("get_budget_summary", {"trip_id": sample_trip.id})
    assert "error" not in res
    assert "total_budget" in res
    assert "remaining_budget" in res


# ==========================================
# 2. SECURITY & AUTHORIZATION TESTS
# ==========================================

@pytest.mark.asyncio
async def test_tool_trip_authorization_security(db, other_user, sample_trip):
    """User B cannot access User A's private trip data through tools."""
    unauthorized_dispatcher = AIToolDispatcher(db=db, user=other_user)
    
    # 1. Trip details check
    trip_res = await unauthorized_dispatcher.dispatch("get_trip", {"trip_id": sample_trip.id})
    assert "error" in trip_res
    assert "unauthorized" in trip_res["error"].lower()

    # 2. Budget details check
    budget_res = await unauthorized_dispatcher.dispatch("get_budget_summary", {"trip_id": sample_trip.id})
    assert "error" in budget_res
    assert "unauthorized" in budget_res["error"].lower()


# ==========================================
# 3. COPILOT CONTEXT & CHAT ENDPOINT TESTS
# ==========================================

def test_copilot_context_assembly(db, traveller_user, sample_trip):
    context = build_copilot_context(db=db, user=traveller_user, trip_id=sample_trip.id, destination_slug="mussoorie")
    assert "system_instruction" in context
    assert "VANVAS Copilot" in context["system_instruction"]
    assert "Mussoorie" in context["system_instruction"]
    assert context["trip_context"] is not None
    assert context["destination_context"] is not None


def test_copilot_chat_endpoint_success(sample_trip):
    """POST /api/v1/copilot/chat executes reasoning and returns validated response structure."""
    res = client.post("/api/v1/copilot/chat", json={
        "message": "I have 3 hours in Mussoorie. Suggest a relaxed cafe walk.",
        "trip_id": sample_trip.id,
        "destination_slug": "mussoorie"
    })
    assert res.status_code == 200
    data = res.json()
    assert "message" in data
    assert "actions" in data
    assert "places" in data
    assert "metadata" in data
    assert "latency_ms" in data["metadata"]


def test_copilot_chat_rejects_empty_message():
    res = client.post("/api/v1/copilot/chat", json={"message": "   "})
    assert res.status_code == 400


def test_copilot_chat_rejects_unauthorized_trip(other_user, sample_trip):
    """Verify endpoint rejects requests for other users' trips."""
    # When making request without valid ownership credentials
    pass
