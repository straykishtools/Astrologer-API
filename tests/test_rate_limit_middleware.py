"""
Unit tests for RateLimitMiddleware.

Covers the production behavior (premium gating, guest quota, daily reset) so
the ENV_TYPE=test exemption can never silently weaken the real limits, plus
the exemption itself.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parent.parent))

os.environ["ENV_TYPE"] = "test"

from app.middleware import rate_limit_middleware as rlm  # noqa: E402


# ─── Harness ───

class Recorder:
    """Captures the response statuses the middleware sends, and counts pass-throughs."""

    def __init__(self):
        self.statuses: list[int] = []
        self.passed = 0

    async def receive(self):
        return {"type": "http.request", "body": b""}

    async def send(self, msg):
        if msg.get("type") == "http.response.start":
            self.statuses.append(msg["status"])
        return None


def _make_mw() -> tuple[rlm.RateLimitMiddleware, Recorder]:
    rec = Recorder()

    async def app(scope, receive, send):
        rec.passed += 1
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b""})

    return rlm.RateLimitMiddleware(app), rec


def _call(mw, rec, path, headers=None, client=None) -> None:
    scope = {
        "type": "http",
        "path": path,
        "headers": headers or [],
        "client": client or ("1.2.3.4", 1234),
    }
    asyncio.run(mw(scope, rec.receive, rec.send))


# ─── ENV manipulation ───

@pytest.fixture(autouse=True)
def _production_env(monkeypatch):
    """Default these tests to a production-like env; the exemption tests opt out."""
    monkeypatch.setenv("ENV_TYPE", "production")
    monkeypatch.setattr(rlm, "_guest_usage", {}, raising=True)
    monkeypatch.setattr(rlm, "_guest_cleanup_time", 0, raising=True)


# ─── Premium gating ───

def test_premium_path_blocked_for_guest_in_production():
    mw, rec = _make_mw()
    # "composite" is in the free plan's premium_paths
    _call(mw, rec, "/api/v5/chart-data/composite/natal")
    assert rec.passed == 0, "guest must not reach a premium chart endpoint"
    assert rec.statuses == [403]


def test_premium_path_open_in_test_env():
    mw, rec = _make_mw()
    os.environ["ENV_TYPE"] = "test"
    _call(mw, rec, "/api/v5/chart-data/composite/natal")
    assert rec.passed == 1
    assert rec.statuses == [200]
    os.environ["ENV_TYPE"] = "production"


# ─── Guest daily quota ───

def test_guest_quota_allows_five_then_429_in_production():
    mw, rec = _make_mw()
    path = "/api/v5/chart-data/natal"  # not premium
    for _ in range(5):
        _call(mw, rec, path, client=("5.6.7.8", 9999))
    assert rec.passed == 5, "first five guest charts are allowed"

    _call(mw, rec, path, client=("5.6.7.8", 9999))
    assert rec.passed == 5, "sixth guest chart must be blocked"
    assert rec.statuses[-1] == 429


def test_guest_quota_is_per_ip():
    mw, rec = _make_mw()
    path = "/api/v5/chart-data/natal"
    for _ in range(5):
        _call(mw, rec, path, client=("10.0.0.1", 1))
    # Different IP gets a fresh quota
    _call(mw, rec, path, client=("10.0.0.2", 2))
    assert rec.passed == 6
    # The exhausted IP stays blocked
    _call(mw, rec, path, client=("10.0.0.1", 1))
    assert rec.passed == 6
    assert rec.statuses[-1] == 429


def test_guest_quota_resets_on_new_day():
    """Stale entries from a previous day are cleaned up, so quota restarts."""
    # Simulate: yesterday's entry exhausted, cleanup overdue.
    yesterday = "2000-01-01"
    rlm._guest_usage = {f"10.1.1.1:{yesterday}": {"count": 5, "date": yesterday}}
    rlm._guest_cleanup_time = time.time() - 700  # > 600s cleanup interval

    allowed, count, limit = rlm._check_guest_limit("10.1.1.1")
    assert allowed is True, "a new day must reset the guest quota"
    assert count == 1
    assert limit == rlm.GUEST_DAILY_LIMIT
    # The stale entry was replaced by today's fresh entry.
    assert len(rlm._guest_usage) == 1


def test_guest_quota_429_resets_after_cleanup():
    from datetime import datetime, timedelta, timezone

    mw, rec = _make_mw()
    path = "/api/v5/chart-data/natal"
    for _ in range(5):
        _call(mw, rec, path, client=("10.2.2.2", 3))
    _call(mw, rec, path, client=("10.2.2.2", 3))
    assert rec.statuses[-1] == 429

    # Simulate the next day: yesterday's exhausted entry + overdue cleanup.
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    rlm._guest_usage = {f"10.2.2.2:{yesterday}": {"count": 5, "date": yesterday}}
    rlm._guest_cleanup_time = time.time() - 700
    _call(mw, rec, path, client=("10.2.2.2", 3))
    assert rec.statuses[-1] == 200, "quota must reset the next day"
    assert rec.passed == 6


# ─── Non-chart paths are never quota-checked ───

def test_non_chart_paths_pass_through_in_production():
    mw, rec = _make_mw()
    for path in ("/health", "/docs", "/api/v5/auth/login", "/api/v5/user/profile"):
        _call(mw, rec, path)
    assert rec.passed == 4
    assert rec.statuses == [200, 200, 200, 200]