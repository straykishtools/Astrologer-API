"""Shared JWT secret resolution (server-only).

The signing key must be injected via the ``JWT_SECRET_KEY`` environment
variable in production. For local/test runs without configuration, a single
ephemeral per-process key is generated once here so that every module in the
process (legacy auth helpers in ``app.models`` and ``app.services.auth_service``)
signs and verifies with the same value. The ephemeral value is never written
to disk or source.

⚠️ باگ 401 (2026-09-13): pydantic-settings مقدار .env را به os.environ
صادرات نمی‌کند؛ پس os.getenv اینجا خالی می‌ماند و هر ری‌استارت کلید تصادفی
تازه‌ای می‌ساخت = تمام توکن‌های قبلی نامعتبر. راه‌حل: بارگذاری مستقیم .env
قبل از خواندن env، و هشدار در حالت کلید موقت.
"""
import os
import secrets

try:
    from dotenv import load_dotenv

    # override=True → مقدار .env همیشه برنده است؛ وگرنه اگر در پوسته/پروسه
    # متغیر قدیمیِ AI_MODEL مانده باشد، restart هم .env تازه را اعمال نمی‌کرد.
    load_dotenv(override=True)
except Exception:  # pragma: no cover - dotenv نصب نیست
    pass

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(48)
if not os.getenv("JWT_SECRET_KEY"):
    import logging

    logging.getLogger(__name__).warning(
        "JWT_SECRET_KEY unset — using an EPHEMERAL key; all tokens are "
        "invalidated on every server restart. Set it in .env."
    )
JWT_ALGORITHM = "HS256"
