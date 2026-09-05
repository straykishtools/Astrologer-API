"""
Smoke tests for the application shell itself (app/main.py wiring).

These are the first, deliberately tiny integration tests: they only check
that the entrypoint serves its frontend and that the health probe works.
Run with: pytest tests/test_app_smoke.py -v
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """/health is the liveness probe and must answer 200 with status OK."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "OK"}


def test_index_page_is_served(client: TestClient):
    """The main page (/) must serve the index.html frontend, not JSON."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    # A real HTML document starts with a doctype (index.html exists in repo root)
    assert resp.text.lstrip().lower().startswith("<!doctype html")