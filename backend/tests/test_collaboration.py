import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database.session import Base, get_db
from app.models.models import (
    User, Destination, Place, Hotel, RentalOption, Trip, TripMember, TripInvite, Vote
)
from app.core.security import get_password_hash, create_access_token

# Test In-Memory Database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
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
    db = TestingSessionLocal()
    # Seed a starter destination and places
    dest = Destination(
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Kullu Valley",
        tagline="Valley of the Gods",
        description="Alpine retreat amidst pine forests.",
        latitude=32.2432,
        longitude=77.1892,
        altitude_meters=2050,
        is_featured=True
    )
    db.add(dest)
    db.flush()

    p1 = Place(
        destination_id=dest.id,
        category="Cafés & Bakery",
        name="Café 1947",
        slug="cafe-1947",
        description="Riverside café in Old Manali",
        latitude=32.256,
        longitude=77.182,
        price_level="Moderate",
        approx_cost=450,
        rating=4.8,
        review_count=120,
        opening_time="11:00",
        closing_time="23:00",
        recommended_duration_mins=90,
        tags="Riverside,Food",
        is_must_visit=True
    )
    db.add(p1)
    db.commit()
    db.close()
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def create_test_user(email: str, name: str) -> tuple[User, str, dict]:
    db = TestingSessionLocal()
    user = User(
        email=email,
        full_name=name,
        hashed_password=get_password_hash("pass123"),
        role="traveller"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    db.close()

    token = create_access_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}
    return user, token, headers

def test_full_trip_collaboration_lifecycle():
    # 1. User A (Owner) registers/creates a trip
    user_a, token_a, headers_a = create_test_user("alice@vanvas.com", "Alice Himalayan")
    user_b, token_b, headers_b = create_test_user("bob@vanvas.com", "Bob Backpacker")
    user_c, token_c, headers_c = create_test_user("carol@vanvas.com", "Carol Wanderer")

    create_resp = client.post("/api/v1/trips", json={
        "destination_id": "manali",
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=2)),
        "budget": 12000,
        "travellers_count": 1,
        "companion_type": "Friends",
        "travel_style": "Balanced",
        "wake_up_preference": "Normal",
        "activity_intensity": "Balanced",
        "interests": ["Nature", "Cafés"]
    }, headers=headers_a)
    assert create_resp.status_code == 200
    trip_data = create_resp.json()
    trip_id = trip_data["id"]

    # 2. Verify User A is member with role 'owner'
    members_resp = client.get(f"/api/v1/trips/{trip_id}/members", headers=headers_a)
    assert members_resp.status_code == 200
    m_data = members_resp.json()
    assert m_data["members_count"] == 1
    assert m_data["members"][0]["user_id"] == user_a.id
    assert m_data["members"][0]["role"] == "owner"

    # 3. User A generates an invite link
    invite_resp = client.post(f"/api/v1/trips/{trip_id}/invites", headers=headers_a)
    assert invite_resp.status_code == 200
    invite_data = invite_resp.json()
    code = invite_data["code"]
    assert len(code) >= 6

    # 4. User B previews the invite (unauthenticated or authenticated)
    preview_resp = client.get(f"/api/v1/trips/invite/{code}", headers=headers_b)
    assert preview_resp.status_code == 200
    p_data = preview_resp.json()
    assert p_data["destination_name"] == "Manali"
    assert p_data["owner_name"] == "Alice Himalayan"
    assert p_data["is_member"] is False

    # 5. Non-member (User B) tries to view private trip detail before joining -> 403
    forbidden_resp = client.get(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert forbidden_resp.status_code == 403

    # 6. User B joins the trip via invite code
    join_resp = client.post(f"/api/v1/trips/join/{code}", headers=headers_b)
    assert join_resp.status_code == 200
    j_data = join_resp.json()
    assert j_data["success"] is True
    assert j_data["already_joined"] is False

    # 7. Duplicate join attempt returns already_joined=True
    dup_join_resp = client.post(f"/api/v1/trips/join/{code}", headers=headers_b)
    assert dup_join_resp.status_code == 200
    assert dup_join_resp.json()["already_joined"] is True

    # 8. User B now accesses private trip details successfully
    allowed_resp = client.get(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert allowed_resp.status_code == 200
    assert allowed_resp.json()["id"] == trip_id

    # 9. User B joins voting on a place
    db = TestingSessionLocal()
    place = db.query(Place).first()
    db.close()

    vote_resp = client.post(f"/api/v1/trips/{trip_id}/vote", json={
        "place_id": place.id,
        "vote_type": "LOVE"
    }, headers=headers_b)
    assert vote_resp.status_code == 200

    # 10. Check group members and compatibility ranking
    group_resp = client.get(f"/api/v1/trips/{trip_id}/members", headers=headers_a)
    assert group_resp.status_code == 200
    assert group_resp.json()["members_count"] == 2
    assert len(group_resp.json()["compatibility_ranking"]) > 0

    # 11. User C joins as 3rd member
    client.post(f"/api/v1/trips/join/{code}", headers=headers_c)

    # 12. Non-owner (User B) tries to remove User C -> 403
    forbid_remove = client.delete(f"/api/v1/trips/{trip_id}/members/{user_c.id}", headers=headers_b)
    assert forbid_remove.status_code == 403

    # 13. Owner (User A) tries to remove Owner -> 400
    owner_remove = client.delete(f"/api/v1/trips/{trip_id}/members/{user_a.id}", headers=headers_a)
    assert owner_remove.status_code == 400

    # 14. Owner (User A) removes User C -> 200
    rem_resp = client.delete(f"/api/v1/trips/{trip_id}/members/{user_c.id}", headers=headers_a)
    assert rem_resp.status_code == 200

    # 15. User B leaves the trip voluntarily -> 200
    leave_resp = client.post(f"/api/v1/trips/{trip_id}/leave", headers=headers_b)
    assert leave_resp.status_code == 200

    # 16. Owner tries to leave -> 400
    owner_leave = client.post(f"/api/v1/trips/{trip_id}/leave", headers=headers_a)
    assert owner_leave.status_code == 400

    # 17. Invalid invite code -> 404
    invalid_resp = client.get("/api/v1/trips/invite/INVALIDCODE123", headers=headers_b)
    assert invalid_resp.status_code == 404
