"""
VANVAS Phase 2B: Ask VANVAS Mobile Failure Recovery Integration Tests
Verifies:
1. "I'm planning a trip" deterministic fast-path without AI provider roundtrip.
2. Preservation of destination context when provided in query or request.
3. Fallback to /plan destination selection step when destination is missing.
4. Unauthenticated guest trip query rejection (401).
5. Open-ended conversational queries requiring authentication produce clean 401.
6. Authenticated open-ended queries correctly invoking AI reasoning.
7. AI provider failure gracefully providing recovery actions to the planner.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Destination, Trip
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(db):
    user = db.query(User).filter(User.email == "traveller_phase2b@vanvas.com").first()
    if not user:
        user = User(
            id="usr-phase2b-test",
            email="traveller_phase2b@vanvas.com",
            hashed_password=get_password_hash("Pass123!"),
            full_name="Phase 2B Explorer",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def ensure_destination(db):
    dest = db.query(Destination).filter(Destination.slug == "manali").first()
    if not dest:
        dest = Destination(
            id="dest-manali",
            name="Manali",
            slug="manali",
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="Pine-scented mountain air",
            description="Beas River valley sanctuary.",
            latitude=32.2396,
            longitude=77.1887,
            is_featured=True,
            is_curated=True,
        )
        db.add(dest)
        db.commit()
    return dest


def test_plan_trip_fast_path_without_destination():
    """'I'm planning a trip' without destination returns 200 with /plan action without requiring auth."""
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "I'm planning a trip"}
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "actions" in data and len(data["actions"]) >= 1
    action = data["actions"][0]
    assert action["action_type"] == "navigate_planner"
    assert action["payload"]["url"] == "/plan"
    assert data["metadata"]["provider"] == "vanvas_fast_path"
    assert data["metadata"]["intent"] == "plan_trip"


def test_plan_trip_fast_path_with_explicit_destination(ensure_destination):
    """'I'm planning a trip to Manali' retains destination and builds planner URL."""
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "I'm planning a trip to Manali"}
    )
    assert res.status_code == 200, res.text
    data = res.json()
    action = data["actions"][0]
    assert action["action_type"] == "navigate_planner"
    assert "dest=manali" in action["payload"]["url"]
    assert action["payload"]["destination"] == "manali"
    assert action["payload"]["destination_name"] == "Manali"


def test_plan_trip_fast_path_with_request_destination(ensure_destination):
    """Request with destination_slug parameter preserves destination."""
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "Plan a trip", "destination_slug": "manali"}
    )
    assert res.status_code == 200, res.text
    data = res.json()
    action = data["actions"][0]
    assert action["action_type"] == "navigate_planner"
    assert "dest=manali" in action["payload"]["url"]


def test_plan_trip_intent_variations():
    """Variations of trip planning prompts all hit the dependable fast-path."""
    variations = [
        "plan a trip",
        "plan my trip",
        "planning a trip",
        "start planning",
        "plan an expedition",
        "i want to plan a trip",
        "i'm travelling",
        "im traveling",
    ]
    for prompt in variations:
        res = client.post(
            "/api/v1/copilot/chat",
            json={"message": prompt}
        )
        assert res.status_code == 200, f"Failed for prompt: {prompt}"
        assert res.json()["actions"][0]["action_type"] == "navigate_planner"


def test_unauthenticated_trip_access_rejected():
    """Attempting to access a trip without authentication returns 401."""
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "What is next?", "trip_id": "nonexistent-trip-id"}
    )
    assert res.status_code == 401


def test_unauthenticated_open_ended_question_requires_auth():
    """Open-ended questions without auth return 401 so frontend shows sign-in state."""
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "What should I pack for high altitude trek?"}
    )
    assert res.status_code == 401
    assert "Authentication required" in res.json().get("detail", "")


@patch("app.providers.ai.gemini_provider.GeminiProvider.chat_with_tools", new_callable=AsyncMock)
def test_authenticated_open_ended_question_routes_to_ai(mock_ai, auth_headers):
    """Authenticated user asking open-ended questions routes through AI provider."""
    mock_ai.return_value = {
        "text": "For high altitude treks, pack thermal layers, windproof shell, and sturdy boots.",
        "tool_calls": [],
        "usage": {"latency_ms": 25.0}
    }
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "What should I pack for high altitude trek?"},
        headers=auth_headers
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "thermal layers" in data["message"].lower()


@patch("app.providers.ai.gemini_provider.GeminiProvider.chat_with_tools", new_callable=AsyncMock)
def test_ai_reasoning_failure_provides_recovery_action(mock_ai, auth_headers):
    """If AI reasoning raises an exception, response includes navigate_planner recovery."""
    mock_ai.side_effect = Exception("Simulated Gemini quota limit exceeded")
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "Tell me a secret valley in Himachal"},
        headers=auth_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "temporarily unavailable" in data["message"].lower()
    assert any(a.get("action_type") == "navigate_planner" for a in data.get("actions", []))
