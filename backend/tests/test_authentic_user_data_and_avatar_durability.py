import io
import os
from unittest.mock import patch
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, UserPreference, UserAvatarBlob, Destination
from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.services.storage_service import StorageService, StorageServiceException


client = TestClient(app)


def _make_png_bytes(color=(30, 80, 60)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (128, 128), color=color)
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_new_user_has_blank_personal_preferences_and_no_preset_avatar():
    email = "fresh_authentic_user@vanvas.com"
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Fresh Traveler"},
    )
    assert reg.status_code == 200

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        token = create_access_token(user.id)
        pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
        assert pref is not None

        # No fabricated personal defaults
        assert user.avatar_type == "none"
        assert user.avatar_preset is None
        assert pref.preferred_travel_style is None
        assert pref.wake_up_preference is None
        assert pref.activity_intensity is None
        assert pref.dietary_preference is None
        assert pref.interests is None
        assert pref.accommodation_preference is None
        assert pref.transport_preference is None
        assert pref.companion_style is None

        # Functional system defaults remain intact
        assert pref.currency == "INR"
        assert pref.language == "en"
        assert pref.region == "India"
        assert pref.allow_friend_requests_via_id is True

        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        me = me_resp.json()
        assert me["avatar_type"] == "none"
        assert me["avatar_preset"] is None
        assert me["preferences"]["preferred_travel_style"] is None
    finally:
        u = db.query(User).filter(User.email == email).first()
        if u:
            db.delete(u)
            db.commit()
        db.close()


def test_seed_database_never_inserts_demo_users_in_production(monkeypatch):
    from app.seed.seed_data import seed_database

    db = SessionLocal()
    try:
        # Remove demo users if present in test DB
        for demo_email in ("admin@vanvas.com", "traveller@vanvas.com"):
            u = db.query(User).filter(User.email == demo_email).first()
            if u:
                db.delete(u)
        db.commit()

        monkeypatch.setattr(settings, "ENVIRONMENT", "production")
        monkeypatch.setenv("SEED_DEMO_USERS", "true")
        seed_database(db=db)

        assert db.query(User).filter(User.email == "admin@vanvas.com").first() is None
        assert db.query(User).filter(User.email == "traveller@vanvas.com").first() is None
        assert db.query(Destination).count() >= 1
    finally:
        db.close()


def test_avatar_upload_propagates_db_blob_failure_and_preserves_existing_avatar(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "STORAGE_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "STORAGE_PROVIDER", "local")

    email = "avatar_durability_user@vanvas.com"
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == email).first()
        if u:
            db.delete(u)
            db.commit()
        user = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name="Avatar Durability",
            avatar_type="none",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
        user_id = user.id
    finally:
        db.close()

    # 1. First upload succeeds
    res1 = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("first.png", _make_png_bytes((20, 90, 60)), "image/png")},
    )
    assert res1.status_code == 200
    first_url = res1.json()["avatar_url"]

    # 2. _persist_to_database itself must raise StorageServiceException on DB failure
    class BrokenSession:
        def query(self, *args, **kwargs):
            raise RuntimeError("Simulated DB connection failure")

    try:
        StorageService._persist_to_database(
            storage_key="users/broken/avatar/test.webp",
            file_bytes=b"123",
            content_type="image/webp",
            user_id=user_id,
            db=BrokenSession(),
        )
        assert False, "Expected StorageServiceException"
    except StorageServiceException as exc:
        assert exc.code == "PROFILE_STORAGE_ERROR"

    # 3. Second upload fails in _persist_to_database -> must fail 500 and keep first_url
    with patch.object(
        StorageService,
        "_persist_to_database",
        side_effect=StorageServiceException("PROFILE_STORAGE_ERROR", "DB write error"),
    ):
        with patch.object(StorageService, "delete_profile_photo") as mock_delete:
            res2 = client.post(
                "/api/v1/auth/profile/avatar",
                headers=headers,
                files={"file": ("second.png", _make_png_bytes((150, 40, 40)), "image/png")},
            )
            assert res2.status_code == 500
            mock_delete.assert_not_called()

    me = client.get("/api/v1/auth/me", headers=headers).json()
    assert me["avatar_url"] == first_url

    # 3. Even if local disk files are wiped, serve_avatar_file recovers from UserAvatarBlob
    for root, _, files in os.walk(tmp_path):
        for f in files:
            os.remove(os.path.join(root, f))

    serve_resp = client.get(first_url)
    assert serve_resp.status_code == 200
    assert len(serve_resp.content) > 0

    db = SessionLocal()
    try:
        db.query(UserAvatarBlob).filter(UserAvatarBlob.user_id == user_id).delete()
        u = db.query(User).filter(User.id == user_id).first()
        if u:
            db.delete(u)
        db.commit()
    finally:
        db.close()


def test_friend_request_privacy_syncs_via_profile_and_preferences():
    email = "privacy_sync_user@vanvas.com"
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == email).first()
        if u:
            db.delete(u)
            db.commit()
        user = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name="Privacy Sync",
            avatar_type="none",
        )
        db.add(user)
        db.flush()
        db.add(UserPreference(user_id=user.id, allow_friend_requests_via_id=True))
        db.commit()
        db.refresh(user)
        headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
        user_id = user.id
    finally:
        db.close()

    # Toggle false via /preferences
    r1 = client.put(
        "/api/v1/auth/preferences",
        headers=headers,
        json={"allow_friend_requests_via_id": False},
    )
    assert r1.status_code == 200
    assert r1.json()["allow_friend_requests_via_id"] is False

    # Toggle true via /profile (mobile compatibility path)
    r2 = client.put(
        "/api/v1/auth/profile",
        headers=headers,
        json={"allow_friend_requests_via_id": True},
    )
    assert r2.status_code == 200
    assert r2.json()["preferences"]["allow_friend_requests_via_id"] is True

    db = SessionLocal()
    try:
        u = db.query(User).filter(User.id == user_id).first()
        if u:
            db.delete(u)
            db.commit()
    finally:
        db.close()


def test_full_authenticated_session_and_avatar_recovery_integration(tmp_path, monkeypatch):
    """
    Real backend integration test (no mocked auth APIs):
    Registration -> verification -> login -> /auth/me -> preference persistence ->
    avatar upload -> DB blob verification -> local file deletion recovery ->
    fresh login session restoration -> replacement commit ordering.
    """
    from datetime import datetime, timezone

    monkeypatch.setattr(settings, "STORAGE_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "STORAGE_PROVIDER", "local")

    email = "full_integration_avatar@vanvas.com"
    password = "IntegrationPass!2026"

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            db.query(UserAvatarBlob).filter(UserAvatarBlob.user_id == existing.id).delete()
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Integration Traveler"},
    )
    assert reg.status_code == 200

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        user.email_verified_at = datetime.now(timezone.utc)
        db.commit()
        user_id = user.id
    finally:
        db.close()

    login1 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login1.status_code == 200
    token1 = login1.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # Update preferences
    pref_res = client.put(
        "/api/v1/auth/preferences",
        headers=h1,
        json={"preferred_travel_style": "Slow", "allow_friend_requests_via_id": False},
    )
    assert pref_res.status_code == 200

    # Upload avatar
    up_res = client.post(
        "/api/v1/auth/profile/avatar",
        headers=h1,
        files={"file": ("portrait.png", _make_png_bytes((40, 110, 80)), "image/png")},
    )
    assert up_res.status_code == 200
    avatar_url = up_res.json()["avatar_url"]
    assert up_res.json()["avatar_type"] == "uploaded"

    # Verify DB UserAvatarBlob exists and decodes cleanly
    db = SessionLocal()
    try:
        u_db = db.query(User).filter(User.id == user_id).first()
        assert u_db is not None
        assert u_db.avatar_storage_key and u_db.avatar_storage_key.startswith(f"users/{user_id}/avatar/")
        blob = db.query(UserAvatarBlob).filter(UserAvatarBlob.storage_key == u_db.avatar_storage_key).first()
        assert blob is not None
        assert blob.byte_size > 0
        decoded = Image.open(io.BytesIO(blob.data))
        assert decoded.size[0] > 0 and decoded.size[1] > 0
    finally:
        db.close()

    # Wipe local disk files and confirm recovery from DB blob
    for root, _, files in os.walk(tmp_path):
        for fname in files:
            os.remove(os.path.join(root, fname))

    fetch_res = client.get(avatar_url)
    assert fetch_res.status_code == 200
    recovered_img = Image.open(io.BytesIO(fetch_res.content))
    assert recovered_img.format == "WEBP"

    # Fresh login restores identical avatar & preferences
    login2 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login2.status_code == 200
    token2 = login2.json()["access_token"]
    me2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token2}"}).json()
    assert me2["avatar_url"] == avatar_url
    assert me2["avatar_type"] == "uploaded"
    assert me2["preferences"]["preferred_travel_style"] == "Slow"
    assert me2["preferences"]["allow_friend_requests_via_id"] is False

    # Cleanup
    db = SessionLocal()
    try:
        db.query(UserAvatarBlob).filter(UserAvatarBlob.user_id == user_id).delete()
        u_del = db.query(User).filter(User.id == user_id).first()
        if u_del:
            db.delete(u_del)
        db.commit()
    finally:
        db.close()
