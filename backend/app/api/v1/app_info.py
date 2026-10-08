from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/app", tags=["App Info"])


class AppVersionResponse(BaseModel):
    app_name: str = "VANVAS"
    package_name: str = "ai.vanvas.app"
    latest_version: str = "0.1.0"
    latest_version_code: int = 1
    min_supported_version: str = "0.1.0"
    min_supported_version_code: int = 1
    force_update: bool = False
    release_notes: str = "VANVAS Production App Infrastructure Release"
    android_package: str = "ai.vanvas.app"
    store_url_android: str = "https://play.google.com/store/apps/details?id=ai.vanvas.app"
    pwa_url: str = "https://vanvasai.vercel.app"
    backend_url: str = "https://vanvas-api.onrender.com"


class AppHealthResponse(BaseModel):
    status: str = "ok"
    app: str = "VANVAS API"
    version: str = "0.1.0"
    environment: str = "production"
    server_time: datetime


@router.get("/version", response_model=AppVersionResponse)
def get_app_version():
    """Returns canonical app version and update requirements."""
    return AppVersionResponse()


@router.get("/health", response_model=AppHealthResponse)
def get_app_health():
    """Returns lightweight system health and version."""
    return AppHealthResponse(server_time=datetime.now(timezone.utc))
