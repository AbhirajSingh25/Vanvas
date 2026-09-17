"""
Tests for Conversation and ConversationMessage persistence models (Phase 6.9.2).
Validates model creation, relationships, cascade deletion, user-isolation readiness,
and SQLite table initialization.
"""
import pytest
from datetime import date, datetime, timezone
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError

from app.database.session import Base
from app.models.models import (
    User, Destination, Trip, Conversation, ConversationMessage
)
from app.core.security import get_password_hash


@pytest.fixture
def db_session():
    """Create a fresh isolated in-memory SQLite database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def sample_user(db_session):
    user = User(
        email="pahadi_traveller@vanvas.com",
        hashed_password=get_password_hash("MountainSecret123"),
        full_name="Vikram Sharma",
        role="traveller",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_destination(db_session):
    dest = Destination(
        name="Mussoorie",
        slug="mussoorie",
        state="Uttarakhand",
        region="Garhwal Himalayas",
        tagline="Queen of the Hills",
        description="Mist-covered ridge in the Garhwal hills.",
        latitude=30.4598,
        longitude=78.0644,
        altitude_meters=2005,
    )
    db_session.add(dest)
    db_session.commit()
    db_session.refresh(dest)
    return dest


@pytest.fixture
def sample_trip(db_session, sample_user, sample_destination):
    trip = Trip(
        user_id=sample_user.id,
        destination_id=sample_destination.id,
        title="Mussoorie Monsoons & Cafes",
        start_date=date(2026, 9, 20),
        end_date=date(2026, 9, 23),
        num_days=3,
        budget_total=12000.0,
        travel_style="Balanced",
    )
    db_session.add(trip)
    db_session.commit()
    db_session.refresh(trip)
    return trip


# =========================================================================
# A. Conversation Creation Tests
# =========================================================================

def test_create_conversation_valid_user_without_trip(db_session, sample_user):
    """Conversation can be created for a user without being tied to a specific trip."""
    conv = Conversation(
        user_id=sample_user.id,
        destination_slug="manali",
        title="Spontaneous Manali Queries",
        summary="User inquired about Old Manali bakeries and weather.",
        context_state='{"pace": "relaxed", "focus": ["cafes", "bakeries"]}',
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    assert conv.id is not None
    assert len(conv.id) == 36
    assert conv.user_id == sample_user.id
    assert conv.trip_id is None
    assert conv.destination_slug == "manali"
    assert conv.title == "Spontaneous Manali Queries"
    assert "relaxed" in conv.context_state
    assert conv.created_at is not None
    assert conv.updated_at is not None


def test_create_conversation_with_trip(db_session, sample_user, sample_trip):
    """Conversation can be linked to an active trip."""
    conv = Conversation(
        user_id=sample_user.id,
        trip_id=sample_trip.id,
        destination_slug="mussoorie",
        title="Mussoorie Itinerary Refinement",
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    assert conv.id is not None
    assert conv.trip_id == sample_trip.id
    assert conv.destination_slug == "mussoorie"


# =========================================================================
# B. ConversationMessage Creation Tests
# =========================================================================

def test_create_conversation_messages_multi_role(db_session, sample_user):
    """Conversation messages support user, assistant, system, and tool roles with metadata."""
    conv = Conversation(
        user_id=sample_user.id,
        destination_slug="rishikesh",
        title="Rishikesh River Meditation",
    )
    db_session.add(conv)
    db_session.commit()

    # User message
    msg_user = ConversationMessage(
        conversation_id=conv.id,
        role="user",
        content="Recommend quiet riverside cafes near Laxman Jhula.",
    )
    db_session.add(msg_user)

    # Tool execution message
    msg_tool = ConversationMessage(
        conversation_id=conv.id,
        role="tool",
        content='{"places_found": 3}',
        tool_calls='[{"name": "search_places", "args": {"query": "riverside cafe", "destination_slug": "rishikesh"}}]',
        tool_results='[{"place_id": "rishikesh_little_buddha", "name": "Little Buddha Cafe"}]',
    )
    db_session.add(msg_tool)

    # Assistant message
    msg_assistant = ConversationMessage(
        conversation_id=conv.id,
        role="assistant",
        content="Here are 3 peaceful riverside cafes including Little Buddha Cafe overlooking the Ganges.",
        metadata_json='{"model": "gemini-3.5-flash-lite", "latency_ms": 520.4}',
    )
    db_session.add(msg_assistant)
    db_session.commit()

    db_session.refresh(conv)
    assert len(conv.messages) == 3
    roles = [m.role for m in conv.messages]
    assert roles == ["user", "tool", "assistant"]
    assert conv.messages[1].tool_calls is not None
    assert "Little Buddha" in conv.messages[1].tool_results
    assert "gemini-3.5-flash-lite" in conv.messages[2].metadata_json


# =========================================================================
# C. Relationships Tests
# =========================================================================

def test_relationships_user_trip_conversation_messages(db_session, sample_user, sample_trip):
    """Verifies bidirectional relationships between User, Trip, Conversation, and Messages."""
    conv = Conversation(
        user_id=sample_user.id,
        trip_id=sample_trip.id,
        destination_slug="mussoorie",
        title="Active Trip Planning Session",
    )
    db_session.add(conv)
    db_session.commit()

    msg = ConversationMessage(
        conversation_id=conv.id,
        role="user",
        content="How far is Landour Bakehouse from Mall Road?",
    )
    db_session.add(msg)
    db_session.commit()

    # Query from User side
    db_session.refresh(sample_user)
    assert len(sample_user.conversations) == 1
    assert sample_user.conversations[0].id == conv.id

    # Query from Trip side
    db_session.refresh(sample_trip)
    assert len(sample_trip.conversations) == 1
    assert sample_trip.conversations[0].id == conv.id

    # Query from Message side back to Conversation
    db_session.refresh(msg)
    assert msg.conversation.id == conv.id
    assert msg.conversation.user.id == sample_user.id
    assert msg.conversation.trip.id == sample_trip.id


# =========================================================================
# D. Cascade Deletion Behavior Tests
# =========================================================================

def test_cascade_delete_conversation_deletes_messages(db_session, sample_user):
    """Deleting a conversation must automatically delete all its associated messages."""
    conv = Conversation(
        user_id=sample_user.id,
        title="Temporary Session",
    )
    db_session.add(conv)
    db_session.commit()

    msg1 = ConversationMessage(conversation_id=conv.id, role="user", content="Hello")
    msg2 = ConversationMessage(conversation_id=conv.id, role="assistant", content="Namaste!")
    db_session.add_all([msg1, msg2])
    db_session.commit()

    conv_id = conv.id
    msg1_id = msg1.id
    msg2_id = msg2.id

    # Delete conversation
    db_session.delete(conv)
    db_session.commit()

    # Verify conversation is gone
    assert db_session.query(Conversation).filter(Conversation.id == conv_id).first() is None
    # Verify messages are cascaded out of existence
    assert db_session.query(ConversationMessage).filter(ConversationMessage.id.in_([msg1_id, msg2_id])).count() == 0


def test_cascade_delete_user_deletes_conversations(db_session, sample_user):
    """Deleting a user must cascade and delete all conversations and messages owned by that user."""
    conv = Conversation(
        user_id=sample_user.id,
        title="User Session",
    )
    db_session.add(conv)
    db_session.commit()

    msg = ConversationMessage(conversation_id=conv.id, role="user", content="Test prompt")
    db_session.add(msg)
    db_session.commit()

    conv_id = conv.id
    msg_id = msg.id

    # Delete user
    db_session.delete(sample_user)
    db_session.commit()

    assert db_session.query(Conversation).filter(Conversation.id == conv_id).first() is None
    assert db_session.query(ConversationMessage).filter(ConversationMessage.id == msg_id).first() is None


# =========================================================================
# E. Isolation-Ready & Ownership Safety Tests
# =========================================================================

def test_trip_deletion_preserves_user_conversation(db_session, sample_user, sample_trip):
    """Deleting a trip must NOT delete the user's conversation history; it only unlinks the trip association."""
    conv = Conversation(
        user_id=sample_user.id,
        trip_id=sample_trip.id,
        title="Trip Specific Chat",
    )
    db_session.add(conv)
    db_session.commit()

    msg = ConversationMessage(
        conversation_id=conv.id,
        role="user",
        content="Keep my notes safe even if trip is removed",
    )
    db_session.add(msg)
    db_session.commit()

    conv_id = conv.id
    msg_id = msg.id

    # Delete the trip
    db_session.delete(sample_trip)
    db_session.commit()

    # The user's conversation and messages must remain alive
    persisted_conv = db_session.query(Conversation).filter(Conversation.id == conv_id).first()
    assert persisted_conv is not None
    assert persisted_conv.user_id == sample_user.id
    # Messages are preserved
    persisted_msg = db_session.query(ConversationMessage).filter(ConversationMessage.id == msg_id).first()
    assert persisted_msg is not None


def test_conversation_user_isolation(db_session, sample_user):
    """A conversation belonging to User A cannot become implicitly owned by User B."""
    user_b = User(
        email="second_traveller@vanvas.com",
        hashed_password=get_password_hash("MountainSecret456"),
        full_name="Ananya Verma",
        role="traveller",
    )
    db_session.add(user_b)
    db_session.commit()

    conv_a = Conversation(user_id=sample_user.id, title="User A Private Planning")
    conv_b = Conversation(user_id=user_b.id, title="User B Private Planning")
    db_session.add_all([conv_a, conv_b])
    db_session.commit()

    db_session.refresh(sample_user)
    db_session.refresh(user_b)

    assert conv_a in sample_user.conversations
    assert conv_a not in user_b.conversations
    assert conv_b in user_b.conversations
    assert conv_b not in sample_user.conversations


def test_conversation_user_id_is_mandatory(db_session):
    """A conversation without a user_id must fail database integrity constraints."""
    conv = Conversation(
        user_id=None,  # Forbidden
        title="Orphaned Conversation",
    )
    db_session.add(conv)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_conversation_message_requires_valid_conversation(db_session):
    """A conversation message cannot exist without a valid conversation_id."""
    msg = ConversationMessage(
        conversation_id=None,  # Forbidden
        role="user",
        content="Invalid message without parent session",
    )
    db_session.add(msg)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


# =========================================================================
# F. Fresh SQLite Table Creation Test
# =========================================================================

def test_fresh_sqlite_table_initialization():
    """Verifies that Base.metadata.create_all creates the conversations and conversation_messages tables."""
    fresh_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=fresh_engine)

    inspector = inspect(fresh_engine)
    table_names = inspector.get_table_names()

    assert "conversations" in table_names
    assert "conversation_messages" in table_names

    conv_cols = {c["name"] for c in inspector.get_columns("conversations")}
    expected_conv_cols = {
        "id", "user_id", "trip_id", "destination_slug",
        "title", "summary", "context_state", "created_at", "updated_at"
    }
    assert expected_conv_cols.issubset(conv_cols)

    msg_cols = {c["name"] for c in inspector.get_columns("conversation_messages")}
    expected_msg_cols = {
        "id", "conversation_id", "role", "content",
        "tool_calls", "tool_results", "metadata_json", "created_at"
    }
    assert expected_msg_cols.issubset(msg_cols)
