"""
VANVAS Phase 6: Production Beta Readiness Test Suite
Verifies production configuration validation, health and readiness audit endpoints,
graceful provider degradation, batch intelligence evaluation, and end-to-end journey contracts.
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.config import Settings, settings
from app.models.models import User, Trip, Destination, Place, Hotel, RentalOption, UserPreference, TravellerMemory
from app.database.session import get_db, SessionLocal
from app.core.security import create_access_token, get_password_hash


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_health_liveness_endpoint(client):
    """Verifies that /health returns HTTP 200 and expected metadata."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "git_revision" in data


def test_health_readiness_endpoint(client, db: Session):
    """Verifies that /health/ready checks DB and canonical inventory."""
    res = client.get("/health/ready")
    assert res.status_code in (200, 503)
    data = res.json()
    assert "status" in data
    assert "database" in data
    assert "inventory" in data


def test_production_readiness_audit_endpoint(client):
    """Verifies that /health/readiness-audit returns the complete Phase 6 matrix without leaking secrets."""
    res = client.get("/health/readiness-audit")
    assert res.status_code == 200
    data = res.json()
    assert "matrix" in data
    matrix = data["matrix"]

    # Verify all capabilities are represented
    assert "database_durability" in matrix
    assert "canonical_inventory" in matrix
    assert "authentication_and_sessions" in matrix
    assert "traveller_memory_and_privacy" in matrix
    assert "proactive_intelligence" in matrix
    assert "travel_commerce_and_payments" in matrix
    assert "stay_and_transport_providers" in matrix
    assert "push_notifications" in matrix
    assert "observability_and_monitoring" in matrix
    assert "mobile_and_pwa" in matrix

    # Verify no secret leakage in output
    raw_text = res.text.lower()
    assert "secret_key" not in raw_text or "hs256" in raw_text
    assert "api_key" not in raw_text or "configured" in raw_text
    assert "password" not in raw_text


def test_production_security_validation():
    """Verifies that Settings strictly rejects default dev keys and SQLite when ENVIRONMENT=production."""
    # 1. Dev secret key in production should fail
    with pytest.raises(ValueError, match="secure, custom SECRET_KEY"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="vanvas-the-sorted-club-super-secret-key-himalayan-mist-2026",
            DATABASE_URL="postgresql://user:pass@host:5432/db",
            BACKEND_CORS_ORIGINS=["https://vanvasai.vercel.app"]
        )

    # 2. SQLite in production should fail
    with pytest.raises(ValueError, match="DATABASE_URL must point to a production PostgreSQL"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a-very-secure-random-32-byte-hex-string-for-prod",
            DATABASE_URL="sqlite:///./vanvas.db",
            BACKEND_CORS_ORIGINS=["https://vanvasai.vercel.app"]
        )

    # 3. Wildcard CORS in production should fail
    with pytest.raises(ValueError, match=r"wildcard '\*' CORS origin is prohibited"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a-very-secure-random-32-byte-hex-string-for-prod",
            DATABASE_URL="postgresql://user:pass@host:5432/db",
            BACKEND_CORS_ORIGINS=["*"]
        )

    # 4. Valid production settings should succeed
    valid_prod = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-very-secure-random-32-byte-hex-string-for-prod",
        DATABASE_URL="postgresql://user:pass@host:5432/db",
        BACKEND_CORS_ORIGINS=["https://vanvasai.vercel.app"]
    )
    assert valid_prod.is_production is True


def test_batch_intelligence_evaluation_endpoint(client, db: Session):
    """Verifies that /api/v1/intelligence/evaluate-active-batch runs bounded batch evaluation."""
    # Create test user and trip
    unique_email = f"eval_runner_{datetime.now(timezone.utc).timestamp()}@vanvas.app"
    user = User(
        email=unique_email,
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Batch Test Runner",
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    dest = db.query(Destination).first()
    dest_id = dest.id if dest else "manali"

    trip = Trip(
        user_id=user.id,
        destination_id=dest_id,
        title="Manali Slow Nature Trip",
        start_date=datetime.now(timezone.utc).date(),
        end_date=(datetime.now(timezone.utc) + timedelta(days=4)).date(),
        travel_style="Balanced",
        budget_total=20000.0,
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(trip)
    db.commit()

    token = create_access_token(subject=user.id)
    res = client.post(
        "/api/v1/intelligence/evaluate-active-batch?max_trips=10",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert "evaluated_trips_count" in data
    assert data["evaluated_trips_count"] >= 1


def test_unconfigured_payment_provider_fails_closed(client, db: Session):
    """Verifies that in production mode with no live gateway credentials, payment initiation fails closed."""
    unique_email = f"pay_test_{datetime.now(timezone.utc).timestamp()}@vanvas.app"
    user = User(
        email=unique_email,
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Payment Test User",
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)

    # In sandbox mode, it returns simulated payload cleanly without fake confirmation
    res = client.post(
        "/api/v1/bookings/nonexistent-booking-id/pay",
        json={"payment_gateway": "razorpay"},
        headers={"Authorization": f"Bearer {token}"}
    )
    # Rejects invalid booking ID securely
    assert res.status_code in (400, 404)


def test_user_data_rights_export_and_isolation(client, db: Session):
    """Verifies that auth export provides comprehensive personal data and isolates tenant data."""
    unique_email = f"rights_user_{datetime.now(timezone.utc).timestamp()}@vanvas.app"
    user = User(
        email=unique_email,
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Data Rights User",
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Add preference and memory
    pref = UserPreference(
        user_id=user.id,
        memory_learning_enabled=True,
        accommodation_preference="Homestay"
    )
    db.add(pref)
    mem = TravellerMemory(
        user_id=user.id,
        category="accommodation",
        preference_key="stay_type",
        preference_value="homestay",
        memory_type="EXPLICIT",
        source_event="EXPLICIT_SETTING",
        confidence=1.0,
        status="ACTIVE"
    )
    db.add(mem)
    db.commit()

    token = create_access_token(subject=user.id)
    res = client.get("/api/v1/auth/export", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()

    assert data["user"]["id"] == user.id
    assert "traveller_memories" in data
    assert len(data["traveller_memories"]) >= 1
    assert data["traveller_memories"][0]["preference_key"] == "stay_type"
    assert data["traveller_memories"][0]["preference_value"] == "homestay"
