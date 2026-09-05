"""
Integration tests for the Phase-1 database endpoints (SQLite via async SQLAlchemy).

Uses a dedicated in-memory database so tests never touch cosmic.db or the
legacy cosmic_oracle.db.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parent.parent))

os.environ["ENV_TYPE"] = "test"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

pytestmark = pytest.mark.filterwarnings("ignore:datetime.datetime.utcnow")


@pytest.fixture(scope="module")
def client():
    # Startup event creates the tables on the in-memory engine; keep a single
    # connection alive for the whole module so the DB isn't wiped between calls.
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def token(client) -> str:
    resp = client.post("/api/v5/auth/register", json={
        "email": "db-test@cosmic.ir",
        "password": "secret123",
        "display_name": "DB Test",
    })
    if resp.status_code == 409:
        resp = client.post("/api/v5/auth/login", json={
            "email": "db-test@cosmic.ir", "password": "secret123",
        })
    assert resp.status_code in (200, 201), resp.text
    data = resp.json()
    return data["access_token"]


@pytest.fixture(scope="module")
def auth(token) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Auth guard ───

def test_protected_routes_require_token(client):
    for path in ("/api/v5/user/profile", "/api/v5/user/dashboard", "/api/v5/yoga/stats", "/api/v5/tarot/history"):
        assert client.get(path).status_code == 401, path


# ─── Profile & settings ───

def test_profile_roundtrip(client, auth):
    resp = client.put("/api/v5/user/profile", headers=auth, json={
        "name": "DB Tester",
        "birth_year": 1992, "birth_month": 6, "birth_day": 21,
        "city": "Tehran", "latitude": 35.68, "longitude": 51.38,
        "timezone": "Asia/Tehran", "zodiac_type": "sidereal",
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "DB Tester"
    assert body["birth_year"] == 1992
    assert body["timezone"] == "Asia/Tehran"
    assert body["zodiac_type"] == "sidereal"

    resp = client.get("/api/v5/user/profile", headers=auth)
    assert resp.status_code == 200
    assert resp.json()["birth_day"] == 21


def test_settings_roundtrip(client, auth):
    resp = client.put("/api/v5/user/settings", headers=auth, json={
        "theme": "light", "daily_reminder_time": "09:30", "preferred_language": "en",
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["theme"] == "light"
    assert body["daily_reminder_time"] == "09:30"

    resp = client.get("/api/v5/user/settings", headers=auth)
    assert resp.json()["preferred_language"] == "en"


# ─── Chart history ───

def test_chart_crud(client, auth):
    resp = client.post("/api/v5/user/charts/save", headers=auth, json={
        "chart_type": "birth",
        "title": "Test Birth Chart",
        "score": 81,
        "chart_data": {"subject": {"name": "DB Tester"}, "planets": {"Sun": {"sign": "Gemini"}}},
        "interpretation": {"level": "high", "title": "Great", "text": "Balanced"},
    })
    assert resp.status_code == 201, resp.text
    chart = resp.json()
    chart_id = chart["id"]
    assert chart["score"] == 81
    assert chart["chart_data"]["planets"]["Sun"]["sign"] == "Gemini"

    resp = client.get("/api/v5/user/charts", headers=auth)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    resp = client.get(f"/api/v5/user/charts/{chart_id}", headers=auth)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test Birth Chart"

    resp = client.get("/api/v5/user/charts/not-a-uuid", headers=auth)
    assert resp.status_code == 404

    resp = client.delete(f"/api/v5/user/charts/{chart_id}", headers=auth)
    assert resp.status_code == 200
    assert client.get(f"/api/v5/user/charts/{chart_id}", headers=auth).status_code == 404


def test_chart_save_legacy_payload(client, auth):
    """input_data/result_data JSON strings are folded into chart_data."""
    resp = client.post("/api/v5/user/charts/save", headers=auth, json={
        "chart_type": "synastry",
        "title": "Legacy Payload",
        "input_data": '{"name": "A"}',
        "result_data": '{"score": 77}',
    })
    assert resp.status_code == 201, resp.text
    chart = resp.json()
    assert chart["chart_data"]["input"]["name"] == "A"
    assert chart["chart_data"]["result"]["score"] == 77


# ─── Yoga ───

def test_yoga_session_stats_streak(client, auth):
    resp = client.post("/api/v5/yoga/session", headers=auth, json={
        "pose_id": 1, "pose_name": "Mountain Pose", "category": "asanas",
        "duration_seconds": 600, "completed": True,
    })
    assert resp.status_code == 201, resp.text
    assert resp.json()["duration_seconds"] == 600

    resp = client.post("/api/v5/yoga/session", headers=auth, json={
        "category": "meditation", "duration_seconds": 300, "completed": True,
    })
    assert resp.status_code == 201

    resp = client.get("/api/v5/yoga/stats", headers=auth)
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_sessions"] == 2
    assert stats["total_minutes"] == 15
    assert stats["streak"] >= 1
    assert stats["practiced_today"] is True

    resp = client.get("/api/v5/yoga/history", headers=auth)
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_yoga_favorites(client, auth):
    resp = client.post("/api/v5/yoga/favorite", headers=auth, json={
        "pose_id": 42, "pose_name": "Downward Dog",
    })
    assert resp.status_code == 201, resp.text

    resp = client.get("/api/v5/yoga/favorites", headers=auth)
    assert resp.json()["total"] == 1

    resp = client.delete("/api/v5/yoga/favorite/42", headers=auth)
    assert resp.status_code == 200

    resp = client.get("/api/v5/yoga/favorites", headers=auth)
    assert resp.json()["total"] == 0


# ─── Tarot history ───

def test_tarot_history_roundtrip(client, auth):
    resp = client.post("/api/v5/tarot/history", headers=auth, json={
        "spread_type": "three-card",
        "card_ids": [1, 2, 3],
        "reversed": [False, True, False],
        "question": "What next?",
    })
    assert resp.status_code == 201, resp.text
    draw = resp.json()
    assert draw["spread_type"] == "three-card"
    assert draw["card_ids"] == [1, 2, 3]
    assert draw["reversed"] == [False, True, False]

    resp = client.get("/api/v5/tarot/history", headers=auth)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


# ─── Dashboard ───

def test_dashboard(client, auth):
    resp = client.get("/api/v5/user/dashboard", headers=auth)
    assert resp.status_code == 200, resp.text
    dash = resp.json()
    assert dash["user"]["email"] == "db-test@cosmic.ir"
    assert dash["profile"] is not None
    assert dash["profile"]["name"] == "DB Tester"
    assert dash["charts"]["total"] >= 1
    assert dash["yoga"]["total_sessions"] >= 1
    assert dash["yoga"]["recent"], "dashboard should include recent yoga sessions"
    first = dash["yoga"]["recent"][0]
    assert first["category"] in ("asanas", "breathing", "meditation")
    assert "practice_date" in first and "duration_seconds" in first
    assert dash["tarot"]["total_draws"] >= 1
    streak_types = {s["streak_type"] for s in dash["streaks"]}
    assert {"yoga", "tarot"}.issubset(streak_types)


# ─── Rate limiter (test-env bypass) ───

def test_rate_limiter_bypassed_in_test_env():
    """ENV_TYPE=test must skip quota enforcement so suites can run in one process."""
    import asyncio

    from app.middleware.rate_limit_middleware import RateLimitMiddleware

    assert os.getenv("ENV_TYPE") == "test"
    calls = []

    async def dummy_app(scope, receive, send):
        calls.append(scope.get("path"))
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b""})

    mw = RateLimitMiddleware(dummy_app)

    async def send(msg):
        return None

    async def receive():
        return {"type": "http.request", "body": b""}

    scope = {"type": "http", "path": "/api/v5/chart-data/natal", "headers": []}

    async def run():
        for _ in range(7):  # exceeds the 5-chart guest limit
            await mw(dict(scope), receive, send)

    asyncio.run(run())
    assert len(calls) == 7, "test env must bypass quota checks"


# ─── Plans model + seeds ───

def test_plans_model_registered():
    from app.models import Base, Plan

    assert "plans" in Base.metadata.tables
    assert Plan.__tablename__ == "plans"


# ─── Email verification & password reset ───

def _fetch_verification_token(email: str) -> str:
    """Read the current verification token from the (in-memory) test DB."""
    import asyncio

    from sqlalchemy import select

    from app.config.database import SessionLocal
    from app.models import User

    async def get():
        async with SessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            assert user is not None, f"user {email} missing from cosmic DB"
            return user.verification_token

    return asyncio.run(get())


def test_email_verification_flow(client, auth):
    import re

    # Verify the console email prints a token (dev mode, SMTP unset)
    import io
    from contextlib import redirect_stdout

    buf = io.StringIO()
    with redirect_stdout(buf):
        resp = client.post("/api/v5/auth/resend-verification", json={"email": "db-test@cosmic.ir"})
    assert resp.status_code == 200
    printed = buf.getvalue()

    token = _fetch_verification_token("db-test@cosmic.ir")
    assert token, "forgot/resend must set a verification token"

    # Bad token -> 400
    assert client.post("/api/v5/auth/verify-email", json={"token": "nope"}).status_code == 400

    # Good token -> verified
    resp = client.post("/api/v5/auth/verify-email", json={"token": token})
    assert resp.status_code == 200, resp.text
    assert resp.json()["email_verified"] is True

    # Token consumed -> second use fails
    assert client.post("/api/v5/auth/verify-email", json={"token": token}).status_code == 400

    # Console output contains the dev email link (SMTP not configured)
    assert re.search(r"verify-email\?token=", printed), "dev console email must print the link"


def test_password_reset_flow(client, auth):
    import uuid

    email = f"reset-{uuid.uuid4().hex[:8]}@cosmic.ir"
    password = "oldpass123"

    # Register (legacy layer) then provision the cosmic row via a protected call
    resp = client.post("/api/v5/auth/register", json={"email": email, "password": password})
    assert resp.status_code in (200, 201), resp.text
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v5/user/profile", headers=headers).status_code == 200

    # Request a reset -> generic success, token set in DB
    resp = client.post("/api/v5/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200
    reset_token = _fetch_verification_token(email)
    assert reset_token

    # Reset with the token
    resp = client.post("/api/v5/auth/reset-password", json={"token": reset_token, "new_password": "newpass456"})
    assert resp.status_code == 200, resp.text

    # New password works against the legacy login (the source of truth)
    resp = client.post("/api/v5/auth/login", json={"email": email, "password": "newpass456"})
    assert resp.status_code == 200, resp.text

    # Token consumed -> cannot reset twice
    resp = client.post("/api/v5/auth/reset-password", json={"token": reset_token, "new_password": "another789"})
    assert resp.status_code == 400

    # Old password no longer works
    assert client.post("/api/v5/auth/login", json={"email": email, "password": password}).status_code == 401


# ─── Dev email inbox ───

def test_dev_email_inbox_lists_recent_emails(client):
    import uuid

    email = f"inbox-{uuid.uuid4().hex[:8]}@cosmic.ir"
    resp = client.post("/api/v5/auth/resend-verification", json={"email": email})
    assert resp.status_code == 200

    resp = client.get("/api/v5/auth/dev/emails")
    assert resp.status_code == 200
    inbox = resp.json()
    assert inbox["count"] >= 1
    emails = inbox["emails"]
    assert emails[0]["to"] == email
    assert "verify-email?token=" in emails[0]["body"]
    assert emails[0]["sent"] is False  # SMTP unset → console/dev mode


def test_dev_email_inbox_disabled_in_production(client, monkeypatch):
    monkeypatch.setenv("ENV_TYPE", "production")
    assert client.get("/api/v5/auth/dev/emails").status_code == 404