import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.models import User, UserPreference, DeviceRegistration, NotificationItem
from app.services.notification_service import NotificationService

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
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db():
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()

client = TestClient(app)


def test_device_token_registration_and_update(db):
    """Test registering a new device token and updating an existing token."""
    user = User(
        id="user-infra-device-1",
        email="infra_device@vanvas.local",
        hashed_password=get_password_hash("password123"),
        full_name="Infra Device User",
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register new token
    res1 = client.post(
        "/api/v1/notifications/devices",
        headers=headers,
        json={
            "push_token": "fcm_test_token_alpha_12345",
            "platform": "android",
            "device_identifier": "device_pixel_8_pro",
            "app_version": "0.1.0",
            "permission_state": "granted",
        },
    )
    assert res1.status_code == 200, res1.text
    data1 = res1.json()
    assert data1["push_token"] == "fcm_test_token_alpha_12345"
    assert data1["platform"] == "android"
    assert data1["is_active"] is True
    assert data1["user_id"] == user.id

    # 2. Update existing token
    res2 = client.post(
        "/api/v1/notifications/devices",
        headers=headers,
        json={
            "push_token": "fcm_test_token_alpha_12345",
            "platform": "android",
            "device_identifier": "device_pixel_8_pro",
            "app_version": "0.1.0",
            "permission_state": "granted",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == data1["id"]
    assert data2["push_token"] == "fcm_test_token_alpha_12345"


def test_device_token_deactivation_on_logout(db):
    """Test deactivating a device push token when the user logs out."""
    user = User(
        id="user-infra-deact-1",
        email="infra_deact@vanvas.local",
        hashed_password=get_password_hash("password123"),
        full_name="Deactivate User",
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Register token first
    push_tok = "fcm_token_to_deactivate_999"
    NotificationService.register_device(
        db=db,
        push_token=push_tok,
        platform="android",
        user_id=user.id,
    )

    # Deactivate via API
    res = client.post(
        "/api/v1/notifications/devices/deactivate",
        headers=headers,
        json={"push_token": push_tok},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Verify inactive in database
    dev = db.query(DeviceRegistration).filter(DeviceRegistration.push_token == push_tok).first()
    assert dev is not None
    assert dev.is_active is False


def test_unauthorized_device_registration_rejected():
    """Ensure unauthenticated device registration is rejected with 401."""
    res = client.post(
        "/api/v1/notifications/devices",
        json={"push_token": "unauth_token_xyz"},
    )
    assert res.status_code == 401


def test_notification_preference_enforcement(db):
    """Test notification preference hierarchy (all, important_only, none, category suppression)."""
    user = User(
        id="user-infra-pref-1",
        email="infra_pref@vanvas.local",
        hashed_password=get_password_hash("password123"),
        full_name="Pref User",
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Update preferences to 'important_only'
    res_up = client.put(
        "/api/v1/notifications/preferences",
        headers=headers,
        json={"level": "important_only"},
    )
    assert res_up.status_code == 200
    assert res_up.json()["level"] == "important_only"

    # 2. Dispatch 'recommendation' (non-important) -> should be suppressed
    res_rec = client.post(
        "/api/v1/notifications/send-test",
        headers=headers,
        json={
            "type": "recommendation",
            "title": "Hidden Café in Old Manali",
            "body": "Try the freshly baked apple crumble at Dylan's.",
            "deep_link": "/explore/manali",
        },
    )
    assert res_rec.status_code == 200
    assert res_rec.json()["suppressed_by_preference"] is True
    assert res_rec.json()["status"] == "suppressed"

    # 3. Dispatch 'trip_reminder' (important) -> should NOT be suppressed
    res_trip = client.post(
        "/api/v1/notifications/send-test",
        headers=headers,
        json={
            "type": "trip_reminder",
            "title": "Volvo Bus Leaves in 90 mins",
            "body": "Your bus from Majnu Ka Tilla departs at 21:30.",
            "deep_link": "/trips/trip-auth-a",
            "trip_id": "trip-auth-a",
        },
    )
    assert res_trip.status_code == 200
    assert res_trip.json()["suppressed_by_preference"] is False

    # 4. Update preferences to 'none' -> all notifications suppressed
    client.put(
        "/api/v1/notifications/preferences",
        headers=headers,
        json={"level": "none"},
    )
    res_none = client.post(
        "/api/v1/notifications/send-test",
        headers=headers,
        json={
            "type": "weather_alert",
            "title": "Storm warning",
            "body": "Rain expected in Solang.",
            "deep_link": "/trips/trip-auth-a",
        },
    )
    assert res_none.status_code == 200
    assert res_none.json()["suppressed_by_preference"] is True


def test_notification_deep_link_and_listing(db):
    """Test notification list endpoint and deep-link payload persistence."""
    user = User(
        id="user-infra-list-1",
        email="infra_list@vanvas.local",
        hashed_password=get_password_hash("password123"),
        full_name="List User",
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure preferences are 'all'
    client.put(
        "/api/v1/notifications/preferences",
        headers=headers,
        json={"level": "all"},
    )

    # Create notification with specific deep link
    res_send = client.post(
        "/api/v1/notifications/send-test",
        headers=headers,
        json={
            "type": "itinerary_change",
            "title": "Schedule Adjusted",
            "body": "Your afternoon trek time was updated.",
            "deep_link": "/trips/trip-auth-a",
            "trip_id": "trip-auth-a",
        },
    )
    assert res_send.status_code == 200
    notif_id = res_send.json()["notification_id"]

    # Retrieve notifications list
    res_list = client.get("/api/v1/notifications/inbox", headers=headers)
    assert res_list.status_code == 200
    notifs = res_list.json()["items"]
    target = next((n for n in notifs if n["id"] == notif_id), None)
    assert target is not None
    assert target["deep_link"] == "/trips/trip-auth-a"
    assert target["trip_id"] == "trip-auth-a"
    assert target["is_read"] is False

    # Mark as read
    res_read = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert res_read.status_code == 200
    assert res_read.json()["is_read"] is True


def test_app_version_and_health_endpoints():
    """Verify production app version, metadata, and health endpoint."""
    res_ver = client.get("/api/v1/app/version")
    assert res_ver.status_code == 200
    ver_data = res_ver.json()
    assert ver_data["app_name"] == "VANVAS"
    assert ver_data["latest_version"] == "0.1.0"
    assert ver_data["package_name"] == "ai.vanvas.app"
    assert ver_data["min_supported_version"] == "0.1.0"
    assert ver_data["force_update"] is False

    res_health = client.get("/api/v1/app/health")
    assert res_health.status_code == 200
    health_data = res_health.json()
    assert health_data["status"] == "ok"
    assert health_data["version"] == "0.1.0"
