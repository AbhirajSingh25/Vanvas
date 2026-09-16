import time
import threading
from typing import Any, Optional, Dict, Tuple

class MemoryCache:
    """
    Thread-safe in-memory cache with Time-To-Live (TTL) expiration and bounded capacity.
    Designed for fast geocoding, places, weather, and search caching without external dependencies.
    """
    def __init__(self, max_size: int = 1000, default_ttl_seconds: int = 300):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._max_size = max_size
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            val, expire_at = self._cache[key]
            if time.time() > expire_at:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expire_at = time.time() + ttl
        with self._lock:
            # If max capacity reached, prune expired or oldest items
            if len(self._cache) >= self._max_size:
                now = time.time()
                expired_keys = [k for k, (_, exp) in self._cache.items() if now > exp]
                for k in expired_keys:
                    del self._cache[k]
                # If still at capacity, remove oldest 10%
                if len(self._cache) >= self._max_size:
                    remove_count = max(1, self._max_size // 10)
                    for k in list(self._cache.keys())[:remove_count]:
                        del self._cache[k]
            self._cache[key] = (value, expire_at)

    def delete(self, key: str) -> None:
        with self._lock:
            if key in self._cache:
                del self._cache[key]

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        with self._lock:
            now = time.time()
            return sum(1 for _, exp in self._cache.values() if now <= exp)

# Global cache instances for specific subsystems with tailored TTLs
geo_cache = MemoryCache(max_size=500, default_ttl_seconds=600)      # 10 minutes for geocoding & autocomplete
places_cache = MemoryCache(max_size=500, default_ttl_seconds=300)   # 5 minutes for nearby places
weather_cache = MemoryCache(max_size=200, default_ttl_seconds=900)  # 15 minutes for meteorological forecasts
web_search_cache = MemoryCache(max_size=200, default_ttl_seconds=600) # 10 minutes for travel web search
