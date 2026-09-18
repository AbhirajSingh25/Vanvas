from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Review, ReviewReport, Place
from app.schemas.schemas import (
    ReviewCreate, ReviewUpdate, ReviewResponse, ReviewAggregateResponse,
    ReviewReportCreate, ReviewReportResponse, ReviewModerateRequest
)
from app.api.deps import get_current_user, get_current_admin, get_current_user_optional

router = APIRouter()


def _to_review_response(review: Review) -> ReviewResponse:
    user_name = review.user.full_name if review.user else "VANVAS Traveller"
    user_avatar = review.user.avatar_url if review.user else None
    return ReviewResponse(
        id=review.id,
        place_id=review.place_id,
        user_id=review.user_id,
        user_name=user_name,
        user_avatar=user_avatar,
        rating=review.rating,
        title=review.title,
        body=review.body,
        status=review.status,
        created_at=review.created_at,
        updated_at=review.updated_at,
        trust_source="VANVAS_COMMUNITY",
    )


@router.post("/places/{place_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_place_review(
    place_id: str,
    req: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new authentic community review for a verified or live destination place.
    """
    if not place_id or not place_id.strip():
        raise HTTPException(status_code=400, detail="A valid place reference is required.")

    if req.rating < 1.0 or req.rating > 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0.")

    clean_body = (req.body or "").strip()
    if len(clean_body) < 5 or len(clean_body) > 2000:
        raise HTTPException(status_code=400, detail="Review body must be between 5 and 2000 characters.")

    review = Review(
        user_id=current_user.id,
        place_id=place_id.strip(),
        rating=round(float(req.rating), 1),
        title=req.title.strip() if req.title else None,
        body=clean_body,
        status="published",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return _to_review_response(review)


@router.get("/places/{place_id}/reviews", response_model=ReviewAggregateResponse)
def get_place_reviews(
    place_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves published community reviews for a place and calculates the genuine aggregate rating.
    Never fabricates ratings or reviews when none exist.
    """
    published_reviews = (
        db.query(Review)
        .filter(Review.place_id == place_id.strip(), Review.status == "published")
        .order_by(Review.created_at.desc())
        .all()
    )

    total_count = len(published_reviews)
    if total_count > 0:
        avg_rating = round(sum(r.rating for r in published_reviews) / total_count, 1)
    else:
        avg_rating = None

    review_items = [_to_review_response(r) for r in published_reviews]

    return ReviewAggregateResponse(
        place_id=place_id.strip(),
        average_rating=avg_rating,
        total_reviews=total_count,
        reviews=review_items,
        trust_source="VANVAS_COMMUNITY",
    )


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: str,
    req: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates an existing community review. Only the review creator can edit.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to edit this review.")

    if req.rating is not None:
        if req.rating < 1.0 or req.rating > 5.0:
            raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0.")
        review.rating = round(float(req.rating), 1)

    if req.title is not None:
        review.title = req.title.strip() if req.title else None

    if req.body is not None:
        clean_body = req.body.strip()
        if len(clean_body) < 5 or len(clean_body) > 2000:
            raise HTTPException(status_code=400, detail="Review body must be between 5 and 2000 characters.")
        review.body = clean_body

    review.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(review)

    return _to_review_response(review)


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a review. Only the owner or an admin can delete.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to delete this review.")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully", "id": review_id}


@router.post("/reviews/{review_id}/report", response_model=ReviewReportResponse, status_code=status.HTTP_201_CREATED)
def report_review(
    review_id: str,
    req: ReviewReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a community moderation report for an inappropriate review.
    Prevents duplicate active reports from the same user.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    clean_reason = (req.reason or "").strip()
    if len(clean_reason) < 3:
        raise HTTPException(status_code=400, detail="Please provide a clear reason for reporting.")

    # Check for existing active pending report
    existing = (
        db.query(ReviewReport)
        .filter(
            ReviewReport.review_id == review_id,
            ReviewReport.reporter_user_id == current_user.id,
            ReviewReport.status == "pending"
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted an active report for this review.")

    report = ReviewReport(
        review_id=review_id,
        reporter_user_id=current_user.id,
        reason=clean_reason,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(report)

    # Flag review as reported if currently published
    if review.status == "published":
        review.status = "reported"

    db.commit()
    db.refresh(report)

    return ReviewReportResponse(
        id=report.id,
        review_id=report.review_id,
        reporter_user_id=report.reporter_user_id,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
    )


# ----------------- Admin Moderation Endpoints -----------------
@router.get("/admin/reviews/reported", response_model=List[ReviewResponse])
def get_reported_reviews(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Admin diagnostic & moderation endpoint to view all reported or pending reviews.
    """
    reported = (
        db.query(Review)
        .filter(Review.status.in_(["reported", "hidden"]))
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_to_review_response(r) for r in reported]


@router.post("/admin/reviews/{review_id}/moderate", response_model=ReviewResponse)
def moderate_review(
    review_id: str,
    req: ReviewModerateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Admin moderation endpoint to change status (published, hidden, removed) and attach moderation notes.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    valid_statuses = ["published", "hidden", "removed"]
    if req.status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    review.status = req.status.lower()
    if req.moderation_note:
        review.moderation_note = req.moderation_note.strip()
    review.updated_at = datetime.now(timezone.utc)

    # If resolved, update pending reports to 'reviewed'
    pending_reports = db.query(ReviewReport).filter(ReviewReport.review_id == review_id, ReviewReport.status == "pending").all()
    for rep in pending_reports:
        rep.status = "reviewed"

    db.commit()
    db.refresh(review)

    return _to_review_response(review)
