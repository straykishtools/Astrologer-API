"""
Simple in-memory cache with configurable TTL.
Used to cache NASA API responses for 24 hours.
"""

import time
from typing import Any, Optional


class SimpleCache:
    """In-memory cache with TTL (Time-To-Live) expiration."""

    def __init__(self, ttl_seconds: int = 86400):  # 24 hours default
        self._store: dict[str, tuple[Any, float]] = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        """Get a cached value if it hasn't expired."""
        if key in self._store:
            value, timestamp = self._store[key]
            if time.time() - timestamp < self.ttl:
                return value
            # Expired — clean up
            del self._store[key]
        return None

    def set(self, key: str, value: Any) -> None:
        """Store a value with the current timestamp."""
        self._store[key] = (value, time.time())

    def delete(self, key: str) -> None:
        """Remove a cached value."""
        self._store.pop(key, None)

    def clear(self) -> None:
        """Clear all cached values."""
        self._store.clear()

    @property
    def size(self) -> int:
        """Number of cached entries."""
        return len(self._store)


# Shared instances for NASA services
nasa_cache = SimpleCache(ttl_seconds=86400)  # 24 hours
apod_cache = SimpleCache(ttl_seconds=86400)  # 24 hours
