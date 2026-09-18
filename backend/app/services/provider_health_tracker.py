"""
VANVAS Provider Health Tracker
Maintains live operational telemetry for real-world travel data providers without exposing credentials.

Supported Statuses:
- healthy: Provider responding normally within latency thresholds.
- degraded: Provider experiencing elevated errors or failing over to backup endpoints.
- unavailable: Provider currently failing or unreachable.
- not_configured: Required API key / endpoint is absent.
"""

import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("vanvas.services.provider_health")


class ProviderStatusRecord:
    def __init__(self, name: str, is_configured: bool = True):
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
            "provider_name": self.name,
            "status": self.status,
            "is_configured": self.is_configured,
            "latency_ms": self.latency_ms,
            "last_success_at": last_success_iso,
            "last_failure_at": last_failure_iso,
            "last_failure_reason": self.last_failure_reason,
            "consecutive_failures": self.consecutive_failures,
        }


class ProviderHealthTracker:
    def __init__(self):
        self._records: Dict[str, ProviderStatusRecord] = {
            "geocoding": ProviderStatusRecord("Geocoding & Autocomplete (OpenStreetMap Nominatim)"),
            "weather": ProviderStatusRecord("Live Weather Service (Open-Meteo / WMO Satellite)"),
            "places": ProviderStatusRecord("Places Discovery (OpenStreetMap Overpass / Curated)"),
            "hotels": ProviderStatusRecord("Accommodation & Stays (OpenStreetMap / Verified Curated)"),
            "rentals": ProviderStatusRecord("Valley Mobility & Rentals (OpenStreetMap / Curated)"),
            "routing": ProviderStatusRecord("Mountain Routing & Topography (Haversine + 1.45x Winding)"),
            "ai": ProviderStatusRecord("AI Travel Engine (Google Gemini 3.5 Flash-Lite)"),
        }

    def record_success(self, provider_key: str, latency_ms: float = 0.0) -> None:
        rec = self._records.get(provider_key)
        if rec:
            rec.record_success(latency_ms)

    def record_failure(self, provider_key: str, reason: str = "Request failed") -> None:
        rec = self._records.get(provider_key)
        if rec:
            rec.record_failure(reason)

    def get_provider_health_summary(self) -> List[Dict[str, Any]]:
        return [rec.to_dict() for rec in self._records.values()]


# Global singleton instance
health_tracker = ProviderHealthTracker()
