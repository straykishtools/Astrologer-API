"""Shared JWT secret resolution (server-only).

The signing key must be injected via the ``JWT_SECRET_KEY`` environment
variable in production. For local/test runs without configuration, a single
ephemeral per-process key is generated once here so that every module in the
process (legacy auth helpers in ``app.models`` and ``app.services.auth_service``)
signs and verifies with the same value. The ephemeral value is never written
to disk or source.
"""
import os
import secrets

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(48)
JWT_ALGORITHM = "HS256"
