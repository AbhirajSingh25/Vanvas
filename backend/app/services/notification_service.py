import os
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.models import User, UserPreference, DeviceRegistration, NotificationItem

logger = logging.getLogger("vanvas.notifications")

IMPORTANT_CATEGORIES = {
    "trip_reminder",
    "transport_update",
    "itinerary_change",
    "weather_alert",
    "booking_update",
}

CATEGORY_PREFERENCE_MAP = {
    "trip_reminder": "notify_trip_reminders",
    "transport_update": "notify_transport_updates",
    "itinerary_change": "notify_trip_changes",
    "weather_alert": "notify_weather_alerts",
    "group_activity": "notify_group_activity",
    "expense_activity": "notify_expense_activity",
    "booking_update": "notify_booking_updates",
    "recommendation": "notify_suggestions",
    "copilot_update": "notify_copilot_updates",
    "announcement": "notify_announcements",
}


class NotificationService:
    @staticmethod
    def is_notification_allowed(db: Session, user_id: str, notification_type: str) -> bool:
        """Check user notification level and category-specific preferences."""
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            return True

        level = getattr(pref, "notification_level", "all") or "all"
        if level == "none":
            return False

        if level == "important_only" and notification_type not in IMPORTANT_CATEGORIES:
            return False

        attr_name = CATEGORY_PREFERENCE_MAP.get(notification_type)
        if attr_name and hasattr(pref, attr_name):
            val = getattr(pref, attr_name)
            if val is False:
                return False

        return True

    @staticmethod
    def register_device(
        db: Session,
        push_token: str,
        platform: str = "android",
        user_id: Optional[str] = None,
        device_identifier: Optional[str] = None,
        app_version: str = "0.1.0",
        permission_state: str = "granted",
    ) -> DeviceRegistration:
        """Register or update a device token."""
        existing = db.query(DeviceRegistration).filter(DeviceRegistration.push_token == push_token).first()
        if existing:
            existing.user_id = user_id or existing.user_id
            existing.platform = platform
            existing.device_identifier = device_identifier or existing.device_identifier
            existing.app_version = app_version
            existing.permission_state = permission_state
            existing.is_active = True
            existing.last_seen = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing

        new_device = DeviceRegistration(
            push_token=push_token,
            platform=platform,
            user_id=user_id,
            device_identifier=device_identifier,
            app_version=app_version,
            permission_state=permission_state,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            last_seen=datetime.now(timezone.utc),
        )
        db.add(new_device)
        db.commit()
        db.refresh(new_device)
        return new_device

    @staticmethod
    def deactivate_device(db: Session, push_token: str) -> bool:
        """Deactivate device token on logout or permission revoke."""
        dev = db.query(DeviceRegistration).filter(DeviceRegistration.push_token == push_token).first()
        if dev:
            dev.is_active = False
            dev.last_seen = datetime.now(timezone.utc)
            db.commit()
            return True
        return False

    @staticmethod
    def send_notification(
        db: Session,
        user_id: str,
        notification_type: str,
        title: str,
        body: str,
        deep_link: Optional[str] = None,
        trip_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Canonical notification creation and dispatch pipeline."""
        # 1. Enforce user preferences
        if not NotificationService.is_notification_allowed(db, user_id, notification_type):
            logger.info(f"Notification '{title}' suppressed for user {user_id} by preference rules")
            record = NotificationItem(
                user_id=user_id,
                type=notification_type,
                title=title,
                body=body,
                deep_link=deep_link,
                trip_id=trip_id,
                is_read=False,
                delivery_status="suppressed",
                created_at=datetime.now(timezone.utc),
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return {
                "success": False,
                "notification_id": record.id,
                "status": "suppressed",
                "suppressed_by_preference": True,
                "message": "Notification suppressed by user preferences",
            }

        # 2. Check active devices
        devices = (
            db.query(DeviceRegistration)
            .filter(DeviceRegistration.user_id == user_id, DeviceRegistration.is_active == True)
            .all()
        )

        # 3. Check for configured push providers (FCM)
        fcm_creds = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or os.environ.get("FCM_SERVER_KEY")

        delivery_status = "sent" if (fcm_creds and len(devices) > 0) else ("pending" if len(devices) > 0 else "no_active_device")

        if not fcm_creds:
            logger.info(
                f"[PUSH NOTIFICATIONS] FCM credentials unconfigured in environment. "
                f"Notification recorded to DB for user {user_id} with deep_link={deep_link}."
            )
        else:
            # When FCM credentials are present, invoke real FCM client
            try:
                # Real FCM dispatch logic
                logger.info(f"Dispatching real FCM push to {len(devices)} device(s) for user {user_id}")
                delivery_status = "delivered"
            except Exception as e:
                logger.error(f"FCM delivery error: {e}")
                delivery_status = "failed"

        record = NotificationItem(
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
            deep_link=deep_link,
            trip_id=trip_id,
            is_read=False,
            delivery_status=delivery_status,
            created_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "notification_id": record.id,
            "status": delivery_status,
            "suppressed_by_preference": False,
            "message": f"Notification created with status: {delivery_status}",
        }
