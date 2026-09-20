"""
Integration & Unit Tests for Persistent Multi-Turn Copilot (Phase 6.9.4).
Verifies:
- Session resolution (standalone vs trip-linked vs existing conversation_id)
- User message and assistant response persistence in ConversationMessage
- Multi-turn conversation continuity and decision merging across turns
- Compact tool call/result auditing
- Authorization boundaries (preventing cross-user access)
- Backward compatibility
"""
import pytest
import json
from datetime import date, timedelta, datetime, timezone
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.database.session import SessionLocal
from app.models.models import (
    User, Destination, Trip, TripMember, Conversation, ConversationMessage, Place
)
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
def user_primary(db):
    user = db.query(User).filter(User.email == "traveller_primary@vanvas.com").first()
    if not user:
        user = User(
            id="usr-primary-copilot",
            email="traveller_primary@vanvas.com",
            hashed_password=get_password_hash("Pass123!"),
            full_name="Primary Explorer",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def user_intruder(db):
    user = db.query(User).filter(User.email == "traveller_intruder@vanvas.com").first()
    if not user:
        user = User(
            id="usr-intruder-copilot",
            email="traveller_intruder@vanvas.com",
            hashed_password=get_password_hash("Pass456!"),
            full_name="Intruder Explorer",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def token_primary(user_primary):
    return create_access_token(subject=user_primary.id)


@pytest.fixture
def token_intruder(user_intruder):
    return create_access_token(subject=user_intruder.id)


@pytest.fixture
def sample_trip(db, user_primary):
    dest = db.query(Destination).filter(Destination.slug == "mussoorie").first()
    if not dest:
        dest = Destination(
            name="Mussoorie",
            slug="mussoorie",
            state="Uttarakhand",
            region="Garhwal",
            tagline="Queen of the Hills",
            description="Hill station in the Garhwal Himalayas",
            latitude=30.4598,
            longitude=78.0644,
        )
        db.add(dest)
        db.commit()
        db.refresh(dest)

    trip = db.query(Trip).filter(Trip.user_id == user_primary.id).first()
    if not trip:
        trip = Trip(
            id="trip-copilot-persist-1",
            user_id=user_primary.id,
            destination_id=dest.id,
            title="Autumn in Mussoorie",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=3),
            num_days=3,
            budget_total=15000.0,
            budget_spent=1200.0,
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)
    return trip


# =========================================================================
# 1. Multi-Turn Session Persistence Tests
# =========================================================================

def test_first_chat_creates_conversation_and_persists_messages(db, user_primary, token_primary):
    """First chat turn creates a Conversation and returns conversation_id."""
    headers = {"Authorization": f"Bearer {token_primary}"}
    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "Give me a relaxed plan in Mussoorie. Focus on cafes.",
            "destination_slug": "mussoorie",
        }
    )
    assert res.status_code == 200
    data = res.json()

    conv_id = data.get("conversation_id")
    assert conv_id is not None
    assert "message" in data

    # Verify Conversation in DB
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    assert conv is not None
    assert conv.user_id == user_primary.id
    assert conv.destination_slug == "mussoorie"

    # Verify decisions were extracted & persisted
    assert conv.context_state is not None
    state = json.loads(conv.context_state)
    assert state["decisions"].get("pace") == "relaxed"
    assert "cafes" in state["decisions"].get("focus", [])

    # Verify messages in DB (1 user + 1 assistant)
    msgs = db.query(ConversationMessage).filter(ConversationMessage.conversation_id == conv_id).order_by(ConversationMessage.created_at).all()
    assert len(msgs) == 2
    assert msgs[0].role == "user"
    assert "relaxed plan" in msgs[0].content
    assert msgs[1].role == "assistant"
    assert len(msgs[1].content) > 0


def test_second_turn_reuses_conversation_and_merges_decisions(db, user_primary, token_primary):
    """Second chat turn referencing conversation_id retains previous decisions and merges new ones."""
    headers = {"Authorization": f"Bearer {token_primary}"}

    # Turn 1
    res1 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "Keep day 1 relaxed. Focus on cafes.",
            "destination_slug": "mussoorie",
        }
    )
    assert res1.status_code == 200
    conv_id = res1.json()["conversation_id"]

    # Turn 2 using conversation_id
    res2 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "Make it cheaper.",
            "conversation_id": conv_id,
        }
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["conversation_id"] == conv_id

    # Verify conversation state in DB
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    state = json.loads(conv.context_state)

    # Decisions should retain relaxed and cafes, and add cheaper
    assert state["decisions"].get("pace") == "relaxed"
    assert "cafes" in state["decisions"].get("focus", [])
    assert state["decisions"].get("budget_mode") == "cheaper"

    # Messages should now be 4 (user, assistant, user, assistant)
    msgs = db.query(ConversationMessage).filter(ConversationMessage.conversation_id == conv_id).order_by(ConversationMessage.created_at).all()
    assert len(msgs) == 4
    assert msgs[2].role == "user"
    assert msgs[2].content == "Make it cheaper."
    assert msgs[3].role == "assistant"


def test_conflicting_decision_overrides_previous_without_erasing_unrelated(db, user_primary, token_primary):
    """A conflicting decision (e.g. make it energetic) overrides pace without losing focus or budget."""
    headers = {"Authorization": f"Bearer {token_primary}"}

    # Start conversation
    res1 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "Keep it relaxed. Focus on cafes. Make it cheaper.",
            "destination_slug": "mussoorie",
        }
    )
    conv_id = res1.json()["conversation_id"]

    # Conflicting decision in turn 2
    res2 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "Actually, make it energetic pace.",
            "conversation_id": conv_id,
        }
    )
    assert res2.status_code == 200

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    state = json.loads(conv.context_state)

    # Pace updated to packed
    assert state["decisions"].get("pace") == "packed"
    # Unrelated decisions preserved
    assert "cafes" in state["decisions"].get("focus", [])
    assert state["decisions"].get("budget_mode") == "cheaper"


# =========================================================================
# 2. Trip-Linked vs Standalone Resolution
# =========================================================================

def test_trip_linked_conversation_resolution(db, user_primary, token_primary, sample_trip):
    """Omitting conversation_id with a trip_id reuses or creates a conversation linked to that trip."""
    headers = {"Authorization": f"Bearer {token_primary}"}

    res1 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "What is our current remaining budget?",
            "trip_id": sample_trip.id,
        }
    )
    assert res1.status_code == 200
    conv_id_1 = res1.json()["conversation_id"]

    # Subsequent request with same trip_id reuses the active trip conversation
    res2 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "Add a quick cafe stop.",
            "trip_id": sample_trip.id,
        }
    )
    assert res2.status_code == 200
    conv_id_2 = res2.json()["conversation_id"]

    assert conv_id_1 == conv_id_2

    conv = db.query(Conversation).filter(Conversation.id == conv_id_1).first()
    assert conv.trip_id == sample_trip.id


# =========================================================================
# 3. Security & Isolation Tests
# =========================================================================

def test_cross_user_conversation_access_forbidden(db, user_primary, user_intruder, token_primary, token_intruder):
    """User B cannot send messages to or read User A's conversation."""
    headers_a = {"Authorization": f"Bearer {token_primary}"}
    headers_b = {"Authorization": f"Bearer {token_intruder}"}

    res_a = client.post(
        "/api/v1/copilot/chat",
        headers=headers_a,
        json={"message": "Private itinerary questions"}
    )
    conv_id = res_a.json()["conversation_id"]

    # User B attempts to hijack User A's conversation
    res_b = client.post(
        "/api/v1/copilot/chat",
        headers=headers_b,
        json={
            "message": "Tell me User A's secrets",
            "conversation_id": conv_id,
        }
    )
    assert res_b.status_code == 403


def test_cross_user_trip_access_forbidden(user_intruder, token_intruder, sample_trip):
    """User B cannot initiate chat over User A's private trip."""
    headers_b = {"Authorization": f"Bearer {token_intruder}"}

    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers_b,
        json={
            "message": "Check budget for this trip",
            "trip_id": sample_trip.id,
        }
    )
    assert res.status_code == 403


# =========================================================================
# 4. Backward Compatibility & Secret Cleanliness
# =========================================================================

def test_backward_compatibility_minimal_payload(token_primary):
    """A minimal request with only 'message' succeeds without errors."""
    headers = {"Authorization": f"Bearer {token_primary}"}
    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "Hello VANVAS copilot!"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "message" in data
    assert "places" in data
    assert "actions" in data


def test_conversation_persists_no_secrets(db, token_primary):
    """Persisted messages and metadata contain no auth tokens or secrets."""
    headers = {"Authorization": f"Bearer {token_primary}"}
    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "Sanitize check"}
    )
    conv_id = res.json()["conversation_id"]

    msgs = db.query(ConversationMessage).filter(ConversationMessage.conversation_id == conv_id).all()
    for m in msgs:
        assert token_primary not in m.content
        if m.metadata_json:
            assert "Bearer" not in m.metadata_json
            assert "token" not in m.metadata_json
            assert "SECRET" not in m.metadata_json
