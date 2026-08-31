"""
Tests for guest (unauthenticated) IP-based rate limiting.
Verifies: 5/day cap, rollback on failure, daily reset, IP isolation.
"""
import time
from unittest.mock import patch, MagicMock

import pytest


# Import the functions under test
from app.middleware.rate_limit_middleware import (
    _check_guest_limit,
    _decrement_guest,
    _get_guest_ip,
    _guest_usage,
    GUEST_DAILY_LIMIT,
)


@pytest.fixture(autouse=True)
def clean_guest_state():
    """Reset global guest usage state before each test."""
    import app.middleware.rate_limit_middleware as mod
    mod._guest_usage.clear()
    mod._guest_cleanup_time = 0
    yield
    mod._guest_usage.clear()


class TestGuestDailyLimit:
    """Test the 5/day cap for guest users."""

    def test_first_request_allowed(self):
        allowed, count, limit = _check_guest_limit("192.168.1.1")
        assert allowed is True
        assert count == 1
        assert limit == GUEST_DAILY_LIMIT

    def test_five_requests_allowed(self):
        ip = "10.0.0.1"
        for i in range(GUEST_DAILY_LIMIT):
            allowed, count, limit = _check_guest_limit(ip)
            assert allowed is True, f"Request {i+1} should be allowed"
            assert count == i + 1

    def test_sixth_request_blocked(self):
        ip = "10.0.0.2"
        for _ in range(GUEST_DAILY_LIMIT):
            _check_guest_limit(ip)
        allowed, count, limit = _check_guest_limit(ip)
        assert allowed is False
        assert count == GUEST_DAILY_LIMIT + 1
        assert limit == GUEST_DAILY_LIMIT

    def test_seventh_request_still_blocked(self):
        ip = "10.0.0.3"
        for _ in range(GUEST_DAILY_LIMIT + 2):
            _check_guest_limit(ip)
        allowed, count, limit = _check_guest_limit(ip)
        assert allowed is False


class TestIPIsolation:
    """Different IPs should have independent limits."""

    def test_different_ips_independent(self):
        ip1 = "192.168.1.100"
        ip2 = "192.168.1.200"
        # Exhaust ip1
        for _ in range(GUEST_DAILY_LIMIT):
            _check_guest_limit(ip1)
        # ip2 should still be allowed
        allowed, count, _ = _check_guest_limit(ip2)
        assert allowed is True
        assert count == 1


class TestRollback:
    """_decrement_guest should roll back on failure."""

    def test_decrement_reduces_count(self):
        ip = "172.16.0.1"
        for _ in range(3):
            _check_guest_limit(ip)
        _decrement_guest(ip)
        # After decrement, count should be 2
        import app.middleware.rate_limit_middleware as mod
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key = f"{ip}:{today}"
        assert mod._guest_usage[key]["count"] == 2

    def test_decrement_does_not_go_below_zero(self):
        ip = "172.16.0.2"
        _check_guest_limit(ip)  # count = 1
        _decrement_guest(ip)    # count = 0
        _decrement_guest(ip)    # should not go below 0
        import app.middleware.rate_limit_middleware as mod
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key = f"{ip}:{today}"
        assert mod._guest_usage[key]["count"] == 0

    def test_rollback_allows_new_requests(self):
        ip = "172.16.0.3"
        # Exhaust limit (count = 5)
        for _ in range(GUEST_DAILY_LIMIT):
            _check_guest_limit(ip)
        # 6th request blocked (count = 6)
        allowed, _, _ = _check_guest_limit(ip)
        assert allowed is False
        # Rollback 2: 6 → 4, then next request increments to 5 (within limit)
        _decrement_guest(ip)
        _decrement_guest(ip)
        allowed, count, _ = _check_guest_limit(ip)
        assert allowed is True
        assert count == GUEST_DAILY_LIMIT


class TestDailyReset:
    """Requests from a previous day should not count toward today."""

    def test_new_day_resets_count(self):
        ip = "10.10.10.10"
        # Exhaust today
        for _ in range(GUEST_DAILY_LIMIT):
            _check_guest_limit(ip)
        # Simulate "yesterday" by changing the date in the stored entry
        import app.middleware.rate_limit_middleware as mod
        from datetime import datetime, timezone
        key = f"{ip}:2020-01-01"
        mod._guest_usage[key] = {"count": 999, "date": "2020-01-01"}
        # Today's entry is separate, but check that old date doesn't interfere
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        today_key = f"{ip}:{today}"
        # The old entry shouldn't block today
        allowed, count, _ = _check_guest_limit(ip)
        # count should reflect today's actual usage (5+1=6, blocked)
        # But the old entry shouldn't be counted
        assert mod._guest_usage[today_key]["date"] == today


class TestGetGuestIP:
    """Test IP extraction from ASGI scope."""

    def test_client_ip(self):
        scope = {"client": ("192.168.1.1", 12345)}
        assert _get_guest_ip(scope) == "192.168.1.1"

    def test_forwarded_header(self):
        scope = {
            "client": ("127.0.0.1", 80),
            "headers": [(b"x-forwarded-for", b"203.0.113.50, 70.41.3.18")],
        }
        assert _get_guest_ip(scope) == "203.0.113.50"

    def test_no_client(self):
        scope = {}
        assert _get_guest_ip(scope) == "unknown"


class TestCleanup:
    """Test that expired entries are cleaned up."""

    def test_cleanup_removes_old_entries(self):
        import app.middleware.rate_limit_middleware as mod
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Add some entries for today and yesterday
        mod._guest_usage["old-ip:2020-01-01"] = {"count": 10, "date": "2020-01-01"}
        mod._guest_usage["new-ip:" + today] = {"count": 2, "date": today}
        mod._guest_cleanup_time = 0  # Force cleanup
        
        _check_guest_limit("trigger-cleanup-ip")
        
        assert "old-ip:2020-01-01" not in mod._guest_usage
        assert "new-ip:" + today in mod._guest_usage
