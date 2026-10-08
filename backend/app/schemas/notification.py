from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class DeviceRegisterRequest(BaseModel):
    push_token: str = Field(..., description="Device push notification token")
    platform: str = Field("android", description="Platform: android, ios, web")
    device_identifier: Optional[str] = Field(None, description="Optional device hardware/installation identifier")
    app_version: str = Field("0.1.0", description="App version")
    permission_state: str = Field("granted", description="Permission state: granted, denied, prompt")


class DeviceDeactivateRequest(BaseModel):
    push_token: str = Field(..., description="Device push token to deactivate")


class DeviceRegistrationOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    device_identifier: Optional[str] = None
    platform: str
    push_token: str
    app_version: str
    permission_state: str
    is_active: bool
    created_at: datetime
    last_seen: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationPreferencesUpdate(BaseModel):
    level: Optional[str] = Field(None, description="all, important_only, none")
    notify_trip_reminders: Optional[bool] = None
    notify_transport_updates: Optional[bool] = None
    notify_trip_changes: Optional[bool] = None
    notify_weather_alerts: Optional[bool] = None
    notify_group_activity: Optional[bool] = None
    notify_expense_activity: Optional[bool] = None
    notify_booking_updates: Optional[bool] = None
    notify_suggestions: Optional[bool] = None
    notify_copilot_updates: Optional[bool] = None
    notify_announcements: Optional[bool] = None


class NotificationPreferencesOut(BaseModel):
    level: str = "all"
    notify_trip_reminders: bool = True
    notify_transport_updates: bool = True
    notify_trip_changes: bool = True
    notify_weather_alerts: bool = True
    notify_group_activity: bool = True
    notify_expense_activity: bool = True
    notify_booking_updates: bool = True
    notify_suggestions: bool = True
    notify_copilot_updates: bool = False
    notify_announcements: bool = False
    updated_at: Optional[datetime] = None


class NotificationRecordOut(BaseModel):
    id: str
    type: str
    title: str
    body: str
    deep_link: Optional[str] = None
    trip_id: Optional[str] = None
    created_at: datetime
    is_read: bool
    delivery_status: str

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: List[NotificationRecordOut]
    total_unread: int


class SendNotificationRequest(BaseModel):
    user_id: Optional[str] = None
    type: str = Field(..., description="Notification category/type")
    title: str
    body: str
    deep_link: Optional[str] = None
    trip_id: Optional[str] = None


class SendNotificationResponse(BaseModel):
    success: bool
    notification_id: Optional[str] = None
    status: str
    suppressed_by_preference: bool = False
    message: str
