import pytest
from datetime import date, timedelta, datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.session import Base, get_db
from app.models.models import (
    User, Destination, Trip, Place,
    SoloTravelerProfile, SoloTripIntent, SoloMatch,
    TravelCircle, CircleMember, CircleMessage, CircleActivity, CircleActivityVote,
    TravelerBlock, TravelerReport, UserNotification
)
from app.core.security import get_password_hash, create_access_token
from app.services.solo_matching_service import SoloMatchingService
from app.main import app

# In-memory test SQLite engine with StaticPool
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_test_user(db, email, name, role="traveller"):
    user = User(
        email=email,
        full_name=name,
        hashed_password=get_password_hash("password123"),
        role=role,
        avatar_preset="himalayan-explorer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(user):
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


def create_test_destination(db, name="Kasol", slug="kasol"):
    dest = Destination(
        name=name,
        slug=slug,
        state="Himachal Pradesh",
        region="Himalayan",
        tagline="Riverside mountain sanctuary",
        description="Parvati valley wonderland",
        latitude=32.0100,
        longitude=77.3150
    )
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


# ----------------------------------------------------
# TEST SUITE: SOLO TRAVELER CIRCLES
# ----------------------------------------------------

def test_create_and_update_solo_profile(client, db_session):
    u1 = create_test_user(db_session, "aarav@vanvas.app", "Aarav Sharma")
    headers = auth_header(u1)

    # 1. Get initial profile (auto-created)
    res = client.get("/api/v1/solo/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["travel_mode"] == "SOLO"
    assert data["is_enabled"] is True

    # 2. Update profile
    update_payload = {
        "travel_mode": "SOLO",
        "is_enabled": True,
        "discover_before_trip": True,
        "discover_when_here": True,
        "preferred_group_size": 4,
        "interests": "Trekking,Cafés,Riverside Photography",
        "travel_style": "Adventure",
        "trek_pace": "Moderate",
        "bio": "Exploring Parvati valley and serene high altitude passes."
    }
    res2 = client.put("/api/v1/solo/profile", json=update_payload, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["travel_style"] == "Adventure"
    assert "Riverside Photography" in data2["interests"]
    assert data2["bio"] == "Exploring Parvati valley and serene high altitude passes."


def test_create_travel_intent_and_listing(client, db_session):
    u1 = create_test_user(db_session, "rohan@vanvas.app", "Rohan Verma")
    dest = create_test_destination(db_session, "Kasol", "kasol")
    headers = auth_header(u1)

    today = date.today()
    intent_payload = {
        "destination_id": dest.id,
        "destination_name": dest.name,
        "trek_slug": "kheerganga",
        "intent_type": "BOTH",
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=4)).isoformat(),
        "arrival_window": "Morning",
        "departure_window": "Evening",
        "interests": "Trekking,Hot Springs",
        "preferred_group_size": 4,
        "travel_style": "Balanced",
        "trek_pace": "Moderate"
    }
    res = client.post("/api/v1/solo/intents", json=intent_payload, headers=headers)
    assert res.status_code == 200
    intent_data = res.json()
    assert intent_data["trek_slug"] == "kheerganga"
    assert intent_data["status"] == "active"

    # List my intents
    res_list = client.get("/api/v1/solo/intents/my", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1


def test_matching_with_date_overlap_and_destination(client, db_session):
    u1 = create_test_user(db_session, "me@vanvas.app", "Current Traveler")
    u2 = create_test_user(db_session, "partner@vanvas.app", "Compatible Traveler")
    dest = create_test_destination(db_session, "Kasol", "kasol")

    today = date.today()
    # Candidate user creates travel intent
    intent_u2 = SoloTripIntent(
        user_id=u2.id,
        destination_id=dest.id,
        destination_name=dest.name,
        intent_type="BOTH",
        start_date=today,
        end_date=today + timedelta(days=5),
        interests="Trekking,Cafés",
        travel_style="Balanced",
        trek_pace="Moderate",
        status="active"
    )
    db_session.add(intent_u2)
    db_session.commit()

    headers = auth_header(u1)
    res = client.get(
        f"/api/v1/solo/discover?destination_id={dest.id}&start_date={today.isoformat()}&end_date={(today + timedelta(days=3)).isoformat()}",
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_matches"] >= 1
    matched = data["travelers"][0]
    assert matched["user_id"] == u2.id
    assert matched["full_name"] == "Compatible Traveler"
    assert matched["overlapping_days"] > 0
    assert "Planning" in matched["proximity_label"]


def test_destination_mismatch_and_no_fake_data(client, db_session):
    u1 = create_test_user(db_session, "me2@vanvas.app", "Traveler 1")
    u2 = create_test_user(db_session, "other@vanvas.app", "Traveler 2")
    dest1 = create_test_destination(db_session, "Manali", "manali")
    dest2 = create_test_destination(db_session, "Goa", "goa")

    today = date.today()
    intent_u2 = SoloTripIntent(
        user_id=u2.id,
        destination_id=dest2.id,  # Goa
        destination_name=dest2.name,
        intent_type="PLANNING",
        start_date=today,
        end_date=today + timedelta(days=5),
        status="active"
    )
    db_session.add(intent_u2)
    db_session.commit()

    headers = auth_header(u1)
    # Searching in Manali should NOT return Goa traveler
    res = client.get(
        f"/api/v1/solo/discover?destination_id={dest1.id}&mode=before_trip",
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_matches"] == 0
    assert len(data["travelers"]) == 0


def test_trek_specific_matching(client, db_session):
    u1 = create_test_user(db_session, "trekker1@vanvas.app", "Tungnath Trekker 1")
    u2 = create_test_user(db_session, "trekker2@vanvas.app", "Tungnath Trekker 2")
    dest = create_test_destination(db_session, "Chopta", "chopta")

    today = date.today()
    intent = SoloTripIntent(
        user_id=u2.id,
        destination_id=dest.id,
        trek_slug="tungnath-chandrashila",
        intent_type="PLANNING",
        start_date=today,
        end_date=today + timedelta(days=3),
        travel_style="Adventure",
        trek_pace="Moderate",
        status="active"
    )
    db_session.add(intent)
    db_session.commit()

    headers = auth_header(u1)
    res = client.get(
        f"/api/v1/solo/discover?trek_slug=tungnath-chandrashila&start_date={today.isoformat()}&end_date={(today + timedelta(days=2)).isoformat()}",
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_matches"] == 1
    assert data["travelers"][0]["user_id"] == u2.id


def test_gps_nearby_matching_and_privacy(client, db_session):
    u1 = create_test_user(db_session, "near1@vanvas.app", "Near Traveler 1")
    u2 = create_test_user(db_session, "near2@vanvas.app", "Near Traveler 2")

    # Set approximate location for u2 (near Kasol: 32.0100, 77.3150)
    p2 = SoloMatchingService.get_or_create_solo_profile(db_session, u2)
    p2.last_approx_lat = 32.0120
    p2.last_approx_lng = 77.3160
    p2.discover_when_here = True
    db_session.commit()

    headers = auth_header(u1)
    res = client.get("/api/v1/solo/nearby?lat=32.0100&lng=77.3150&mode=here_now", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_matches"] == 1
    matched = data["travelers"][0]
    # Verify proximity label is present and exact coordinates are NOT in response
    assert "Nearby" in matched["proximity_label"]
    assert "lat" not in matched
    assert "lng" not in matched


def test_connection_request_and_mutual_acceptance(client, db_session):
    u1 = create_test_user(db_session, "sender@vanvas.app", "Sender User")
    u2 = create_test_user(db_session, "receiver@vanvas.app", "Receiver User")
    dest = create_test_destination(db_session)

    # 1. Send connection request
    headers_u1 = auth_header(u1)
    req_res = client.post(
        "/api/v1/solo/connect/request",
        json={"receiver_user_id": u2.id, "destination_id": dest.id, "message": "Hey! Want to explore Parvati valley trails?"},
        headers=headers_u1
    )
    assert req_res.status_code == 200
    match_data = req_res.json()
    assert match_data["status"] == "PENDING"
    match_id = match_data["id"]

    # 2. Receiver accepts
    headers_u2 = auth_header(u2)
    accept_res = client.post(f"/api/v1/solo/connect/{match_id}/accept", headers=headers_u2)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 3. Verify notification created
    notifs = client.get("/api/v1/notifications", headers=headers_u1).json()
    assert len(notifs) >= 1
    assert "accepted" in notifs[0]["title"].lower() or "accepted" in notifs[0]["body"].lower()


def test_blocking_removes_from_discovery_and_matching(client, db_session):
    u1 = create_test_user(db_session, "blocker@vanvas.app", "Blocker User")
    u2 = create_test_user(db_session, "blocked@vanvas.app", "Blocked User")
    dest = create_test_destination(db_session)

    today = date.today()
    intent = SoloTripIntent(
        user_id=u2.id,
        destination_id=dest.id,
        intent_type="BOTH",
        start_date=today,
        end_date=today + timedelta(days=5),
        status="active"
    )
    db_session.add(intent)
    db_session.commit()

    headers_u1 = auth_header(u1)
    # Block u2
    block_res = client.post(
        "/api/v1/solo/block",
        json={"blocked_user_id": u2.id, "reason": "Not compatible"},
        headers=headers_u1
    )
    assert block_res.status_code == 200

    # Discovery should now return 0 matches
    res = client.get(f"/api/v1/solo/discover?destination_id={dest.id}", headers=headers_u1)
    assert res.status_code == 200
    assert res.json()["total_matches"] == 0


def test_circle_creation_membership_and_chat(client, db_session):
    u1 = create_test_user(db_session, "creator@vanvas.app", "Circle Creator")
    u2 = create_test_user(db_session, "joiner@vanvas.app", "Circle Joiner")
    dest = create_test_destination(db_session, "Kasol", "kasol")

    today = date.today()
    headers_u1 = auth_header(u1)
    headers_u2 = auth_header(u2)

    # 1. Create Circle
    circle_payload = {
        "destination_id": dest.id,
        "destination_name": dest.name,
        "name": "Parvati Valley Sunset Circle",
        "description": "Exploration & Chalal trail group",
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=3)).isoformat(),
        "max_members": 6,
        "activity_type": "Exploration",
        "meetup_point": "Kasol Bridge",
        "meetup_lat": 32.0100,
        "meetup_lng": 77.3150,
        "meetup_time": "10:00 AM"
    }
    create_res = client.post("/api/v1/circles", json=circle_payload, headers=headers_u1)
    assert create_res.status_code == 200
    circle_data = create_res.json()
    circle_id = circle_data["id"]
    assert circle_data["members_count"] == 1
    assert circle_data["is_creator"] is True

    # 2. Join Circle
    join_res = client.post(f"/api/v1/circles/{circle_id}/join", headers=headers_u2)
    assert join_res.status_code == 200
    assert join_res.json()["members_count"] == 2

    # 3. Post Chat Message
    msg_res = client.post(
        f"/api/v1/circles/{circle_id}/messages",
        json={"content": "Hey everyone, excited to meet at Kasol Bridge tomorrow!"},
        headers=headers_u2
    )
    assert msg_res.status_code == 200
    assert msg_res.json()["content"] == "Hey everyone, excited to meet at Kasol Bridge tomorrow!"

    # 4. Read Chat Messages
    msgs_res = client.get(f"/api/v1/circles/{circle_id}/messages", headers=headers_u1)
    assert msgs_res.status_code == 200
    msgs = msgs_res.json()
    assert len(msgs) >= 2  # Welcome message + user message


def test_circle_voting_and_activities(client, db_session):
    u1 = create_test_user(db_session, "voter1@vanvas.app", "Voter 1")
    u2 = create_test_user(db_session, "voter2@vanvas.app", "Voter 2")
    dest = create_test_destination(db_session)

    # Add a place
    place = Place(
        destination_id=dest.id,
        category="Café",
        name="Evergreen Café Kasol",
        slug="evergreen-cafe-kasol",
        description="Famous Israeli food and mountain terrace",
        latitude=32.0105,
        longitude=77.3155
    )
    db_session.add(place)
    db_session.commit()

    today = date.today()
    circle = TravelCircle(
        creator_user_id=u1.id,
        destination_id=dest.id,
        name="Food & Trails Circle",
        start_date=today,
        end_date=today + timedelta(days=2),
        status="FORMING"
    )
    db_session.add(circle)
    db_session.flush()

    db_session.add(CircleMember(circle_id=circle.id, user_id=u1.id, role="creator"))
    db_session.add(CircleMember(circle_id=circle.id, user_id=u2.id, role="member"))
    db_session.commit()

    headers_u1 = auth_header(u1)
    headers_u2 = auth_header(u2)

    # 1. Propose Activity
    prop_res = client.post(
        f"/api/v1/circles/{circle.id}/activities",
        json={"place_id": place.id, "category": "restaurant", "meetup_time": "01:00 PM"},
        headers=headers_u1
    )
    assert prop_res.status_code == 200
    act_id = prop_res.json()["id"]

    # 2. Vote LOVE from u1 and LOVE from u2
    v1 = client.post(f"/api/v1/circles/{circle.id}/activities/{act_id}/vote", json={"vote_type": "LOVE"}, headers=headers_u1)
    assert v1.status_code == 200

    v2 = client.post(f"/api/v1/circles/{circle.id}/activities/{act_id}/vote", json={"vote_type": "LOVE"}, headers=headers_u2)
    assert v2.status_code == 200

    # 3. Retrieve activities and verify consensus
    acts_res = client.get(f"/api/v1/circles/{circle.id}/activities", headers=headers_u1)
    assert acts_res.status_code == 200
    acts = acts_res.json()
    assert len(acts) == 1
    assert acts[0]["love_count"] == 2
    assert acts[0]["is_consensus_favorite"] is True


def test_ask_vanvas_planning_for_circle(client, db_session):
    u1 = create_test_user(db_session, "planner@vanvas.app", "Circle Planner")
    dest = create_test_destination(db_session)
    place = Place(
        destination_id=dest.id,
        category="Attraction",
        name="Chalal Bridge & Forest Trail",
        slug="chalal-forest-trail",
        description="Scenic pine forest trail along Parvati river",
        latitude=32.0120,
        longitude=77.3180,
        approx_cost=0.0,
        why_vanvas_recommends="Tranquil pine forest walk"
    )
    db_session.add(place)

    today = date.today()
    circle = TravelCircle(
        creator_user_id=u1.id,
        destination_id=dest.id,
        destination_name="Kasol",
        name="Kasol Day Circle",
        start_date=today,
        end_date=today + timedelta(days=2),
        meetup_point="Kasol Market Entrance",
        status="ACTIVE"
    )
    db_session.add(circle)
    db_session.flush()
    db_session.add(CircleMember(circle_id=circle.id, user_id=u1.id, role="creator"))
    db_session.commit()

    headers = auth_header(u1)
    res = client.post(
        f"/api/v1/circles/{circle.id}/ask-vanvas",
        json={"query": "Plan a 6 hour day exploration for our group", "time_limit_hours": 6},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "Kasol" in data["plan_title"]
    assert len(data["suggested_activities"]) >= 1
    assert len(data["safety_advisories"]) >= 1
