"""
VANVAS Community Reviews & Moderation Trust Verification Test Suite.
Validates:
1. Published review appears in aggregate.
2. Hidden review does not appear in public aggregate.
3. Removed review does not appear publicly.
4. Reported review appears in admin queue.
5. Duplicate active report from same reporter is rejected.
6. Unauthorized user cannot moderate.
7. User cannot edit another user's review.
8. User cannot delete another user's review.
9. Invalid rating is rejected (out of 1.0 - 5.0 range).
10. Empty or invalid review body is rejected (<5 or >2000 chars).
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Destination, Place, Review, ReviewReport
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def user_author(db):
    user = db.query(User).filter(User.email == "author_review@vanvas.com").first()
    if not user:
        user = User(
            id="usr-review-author-1",
            email="author_review@vanvas.com",
            hashed_password=get_password_hash("Secret123!"),
            full_name="Priya Sharma",
            role="traveller",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def user_other(db):
    user = db.query(User).filter(User.email == "other_traveller@vanvas.com").first()
    if not user:
        user = User(
            id="usr-review-other-2",
            email="other_traveller@vanvas.com",
            hashed_password=get_password_hash("Secret456!"),
            full_name="Rohan Verma",
            role="traveller",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def user_admin(db):
    user = db.query(User).filter(User.email == "admin_mod@vanvas.com").first()
    if not user:
        user = User(
            id="usr-review-admin-1",
            email="admin_mod@vanvas.com",
            hashed_password=get_password_hash("AdminPass123!"),
            full_name="Admin Moderator",
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def token_author(user_author):
    return create_access_token(subject=user_author.id)


@pytest.fixture
def token_other(user_other):
    return create_access_token(subject=user_other.id)


@pytest.fixture
def token_admin(user_admin):
    return create_access_token(subject=user_admin.id)


@pytest.fixture
def test_place(db):
    dest = db.query(Destination).filter(Destination.slug == "review-dest").first()
    if not dest:
        dest = Destination(
            id="dest-review-test",
            name="Review Destination",
            slug="review-dest",
            state="Uttarakhand",
            region="Himalayan",
            tagline="A peaceful test valley for reviews",
            description="Testing destination for review trust verification",
            latitude=30.45,
            longitude=78.07,
        )
        db.add(dest)
        db.commit()
        db.refresh(dest)

    place = db.query(Place).filter(Place.id == "place-review-test-1").first()
    if not place:
        place = Place(
            id="place-review-test-1",
            destination_id=dest.id,
            name="Echo Point Meadow",
            slug="echo-point-meadow",
            category="Nature",
            description="Scenic viewpoint with mountain echoes",
            latitude=30.455,
            longitude=78.075,
        )
        db.add(place)
        db.commit()
        db.refresh(place)
    return place


# =========================================================================
# 1. Published review appears in aggregate
# =========================================================================
def test_1_published_review_appears_in_aggregate(db, token_author, test_place):
    # Clean previous reviews for test_place
    db.query(ReviewReport).filter(ReviewReport.review_id.in_(
        db.query(Review.id).filter(Review.place_id == test_place.id)
    )).delete(synchronize_session=False)
    db.query(Review).filter(Review.place_id == test_place.id).delete()
    db.commit()

    # Post a new review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 4.5,
            "title": "Serene and Untouched",
            "body": "Truly one of the most tranquil meadows in the valley. Highly recommended!",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res.status_code == 201
    created = res.json()
    assert created["rating"] == 4.5
    assert created["status"] == "published"
    assert created["trust_source"] == "VANVAS_COMMUNITY"

    # Get place reviews aggregate
    agg_res = client.get(f"/api/v1/places/{test_place.id}/reviews")
    assert agg_res.status_code == 200
    agg = agg_res.json()
    assert agg["total_reviews"] == 1
    assert agg["average_rating"] == 4.5
    assert len(agg["reviews"]) == 1
    assert agg["reviews"][0]["id"] == created["id"]


# =========================================================================
# 2. Hidden review does not appear in public aggregate
# =========================================================================
def test_2_hidden_review_does_not_appear_in_aggregate(db, token_author, token_admin, test_place):
    # Create review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 3.0,
            "body": "Decent spot but crowded during afternoon hours.",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res.status_code == 201
    review_id = res.json()["id"]

    # Admin hides the review
    mod_res = client.post(
        f"/api/v1/admin/reviews/{review_id}/moderate",
        json={"status": "hidden", "moderation_note": "Hidden pending location verification."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["status"] == "hidden"

    # Verify public aggregate excludes hidden review
    agg_res = client.get(f"/api/v1/places/{test_place.id}/reviews")
    agg = agg_res.json()
    hidden_ids = [r["id"] for r in agg["reviews"]]
    assert review_id not in hidden_ids


# =========================================================================
# 3. Removed review does not appear publicly
# =========================================================================
def test_3_removed_review_does_not_appear_publicly(db, token_author, token_admin, test_place):
    # Create review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 1.0,
            "body": "Spam commercial promotion for external off-platform tour.",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    review_id = res.json()["id"]

    # Admin removes review
    mod_res = client.post(
        f"/api/v1/admin/reviews/{review_id}/moderate",
        json={"status": "removed", "moderation_note": "Violated commercial spam policy."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["status"] == "removed"

    # Verify public aggregate excludes removed review
    agg_res = client.get(f"/api/v1/places/{test_place.id}/reviews")
    agg = agg_res.json()
    assert review_id not in [r["id"] for r in agg["reviews"]]


# =========================================================================
# 4. Reported review appears in admin queue
# =========================================================================
def test_4_reported_review_appears_in_admin_queue(db, token_author, token_other, token_admin, test_place):
    # Create review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 2.0,
            "body": "Misleading information about trail accessibility.",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    review_id = res.json()["id"]

    # Other user reports the review
    rep_res = client.post(
        f"/api/v1/reviews/{review_id}/report",
        json={"reason": "Incorrect trail difficulty and misleading directions."},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert rep_res.status_code == 201

    # Admin fetches reported reviews
    queue_res = client.get(
        "/api/v1/admin/reviews/reported",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert queue_res.status_code == 200
    reported_queue = queue_res.json()
    queued_ids = [r["id"] for r in reported_queue]
    assert review_id in queued_ids

    # Find the review in queue and verify reports list
    target = next(r for r in reported_queue if r["id"] == review_id)
    assert target["status"] == "reported"
    assert len(target["reports"]) >= 1
    assert target["reports"][0]["reason"] == "Incorrect trail difficulty and misleading directions."


# =========================================================================
# 5. Duplicate active report from same reporter is rejected
# =========================================================================
def test_5_duplicate_active_report_rejected(db, token_author, token_other, test_place):
    # Create review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 4.0,
            "body": "Great cafe with lovely tea selection and pine view.",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    review_id = res.json()["id"]

    # First report
    rep1 = client.post(
        f"/api/v1/reviews/{review_id}/report",
        json={"reason": "Incorrect operating hours listed."},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert rep1.status_code == 201

    # Duplicate second report by same user
    rep2 = client.post(
        f"/api/v1/reviews/{review_id}/report",
        json={"reason": "Incorrect operating hours listed again."},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert rep2.status_code == 400
    assert "already submitted" in rep2.json()["detail"].lower()


# =========================================================================
# 6. Unauthorized user cannot moderate
# =========================================================================
def test_6_unauthorized_user_cannot_moderate(token_author, token_other):
    res = client.post(
        "/api/v1/admin/reviews/some-review-id/moderate",
        json={"status": "hidden"},
        headers={"Authorization": f"Bearer {token_author}"},
    )
    # Standard role-based access control returns 403 Forbidden for non-admins
    assert res.status_code == 403


# =========================================================================
# 7. User cannot edit another user's review
# =========================================================================
def test_7_user_cannot_edit_another_users_review(token_author, token_other, test_place):
    # Author creates review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 5.0,
            "body": "Peaceful riverbank retreat with clear alpine waters.",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    review_id = res.json()["id"]

    # Other user attempts edit
    edit_res = client.put(
        f"/api/v1/reviews/{review_id}",
        json={"rating": 1.0, "body": "Attempted malicious overwrite of content."},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert edit_res.status_code == 403


# =========================================================================
# 8. User cannot delete another user's review
# =========================================================================
def test_8_user_cannot_delete_another_users_review(token_author, token_other, test_place):
    # Author creates review
    res = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={
            "rating": 4.8,
            "body": "Breathtaking sunset spot above the cloudline.",
        },
        headers={"Authorization": f"Bearer {token_author}"},
    )
    review_id = res.json()["id"]

    # Other user attempts deletion
    del_res = client.delete(
        f"/api/v1/reviews/{review_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert del_res.status_code == 403


# =========================================================================
# 9. Invalid rating is rejected
# =========================================================================
def test_9_invalid_rating_rejected(token_author, test_place):
    # Rating > 5.0
    res_high = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={"rating": 6.5, "body": "Rating exceeds maximum allowed value."},
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res_high.status_code == 400

    # Rating < 1.0
    res_low = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={"rating": 0.5, "body": "Rating below minimum allowed value."},
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res_low.status_code == 400


# =========================================================================
# 10. Empty/invalid review body is rejected
# =========================================================================
def test_10_invalid_body_length_rejected(token_author, test_place):
    # Body too short (< 5 chars)
    res_short = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={"rating": 5.0, "body": "Hi"},
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res_short.status_code == 400

    # Empty body
    res_empty = client.post(
        f"/api/v1/places/{test_place.id}/reviews",
        json={"rating": 5.0, "body": "   "},
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res_empty.status_code == 400
