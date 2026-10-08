from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, UserPreference, DeviceRegistration, NotificationItem
from app.schemas.notification import (
    DeviceRegisterRequest,
    DeviceDeactivateRequest,
    DeviceRegistrationOut,
    NotificationPreferencesUpdate,
    NotificationPreferencesOut,
    NotificationRecordOut,
    NotificationListResponse,
    SendNotificationRequest,
    SendNotificationResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/devices", response_model=DeviceRegistrationOut)
def register_device_token(
    payload: DeviceRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register or refresh a device push token for the authenticated user."""
    if not payload.push_token or not payload.push_token.strip():
        raise HTTPException(status_code=400, detail="Push token is required")

    device = NotificationService.register_device(
        db=db,
        push_token=payload.push_token.strip(),
        platform=payload.platform.lower(),
        user_id=current_user.id,
        device_identifier=payload.device_identifier,
        app_version=payload.app_version,
        permission_state=payload.permission_state,
    )
    return device


@router.post("/devices/deactivate")
def deactivate_device_token(
    payload: DeviceDeactivateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate device push token on logout."""
    if not payload.push_token or not payload.push_token.strip():
        raise HTTPException(status_code=400, detail="Push token is required")

    success = NotificationService.deactivate_device(db=db, push_token=payload.push_token.strip())
    return {"success": success, "message": "Device token deactivated" if success else "Token not found"}


@router.get("/preferences", response_model=NotificationPreferencesOut)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's notification preferences."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        # Create default preferences if not yet existing
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return NotificationPreferencesOut(
        level=getattr(pref, "notification_level", "all") or "all",
        notify_trip_reminders=bool(pref.notify_trip_reminders),
        notify_transport_updates=bool(getattr(pref, "notify_transport_updates", True)),
        notify_trip_changes=bool(pref.notify_trip_changes),
        notify_weather_alerts=bool(getattr(pref, "notify_weather_alerts", True)),
        notify_group_activity=bool(getattr(pref, "notify_group_activity", True)),
        notify_expense_activity=bool(getattr(pref, "notify_expense_activity", True)),
        notify_booking_updates=bool(pref.notify_booking_updates),
        notify_suggestions=bool(pref.notify_suggestions),
        notify_copilot_updates=bool(pref.notify_copilot_updates),
        notify_announcements=bool(pref.notify_announcements),
        updated_at=pref.updated_at,
    )


@router.put("/preferences", response_model=NotificationPreferencesOut)
def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the user's notification preferences."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if payload.level is not None:
        if payload.level not in ["all", "important_only", "none"]:
            raise HTTPException(status_code=400, detail="Invalid notification level: choose all, important_only, or none")
        pref.notification_level = payload.level

    if payload.notify_trip_reminders is not None:
        pref.notify_trip_reminders = payload.notify_trip_reminders
    if payload.notify_transport_updates is not None:
        pref.notify_transport_updates = payload.notify_transport_updates
    if payload.notify_trip_changes is not None:
        pref.notify_trip_changes = payload.notify_trip_changes
    if payload.notify_weather_alerts is not None:
        pref.notify_weather_alerts = payload.notify_weather_alerts
    if payload.notify_group_activity is not None:
        pref.notify_group_activity = payload.notify_group_activity
    if payload.notify_expense_activity is not None:
        pref.notify_expense_activity = payload.notify_expense_activity
    if payload.notify_booking_updates is not None:
        pref.notify_booking_updates = payload.notify_booking_updates
    if payload.notify_suggestions is not None:
        pref.notify_suggestions = payload.notify_suggestions
    if payload.notify_copilot_updates is not None:
        pref.notify_copilot_updates = payload.notify_copilot_updates
    if payload.notify_announcements is not None:
        pref.notify_announcements = payload.notify_announcements

    pref.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pref)

    return NotificationPreferencesOut(
        level=getattr(pref, "notification_level", "all") or "all",
        notify_trip_reminders=bool(pref.notify_trip_reminders),
        notify_transport_updates=bool(getattr(pref, "notify_transport_updates", True)),
        notify_trip_changes=bool(pref.notify_trip_changes),
        notify_weather_alerts=bool(getattr(pref, "notify_weather_alerts", True)),
        notify_group_activity=bool(getattr(pref, "notify_group_activity", True)),
        notify_expense_activity=bool(getattr(pref, "notify_expense_activity", True)),
        notify_booking_updates=bool(pref.notify_booking_updates),
        notify_suggestions=bool(pref.notify_suggestions),
        notify_copilot_updates=bool(pref.notify_copilot_updates),
        notify_announcements=bool(pref.notify_announcements),
        updated_at=pref.updated_at,
    )


@router.get("/inbox", response_model=NotificationListResponse)
@router.get("/records", response_model=NotificationListResponse)
@router.get("/list", response_model=NotificationListResponse)
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for current user with unread count."""
    items = (
        db.query(NotificationItem)
        .filter(NotificationItem.user_id == current_user.id)
        .order_by(NotificationItem.created_at.desc())
        .limit(50)
        .all()
    )
    unread_count = (
        db.query(NotificationItem)
        .filter(NotificationItem.user_id == current_user.id, NotificationItem.is_read == False)
        .count()
    )
    return NotificationListResponse(
        items=[NotificationRecordOut.model_validate(it) for it in items],
        total_unread=unread_count,
    )


@router.patch("/{notification_id}/read", response_model=NotificationRecordOut)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    item = (
        db.query(NotificationItem)
        .filter(NotificationItem.id == notification_id, NotificationItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")

    item.is_read = True
    db.commit()
    db.refresh(item)
    return NotificationRecordOut.model_validate(item)


@router.post("/send-test", response_model=SendNotificationResponse)
def send_test_notification(
    payload: SendNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create and dispatch a real test notification for testing end-to-end delivery."""
    target_user_id = payload.user_id or current_user.id
    res = NotificationService.send_notification(
        db=db,
        user_id=target_user_id,
        notification_type=payload.type,
        title=payload.title,
        body=payload.body,
        deep_link=payload.deep_link,
        trip_id=payload.trip_id,
    )
    return SendNotificationResponse(**res)
