"""
Tests for the admin panel & account settings endpoints.

- PUT  /api/v5/auth/profile                     (self profile update)
- PUT/DELETE /api/v5/auth/admin/users/{id}      (admin user management)
- POST /api/v5/auth/admin/users/{id}/reset-usage
- GET  /api/v5/auth/admin/stats
- GET  /admin.html, /account.html               (static pages served)

All DB writes go to an isolated temporary SQLite file (not cosmic_oracle.db).
"""

from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

import app.models as models


@pytest.fixture(scope="module", autouse=True)
def isolated_db(tmp_path_factory):
    """Point the models layer at a temp database for this whole module."""
    db_file = tmp_path_factory.mktemp("authdb") / "test_auth.db"
    old_db_path = models.DB_PATH
    models.DB_PATH = str(db_file)
    models.init_db()  # creates tables + default plans + default admin
    yield
    models.DB_PATH = old_db_path


def _register(client: TestClient, email: str | None = None, password: str = "secret123"):
    email = email or f"u{int(time.time() * 1000)}@test.com"
    resp = client.post("/api/v5/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    headers = {"Authorization": f"Bearer {body['access_token']}"}
    return body["user"], headers


def _admin_headers(client: TestClient) -> dict:
    # ادمین پیش‌فرض seed شده توسط init_db (موجود در ENDPOINTS.md)
    resp = client.post("/api/v5/auth/login", json={"email": "admin@cosmic.ir", "password": "admin123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


# ---------------------------------------------------------------- profile

def test_profile_update_reflected_in_me(client: TestClient):
    user, headers = _register(client)
    resp = client.put("/api/v5/auth/profile", headers=headers,
                      json={"display_name": "نام جدید", "email": f"renamed_{user['id']}@test.com"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["display_name"] == "نام جدید"
    assert body["email"] == f"renamed_{user['id']}@test.com"

    me = client.get("/api/v5/auth/me", headers=headers).json()
    assert me["display_name"] == "نام جدید"


def test_profile_email_conflict_returns_409(client: TestClient):
    _, headers_a = _register(client)
    user_b, _ = _register(client)
    resp = client.put("/api/v5/auth/profile", headers=headers_a, json={"email": user_b["email"]})
    assert resp.status_code == 409


def test_profile_requires_auth(client: TestClient):
    resp = client.put("/api/v5/auth/profile", json={"display_name": "x"})
    assert resp.status_code == 401


# ------------------------------------------------------------ admin users

def test_admin_edit_user_plan_and_admin_flag(client: TestClient):
    admin_headers = _admin_headers(client)
    user, _ = _register(client)

    resp = client.put(f"/api/v5/auth/admin/users/{user['id']}", headers=admin_headers,
                      json={"plan": "gold", "is_admin": True, "display_name": "ارتقاییافته"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["plan"] == "gold"
    assert body["is_admin"] is True
    assert body["display_name"] == "ارتقاییافته"


def test_admin_edit_user_invalid_plan_returns_404(client: TestClient):
    admin_headers = _admin_headers(client)
    user, _ = _register(client)
    resp = client.put(f"/api/v5/auth/admin/users/{user['id']}", headers=admin_headers,
                      json={"plan": "does-not-exist"})
    assert resp.status_code == 404


def test_admin_cannot_demote_self(client: TestClient):
    admin_headers = _admin_headers(client)
    me = client.get("/api/v5/auth/me", headers=admin_headers).json()
    resp = client.put(f"/api/v5/auth/admin/users/{me['id']}", headers=admin_headers,
                      json={"is_admin": False})
    assert resp.status_code == 400


def test_admin_edit_requires_admin(client: TestClient):
    user, headers = _register(client)
    other, _ = _register(client)
    resp = client.put(f"/api/v5/auth/admin/users/{other['id']}", headers=headers,
                      json={"plan": "gold"})
    assert resp.status_code == 403


def test_admin_delete_user_then_token_invalid(client: TestClient):
    admin_headers = _admin_headers(client)
    user, headers = _register(client)

    resp = client.delete(f"/api/v5/auth/admin/users/{user['id']}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"

    # توکن کاربر حذف‌شده دیگر معتبر نیست
    me = client.get("/api/v5/auth/me", headers=headers)
    assert me.status_code == 401


def test_admin_cannot_delete_self(client: TestClient):
    admin_headers = _admin_headers(client)
    me = client.get("/api/v5/auth/me", headers=admin_headers).json()
    resp = client.delete(f"/api/v5/auth/admin/users/{me['id']}", headers=admin_headers)
    assert resp.status_code == 400


# ------------------------------------------------------------ usage / stats

def test_admin_reset_usage(client: TestClient):
    admin_headers = _admin_headers(client)
    user, _ = _register(client)

    # مصرف را دستی روی ۵ می‌گذاریم
    conn = models.get_db()
    conn.execute("UPDATE users SET daily_charts_used = 5 WHERE id = ?", (user["id"],))
    conn.commit()
    conn.close()

    resp = client.post(f"/api/v5/auth/admin/users/{user['id']}/reset-usage", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["daily_charts_used"] == 0

    conn = models.get_db()
    row = conn.execute("SELECT daily_charts_used FROM users WHERE id = ?", (user["id"],)).fetchone()
    conn.close()
    assert row["daily_charts_used"] == 0


def test_admin_stats_shape(client: TestClient):
    admin_headers = _admin_headers(client)
    resp = client.get("/api/v5/auth/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_users"] >= 2  # ادمین پیش‌فرض + کاربران تست
    assert body["total_admins"] >= 1
    assert isinstance(body["per_plan"], list)
    assert any(p["plan"] == "free" for p in body["per_plan"])


def test_stats_requires_admin(client: TestClient):
    _, headers = _register(client)
    resp = client.get("/api/v5/auth/admin/stats", headers=headers)
    assert resp.status_code == 403


# ------------------------------------------------------------ static pages

def test_admin_and_account_pages_served(client: TestClient):
    for path in ("/admin.html", "/account.html"):
        resp = client.get(path)
        assert resp.status_code == 200, path
        assert "text/html" in resp.headers["content-type"], path
