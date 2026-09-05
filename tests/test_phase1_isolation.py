"""
Phase-1 isolation & regression tests.

- Cross-user chart isolation (a user must not read/delete another user's chart)
- Dashboard aggregates stay consistent after mixed activity
- ``/api/v5/yoga/stats`` practiced_today honours session dates regardless of
  insertion order (regression: sessions were un-ordered, so ``sessions[0]`` was
  often the oldest row).
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.filterwarnings("ignore:datetime.datetime.utcnow")


@pytest.fixture(scope="module")
def client():
    # Startup event creates the tables (and seeds plans) on the in-memory engine.
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def users(client):
    """Two independent registered users with auth headers."""

    def make(email, name):
        resp = client.post("/api/v5/auth/register", json={
            "email": email, "password": "secret123", "display_name": name,
        })
        if resp.status_code == 409:  # cross-run leftovers in the shared test DB
            resp = client.post("/api/v5/auth/login", json={
                "email": email, "password": "secret123",
            })
        assert resp.status_code in (200, 201), resp.text
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    return {
        "alice": make("iso-alice@test.ir", "Alice"),
        "bob": make("iso-bob@test.ir", "Bob"),
    }


def test_chart_cross_user_isolation(client, users):
    resp = client.post("/api/v5/user/charts/save", headers=users["alice"], json={
        "chart_type": "birth",
        "title": "Alice Secret",
        "chart_data": {"subject": {"name": "Alice"}},
        "score": 95,
    })
    assert resp.status_code == 201, resp.text
    chart_id = resp.json()["id"]

    # Bob must not list, read or delete Alice's chart.
    assert client.get("/api/v5/user/charts", headers=users["bob"]).json()["total"] == 0
    assert client.get(f"/api/v5/user/charts/{chart_id}", headers=users["bob"]).status_code == 404
    assert client.delete(f"/api/v5/user/charts/{chart_id}", headers=users["bob"]).status_code == 404

    # Alice can still read her own chart.
    assert client.get(f"/api/v5/user/charts/{chart_id}", headers=users["alice"]).status_code == 200


def _fresh_user(client, tag):
    import time

    email = f"iso-{tag}-{int(time.time() * 1000)}@test.ir"
    resp = client.post("/api/v5/auth/register", json={
        "email": email, "password": "secret123", "display_name": tag,
    })
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_dashboard_aggregates_match_activity(client):
    alice = _fresh_user(client, "dash")
    # One yoga session + one tarot draw + one chart.
    r = client.post("/api/v5/yoga/session", headers=alice, json={
        "pose_name": "Downward Dog", "category": "asanas", "duration_seconds": 600,
    })
    assert r.status_code == 201
    r = client.post("/api/v5/tarot/history", headers=alice, json={
        "spread_type": "three-card", "card_ids": [1, 2, 3], "reversed": [False, True, False],
    })
    assert r.status_code == 201
    r = client.post("/api/v5/user/charts/save", headers=alice, json={
        "chart_type": "transit", "chart_data": {"when": "now"},
    })
    assert r.status_code == 201

    dash = client.get("/api/v5/user/dashboard", headers=alice).json()
    assert dash["yoga"]["total_sessions"] == 1
    assert dash["yoga"]["streak"] == 1
    assert dash["tarot"]["total_draws"] == 1
    assert dash["charts"]["total"] == 1
    assert isinstance(dash["streaks"], list)
    assert isinstance(dash["user"], dict)

    # A second fresh user's dashboard stays empty regardless.
    other = _fresh_user(client, "empty")
    bdash = client.get("/api/v5/user/dashboard", headers=other).json()
    assert bdash["yoga"]["total_sessions"] == 0
    assert bdash["charts"]["total"] == 0
    assert bdash["tarot"]["total_draws"] == 0


def test_yoga_practiced_today_independent_of_insert_order(client):
    alice = _fresh_user(client, "streak")
    days_ago = (date.today() - timedelta(days=3)).isoformat()
    today = date.today().isoformat()

    # Insert the OLD session first, then today's — practiced_today must be True
    # (regression: stats took sessions[0] from an un-ordered query).
    r = client.post("/api/v5/yoga/session", headers=alice, json={
        "pose_name": "Old Pose", "duration_seconds": 120,
        "practice_date": days_ago,
    })
    assert r.status_code == 201
    r = client.post("/api/v5/yoga/session", headers=alice, json={
        "pose_name": "Today Pose", "duration_seconds": 180,
        "practice_date": today,
    })
    assert r.status_code == 201

    stats = client.get("/api/v5/yoga/stats", headers=alice).json()
    assert stats["practiced_today"] is True
    assert stats["last_practice_date"] == today
    assert stats["total_sessions"] >= 2
