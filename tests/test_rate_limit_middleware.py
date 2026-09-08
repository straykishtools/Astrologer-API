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

# ─── Login / reset throttling (per-IP failed attempts) ───

def test_login_throttle_allows_under_limit():
    os.environ["ENV_TYPE"] = "production"
    rlm._login_failures.clear()
    ip = "9.9.9.9"
    for _ in range(rlm.LOGIN_FAILURE_LIMIT - 1):
        rlm.record_login_failure(ip)
    assert rlm.login_attempt_allowed(ip) is True
    os.environ["ENV_TYPE"] = "test"


def test_login_throttle_locks_after_limit_then_unlocks():
    os.environ["ENV_TYPE"] = "production"
    rlm._login_failures.clear()
    ip = "8.8.8.8"
    for _ in range(rlm.LOGIN_FAILURE_LIMIT):
        rlm.record_login_failure(ip)
    assert rlm.login_attempt_allowed(ip) is False, "IP must be locked at the limit"

    # After the lockout window the IP is allowed again (fresh counter).
    entry = rlm._login_failures[ip]
    entry["locked_until"] = time.time() - 1
    assert rlm.login_attempt_allowed(ip) is True
    os.environ["ENV_TYPE"] = "test"


def test_login_throttle_success_clears_failures():
    os.environ["ENV_TYPE"] = "production"
    rlm._login_failures.clear()
    ip = "7.7.7.7"
    for _ in range(rlm.LOGIN_FAILURE_LIMIT - 1):
        rlm.record_login_failure(ip)
    rlm.clear_login_failures(ip)
    assert rlm.login_attempt_allowed(ip) is True
    assert ip not in rlm._login_failures
    os.environ["ENV_TYPE"] = "test"


def test_login_throttle_exempt_in_test_env():
    os.environ["ENV_TYPE"] = "test"
    ip = "6.6.6.6"
    for _ in range(rlm.LOGIN_FAILURE_LIMIT * 3):
        rlm.record_login_failure(ip)
    assert rlm.login_attempt_allowed(ip) is True, "test env must bypass the lockout"


def test_login_endpoint_returns_429_when_locked(client, monkeypatch):
    """End-to-end: a locked IP gets 429 from /auth/login before auth is even tried."""
    from app.middleware import rate_limit_middleware as rlm_mod

    monkeypatch.setenv("ENV_TYPE", "production")
    rlm_mod._login_failures.clear()
    ip = "203.0.113.77"
    for _ in range(rlm_mod.LOGIN_FAILURE_LIMIT):
        rlm_mod.record_login_failure(ip)

    # Simulate requests from that IP via the forwarded header the middleware reads.
    headers = {"X-Forwarded-For": ip}
    resp = client.post("/api/v5/auth/login", json={"email": "x@cosmic.ir", "password": "wrongpw"}, headers=headers)
    assert resp.status_code == 429, resp.text

    # A different IP is unaffected.
    resp = client.post("/api/v5/auth/login", json={"email": "x@cosmic.ir", "password": "wrongpw"}, headers={"X-Forwarded-For": "198.51.100.9"})
    assert resp.status_code == 401, resp.text
    rlm_mod._login_failures.clear()
    monkeypatch.setenv("ENV_TYPE", "test")

# ─── Static cache-buster middleware ───

def test_static_cache_buster_pins_no_cache_on_js():
    from app.middleware.static_cache_buster_middleware import StaticCacheBusterMiddleware

    statuses = []
    headers_seen = []

    async def inner_app(scope, receive, send):
        await send({"type": "http.response.start", "status": 200,
                    "headers": [(b"content-type", b"application/javascript")]})
        await send({"type": "http.response.body", "body": b"console.log(1)"})

    async def receive():
        return {"type": "http.request", "body": b""}

    async def send(msg):
        if msg["type"] == "http.response.start":
            statuses.append(msg["status"])
            headers_seen.append(msg["headers"])

    mw = StaticCacheBusterMiddleware(inner_app)
    for path in ("/static/auth-panel.js", "/static/style.css"):
        statuses.clear(); headers_seen.clear()
        scope = {"type": "http", "path": path, "headers": []}
        asyncio.run(mw(scope, receive, send))
        assert statuses == [200]
        flat = [k for msg in headers_seen for k, _ in msg]
        assert b"cache-control" in [k.lower() for k in flat], f"no cache-control for {path}"
        cc = [v for msg in headers_seen for k, v in msg if k.lower() == b"cache-control"]
        assert cc == [b"no-cache"], f"wrong cache-control for {path}: {cc}"


def test_static_cache_buster_leaves_non_static_untouched():
    from app.middleware.static_cache_buster_middleware import StaticCacheBusterMiddleware

    headers_seen = []

    async def inner_app(scope, receive, send):
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b""})

    async def receive():
        return {"type": "http.request", "body": b""}

    async def send(msg):
        if msg["type"] == "http.response.start":
            headers_seen.append(msg["headers"])

    mw = StaticCacheBusterMiddleware(inner_app)
    scope = {"type": "http", "path": "/api/v5/auth/me", "headers": []}
    asyncio.run(mw(scope, receive, send))
    flat = [k for msg in headers_seen for k, _ in msg]
    assert b"cache-control" not in [k.lower() for k in flat], "must not touch API responses"


def test_bust_static_url_changes_when_file_changes(tmp_path, monkeypatch):
    """The mtime-hash helper must produce a new version when the file changes."""
    import importlib

    monkeypatch.chdir(tmp_path)
    (tmp_path / "static").mkdir()
    f = tmp_path / "static" / "demo.js"
    f.write_text("a=1")

    import app.middleware.static_cache_buster_middleware as mod
    monkeypatch.setattr(mod, "_version", {})
    v1 = mod.bust_static_url("demo.js")
    assert v1.startswith("demo.js?v=")

    import os as _os, time as _time
    st_old = _os.stat(f)
    _time.sleep(0.01)
    f.write_text("a=2")
    st_new = _os.stat(f)
    assert (st_old.st_mtime_ns, st_old.st_size) != (st_new.st_mtime_ns, st_new.st_size), "test setup needs distinct mtime"

    v2 = mod.bust_static_url("demo.js")
    assert v2 != v1, "version must change when file content changes"
