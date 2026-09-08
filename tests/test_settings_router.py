"""
Tests for the server-side admin settings API (/api/v5/settings/{ns}).

The admin panel's plans/audio/backgrounds live in the app_settings table so
they apply to every user — these tests pin the read/write/authz contract.
"""
from __future__ import annotations

import time

from fastapi.testclient import TestClient


def _admin_headers(client: TestClient) -> dict:
    resp = client.post("/api/v5/auth/login", json={"email": "admin@cosmic.ir", "password": "admin123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _user_headers(client: TestClient) -> dict:
    email = f"settings-viewer-{int(time.time() * 1000)}@test.com"
    resp = client.post("/api/v5/auth/register", json={"email": email, "password": "secret123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_get_empty_namespace_returns_empty_items(client: TestClient):
    resp = client.get("/api/v5/settings/backgrounds")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["ns"] == "backgrounds"
    assert body["items"] == []


def test_get_unknown_namespace_is_404(client: TestClient):
    assert client.get("/api/v5/settings/nope").status_code == 404


def test_put_requires_admin(client: TestClient):
    headers = _user_headers(client)
    resp = client.put(
        "/api/v5/settings/plans",
        json={"items": [{"name": "free"}]},
        headers=headers,
    )
    assert resp.status_code == 403, resp.text

    # Anonymous too.
    assert client.put("/api/v5/settings/plans", json={"items": []}).status_code in (401, 403)


def test_put_roundtrip_and_public_read(client: TestClient):
    admin = _admin_headers(client)
    items = [
        {"name": "gold", "label": "طلایی", "price": "۹۹,۰۰۰ تومان/ماه"},
        {"name": "free", "label": "رایگان", "price": "۰ تومان"},
    ]
    resp = client.put("/api/v5/settings/plans", json={"items": items}, headers=admin)
    assert resp.status_code == 200, resp.text
    assert resp.json()["count"] == 2

    # Public read sees exactly what the admin wrote (order preserved).
    got = client.get("/api/v5/settings/plans").json()["items"]
    assert [i["name"] for i in got] == ["gold", "free"]

    # Overwrite replaces the whole namespace.
    resp = client.put("/api/v5/settings/plans", json={"items": [{"name": "only"}]}, headers=admin)
    assert resp.status_code == 200
    got = client.get("/api/v5/settings/plans").json()["items"]
    assert [i["name"] for i in got] == ["only"]


def test_put_rejects_non_list_items(client: TestClient):
    admin = _admin_headers(client)
    resp = client.put("/api/v5/settings/audio", json={"items": "oops"}, headers=admin)
    assert resp.status_code == 400, resp.text
