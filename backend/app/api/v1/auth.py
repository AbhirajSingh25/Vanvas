from datetime import datetime, timezone, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import (
    User, UserPreference, Trip, SavedPlace, Review, Booking,
    Itinerary, Expense, ChecklistItem
)
from app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    UserPreferenceSchema, UserProfileUpdateRequest,
    PasswordChangeRequest, AccountDeleteRequest,
    UserStatsResponse, UserDataExportResponse
)
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

PREFERENCE_FIELDS = [
    "preferred_travel_style", "wake_up_preference", "activity_intensity",
    "dietary_preference", "interests", "accommodation_preference",
    "transport_preference", "companion_style", "language", "region",
    "currency", "theme", "location_mode", "notify_trip_reminders",
    "notify_trip_changes", "notify_booking_updates", "notify_suggestions",
    "notify_copilot_updates", "notify_announcements", "ai_copilot_enabled",
    "ai_personalized_recommendations", "ai_use_travel_preferences",
    "ai_use_trip_context"
]

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    if not user_in.full_name or not user_in.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name cannot be empty"
        )

    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role="traveller"
    )
    db.add(user)
    db.flush()

    # Create default preferences
    pref = UserPreference(user_id=user.id)
    db.add(pref)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.preferences:
        pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
        if not pref:
            pref = UserPreference(user_id=current_user.id)
            db.add(pref)
            db.commit()
            db.refresh(current_user)
    return current_user

@router.get("/profile/stats", response_model=UserStatsResponse)
def get_profile_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    saved_places_count = db.query(SavedPlace).filter(SavedPlace.user_id == current_user.id).count()
    saved_trips_count = db.query(Trip).filter(Trip.user_id == current_user.id).count()
    
    upcoming_trips_count = db.query(Trip).filter(
        Trip.user_id == current_user.id,
        Trip.start_date >= today,
        Trip.status != "completed"
    ).count()

    completed_trips_count = db.query(Trip).filter(
        Trip.user_id == current_user.id,
        (Trip.status == "completed") | (Trip.end_date < today)
    ).count()

    reviews_count = db.query(Review).filter(Review.user_id == current_user.id).count()
    bookings_count = db.query(Booking).filter(Booking.user_id == current_user.id).count()

    return UserStatsResponse(
        saved_places_count=saved_places_count,
        saved_trips_count=saved_trips_count,
        upcoming_trips_count=upcoming_trips_count,
        completed_trips_count=completed_trips_count,
        reviews_count=reviews_count,
        bookings_count=bookings_count,
        member_since=current_user.created_at
    )

@router.put("/profile", response_model=UserResponse)
@router.patch("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.full_name is not None:
        trimmed_name = profile_in.full_name.strip()
        if not trimmed_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Display name cannot be blank."
            )
        if len(trimmed_name) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Display name cannot exceed 100 characters."
            )
        current_user.full_name = trimmed_name

    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url.strip() if profile_in.avatar_url.strip() else None

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        db.flush()

    for field in PREFERENCE_FIELDS:
        val = getattr(profile_in, field, None)
        if val is not None:
            setattr(pref, field, val)

    pref.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    db.refresh(pref)
    current_user.preferences = pref
    return current_user

@router.get("/preferences", response_model=UserPreferenceSchema)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.put("/preferences", response_model=UserPreferenceSchema)
@router.patch("/preferences", response_model=UserPreferenceSchema)
def update_preferences(
    pref_in: UserPreferenceSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
    
    for field, val in pref_in.model_dump(exclude_unset=True).items():
        if hasattr(pref, field):
            setattr(pref, field, val)

    pref.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pref)
    return pref

@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as your current password."
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully. Please keep your credentials secure."}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {
        "message": "Session invalidated successfully.",
        "user_id": current_user.id
    }

@router.get("/export", response_model=UserDataExportResponse)
def export_user_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # User Profile Info
    user_info = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

    # Preferences
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    pref_data = None
    if pref:
        pref_data = {
            field: getattr(pref, field)
            for field in PREFERENCE_FIELDS
            if hasattr(pref, field)
        }

    # User Owned Trips
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()
    trips_data = []
    for t in trips:
        trips_data.append({
            "id": t.id,
            "title": t.title,
            "destination_id": t.destination_id,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None,
            "num_days": t.num_days,
            "budget_total": t.budget_total,
            "budget_spent": t.budget_spent,
            "travel_style": t.travel_style,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })

    # Saved Places
    saved_entries = db.query(SavedPlace).filter(SavedPlace.user_id == current_user.id).all()
    saved_data = []
    for sp in saved_entries:
        saved_data.append({
            "id": sp.id,
            "place_id": sp.place_id,
            "destination_id": sp.destination_id,
            "place_name": sp.place.name if sp.place else None,
            "category": sp.place.category if sp.place else None,
            "saved_at": sp.created_at.isoformat() if sp.created_at else None
        })

    # Reviews
    reviews = db.query(Review).filter(Review.user_id == current_user.id).all()
    reviews_data = []
    for r in reviews:
        reviews_data.append({
            "id": r.id,
            "place_id": r.place_id,
            "rating": r.rating,
            "title": r.title,
            "body": r.body,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    # Bookings
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    bookings_data = []
    for b in bookings:
        bookings_data.append({
            "id": b.id,
            "booking_type": b.booking_type,
            "provider": b.provider,
            "status": b.status,
            "currency": b.currency,
            "total_amount": b.total_amount,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })

    return UserDataExportResponse(
        user=user_info,
        preferences=pref_data,
        trips=trips_data,
        saved_places=saved_data,
        reviews=reviews_data,
        bookings=bookings_data,
        exported_at=datetime.now(timezone.utc)
    )

@router.delete("/account")
def delete_account(
    payload: Optional[AccountDeleteRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If password is provided, verify it
    if payload and payload.password:
        if not verify_password(payload.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password confirmation is incorrect."
            )

    user_id = current_user.id
    user_email = current_user.email

    # Cascading delete is configured on relationships (trips, preferences, saved_places, reviews, bookings, conversations)
    db.delete(current_user)
    db.commit()

    return {
        "message": f"Account '{user_email}' and all associated personal travel data have been permanently deleted.",
        "user_id": user_id,
        "status": "deleted"
    }
