import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database.session import Base, get_db
from app.models.models import (
    User, UserPreference, Destination, Trip, Expense, ExpenseShare, SettlementPayment,
    SoloMatch, SoloDirectMessage, TravelerBlock, CircleMessage, TravelCircle,
    UserAvatarBlob
)
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings
from app.services.storage_service import StorageService, StorageServiceException

# In-memory SQLite for testing with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    try:
        yield
    finally:
        settings.ENVIRONMENT = orig_env
        app.dependency_overrides.pop(get_db, None)

client = TestClient(app)

def create_user_helper(email="testdelete@vanvas.com", password="securepassword123"):
    db = TestingSessionLocal()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()

    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name="Deletion Test User",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}
    db.close()
    return user, headers


def test_delete_account_unauthenticated():
    """Unauthenticated request must return 401."""
    res = client.delete("/api/v1/auth/account")
    assert res.status_code == 401


def test_delete_account_incorrect_password():
    """Incorrect password confirmation must return 400 Bad Request."""
    user, headers = create_user_helper("wrongpass@vanvas.com", "mypassword123")
    res = client.request("DELETE", "/api/v1/auth/account", headers=headers, json={"password": "wrongpassword"})
    assert res.status_code == 400
    assert "Password confirmation is incorrect" in res.json()["detail"]

    # Verify user still exists
    db = TestingSessionLocal()
    assert db.query(User).filter(User.id == user.id).first() is not None
    db.close()


def test_delete_account_correct_password_and_cascades():
    """Correct password deletion must cascade trips and clean related records."""
    user, headers = create_user_helper("cascade@vanvas.com", "correctpass123")
    db = TestingSessionLocal()

    # Query or create unique destination
    dest = db.query(Destination).first()
    if not dest:
        dest = Destination(
            name="Spiti Test",
            slug="spiti-del-test",
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="Middle Land Test",
            description="High altitude test desert",
            latitude=32.0,
            longitude=78.0
        )
        db.add(dest)
        db.flush()

    # Add trip
    trip = Trip(
        destination_id=dest.id,
        user_id=user.id,
        title="Himalayan Loop",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=5),
        num_days=5
    )
    db.add(trip)
    db.flush()

    # Add expense share
    expense = Expense(trip_id=trip.id, user_id=user.id, title="Chai & Maggi", amount=250.0)
    db.add(expense)
    db.flush()

    share = ExpenseShare(expense_id=expense.id, user_id=user.id, owed_amount=250.0)
    db.add(share)

    # Add peer settlement
    peer = User(email="peer@vanvas.com", hashed_password="pw", full_name="Peer")
    db.add(peer)
    db.flush()

    settlement = SettlementPayment(trip_id=trip.id, payer_user_id=user.id, receiver_user_id=peer.id, amount=100.0)
    db.add(settlement)

    # Add travel circle & message
    circle = TravelCircle(
        name="Parvati Trekkers",
        creator_user_id=user.id,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=3)
    )
    db.add(circle)
    db.flush()

    msg = CircleMessage(circle_id=circle.id, user_id=user.id, content="Meeting at Kasol bridge at 9 AM")
    db.add(msg)
    db.commit()
    db.close()

    # Call delete
    res = client.request("DELETE", "/api/v1/auth/account", headers=headers, json={"password": "correctpass123"})
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"

    # Verify user is gone
    db = TestingSessionLocal()
    assert db.query(User).filter(User.id == user.id).first() is None
    # Verify trip cascaded
    assert db.query(Trip).filter(Trip.user_id == user.id).first() is None
    # Verify shares and settlements cleaned
    assert db.query(ExpenseShare).filter(ExpenseShare.user_id == user.id).first() is None
    assert db.query(SettlementPayment).filter(SettlementPayment.payer_user_id == user.id).first() is None
    # Verify circle created by user cleaned
    assert db.query(TravelCircle).filter(TravelCircle.creator_user_id == user.id).first() is None
    db.close()


def test_delete_account_circle_message_anonymization():
    """When user leaves, their messages in circles created by OTHERS should be anonymized (user_id=None)."""
    owner, _ = create_user_helper("circleowner@vanvas.com", "ownerpass123")
    member, member_headers = create_user_helper("circlemember@vanvas.com", "memberpass123")

    db = TestingSessionLocal()
    circle = TravelCircle(
        name="Spiti Explorers",
        creator_user_id=owner.id,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=2)
    )
    db.add(circle)
    db.flush()

    msg = CircleMessage(circle_id=circle.id, user_id=member.id, content="Leaving trail tips")
    db.add(msg)
    db.commit()
    msg_id = msg.id
    db.close()

    # Member deletes their account
    res = client.request("DELETE", "/api/v1/auth/account", headers=member_headers, json={"password": "memberpass123"})
    assert res.status_code == 200

    # Verify message still exists for the group, but user_id is now None (anonymized)
    db = TestingSessionLocal()
    persisted_msg = db.query(CircleMessage).filter(CircleMessage.id == msg_id).first()
    assert persisted_msg is not None
    assert persisted_msg.user_id is None
    assert persisted_msg.content == "Leaving trail tips"
    db.close()


def test_storage_deletion_cloudinary():
    """Verify Cloudinary remote destroy request is formatted correctly."""
    with patch("urllib.request.urlopen") as mock_urlopen, \
         patch("app.core.config.settings.STORAGE_PROVIDER", "cloudinary"), \
         patch("app.core.config.settings.CLOUDINARY_CLOUD_NAME", "vanvas_cloud"), \
         patch("app.core.config.settings.CLOUDINARY_API_KEY", "12345678"), \
         patch("app.core.config.settings.CLOUDINARY_API_SECRET", "secret_key"):

        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"result": "ok"}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = StorageService._delete_cloudinary("users/user_abc/avatar/pic.webp")
        assert result is True
        assert mock_urlopen.called
        req = mock_urlopen.call_args[0][0]
        assert "cloudinary.com" in req.full_url
        assert b"public_id=users_user_abc_avatar_pic" in req.data


def test_storage_deletion_s3():
    """Verify S3 remote delete_object request is invoked with correct bucket and key."""
    with patch("boto3.session.Session") as mock_session_cls, \
         patch("app.core.config.settings.STORAGE_PROVIDER", "s3"), \
         patch("app.core.config.settings.S3_BUCKET_NAME", "vanvas-avatars"), \
         patch("app.core.config.settings.S3_ACCESS_KEY_ID", "key"), \
         patch("app.core.config.settings.S3_SECRET_ACCESS_KEY", "secret"):

        mock_s3 = MagicMock()
        mock_session_cls.return_value.client.return_value = mock_s3

        result = StorageService._delete_s3("users/user_xyz/avatar/photo.webp")
        assert result is True
        mock_s3.delete_object.assert_called_once_with(
            Bucket="vanvas-avatars",
            Key="users/user_xyz/avatar/photo.webp"
        )


def test_remote_storage_failure_aborts_deletion():
    """If remote cloud storage fails during deletion, the API must return 502 and NOT claim deletion."""
    user, headers = create_user_helper("failremote@vanvas.com", "pass123")
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == user.id).first()
    u.avatar_storage_key = "users/failremote/avatar/bad.webp"
    db.commit()
    db.close()

    with patch.object(StorageService, "delete_profile_photo", side_effect=StorageServiceException("PROFILE_STORAGE_ERROR", "Cloudinary timeout")):
        res = client.request("DELETE", "/api/v1/auth/account", headers=headers, json={"password": "pass123"})
        assert res.status_code == 502
        assert "Unable to delete cloud avatar assets" in res.json()["detail"]

    # Verify user was NOT deleted
    db = TestingSessionLocal()
    assert db.query(User).filter(User.id == user.id).first() is not None
    db.close()
