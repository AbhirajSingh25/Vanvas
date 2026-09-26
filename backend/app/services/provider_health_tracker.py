"""
VANVAS Provider Health Tracker
Maintains live operational telemetry for real-world travel data providers without exposing credentials or secrets.

Diagnostics show:
- configured (bool)
- last_success (ISO string or timestamp or null)
- last_failure (ISO string or timestamp or null)
- latency (ms float)
- error_count (int)
"""

import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("vanvas.services.provider_health")


class ProviderStatusRecord:
    def __init__(self, key: str, name: str, is_configured: bool = True):
        self.key = key
        self.name = name
        self.is_configured = is_configured
        self.status = "healthy" if is_configured else "not_configured"
        self.last_success: Optional[float] = None
        self.last_failure: Optional[float] = None
        self.last_failure_reason: Optional[str] = None
        self.consecutive_failures = 0
        self.total_requests = 0
        self.total_successes = 0
        self.total_failures = 0
        self.latency_ms = 0.0

    def record_success(self, latency_ms: float = 0.0) -> None:
        self.total_requests += 1
        self.total_successes += 1
        self.consecutive_failures = 0
        self.last_success = time.time()
        self.latency_ms = round(latency_ms, 1)
        self.status = "healthy"

    def record_failure(self, reason: str = "Request failed", is_timeout: bool = False) -> None:
        self.total_requests += 1
        self.total_failures += 1
        self.consecutive_failures += 1
        self.last_failure = time.time()
        self.last_failure_reason = reason
        if self.consecutive_failures >= 3:
            self.status = "unavailable"
        else:
            self.status = "degraded"

    def to_dict(self) -> Dict[str, Any]:
        last_success_iso = datetime.fromtimestamp(self.last_success, timezone.utc).isoformat() if self.last_success else None
        last_failure_iso = datetime.fromtimestamp(self.last_failure, timezone.utc).isoformat() if self.last_failure else None
        return {
            "provider_key": self.key,
            "provider_name": self.name,
            "configured": self.is_configured,
            "is_configured": self.is_configured,
            "status": self.status,
            "latency": self.latency_ms,
            "latency_ms": self.latency_ms,
            "error_count": self.total_failures,
            "last_success": last_success_iso,
            "last_failure": last_failure_iso,
            "last_success_at": last_success_iso,
            "last_failure_at": last_failure_iso,
            "last_failure_reason": self.last_failure_reason,
            "consecutive_failures": self.consecutive_failures,
        }


class ProviderHealthTracker:
    def __init__(self):
        google_key_present = bool(
            (getattr(settings, "GOOGLE_PLACES_API_KEY", None) or getattr(settings, "PLACES_API_KEY", None))
            and len(getattr(settings, "GOOGLE_PLACES_API_KEY", "") or getattr(settings, "PLACES_API_KEY", "")) > 10
            and not (getattr(settings, "GOOGLE_PLACES_API_KEY", "") or "").startswith("your_")
        )
        self._records: Dict[str, ProviderStatusRecord] = {
            "google_places": ProviderStatusRecord("google_places", "Google Places API (New / Places Discovery)", is_configured=google_key_present),
            "osm_overpass": ProviderStatusRecord("osm_overpass", "OpenStreetMap Overpass API (Live POI Discovery)", is_configured=True),
            "rentals": ProviderStatusRecord("rentals", "Live Rentals & Valley Mobility Engine", is_configured=True),
            "stays": ProviderStatusRecord("stays", "Accommodation & Stays Commerce Engine", is_configured=True),
            "routing": ProviderStatusRecord("routing", "Navigation & Mountain Routing Engine", is_configured=True),
            "weather": ProviderStatusRecord("weather", "Open-Meteo Weather & Climate Service", is_configured=True),
            "geocoding": ProviderStatusRecord("geocoding", "Nominatim / Photon Geocoding Service", is_configured=True),
            "places": ProviderStatusRecord("places", "Unified Places Discovery Provider", is_configured=True),
            "hotels": ProviderStatusRecord("hotels", "Hotels & Sanctuaries Provider", is_configured=True),
        }

    def record_success(self, provider_key: str, latency_ms: float = 0.0) -> None:
        rec = self._records.get(provider_key)
        if rec:
            rec.record_success(latency_ms)
        # Mirror aliases
        if provider_key == "places":
            rec_osm = self._records.get("osm_overpass")
            if rec_osm:
                rec_osm.record_success(latency_ms)
        elif provider_key == "hotels":
            rec_stays = self._records.get("stays")
            if rec_stays:
                rec_stays.record_success(latency_ms)

    def record_failure(self, provider_key: str, reason: str = "Request failed") -> None:
        rec = self._records.get(provider_key)
        if rec:
            rec.record_failure(reason)
        # Mirror aliases
        if provider_key == "places":
            rec_osm = self._records.get("osm_overpass")
            if rec_osm:
                rec_osm.record_failure(reason)
        elif provider_key == "hotels":
            rec_stays = self._records.get("stays")
            if rec_stays:
                rec_stays.record_failure(reason)

    def get_provider_health_summary(self) -> List[Dict[str, Any]]:
        # Refresh configuration status dynamically
        google_key_present = bool(
            (getattr(settings, "GOOGLE_PLACES_API_KEY", None) or getattr(settings, "PLACES_API_KEY", None))
            and len(getattr(settings, "GOOGLE_PLACES_API_KEY", "") or getattr(settings, "PLACES_API_KEY", "")) > 10
            and not (getattr(settings, "GOOGLE_PLACES_API_KEY", "") or "").startswith("your_")
        )
        if "google_places" in self._records:
            self._records["google_places"].is_configured = google_key_present

        return [rec.to_dict() for rec in self._records.values()]


# Global singleton instance
health_tracker = ProviderHealthTracker()

