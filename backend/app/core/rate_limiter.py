"""
VANVAS Lightweight In-Memory Rate Limiter
Abuse protection and endpoint safety for public search, discovery, and Copilot endpoints.

Returns HTTP 429 Too Many Requests when threshold exceeded.
"""

import time
import logging
from collections import defaultdict
from typing import Dict, List, Callable
from fastapi import Request, HTTPException, status

logger = logging.getLogger("vanvas.core.rate_limiter")


class InMemoryRateLimiter:
    def __init__(self):
        # Maps client_id -> list of request timestamps
        self._history: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def _get_client_identifier(self, request: Request) -> str:
        """Extracts client IP address or user ID from Authorization header."""
        auth = request.headers.get("Authorization")
        if auth and len(auth) > 15:
            # Use hash or prefix of auth token
            return f"auth:{hash(auth)}"
        
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"

    def check(self, request: Request, max_requests: int = 60, window_seconds: float = 60.0) -> None:
        now = time.time()
        client_id = self._get_client_identifier(request)

        # Periodic cleanup of expired records every 60s
        if now - self._last_cleanup > 60.0:
            self._cleanup(now, window_seconds)

        timestamps = self._history[client_id]
        # Keep only timestamps within window
        cutoff = now - window_seconds
        valid_timestamps = [t for t in timestamps if t > cutoff]
        self._history[client_id] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            retry_after = max(1, int(oldest + window_seconds - now))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded ({max_requests} requests per {int(window_seconds)}s). Please retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)}
            )

        self._history[client_id].append(now)

    def _cleanup(self, now: float, window_seconds: float) -> None:
        self._last_cleanup = now
        cutoff = now - max(window_seconds, 120.0)
        dead_keys = []
        for client_id, timestamps in list(self._history.items()):
            valid = [t for t in timestamps if t > cutoff]
            if valid:
                self._history[client_id] = valid
            else:
                dead_keys.append(client_id)
        for k in dead_keys:
            self._history.pop(k, None)


rate_limiter = InMemoryRateLimiter()


def rate_limit(max_requests: int = 60, window_seconds: float = 60.0) -> Callable:
    """FastAPI Dependency for rate limiting an endpoint."""
    async def dependency(request: Request):
        rate_limiter.check(request, max_requests=max_requests, window_seconds=window_seconds)
    return dependency
