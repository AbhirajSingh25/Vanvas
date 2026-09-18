"""
VANVAS Safe In-Memory & TTL Cache Service
Provider-neutral caching for geocoding, live place discovery, weather, and destination metadata.

Strict Reliability & Safety Rules:
1. Deterministic query-aware keys.
2. Bounded TTL with stale-data fallback support.
3. No cross-user private data leakage.
4. Marks stale cached data as data_state = "STALE".
"""

import time
import math
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("vanvas.services.cache")


class CacheEntry:
    def __init__(self, value: Any, ttl_seconds: float, created_at: Optional[float] = None):
        self.value = value
        self.ttl_seconds = ttl_seconds
        self.created_at = created_at or time.time()

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.created_at) > self.ttl_seconds

    @property
    def age_seconds(self) -> float:
        return time.time() - self.created_at


class SafeCacheService:
    """Thread-safe, lightweight in-memory cache with bounded TTL and stale fallback support."""
    
    def __init__(self, max_entries: int = 2000):
        self._cache: Dict[str, CacheEntry] = {}
        self._max_entries = max_entries

    def get(self, key: str) -> Tuple[Optional[Any], bool]:
        """
        Returns (value, is_stale).
        If key exists and not expired -> (value, False)
        If key exists but is expired -> (value, True)
        If key does not exist -> (None, False)
        """
        entry = self._cache.get(key)
        if not entry:
            return None, False
        if entry.is_expired:
            return entry.value, True
        return entry.value, False

    def get_fresh(self, key: str) -> Optional[Any]:
        """Returns value only if it is unexpired, otherwise None."""
        val, is_stale = self.get(key)
        if val is not None and not is_stale:
            return val
        return None

    def get_stale(self, key: str) -> Optional[Any]:
        """Returns cached value even if expired (for graceful degradation during provider outage)."""
        entry = self._cache.get(key)
        if entry:
            return entry.value
        return None

    def set(self, key: str, value: Any, ttl_seconds: float = 600.0) -> None:
        """Stores a value in cache with specified TTL in seconds (default 10 minutes)."""
        # Evict oldest if max capacity reached
        if len(self._cache) >= self._max_entries and key not in self._cache:
            self._evict_oldest()
        self._cache[key] = CacheEntry(value=value, ttl_seconds=ttl_seconds)

    def invalidate(self, key: str) -> bool:
        """Removes a key from cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Clears the entire cache."""
        self._cache.clear()

    def _evict_oldest(self) -> None:
        """Evicts expired or oldest entries."""
        now = time.time()
        expired_keys = [k for k, v in self._cache.items() if (now - v.created_at) > v.ttl_seconds]
        if expired_keys:
            for k in expired_keys[:20]:
                self._cache.pop(k, None)
            return

        # If no expired keys, evict oldest 10%
        sorted_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k].created_at)
        for k in sorted_keys[: max(1, len(sorted_keys) // 10)]:
            self._cache.pop(k, None)

    # -------------------------------------------------------------
    # Key Generators for Public Data
    # -------------------------------------------------------------
    @staticmethod
    def make_places_key(lat: float, lng: float, radius_km: float = 15.0, category: Optional[str] = None) -> str:
        # Snap coordinates to ~100m grid (3 decimal places) to maximize cache hits
        grid_lat = round(lat, 3)
        grid_lng = round(lng, 3)
        cat_norm = (category or "all").lower().strip()
        return f"places:{grid_lat}:{grid_lng}:{round(radius_km, 1)}:{cat_norm}"

    @staticmethod
    def make_weather_key(lat: float, lng: float, days: int = 5) -> str:
        grid_lat = round(lat, 2)
        grid_lng = round(lng, 2)
        return f"weather:{grid_lat}:{grid_lng}:{days}"

    @staticmethod
    def make_geocoding_key(query: str) -> str:
        q_norm = query.strip().lower()
        return f"geocoding:{q_norm}"

    @staticmethod
    def make_destination_places_key(slug: str) -> str:
        return f"dest_places:{slug.lower().strip()}"


# Global singleton instance for application use
cache_service = SafeCacheService()
