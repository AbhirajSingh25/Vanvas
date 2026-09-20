import io
import pytest
from datetime import datetime, timezone
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db, ensure_database_schema
from app.models.models import User, UserPreference
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings
from app.services.storage_service import StorageService, StorageServiceException

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
def setup_test_db(tmp_path, monkeypatch):
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    
    # Use temporary upload directory for test isolation
    test_upload_dir = tmp_path / "test_uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(settings, "STORAGE_UPLOAD_DIR", str(test_upload_dir))
    monkeypatch.setattr(settings, "STORAGE_PROVIDER", "local")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    
    yield
    
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def create_test_user(email: str = "traveler@vanvas.com", name: str = "Tenzing Norgay") -> tuple[User, str, dict]:
    db = TestingSessionLocal()
    user = User(
        email=email,
        full_name=name,
        hashed_password=get_password_hash("securepass123"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.flush()
    pref = UserPreference(user_id=user.id)
    db.add(pref)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    db.close()
    return user, token, headers

def generate_test_image(format: str = "JPEG", size: tuple[int, int] = (600, 400), color: str = "rgb(30, 80, 50)") -> bytes:
    img = Image.new("RGB" if format != "PNG" else "RGBA", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


# 1. Valid JPEG Upload
def test_avatar_upload_jpeg_success():
    user, _, headers = create_test_user("jpeg@vanvas.com", "JPEG Traveler")
    img_bytes = generate_test_image(format="JPEG", size=(400, 400))
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("photo.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "avatar_url" in data
    assert data["avatar_url"].startswith("http") or data["avatar_url"].startswith("/api/v1/auth/profile/avatar/file/")
    assert data["message"] == "Profile photo updated successfully."
    
    # Verify DB state
    db = TestingSessionLocal()
    updated_user = db.query(User).filter(User.id == user.id).first()
    assert updated_user.avatar_url == data["avatar_url"]
    assert updated_user.avatar_storage_key is not None
    assert updated_user.avatar_storage_key.startswith(f"users/{user.id}/avatar/")
    assert updated_user.avatar_storage_key.endswith(".webp")
    db.close()


# 2. Valid PNG Upload (with Alpha)
def test_avatar_upload_png_success():
    user, _, headers = create_test_user("png@vanvas.com", "PNG Traveler")
    img_bytes = generate_test_image(format="PNG", size=(300, 300))
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("badge.png", img_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["avatar_url"] is not None


# 3. Valid WebP Upload
def test_avatar_upload_webp_success():
    user, _, headers = create_test_user("webp@vanvas.com", "WebP Traveler")
    img_bytes = generate_test_image(format="WEBP", size=(250, 250))
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("avatar.webp", img_bytes, "image/webp")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["avatar_url"] is not None


# 4. Unauthenticated Upload Rejected with 401
def test_avatar_upload_unauthenticated_fails_401():
    img_bytes = generate_test_image(format="JPEG")
    response = client.post(
        "/api/v1/auth/profile/avatar",
        files={"file": ("photo.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 401


# 5. File Exceeding Max Size (>5MB) Rejected
def test_avatar_upload_file_exceeding_max_size_fails(monkeypatch):
    user, _, headers = create_test_user("large@vanvas.com", "Large File Traveler")
    # Temporarily set max size to 100 KB for rapid test
    monkeypatch.setattr(settings, "MAX_AVATAR_SIZE_BYTES", 100 * 1024)
    
    large_bytes = b"X" * (120 * 1024)
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("large.jpg", large_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "exceeds maximum allowed size" in response.json()["detail"]


# 6. Corrupt Non-Image File Rejected
def test_avatar_upload_corrupt_file_fails():
    user, _, headers = create_test_user("corrupt@vanvas.com", "Corrupt File Traveler")
    corrupt_bytes = b"This is plain text pretending to be an image file."
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("fake.jpg", corrupt_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Invalid or corrupt image" in response.json()["detail"]


# 7. Invalid MIME Type Rejected
def test_avatar_upload_invalid_mime_type_fails():
    user, _, headers = create_test_user("invalidmime@vanvas.com", "Invalid MIME Traveler")
    txt_bytes = b"hello world"
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("file.txt", txt_bytes, "text/plain")}
    )
    assert response.status_code == 400
    assert "Invalid image format" in response.json()["detail"]


# 8. Empty File Rejected
def test_avatar_upload_empty_file_fails():
    user, _, headers = create_test_user("empty@vanvas.com", "Empty File Traveler")
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Empty image file" in response.json()["detail"]


# 9. Square Crop and Max 512x512 Resize
def test_avatar_square_crop_and_resize():
    user, _, headers = create_test_user("resizetest@vanvas.com", "Resize Traveler")
    # High resolution rectangular image: 1200x800
    img_bytes = generate_test_image(format="JPEG", size=(1200, 800))
    
    response = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("rect.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    
    # Read back the saved avatar file
    db = TestingSessionLocal()
    updated_user = db.query(User).filter(User.id == user.id).first()
    key = updated_user.avatar_storage_key
    file_bytes, _ = StorageService.read_local_avatar(key)
    assert file_bytes is not None
    
    # Verify processed image properties with PIL
    processed_img = Image.open(io.BytesIO(file_bytes))
    assert processed_img.format == "WEBP"
    assert processed_img.size == (512, 512)
    db.close()


# 10. Avatar Replacement Deletes Old Storage File
def test_avatar_replacement_deletes_old_storage_file():
    user, _, headers = create_test_user("replacetest@vanvas.com", "Replace Traveler")
    
    # First upload
    img1 = generate_test_image(format="JPEG", size=(200, 200), color="rgb(10, 20, 30)")
    r1 = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("first.jpg", img1, "image/jpeg")}
    )
    assert r1.status_code == 200
    
    db = TestingSessionLocal()
    u1 = db.query(User).filter(User.id == user.id).first()
    first_key = u1.avatar_storage_key
    db.close()
    
    # Confirm first file exists in storage
    bytes1, _ = StorageService.read_local_avatar(first_key)
    assert bytes1 is not None
    
    # Second upload replaces first
    img2 = generate_test_image(format="JPEG", size=(200, 200), color="rgb(90, 80, 70)")
    r2 = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("second.jpg", img2, "image/jpeg")}
    )
    assert r2.status_code == 200
    
    db = TestingSessionLocal()
    u2 = db.query(User).filter(User.id == user.id).first()
    second_key = u2.avatar_storage_key
    db.close()
    
    assert second_key != first_key
    # First file should be deleted from storage
    bytes_old, _ = StorageService.read_local_avatar(first_key)
    assert bytes_old is None
    # Second file should exist
    bytes_new, _ = StorageService.read_local_avatar(second_key)
    assert bytes_new is not None


# 11. Avatar Deletion Success
def test_avatar_deletion_success():
    user, _, headers = create_test_user("deletetest@vanvas.com", "Delete Traveler")
    img = generate_test_image(format="JPEG", size=(200, 200))
    client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("photo.jpg", img, "image/jpeg")}
    )
    
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == user.id).first()
    key = u.avatar_storage_key
    assert key is not None
    db.close()
    
    # Delete avatar
    del_res = client.delete("/api/v1/auth/profile/avatar", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["avatar_url"] is None
    
    # Confirm DB is cleared
    db = TestingSessionLocal()
    u_after = db.query(User).filter(User.id == user.id).first()
    assert u_after.avatar_url is None
    assert u_after.avatar_storage_key is None
    db.close()
    
    # Confirm file is gone from storage
    file_bytes, _ = StorageService.read_local_avatar(key)
    assert file_bytes is None


# 12. Avatar Deletion Unauthenticated Rejected
def test_avatar_deletion_unauthenticated_fails_401():
    del_res = client.delete("/api/v1/auth/profile/avatar")
    assert del_res.status_code == 401


# 13. Serve Local Avatar Endpoint
def test_serve_local_avatar_file_success():
    user, _, headers = create_test_user("servetest@vanvas.com", "Serve Traveler")
    img = generate_test_image(format="JPEG", size=(200, 200))
    upload_res = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": ("photo.jpg", img, "image/jpeg")}
    )
    assert upload_res.status_code == 200
    avatar_url = upload_res.json()["avatar_url"]
    
    # Fetch served avatar
    serve_res = client.get(avatar_url)
    assert serve_res.status_code == 200
    assert serve_res.headers["content-type"] == "image/webp"
    assert "public, max-age=86400" in serve_res.headers.get("cache-control", "")
    assert len(serve_res.content) > 0


# 14. Serve Local Avatar Not Found 404
def test_serve_local_avatar_file_not_found():
    res = client.get("/api/v1/auth/profile/avatar/file/users/nonexistent/avatar/abc.webp")
    assert res.status_code == 404


# 15. Directory Traversal Attack Prevention
def test_serve_local_avatar_directory_traversal_prevention():
    res = client.get("/api/v1/auth/profile/avatar/file/../../etc/passwd")
    # FastAPI path parser / our security check rejects with 400 or 404
    assert res.status_code in (400, 404)


# 16. Storage Service Cloudinary Unconfigured Error Handling
def test_storage_service_cloudinary_unconfigured_error(monkeypatch):
    monkeypatch.setattr(settings, "STORAGE_PROVIDER", "cloudinary")
    monkeypatch.setattr(settings, "CLOUDINARY_CLOUD_NAME", None)
    
    assert StorageService.is_configured() is False
    with pytest.raises(StorageServiceException) as exc_info:
        StorageService.upload_profile_photo("test/key.webp", b"data", "image/webp")
    assert exc_info.value.code == "PROFILE_STORAGE_NOT_CONFIGURED"
    assert "PROFILE_STORAGE_NOT_CONFIGURED" in str(exc_info.value)


# 17. Storage Key Does Not Leak User Filename
def test_storage_key_uses_secure_uuid_no_user_filename():
    user, _, headers = create_test_user("safekey@vanvas.com", "Safe Key Traveler")
    img = generate_test_image(format="JPEG", size=(200, 200))
    malicious_filename = "../../../secret_travel_plan.jpg"
    
    res = client.post(
        "/api/v1/auth/profile/avatar",
        headers=headers,
        files={"file": (malicious_filename, img, "image/jpeg")}
    )
    assert res.status_code == 200
    
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == user.id).first()
    key = u.avatar_storage_key
    db.close()
    
    assert "secret_travel_plan" not in key
    assert ".." not in key
    assert key.startswith(f"users/{user.id}/avatar/")


# 18. Database Migration Schema Check
def test_database_migration_schema_includes_avatar_storage_key():
    ensure_database_schema(test_engine)
    inspector = inspect(test_engine)
    columns = [col["name"] for col in inspector.get_columns("users")]
    assert "avatar_storage_key" in columns
    assert "avatar_url" in columns
