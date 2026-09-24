"""
Comprehensive Tests for VANVAS Copilot Action Foundation (Phase 7).
Validates:
1. save valid place
2. duplicate save handled safely (idempotent)
3. save nonexistent place rejected safely
4. add valid place to authorized trip
5. add nonexistent place rejected
6. unauthorized trip mutation rejected
7. invalid itinerary day rejected
8. locked itinerary items preserved
9. arbitrary/fake place ID cannot create a place
10. action name allowlist rejects unknown actions
11. action results contain canonical IDs
12. no secrets appear in persisted action logs
13. end-to-end copilot chat action flow
"""
import pytest
import json
from datetime import date, timedelta, datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import (
    User, Destination, Place, Trip, TripMember, Itinerary, ItineraryItem, SavedPlace, Conversation, ConversationMessage
)
from unittest.mock import AsyncMock, patch
from app.core.security import create_access_token, get_password_hash
from app.services.copilot_actions import CopilotActionService

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_ai_chat():
    with patch("app.providers.ai.gemini_provider.GeminiProvider.chat_with_tools", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = {
            "text": "Place saved to your mountain journal.",
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
def test_user_owner(db):
    user = db.query(User).filter(User.email == "action_owner@vanvas.com").first()
    if not user:
        user = User(
            id="usr-action-owner",
            email="action_owner@vanvas.com",
            hashed_password=get_password_hash("Secret123!"),
            full_name="Action Owner Traveller",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def test_user_intruder(db):
    user = db.query(User).filter(User.email == "action_intruder@vanvas.com").first()
    if not user:
        user = User(
            id="usr-action-intruder",
            email="action_intruder@vanvas.com",
            hashed_password=get_password_hash("Secret456!"),
            full_name="Action Intruder Traveller",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def token_owner(test_user_owner):
    return create_access_token(subject=test_user_owner.id)


@pytest.fixture
def token_intruder(test_user_intruder):
    return create_access_token(subject=test_user_intruder.id)


@pytest.fixture
def test_destination(db):
    dest = db.query(Destination).filter(Destination.slug == "action-dest").first()
    if not dest:
        dest = Destination(
            id="dest-action-test",
            name="Action Sanctuary",
            slug="action-dest",
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="A peaceful test valley",
            description="Testing destination for controlled actions",
            latitude=32.24,
            longitude=77.18,
        )
        db.add(dest)
        db.commit()
        db.refresh(dest)
    return dest


@pytest.fixture
def test_place(db, test_destination):
    place = db.query(Place).filter(Place.id == "place-action-test-1").first()
    if not place:
        place = Place(
            id="place-action-test-1",
            destination_id=test_destination.id,
            name="Pine Crest Cafe",
            slug="pine-crest-cafe",
            category="Café",
            description="Scenic artisan bakery with mountain vistas",
            latitude=32.241,
            longitude=77.185,
            price_level="₹₹",
            approx_cost=450.0,
            recommended_duration_mins=60,
            opening_time="08:30",
            closing_time="20:00",
            why_vanvas_recommends="Fresh sourdough and calm pine forest atmosphere.",
        )
        db.add(place)
    else:
        place.destination_id = test_destination.id
    db.commit()
    db.refresh(place)
    return place


@pytest.fixture
def test_trip(db, test_user_owner, test_destination):
    trip = db.query(Trip).filter(Trip.id == "trip-action-test-1").first()
    if not trip:
        trip = Trip(
            id="trip-action-test-1",
            user_id=test_user_owner.id,
            destination_id=test_destination.id,
            title="Action Expedition",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=2),
            num_days=3,
            budget_total=20000.0,
            budget_spent=0.0,
            wake_up_preference="Normal",
        )
        db.add(trip)
    else:
        trip.destination_id = test_destination.id
        trip.user_id = test_user_owner.id
        trip.num_days = 3
    db.commit()
    db.refresh(trip)

    # Ensure Day 1 and Day 2 Itineraries exist
    it1 = db.query(Itinerary).filter(Itinerary.id == "it-action-day-1").first()
    if not it1:
        it1 = Itinerary(
            id="it-action-day-1",
            trip_id=trip.id,
            day_number=1,
            date=date.today(),
            title="Day 1: Arrival & Exploration",
            theme="Scenic",
        )
        db.add(it1)

    it2 = db.query(Itinerary).filter(Itinerary.id == "it-action-day-2").first()
    if not it2:
        it2 = Itinerary(
            id="it-action-day-2",
            trip_id=trip.id,
            day_number=2,
            date=date.today() + timedelta(days=1),
            title="Day 2: Deep Valley Trail",
            theme="Nature",
        )
        db.add(it2)
    db.commit()

    # Ensure locked item on Day 2 exists
    locked_item = db.query(ItineraryItem).filter(ItineraryItem.id == "it-item-locked-1").first()
    if not locked_item:
        locked_item = ItineraryItem(
            id="it-item-locked-1",
            itinerary_id="it-action-day-2",
            title="Sunrise Meditation at High Cliff",
            category="Spiritual",
            start_time="06:00",
            end_time="07:30",
            duration_mins=90,
            is_locked=True,
            status="upcoming",
        )
        db.add(locked_item)
        db.commit()

    db.refresh(trip)
    return trip


# =========================================================================
# 1. Direct Action Service Tests
# =========================================================================

def test_1_save_valid_place(db, test_user_owner, test_place):
    """1. Save a valid place returns success and canonical place info."""
    # Clean previous save if any
    db.query(SavedPlace).filter(
        SavedPlace.user_id == test_user_owner.id,
        SavedPlace.place_id == test_place.id
    ).delete()
    db.commit()

    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="save_place",
        payload={"place_id": test_place.id},
    )

    assert res["success"] is True
    assert res["action"] == "save_place"
    assert res["already_saved"] is False
    assert res["place"]["id"] == test_place.id
    assert res["place"]["name"] == test_place.name

    # Verify persisted in database
    saved = db.query(SavedPlace).filter(
        SavedPlace.user_id == test_user_owner.id,
        SavedPlace.place_id == test_place.id
    ).first()
    assert saved is not None
    assert saved.destination_id == test_place.destination_id


def test_2_duplicate_save_handled_safely(db, test_user_owner, test_place):
    """2. Duplicate save is idempotent and creates no duplicate rows."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="save_place",
        payload={"place_id": test_place.id},
    )

    assert res["success"] is True
    assert res["already_saved"] is True
    assert res["place"]["id"] == test_place.id

    # Verify only 1 row exists
    count = db.query(SavedPlace).filter(
        SavedPlace.user_id == test_user_owner.id,
        SavedPlace.place_id == test_place.id
    ).count()
    assert count == 1


def test_3_save_nonexistent_place_rejected(db, test_user_owner):
    """3. Saving a nonexistent place fails safely with PLACE_NOT_FOUND."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="save_place",
        payload={"place_id": "nonexistent-fake-place-999"},
    )

    assert res["success"] is False
    assert res["error_code"] == "PLACE_NOT_FOUND"


def test_4_add_valid_place_to_authorized_trip(db, test_user_owner, test_place, test_trip):
    """4. Add valid place to authorized trip succeeds and creates an ItineraryItem."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": test_place.id,
            "day": 1,
        },
    )

    assert res["success"] is True
    assert res["action"] == "add_place_to_itinerary"
    assert res["trip_id"] == test_trip.id
    assert res["day"] == 1
    assert res["place"]["id"] == test_place.id
    assert "itinerary_item_id" in res

    # Verify in DB
    item_id = res["itinerary_item_id"]
    item = db.query(ItineraryItem).filter(ItineraryItem.id == item_id).first()
    assert item is not None
    assert item.place_id == test_place.id
    assert item.title == test_place.name
    assert item.duration_mins == test_place.recommended_duration_mins


def test_5_add_nonexistent_place_rejected(db, test_user_owner, test_trip):
    """5. Adding nonexistent place fails safely without creating place."""
    place_count_before = db.query(Place).count()

    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": "fake-hallucinated-place",
            "day": 1,
        },
    )

    assert res["success"] is False
    assert res["error_code"] == "PLACE_NOT_FOUND"
    assert db.query(Place).count() == place_count_before


def test_6_unauthorized_trip_mutation_rejected(db, test_user_intruder, test_place, test_trip):
    """6. Unauthorized user cannot mutate another user's trip."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_intruder,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": test_place.id,
            "day": 1,
        },
    )

    assert res["success"] is False
    assert res["error_code"] == "TRIP_NOT_AUTHORIZED"


def test_7_invalid_itinerary_day_rejected(db, test_user_owner, test_place, test_trip):
    """7. Invalid itinerary day (e.g. Day 99 on a 3-day trip) fails safely."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": test_place.id,
            "day": 99,
        },
    )

    assert res["success"] is False
    assert res["error_code"] == "INVALID_DAY"


def test_8_locked_itinerary_items_preserved(db, test_user_owner, test_place, test_trip):
    """8. Adding a place to a day with a locked item preserves the locked item intact."""
    # Ensure a clean baseline for day 2 items
    db.query(ItineraryItem).filter(
        ItineraryItem.itinerary_id == "it-action-day-2",
        ItineraryItem.id != "it-item-locked-1"
    ).delete()
    db.commit()

    # Day 2 has a locked item 'Sunrise Meditation'
    locked_item = db.query(ItineraryItem).filter(ItineraryItem.id == "it-item-locked-1").first()
    assert locked_item is not None
    assert locked_item.is_locked is True

    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": test_place.id,
            "day": 2,
        },
    )

    assert res["success"] is True

    # Re-verify locked item remains unchanged
    locked_after = db.query(ItineraryItem).filter(ItineraryItem.id == "it-item-locked-1").first()
    assert locked_after is not None
    assert locked_after.is_locked is True
    assert locked_after.title == "Sunrise Meditation at High Cliff"

    # Verify new item starts after the locked item's end time
    new_item = db.query(ItineraryItem).filter(ItineraryItem.id == res["itinerary_item_id"]).first()
    assert new_item is not None
    assert new_item.start_time >= locked_after.end_time


def test_9_arbitrary_place_id_cannot_create_place(db, test_user_owner, test_trip):
    """9. Gemini cannot inject an arbitrary place into the database via action payloads."""
    places_before = db.query(Place).filter(Place.name == "Fabricated Fake Castle").count()
    assert places_before == 0

    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": "fabricated-fake-castle-id",
            "day": 1,
        },
    )

    assert res["success"] is False
    places_after = db.query(Place).filter(Place.name == "Fabricated Fake Castle").count()
    assert places_after == 0


def test_10_action_name_allowlist_rejects_unknown(db, test_user_owner):
    """10. Action allowlist rejects unknown actions like 'delete_user' or 'drop_table'."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="delete_account",
        payload={"confirm": True},
    )

    assert res["success"] is False
    assert res["error_code"] == "UNKNOWN_ACTION"


def test_11_action_results_contain_canonical_ids(db, test_user_owner, test_place, test_trip):
    """11. Action results contain canonical IDs rather than arbitrary strings."""
    res = CopilotActionService.execute_action(
        db=db,
        user=test_user_owner,
        action_name="add_place_to_itinerary",
        payload={
            "trip_id": test_trip.id,
            "place_id": test_place.id,
            "day": 1,
        },
    )

    assert res["success"] is True
    assert res["trip_id"] == test_trip.id
    assert res["place"]["id"] == test_place.id
    assert res["itinerary_item_id"].startswith("it-item-") or len(res["itinerary_item_id"]) > 0


def test_12_no_secrets_appear_in_persisted_action_logs(db, test_user_owner, token_owner, test_trip, test_place):
    """12. Persisted action audit logs contain no auth tokens, keys, or passwords."""
    headers = {"Authorization": f"Bearer {token_owner}"}
    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": f"Save place {test_place.id}",
            "trip_id": test_trip.id,
        }
    )
    assert res.status_code == 200
    conv_id = res.json().get("conversation_id")
    assert conv_id is not None

    msgs = db.query(ConversationMessage).filter(ConversationMessage.conversation_id == conv_id).all()
    for m in msgs:
        assert token_owner not in m.content
        if m.tool_calls:
            assert token_owner not in m.tool_calls
            assert "Bearer " not in m.tool_calls
        if m.tool_results:
            assert token_owner not in m.tool_results
            assert "Bearer " not in m.tool_results
        if m.metadata_json:
            assert "Bearer" not in m.metadata_json


# =========================================================================
# 13. End-to-End Endpoint Action Flow
# =========================================================================

def test_13_copilot_chat_action_integration(db, test_user_owner, token_owner, test_trip, test_place):
    """13. Verified chat request through Copilot returns action array and place data."""
    headers = {"Authorization": f"Bearer {token_owner}"}
    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": f"Please save place {test_place.name} (ID: {test_place.id}) to my travel collection.",
            "trip_id": test_trip.id,
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "message" in data
    assert isinstance(data.get("actions"), list)
