import pytest
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from jose import jwt

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User, UserPreference, EmailVerificationToken, Trip
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings
from app.services.email_service import EmailService, build_verification_email_html

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
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

# --------------------------------------------------------------------------
# 1. Registration Flow & Unverified Account Creation
# --------------------------------------------------------------------------

def test_registration_creates_unverified_account():
    response = client.post("/api/v1/auth/register", json={
        "email": "aarav.sharma@example.com",
        "password": "mountainsecret123",
        "full_name": "Aarav Sharma"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "aarav.sharma@example.com"
    assert data["email_verified"] is False
    assert "access_token" not in data  # Must NOT return access token
    assert "token" not in data  # Must NOT expose verification token

    # Check database state
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "aarav.sharma@example.com").first()
    assert user is not None
    assert user.email_verified_at is None  # Unverified

    # Check verification token record exists in DB
    token_record = db.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == user.id).first()
    assert token_record is not None
    assert token_record.token_hash is not None
    assert len(token_record.token_hash) == 64  # SHA-256 hash length
    assert token_record.used_at is None
    db.close()

# --------------------------------------------------------------------------
# 2. Login Enforcement for Unverified vs Verified Accounts
# --------------------------------------------------------------------------

def test_login_blocked_for_unverified_account():
    # Register user
    client.post("/api/v1/auth/register", json={
        "email": "unverified@example.com",
        "password": "securepassword123",
        "full_name": "Unverified User"
    })

    # Attempt login before verification
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "unverified@example.com",
        "password": "securepassword123"
    })
    assert login_resp.status_code == 403
    assert "verify your email" in login_resp.json()["detail"].lower()

def test_login_succeeds_for_verified_account():
    # Register user
    client.post("/api/v1/auth/register", json={
        "email": "verified.traveler@example.com",
        "password": "securepassword123",
        "full_name": "Verified Traveler"
    })

    # Mark user verified
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "verified.traveler@example.com").first()
    user.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.close()

    # Attempt login after verification
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "verified.traveler@example.com",
        "password": "securepassword123"
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "verified.traveler@example.com"
    assert data["user"]["is_verified"] is True

# --------------------------------------------------------------------------
# 3. Email Verification Confirmation & Token Handling
# --------------------------------------------------------------------------

def test_verify_email_confirm_success():
    db = TestingSessionLocal()
    user = User(
        email="test.confirm@example.com",
        hashed_password=get_password_hash("pass1234"),
        full_name="Test Confirm",
        email_verified_at=None
    )
    db.add(user)
    db.flush()

    raw_token = "valid-cryptographic-token-12345"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    record = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db.add(record)
    db.commit()
    db.close()

    # Confirm verification
    resp = client.post("/api/v1/auth/verify-email/confirm", json={"token": raw_token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "verified successfully" in data["message"].lower()

    # Verify user state in DB
    db = TestingSessionLocal()
    updated_user = db.query(User).filter(User.email == "test.confirm@example.com").first()
    assert updated_user.email_verified_at is not None

    updated_record = db.query(EmailVerificationToken).filter(EmailVerificationToken.token_hash == token_hash).first()
    assert updated_record.used_at is not None
    db.close()

def test_verify_email_invalid_token():
    resp = client.post("/api/v1/auth/verify-email/confirm", json={"token": "completely-invalid-token"})
    assert resp.status_code == 400
    assert "invalid" in resp.json()["detail"].lower()

def test_verify_email_expired_token():
    db = TestingSessionLocal()
    user = User(
        email="expired.user@example.com",
        hashed_password=get_password_hash("pass1234"),
        full_name="Expired User",
        email_verified_at=None
    )
    db.add(user)
    db.flush()

    raw_token = "expired-token-xyz"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    record = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1)  # Expired 1 hour ago
    )
    db.add(record)
    db.commit()
    db.close()

    resp = client.post("/api/v1/auth/verify-email/confirm", json={"token": raw_token})
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()

def test_verify_email_reused_token():
    db = TestingSessionLocal()
    user = User(
        email="reused.user@example.com",
        hashed_password=get_password_hash("pass1234"),
        full_name="Reused User",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.flush()

    raw_token = "already-used-token-abc"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    record = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        used_at=datetime.now(timezone.utc)  # Already marked used
    )
    db.add(record)
    db.commit()
    db.close()

    resp = client.post("/api/v1/auth/verify-email/confirm", json={"token": raw_token})
    assert resp.status_code == 400
    assert "already been used" in resp.json()["detail"].lower()

# --------------------------------------------------------------------------
# 4. Resend Verification & Rate Limiting / Cooldown
# --------------------------------------------------------------------------

def test_resend_verification_creates_new_token():
    # Register user
    client.post("/api/v1/auth/register", json={
        "email": "resend.test@example.com",
        "password": "password123",
        "full_name": "Resend Test"
    })

    # Age the first token by 65 seconds to pass cooldown
    db = TestingSessionLocal()
    token1 = db.query(EmailVerificationToken).first()
    assert token1 is not None
    token1.created_at = datetime.now(timezone.utc) - timedelta(seconds=65)
    db.commit()
    db.close()

    # Request resend
    resend_resp = client.post("/api/v1/auth/verify-email/request", json={
        "email": "resend.test@example.com"
    })
    assert resend_resp.status_code == 200
    assert resend_resp.json()["success"] is True

    # Check DB: Old token must be marked used/invalidated, and new token created
    db = TestingSessionLocal()
    tokens = db.query(EmailVerificationToken).all()
    assert len(tokens) == 2
    assert tokens[0].used_at is not None  # Old invalidated
    assert tokens[1].used_at is None      # New active
    db.close()

def test_resend_rate_limit_cooldown():
    # Register user (creates initial token just now)
    client.post("/api/v1/auth/register", json={
        "email": "cooldown.test@example.com",
        "password": "password123",
        "full_name": "Cooldown Test"
    })

    # Immediately request resend -> should be rejected with 429
    resend_resp = client.post("/api/v1/auth/verify-email/request", json={
        "email": "cooldown.test@example.com"
    })
    assert resend_resp.status_code == 429
    assert "wait before requesting" in resend_resp.json()["detail"].lower()

def test_resend_for_nonexistent_email_prevents_enumeration():
    # Requesting resend for unregistered email returns generic success
    resend_resp = client.post("/api/v1/auth/verify-email/request", json={
        "email": "nonexistent.user.12345@example.com"
    })
    assert resend_resp.status_code == 200
    assert resend_resp.json()["success"] is True

# --------------------------------------------------------------------------
# 5. Email Template & Service Provider Tests
# --------------------------------------------------------------------------

def test_email_template_contains_branding_and_security():
    html = build_verification_email_html(
        recipient_name="Maya Negi",
        verification_url="https://vanvasai.vercel.app/verify-email?token=test-token-123",
        expire_hours=24
    )
    assert "VANVAS" in html
    assert "Maya Negi" in html
    assert "https://vanvasai.vercel.app/verify-email?token=test-token-123" in html
    assert "24 hours" in html
    assert "Verify My Email" in html
    # Ensure no secrets or passwords present
    assert "password" not in html.lower()
    assert "secret" not in html.lower()

def test_email_service_reports_not_configured_when_no_credentials():
    # When no EMAIL_API_KEY or SMTP is configured
    old_key = settings.EMAIL_API_KEY
    old_smtp = settings.SMTP_HOST
    settings.EMAIL_API_KEY = ""
    settings.SMTP_HOST = ""
    try:
        result = EmailService.send_verification_email(
            to_email="test@example.com",
            recipient_name="Test",
            raw_token="raw-token"
        )
        assert result.success is False
        assert result.status == "EMAIL_NOT_CONFIGURED"
    finally:
        settings.EMAIL_API_KEY = old_key
        settings.SMTP_HOST = old_smtp
