import pytest
import hashlib
import json
import smtplib
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import urllib.request
import urllib.error

from app.main import app
from app.database.session import Base, get_db, ensure_database_schema
from app.models.models import User, UserPreference, EmailVerificationOTP, EmailVerificationToken
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings
from app.services.email_service import EmailService, build_otp_email_html, mask_email

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

# Helper: Seed user with known OTP
def seed_user_with_otp(email: str, raw_otp: str, minutes_offset: int = 0, attempt_count: int = 0, is_verified: bool = False):
    db = TestingSessionLocal()
    user = User(
        email=email.lower().strip(),
        hashed_password=get_password_hash("mountainPass123"),
        full_name="Himalayan Traveler",
        role="traveller",
        email_verified_at=datetime.now(timezone.utc) if is_verified else None
    )
    db.add(user)
    db.flush()

    pref = UserPreference(user_id=user.id)
    db.add(pref)

    now_utc = datetime.now(timezone.utc) + timedelta(minutes=minutes_offset)
    otp_hash = hashlib.sha256(raw_otp.encode("utf-8")).hexdigest()
    expires_at = now_utc + timedelta(minutes=settings.EMAIL_OTP_EXPIRE_MINUTES)

    otp_record = EmailVerificationOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        created_at=now_utc,
        expires_at=expires_at,
        attempt_count=attempt_count
    )
    db.add(otp_record)
    db.commit()
    db.refresh(user)
    db.refresh(otp_record)
    user_id = user.id
    otp_id = otp_record.id
    db.close()
    return user_id, otp_id

# ==============================================================================
# 1. Registration creates unverified user
# ==============================================================================
def test_registration_creates_unverified_user():
    response = client.post("/api/v1/auth/register", json={
        "email": "priya.sharma@example.com",
        "password": "mountainsecret123",
        "full_name": "Priya Sharma"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "priya.sharma@example.com"
    assert data["email_verified"] is False
    assert "access_token" not in data

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "priya.sharma@example.com").first()
    assert user is not None
    assert user.email_verified_at is None
    db.close()

# ==============================================================================
# 2. OTP is generated on registration
# ==============================================================================
def test_otp_is_generated_on_registration():
    response = client.post("/api/v1/auth/register", json={
        "email": "aarav.otp@example.com",
        "password": "mountainsecret123",
        "full_name": "Aarav Negi"
    })
    assert response.status_code == 200

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "aarav.otp@example.com").first()
    assert user is not None
    otp_record = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user.id).first()
    assert otp_record is not None
    assert otp_record.used_at is None
    assert otp_record.attempt_count == 0
    db.close()

# ==============================================================================
# 3. Raw OTP is never stored in DB (only SHA-256 hash)
# ==============================================================================
def test_raw_otp_never_stored_in_db():
    client.post("/api/v1/auth/register", json={
        "email": "secure.hash@example.com",
        "password": "mountainsecret123",
        "full_name": "Secure Hash"
    })

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "secure.hash@example.com").first()
    otp_record = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user.id).first()
    assert otp_record is not None
    # Must be 64-char hexadecimal SHA-256 hash
    assert len(otp_record.otp_hash) == 64
    assert not otp_record.otp_hash.isdigit()
    db.close()

# ==============================================================================
# 4. Raw OTP is never returned by API
# ==============================================================================
def test_raw_otp_never_returned_by_api():
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "api.leakcheck@example.com",
        "password": "mountainsecret123",
        "full_name": "Leak Check"
    })
    reg_json = reg_resp.json()
    assert "otp" not in reg_json
    assert "token" not in reg_json
    assert "code" not in reg_json
    assert "123456" not in str(reg_json)

# ==============================================================================
# 5. OTP expires after 10 minutes
# ==============================================================================
def test_otp_expires_after_10_minutes():
    raw_otp = "842910"
    seed_user_with_otp("expired.otp@example.com", raw_otp, minutes_offset=-15)  # Created 15 mins ago

    resp = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": "expired.otp@example.com",
        "otp": raw_otp
    })
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()

# ==============================================================================
# 6. Correct OTP verifies account
# ==============================================================================
def test_correct_otp_verifies_account():
    raw_otp = "492018"
    seed_user_with_otp("confirm.valid@example.com", raw_otp)

    resp = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": "confirm.valid@example.com",
        "otp": raw_otp
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "verified successfully" in data["message"].lower()

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "confirm.valid@example.com").first()
    assert user.email_verified_at is not None
    otp = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user.id).first()
    assert otp.used_at is not None
    db.close()

# ==============================================================================
# 7. Incorrect OTP increments attempts
# ==============================================================================
def test_incorrect_otp_increments_attempts():
    raw_otp = "654321"
    seed_user_with_otp("wrong.otp@example.com", raw_otp)

    resp = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": "wrong.otp@example.com",
        "otp": "000000"  # Wrong OTP
    })
    assert resp.status_code == 400
    assert "invalid verification code" in resp.json()["detail"].lower()

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "wrong.otp@example.com").first()
    otp = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user.id).first()
    assert otp.attempt_count == 1
    assert user.email_verified_at is None
    db.close()

# ==============================================================================
# 8. Five failed attempts invalidate/block OTP
# ==============================================================================
def test_five_failed_attempts_invalidates_otp():
    raw_otp = "777888"
    seed_user_with_otp("maxattempts@example.com", raw_otp, attempt_count=4)

    # 5th failed attempt
    resp = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": "maxattempts@example.com",
        "otp": "111222"
    })
    assert resp.status_code == 400
    assert "too many" in resp.json()["detail"].lower() or "invalidated" in resp.json()["detail"].lower()

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "maxattempts@example.com").first()
    otp = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user.id).first()
    assert otp.used_at is not None  # Invalidated
    assert user.email_verified_at is None
    db.close()

# ==============================================================================
# 9. Used OTP cannot be reused
# ==============================================================================
def test_used_otp_cannot_be_reused():
    raw_otp = "333444"
    seed_user_with_otp("reused.otp@example.com", raw_otp)

    # 1st attempt: Success
    resp1 = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": "reused.otp@example.com",
        "otp": raw_otp
    })
    assert resp1.status_code == 200

    # 2nd attempt: Account already verified response
    resp2 = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": "reused.otp@example.com",
        "otp": raw_otp
    })
    assert resp2.status_code == 200
    assert resp2.json()["already_verified"] is True

# ==============================================================================
# 10. Resend invalidates previous OTP
# ==============================================================================
def test_resend_invalidates_previous_otp():
    raw_otp1 = "111111"
    user_id, _ = seed_user_with_otp("resend.prev@example.com", raw_otp1, minutes_offset=-2)

    resend_resp = client.post("/api/v1/auth/resend-verification", json={
        "email": "resend.prev@example.com"
    })
    assert resend_resp.status_code == 200
    assert resend_resp.json()["success"] is True

    db = TestingSessionLocal()
    otps = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user_id).order_by(EmailVerificationOTP.created_at.asc()).all()
    assert len(otps) == 2
    assert otps[0].used_at is not None  # Previous marked used/invalidated
    assert otps[1].used_at is None      # New active OTP
    db.close()

# ==============================================================================
# 11. Resend cooldown works (60s)
# ==============================================================================
def test_resend_cooldown_works():
    # Register user (creates OTP just now)
    client.post("/api/v1/auth/register", json={
        "email": "cooldown.otp@example.com",
        "password": "mountainsecret123",
        "full_name": "Cooldown Test"
    })

    # Immediate resend attempt -> 429
    resend_resp = client.post("/api/v1/auth/resend-verification", json={
        "email": "cooldown.otp@example.com"
    })
    assert resend_resp.status_code == 429
    assert "wait before requesting" in resend_resp.json()["detail"].lower()

# ==============================================================================
# 12. Already verified account cannot request another OTP
# ==============================================================================
def test_already_verified_account_cannot_request_another_otp():
    seed_user_with_otp("already.verified@example.com", "123456", is_verified=True)

    resend_resp = client.post("/api/v1/auth/resend-verification", json={
        "email": "already.verified@example.com"
    })
    assert resend_resp.status_code == 200
    data = resend_resp.json()
    assert "already verified" in data["message"].lower()
    assert data["cooldown_seconds"] == 0

# ==============================================================================
# 13. Unverified login returns EMAIL_NOT_VERIFIED (HTTP 403)
# ==============================================================================
def test_unverified_login_returns_email_not_verified():
    client.post("/api/v1/auth/register", json={
        "email": "login.unverified@example.com",
        "password": "password123",
        "full_name": "Unverified Login"
    })

    login_resp = client.post("/api/v1/auth/login", json={
        "email": "login.unverified@example.com",
        "password": "password123"
    })
    assert login_resp.status_code == 403
    assert login_resp.headers.get("X-Auth-Reason") == "EMAIL_NOT_VERIFIED"
    assert "verify your email" in login_resp.json()["detail"].lower()

# ==============================================================================
# 14. Verified login works normally
# ==============================================================================
def test_verified_login_works_normally():
    seed_user_with_otp("login.verified@example.com", "999000", is_verified=True)

    login_resp = client.post("/api/v1/auth/login", json={
        "email": "login.verified@example.com",
        "password": "mountainPass123"
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login.verified@example.com"
    assert data["user"]["is_verified"] is True

# ==============================================================================
# 15. Brevo provider sends through HTTPS abstraction (Mock urllib)
# ==============================================================================
def test_brevo_provider_sends_through_https_abstraction():
    old_key = settings.BREVO_API_KEY
    settings.BREVO_API_KEY = "xkeysib-mock-test-key-12345"
    try:
        mock_response = MagicMock()
        mock_response.status = 201
        mock_response.read.return_value = json.dumps({"messageId": "<test-msg-id@brevo.com>"}).encode("utf-8")
        mock_response.__enter__.return_value = mock_response

        with patch("urllib.request.urlopen", return_value=mock_response) as mock_urlopen:
            res = EmailService.send_otp_email(
                to_email="test.brevo@example.com",
                recipient_name="Maya",
                otp_code="582910"
            )
            assert res.success is True
            assert res.status == "EMAIL_SENT"
            assert res.provider == "brevo"

            # Check that urllib was called with correct url and headers
            mock_urlopen.assert_called_once()
            req = mock_urlopen.call_args[0][0]
            assert req.full_url == "https://api.brevo.com/v3/smtp/email"
            assert req.headers.get("Api-key") == "xkeysib-mock-test-key-12345"
            body = json.loads(req.data.decode("utf-8"))
            assert body["to"][0]["email"] == "test.brevo@example.com"
            assert "582910" in body["textContent"]
    finally:
        settings.BREVO_API_KEY = old_key

# ==============================================================================
# 16. Missing BREVO_API_KEY produces EMAIL_NOT_CONFIGURED
# ==============================================================================
def test_missing_brevo_api_key_produces_email_not_configured():
    old_brevo = settings.BREVO_API_KEY
    old_email = settings.EMAIL_API_KEY
    settings.BREVO_API_KEY = ""
    settings.EMAIL_API_KEY = ""
    try:
        res = EmailService.send_otp_email(
            to_email="no.config@example.com",
            recipient_name="No Config",
            otp_code="123456"
        )
        assert res.success is False
        assert res.status == "EMAIL_NOT_CONFIGURED"
    finally:
        settings.BREVO_API_KEY = old_brevo
        settings.EMAIL_API_KEY = old_email

# ==============================================================================
# 17. Brevo provider errors are safely normalized
# ==============================================================================
def test_brevo_provider_errors_are_safely_normalized():
    old_key = settings.BREVO_API_KEY
    settings.BREVO_API_KEY = "xkeysib-mock-key"
    try:
        # Rate limit 429
        mock_http_429 = urllib.error.HTTPError("https://api.brevo.com", 429, "Too Many Requests", {}, None)
        with patch("urllib.request.urlopen", side_effect=mock_http_429):
            res_429 = EmailService.send_otp_email("rate@example.com", "Rate User", "123456")
            assert res_429.status == "EMAIL_RATE_LIMITED"
            assert res_429.success is False

        # Server error 500
        mock_http_500 = urllib.error.HTTPError("https://api.brevo.com", 500, "Internal Server Error", {}, None)
        with patch("urllib.request.urlopen", side_effect=mock_http_500):
            res_500 = EmailService.send_otp_email("server@example.com", "Server User", "123456")
            assert res_500.status == "EMAIL_PROVIDER_ERROR"
            assert res_500.success is False
    finally:
        settings.BREVO_API_KEY = old_key

# ==============================================================================
# 18. No SMTP connection is attempted in OTP flow
# ==============================================================================
def test_no_smtp_connection_is_attempted():
    old_smtp = settings.SMTP_HOST
    settings.SMTP_HOST = "smtp.gmail.com"
    settings.SMTP_PORT = 587
    try:
        with patch("smtplib.SMTP") as mock_smtp:
            EmailService.send_otp_email("nosmtp@example.com", "No SMTP", "123456")
            mock_smtp.assert_not_called()
    finally:
        settings.SMTP_HOST = old_smtp

# ==============================================================================
# 19. PostgreSQL / dialect-agnostic schema migration works
# ==============================================================================
def test_database_migration_additive_and_indexes():
    mig_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    ensure_database_schema(mig_engine)

    inspector = inspect(mig_engine)
    tables = set(inspector.get_table_names())
    assert "email_verification_otps" in tables
    assert "users" in tables

    otp_cols = {c["name"] for c in inspector.get_columns("email_verification_otps")}
    assert "otp_hash" in otp_cols
    assert "user_id" in otp_cols
    assert "expires_at" in otp_cols
    assert "used_at" in otp_cols
    assert "attempt_count" in otp_cols

# ==============================================================================
# 20. Existing users remain intact
# ==============================================================================
def test_existing_users_remain_intact():
    mig_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    # Create legacy table with user
    with mig_engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'traveller',
                created_at DATETIME
            )
        """))
        conn.execute(text("""
            INSERT INTO users (id, email, hashed_password, full_name, role)
            VALUES ('u-legacy-1', 'mountain.og@vanvas.com', 'hashed_pass_secret', 'Mountain OG', 'traveller')
        """))
        conn.commit()

    ensure_database_schema(mig_engine)

    Session = sessionmaker(bind=mig_engine)
    db = Session()
    user = db.query(User).filter(User.email == "mountain.og@vanvas.com").first()
    assert user is not None
    assert user.id == "u-legacy-1"
    assert user.full_name == "Mountain OG"
    db.close()
