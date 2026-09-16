import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from jose import jwt
from app.main import app
from app.database.session import Base, get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

from sqlalchemy.pool import StaticPool

# Test DB setup
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

client = TestClient(app)

def test_password_hashing():
    pwd = "secret-mountain-pass"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong-password", hashed) is False

def test_jwt_token_creation():
    user_id = "test-user-123"
    token = create_access_token(user_id)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload.get("sub") == user_id

def test_user_registration_and_profile_preferences():
    # 1. Register a user
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "himalayan_wanderer@vanvas.com",
        "password": "mountainpass123",
        "full_name": "Maya Negi"
    })
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    token = data["access_token"]
    assert data["user"]["full_name"] == "Maya Negi"
    assert data["user"]["preferences"]["wake_up_preference"] == "Normal"

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get current user
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "himalayan_wanderer@vanvas.com"

    # 3. Update preferences directly
    pref_resp = client.put("/api/v1/auth/preferences", json={
        "preferred_travel_style": "Comfort",
        "wake_up_preference": "Early",
        "activity_intensity": "Packed",
        "dietary_preference": "Veg",
        "interests": "Trek,Riverside,Photography",
        "accommodation_preference": "Boutique Heritage Havelis",
        "transport_preference": "Self-Drive 4x4",
        "companion_style": "Friends"
    }, headers=headers)
    assert pref_resp.status_code == 200
    pref_data = pref_resp.json()
    assert pref_data["preferred_travel_style"] == "Comfort"
    assert pref_data["wake_up_preference"] == "Early"
    assert pref_data["accommodation_preference"] == "Boutique Heritage Havelis"
    assert pref_data["transport_preference"] == "Self-Drive 4x4"
    assert pref_data["companion_style"] == "Friends"

    # 4. Update full profile (name and preferences simultaneously)
    profile_resp = client.put("/api/v1/auth/profile", json={
        "full_name": "Maya Negi (Alpine Explorer)",
        "wake_up_preference": "Late",
        "preferred_travel_style": "Premium",
        "interests": "Glaciers,Artisan Cafes"
    }, headers=headers)
    assert profile_resp.status_code == 200
    user_data = profile_resp.json()
    assert user_data["full_name"] == "Maya Negi (Alpine Explorer)"
    assert user_data["preferences"]["wake_up_preference"] == "Late"
    assert user_data["preferences"]["preferred_travel_style"] == "Premium"
    assert user_data["preferences"]["interests"] == "Glaciers,Artisan Cafes"
    # Preserved existing fields
    assert user_data["preferences"]["accommodation_preference"] == "Boutique Heritage Havelis"
