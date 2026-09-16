import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from pydantic import ValidationError

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User, Destination, Trip, TripMember
from app.core.security import get_password_hash, create_access_token
from app.core.config import Settings, settings

# Test DB Setup
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
    
    # Create demo traveller and admin
    db = TestingSessionLocal()
    traveller = User(
        email="traveller@vanvas.com",
        full_name="Vanvas Traveller",
        hashed_password=get_password_hash("pass123"),
        role="traveller"
    )
    admin = User(
        email="admin@vanvas.com",
        full_name="Vanvas Admin",
        hashed_password=get_password_hash("admin123"),
        role="admin"
    )
    dest = Destination(
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Kullu Valley",
        tagline="Valley of Gods",
        description="Alpine haven",
        latitude=32.24,
        longitude=77.18,
        altitude_meters=2050,
        is_featured=True
    )
    db.add_all([traveller, admin, dest])
    db.commit()
    db.close()
    
    # Ensure settings default to development before each test
    settings.ENVIRONMENT = "development"
    
    yield
    
    # Reset
    settings.ENVIRONMENT = "development"
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def create_user_with_token(email: str, name: str, role: str = "traveller") -> tuple[User, str, dict]:
    db = TestingSessionLocal()
    user = User(
        email=email,
        full_name=name,
        hashed_password=get_password_hash("securepass123"),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    db.close()

    token = create_access_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}
    return user, token, headers


# ==============================================================================
# 1. DEVELOPMENT ENVIRONMENT BEHAVIOR
# ==============================================================================

def test_development_demo_user_fallback():
    """In development mode, unauthenticated /me requests fallback to demo user for convenience."""
    settings.ENVIRONMENT = "development"
    assert settings.is_production is False

    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "traveller@vanvas.com"


# ==============================================================================
# 2. PRODUCTION ENVIRONMENT AUTHENTICATION HARDENING
# ==============================================================================

def test_production_rejects_missing_auth():
    """In production mode, missing Authorization header MUST return 401 and never demo user."""
    settings.ENVIRONMENT = "production"
    assert settings.is_production is True

    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "detail" in response.json()
    assert response.json()["detail"] == "Authentication required"


def test_production_rejects_invalid_token():
    """In production mode, malformed or invalid JWT token MUST return 401."""
    settings.ENVIRONMENT = "production"

    bad_headers = {"Authorization": "Bearer invalid.jwt.token.here"}
    response = client.get("/api/v1/auth/me", headers=bad_headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid authentication token"


def test_production_accepts_valid_token():
    """In production mode, valid JWT token successfully authenticates the specific user."""
    settings.ENVIRONMENT = "production"

    user, token, headers = create_user_with_token("priya@vanvas.com", "Priya Sharma")
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "priya@vanvas.com"
    assert data["full_name"] == "Priya Sharma"


def test_production_protected_trip_endpoint_requires_auth():
    """In production mode, accessing trips without credentials returns 401."""
    settings.ENVIRONMENT = "production"

    response = client.get("/api/v1/trips")
    assert response.status_code == 401


def test_production_admin_endpoint_authorization():
    """In production, admin endpoint rejects unauthenticated (401) and non-admin users (403)."""
    settings.ENVIRONMENT = "production"

    # 1. Unauthenticated -> 401
    unauth_resp = client.get("/api/v1/admin/stats")
    assert unauth_resp.status_code == 401

    # 2. Regular traveller -> 403 Forbidden
    traveller, _, trav_headers = create_user_with_token("regular@vanvas.com", "Regular User", role="traveller")
    forbidden_resp = client.get("/api/v1/admin/stats", headers=trav_headers)
    assert forbidden_resp.status_code == 403
    assert forbidden_resp.json()["detail"] == "Admin privileges required"

    # 3. Admin user -> 200 OK
    admin_user, _, admin_headers = create_user_with_token("superadmin@vanvas.com", "Super Admin", role="admin")
    admin_resp = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert admin_resp.status_code == 200
    assert "total_trips" in admin_resp.json()


# ==============================================================================
# 3. PRODUCTION CONFIGURATION VALIDATION
# ==============================================================================

def test_production_config_rejects_default_secret_key():
    """Settings model validator must raise error if ENVIRONMENT=production with default secret key."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="vanvas-the-sorted-club-super-secret-key-himalayan-mist-2026"
        )
    assert "In production (ENVIRONMENT=production), a secure, custom SECRET_KEY must be explicitly set" in str(exc_info.value)


def test_production_config_accepts_strong_secret_key():
    """Settings model validator passes in production with a custom 64-char secret key."""
    custom_secret = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=custom_secret
    )
    assert prod_settings.is_production is True
    assert prod_settings.SECRET_KEY == custom_secret


# ==============================================================================
# 4. COLLABORATION & AUTHORIZATION CONSTRAINTS
# ==============================================================================

def test_collaboration_security_constraints():
    """Verify non-members cannot access private trip, non-owner cannot remove, owner cannot leave."""
    user_owner, _, headers_owner = create_user_with_token("owner@vanvas.com", "Trip Owner")
    user_member, _, headers_member = create_user_with_token("member@vanvas.com", "Trip Member")
    user_outsider, _, headers_outsider = create_user_with_token("outsider@vanvas.com", "Trip Outsider")

    # 1. Owner creates trip
    create_resp = client.post("/api/v1/trips", json={
        "destination_id": "manali",
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=2)),
        "budget": 10000,
        "travellers_count": 1,
        "companion_type": "Solo",
        "travel_style": "Balanced",
        "wake_up_preference": "Normal",
        "activity_intensity": "Balanced",
        "interests": ["Nature"]
    }, headers=headers_owner)
    assert create_resp.status_code == 200
    trip_id = create_resp.json()["id"]

    # 2. Generate invite & member joins
    inv_resp = client.post(f"/api/v1/trips/{trip_id}/invites", headers=headers_owner)
    code = inv_resp.json()["code"]
    join_resp = client.post(f"/api/v1/trips/join/{code}", headers=headers_member)
    assert join_resp.status_code == 200

    # 3. Outsider (non-member) cannot access private trip -> 403
    forbidden_resp = client.get(f"/api/v1/trips/{trip_id}", headers=headers_outsider)
    assert forbidden_resp.status_code == 403

    # 4. Non-owner (user_member) cannot remove another user -> 403
    forbid_remove = client.delete(f"/api/v1/trips/{trip_id}/members/{user_owner.id}", headers=headers_member)
    assert forbid_remove.status_code == 403

    # 5. Owner cannot leave their own trip -> 400
    owner_leave = client.post(f"/api/v1/trips/{trip_id}/leave", headers=headers_owner)
    assert owner_leave.status_code == 400


# ==============================================================================
# 5. HEALTH & READINESS PROBES (PHASE 6.2)
# ==============================================================================

def test_liveness_health_endpoint():
    """GET /health must return HTTP 200 with service status without exposing sensitive credentials."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "vanvas-core-api"
    assert "version" in data
    assert "password" not in str(data)
    assert "secret" not in str(data)


def test_readiness_probe_success():
    """GET /health/ready must return HTTP 200 and database connected when DB is operational."""
    resp = client.get("/health/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
    assert data["service"] == "vanvas-core-api"


def test_readiness_probe_database_failure():
    """GET /health/ready must return HTTP 503 when database execution fails."""
    from unittest.mock import MagicMock
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("Database connection lost")

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        resp = client.get("/health/ready")
        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
        assert "password" not in str(data)
    finally:
        app.dependency_overrides[get_db] = override_get_db


# ==============================================================================
# 6. CORS & DATABASE CONFIGURATION (PHASE 6.2)
# ==============================================================================

def test_production_cors_wildcard_rejected():
    """In production mode, wildcard '*' in CORS origins must be rejected by configuration validator."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="custom-strong-secret-key-that-is-valid-for-testing-123456",
            BACKEND_CORS_ORIGINS=["*"]
        )
    assert "wildcard '*' CORS origin is prohibited" in str(exc_info.value)


def test_production_cors_custom_origins():
    """In production mode, explicit domain strings are accepted and parsed cleanly."""
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="custom-strong-secret-key-that-is-valid-for-testing-123456",
        BACKEND_CORS_ORIGINS="https://vanvas.app,https://www.vanvas.app"
    )
    assert prod_settings.BACKEND_CORS_ORIGINS == ["https://vanvas.app", "https://www.vanvas.app"]


def test_database_url_postgres_normalization():
    """Verify postgres:// is normalized to postgresql:// without errors."""
    from app.database.session import db_url
    assert not db_url.startswith("postgres://")

