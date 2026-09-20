import pytest
from datetime import datetime, timezone, date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User, UserPreference, Destination, Trip, Place, SavedPlace, Review, Booking
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings

# In-memory test database setup
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
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    
    # Enable production mode during security tests so unauthenticated requests strictly return 401
    settings.ENVIRONMENT = "production"
    
    yield
    
    settings.ENVIRONMENT = "development"
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

from datetime import datetime, timezone

def create_user_with_token(email: str, name: str, password: str = "securepass123") -> tuple[User, str, dict]:
    db = TestingSessionLocal()
    user = User(
        email=email,
        full_name=name,
        hashed_password=get_password_hash(password),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.flush()
    pref = UserPreference(user_id=user.id)
    db.add(pref)
    db.commit()
    db.refresh(user)
    user_id = user.id
    db.close()

    token = create_access_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}
    return user, token, headers


def test_user_registration_and_stats():
    # 1. Register User (unverified)
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "aarav.wanderer@vanvas.com",
        "password": "mountainsecret123",
        "full_name": "Aarav Sharma"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["email"] == "aarav.wanderer@vanvas.com"
    assert reg_data["email_verified"] is False

    # Mark verified in DB and login
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "aarav.wanderer@vanvas.com").first()
    u.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.close()

    login_resp = client.post("/api/v1/auth/login", json={
        "email": "aarav.wanderer@vanvas.com",
        "password": "mountainsecret123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile stats (initially 0 counts)
    stats_resp = client.get("/api/v1/auth/profile/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["saved_places_count"] == 0
    assert stats["saved_trips_count"] == 0
    assert stats["upcoming_trips_count"] == 0
    assert stats["completed_trips_count"] == 0
    assert "member_since" in stats


def test_update_profile_and_preferences():
    user, token, headers = create_user_with_token("kavya@vanvas.com", "Kavya Patel")

    # 1. Update Profile Display Name
    prof_resp = client.put("/api/v1/auth/profile", json={
        "full_name": "Kavya Patel (High Altitude Trekker)",
        "preferred_travel_style": "Packed",
        "transport_preference": "Self-Drive 4x4",
        "currency": "USD",
        "language": "hi",
        "theme": "dark",
        "location_mode": "while_using"
    }, headers=headers)
    assert prof_resp.status_code == 200
    data = prof_resp.json()
    assert data["full_name"] == "Kavya Patel (High Altitude Trekker)"
    assert data["preferences"]["preferred_travel_style"] == "Packed"
    assert data["preferences"]["currency"] == "USD"
    assert data["preferences"]["language"] == "hi"
    assert data["preferences"]["theme"] == "dark"
    assert data["preferences"]["location_mode"] == "while_using"

    # 2. Update Preferences directly
    pref_resp = client.put("/api/v1/auth/preferences", json={
        "dietary_preference": "Veg",
        "companion_style": "Couple",
        "notify_trip_reminders": True,
        "notify_announcements": True,
        "ai_copilot_enabled": True
    }, headers=headers)
    assert pref_resp.status_code == 200
    pref_data = pref_resp.json()
    assert pref_data["dietary_preference"] == "Veg"
    assert pref_data["companion_style"] == "Couple"
    assert pref_data["notify_announcements"] is True


def test_password_change_flow():
    user, token, headers = create_user_with_token("rohan@vanvas.com", "Rohan Mehra", "oldsecret123")

    # 1. Wrong current password fails
    fail_resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "wrongpassword",
        "new_password": "newsecret123",
        "confirm_password": "newsecret123"
    }, headers=headers)
    assert fail_resp.status_code == 400
    assert "Current password is incorrect" in fail_resp.json()["detail"]

    # 2. Mismatched confirmation fails
    mismatch_resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "oldsecret123",
        "new_password": "newsecret123",
        "confirm_password": "mismatchedpass"
    }, headers=headers)
    assert mismatch_resp.status_code == 400

    # 3. Valid password change succeeds
    change_resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "oldsecret123",
        "new_password": "newsecret123",
        "confirm_password": "newsecret123"
    }, headers=headers)
    assert change_resp.status_code == 200
    assert "Password changed successfully" in change_resp.json()["message"]

    # 4. Old password cannot log in
    old_login = client.post("/api/v1/auth/login", json={
        "email": "rohan@vanvas.com",
        "password": "oldsecret123"
    })
    assert old_login.status_code == 401

    # 5. New password logs in successfully
    new_login = client.post("/api/v1/auth/login", json={
        "email": "rohan@vanvas.com",
        "password": "newsecret123"
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_user_data_export_and_isolation():
    user1, token1, headers1 = create_user_with_token("user1@vanvas.com", "User One")
    user2, token2, headers2 = create_user_with_token("user2@vanvas.com", "User Two")

    # Add destination and trip for user1
    db = TestingSessionLocal()
    dest = Destination(
        name="Spiti Valley",
        slug="spiti",
        state="Himachal Pradesh",
        region="Spiti Valley",
        tagline="Middle Land",
        description="High altitude desert",
        latitude=32.22,
        longitude=78.07
    )
    db.add(dest)
    db.flush()

    trip1 = Trip(
        user_id=user1.id,
        destination_id=dest.id,
        title="Spiti Road Expedition",
        start_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=16),
        num_days=6
    )
    db.add(trip1)
    db.commit()
    db.close()

    # User 1 export contains their trip
    exp1 = client.get("/api/v1/auth/export", headers=headers1)
    assert exp1.status_code == 200
    data1 = exp1.json()
    assert data1["user"]["email"] == "user1@vanvas.com"
    assert len(data1["trips"]) == 1
    assert data1["trips"][0]["title"] == "Spiti Road Expedition"

    # User 2 export does NOT contain User 1's trip (Strict Isolation)
    exp2 = client.get("/api/v1/auth/export", headers=headers2)
    assert exp2.status_code == 200
    data2 = exp2.json()
    assert data2["user"]["email"] == "user2@vanvas.com"
    assert len(data2["trips"]) == 0


def test_account_deletion():
    user, token, headers = create_user_with_token("disposable@vanvas.com", "Disposable User", "deleteme123")

    # 1. Delete account
    del_resp = client.request("DELETE", "/api/v1/auth/account", headers=headers, json={
        "password": "deleteme123"
    })
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"

    # 2. Login fails because account was deleted
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "disposable@vanvas.com",
        "password": "deleteme123"
    })
    assert login_resp.status_code == 401
