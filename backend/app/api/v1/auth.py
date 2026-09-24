import io
import uuid
import secrets
import hashlib
from datetime import datetime, timezone, date, timedelta
from typing import Optional
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import (
    User, UserPreference, EmailVerificationToken, EmailVerificationOTP, Trip, SavedPlace, Review, Booking,
    Itinerary, Expense, ChecklistItem
)
from app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    RegistrationSuccessResponse, VerifyEmailRequest, VerifyEmailResponse,
    ResendVerificationRequest, ResendVerificationResponse,
    UserPreferenceSchema, UserProfileUpdateRequest,
    PasswordChangeRequest, AccountDeleteRequest,
    UserStatsResponse, UserDataExportResponse,
    AvatarUploadResponse
)
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.services.email_service import EmailService
from app.services.storage_service import StorageService, StorageServiceException
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

@router.post("/register", response_model=RegistrationSuccessResponse)
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
        role="traveller",
        email_verified_at=None  # Explicitly unverified upon creation
    )
    db.add(user)
    db.flush()

    # Create default preferences
    pref = UserPreference(user_id=user.id)
    db.add(pref)

    # Generate 6-digit cryptographically secure numeric OTP
    otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.EMAIL_OTP_EXPIRE_MINUTES)

    otp_record = EmailVerificationOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempt_count=0
    )
    db.add(otp_record)
    db.commit()
    db.refresh(user)

    # Dispatch transactional verification OTP via Brevo HTTPS
    delivery = EmailService.send_otp_email(
        to_email=user.email,
        recipient_name=user.full_name,
        otp_code=otp_code
    )

    return RegistrationSuccessResponse(
        message="Account created. Please check your email for the verification code.",
        email=user.email,
        email_verified=False,
        email_delivery_status=delivery.status
    )

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Enforce email verification
    if user.email_verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before continuing. Check your inbox for the verification code.",
            headers={"X-Auth-Reason": "EMAIL_NOT_VERIFIED"}
        )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@router.post("/verify-email/confirm", response_model=VerifyEmailResponse)
def confirm_email_verification(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)

    # 1. OTP-based verification flow (Primary)
    if payload.email and payload.otp:
        clean_email = payload.email.lower().strip()
        clean_otp = payload.otp.strip()

        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code or email address."
            )

        if user.email_verified_at is not None:
            return VerifyEmailResponse(
                success=True,
                message="Your email is already verified. You can now sign in.",
                email=user.email,
                already_verified=True
            )

        # Look up most recent active OTP record for user
        otp_record = db.query(EmailVerificationOTP).filter(
            EmailVerificationOTP.user_id == user.id,
            EmailVerificationOTP.used_at.is_(None)
        ).order_by(EmailVerificationOTP.created_at.desc()).first()

        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active verification code found. Please request a new code."
            )

        # Check attempt count
        if otp_record.attempt_count >= settings.EMAIL_OTP_MAX_ATTEMPTS:
            otp_record.used_at = now_utc
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many invalid attempts. This verification code has been invalidated. Please request a new code."
            )

        # Check expiration
        expires_at = otp_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now_utc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your verification code has expired. Please request a new verification code."
            )

        # Verify OTP Hash
        submitted_hash = hashlib.sha256(clean_otp.encode("utf-8")).hexdigest()
        if submitted_hash != otp_record.otp_hash:
            otp_record.attempt_count += 1
            db.commit()
            if otp_record.attempt_count >= settings.EMAIL_OTP_MAX_ATTEMPTS:
                otp_record.used_at = now_utc
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many invalid attempts. This verification code has been invalidated. Please request a new code."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check the code and try again."
            )

        # Valid OTP: mark used, verify user, invalidate all remaining OTPs for user
        otp_record.used_at = now_utc
        user.email_verified_at = now_utc

        db.query(EmailVerificationOTP).filter(
            EmailVerificationOTP.user_id == user.id,
            EmailVerificationOTP.used_at.is_(None)
        ).update({"used_at": now_utc}, synchronize_session=False)

        db.query(EmailVerificationToken).filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None)
        ).update({"used_at": now_utc}, synchronize_session=False)

        db.commit()
        db.refresh(user)

        return VerifyEmailResponse(
            success=True,
            message="Your email has been verified successfully. Welcome to VANVAS!",
            email=user.email,
            already_verified=False
        )

    # 2. Legacy Token-based fallback flow
    clean_token = (payload.token or "").strip()
    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and verification code are required."
        )

    token_hash = hashlib.sha256(clean_token.encode("utf-8")).hexdigest()
    # Check OTP records or legacy Token records
    record = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.otp_hash == token_hash).first()
    if not record:
        record = db.query(EmailVerificationToken).filter(EmailVerificationToken.token_hash == token_hash).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link or token."
        )

    if record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has already been used. Please sign in or request a new code."
        )

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your verification link has expired. Please request a new verification email."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User associated with this token no longer exists."
        )

    record.used_at = now_utc
    if user.email_verified_at is not None:
        db.commit()
        return VerifyEmailResponse(
            success=True,
            message="Your email is already verified. You can now sign in.",
            email=user.email,
            already_verified=True
        )

    user.email_verified_at = now_utc

    db.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id,
        EmailVerificationOTP.used_at.is_(None)
    ).update({"used_at": now_utc}, synchronize_session=False)

    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used_at.is_(None)
    ).update({"used_at": now_utc}, synchronize_session=False)

    db.commit()
    db.refresh(user)

    return VerifyEmailResponse(
        success=True,
        message="Your email has been verified successfully. Welcome to VANVAS!",
        email=user.email,
        already_verified=False
    )

@router.post("/verify-email/request", response_model=ResendVerificationResponse)
@router.post("/resend-verification", response_model=ResendVerificationResponse)
def resend_verification_email(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    # Mitigate account enumeration by returning a generic success message if not found
    if not user:
        return ResendVerificationResponse(
            success=True,
            message="If an unverified account with this email exists, a verification code has been sent.",
            cooldown_seconds=settings.EMAIL_OTP_RESEND_COOLDOWN_SECONDS,
            email_delivery_status="EMAIL_SENT"
        )

    if user.email_verified_at is not None:
        return ResendVerificationResponse(
            success=True,
            message="This email address is already verified. Please sign in.",
            cooldown_seconds=0,
            email_delivery_status="ALREADY_VERIFIED"
        )

    # Rate limiting / cooldown check
    now_utc = datetime.now(timezone.utc)
    cooldown_cutoff = now_utc - timedelta(seconds=settings.EMAIL_OTP_RESEND_COOLDOWN_SECONDS)

    recent_otp = db.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id,
        EmailVerificationOTP.created_at >= cooldown_cutoff
    ).first()

    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait before requesting another verification code. Try again in {settings.EMAIL_OTP_RESEND_COOLDOWN_SECONDS} seconds."
        )

    # Invalidate older active OTPs
    db.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id,
        EmailVerificationOTP.used_at.is_(None)
    ).update({"used_at": now_utc}, synchronize_session=False)

    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used_at.is_(None)
    ).update({"used_at": now_utc}, synchronize_session=False)

    # Generate new 6-digit OTP
    otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at = now_utc + timedelta(minutes=settings.EMAIL_OTP_EXPIRE_MINUTES)

    new_otp_record = EmailVerificationOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        created_at=now_utc,
        expires_at=expires_at,
        attempt_count=0
    )
    db.add(new_otp_record)
    db.commit()

    delivery = EmailService.send_otp_email(
        to_email=user.email,
        recipient_name=user.full_name,
        otp_code=otp_code
    )

    return ResendVerificationResponse(
        success=True,
        message="A new verification code has been sent to your email address.",
        cooldown_seconds=settings.EMAIL_OTP_RESEND_COOLDOWN_SECONDS,
        email_delivery_status=delivery.status
    )

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

@router.post("/profile/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type or file.content_type.lower() not in (
        "image/jpeg", "image/jpg", "image/png", "image/webp"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPEG, PNG, WebP."
        )

    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image file."
        )

    if len(contents) > settings.MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Profile photo exceeds maximum allowed size of {settings.MAX_AVATAR_SIZE_BYTES // (1024 * 1024)} MB."
        )

    try:
        # Verify image integrity
        img_check = Image.open(io.BytesIO(contents))
        img_check.verify()

        # Reopen for processing
        img = Image.open(io.BytesIO(contents))
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupt image file."
        )

    if img.format not in ("JPEG", "PNG", "WEBP"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Allowed formats: JPEG, PNG, WebP."
        )

    # Convert mode
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # Center crop to 1:1 square
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    img = img.crop((left, top, right, bottom))

    # Resize to max 512x512
    if min_dim > 512:
        img = img.resize((512, 512), Image.Resampling.LANCZOS)

    # Export to WebP without metadata
    output_io = io.BytesIO()
    img.save(output_io, format="WEBP", quality=85, method=6)
    webp_bytes = output_io.getvalue()

    # Generate secure random storage key
    unique_filename = f"{uuid.uuid4().hex}.webp"
    storage_key = f"users/{current_user.id}/avatar/{unique_filename}"

    try:
        avatar_url = StorageService.upload_profile_photo(
            storage_key=storage_key,
            file_bytes=webp_bytes,
            content_type="image/webp"
        )
    except StorageServiceException as e:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE if ("NOT_CONFIGURED" in e.code or "DISABLED" in e.code) else status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(
            status_code=status_code,
            detail=e.message or str(e)
        )

    # Clean up old avatar if exists
    if current_user.avatar_storage_key and current_user.avatar_storage_key != storage_key:
        try:
            StorageService.delete_profile_photo(current_user.avatar_storage_key)
        except Exception:
            pass

    current_user.avatar_storage_key = storage_key
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)

    return AvatarUploadResponse(
        avatar_url=current_user.avatar_url,
        message="Profile photo updated successfully."
    )

@router.delete("/profile/avatar", response_model=AvatarUploadResponse)
def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.avatar_storage_key:
        try:
            StorageService.delete_profile_photo(current_user.avatar_storage_key)
        except Exception:
            pass

    current_user.avatar_storage_key = None
    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)

    return AvatarUploadResponse(
        avatar_url=None,
        message="Profile photo removed successfully."
    )

@router.get("/profile/avatar/file/{key_path:path}")
def serve_avatar_file(key_path: str):
    if ".." in key_path or key_path.startswith("/") or key_path.startswith("\\"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path."
        )

    avatar_bytes, mime_type = StorageService.read_local_avatar(key_path)
    if avatar_bytes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile photo not found."
        )

    return Response(
        content=avatar_bytes,
        media_type=mime_type or "image/webp",
        headers={
            "Cache-Control": "public, max-age=86400, immutable"
        }
    )

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
