"""
Authentication service for the Cosmic Oracle database (Phase 1).

- Password hashing with bcrypt
- JWT creation/verification with PyJWT (project convention; python-jose
  exposes the same ``jwt`` package and would conflict)
- Token expiry: 7 days; email verification tokens: 24 hours
- ``get_current_user`` FastAPI dependency that validates the JWT issued by the
  existing auth router and resolves (lazy-provisioning) the async ``User`` row
"""
import asyncio
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models import User

# Must match the legacy auth config in app/models.py (shared secret key).
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cosmic-oracle-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
VERIFICATION_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


# ─── Password hashing (bcrypt) ───

def hash_password(password: str) -> str:
    """Hash a password with bcrypt (returns the full ``$2b$...`` string)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ─── JWT ───

def create_access_token(data: dict) -> str:
    """Create a signed JWT with a 7-day expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode + validate a JWT. Returns the payload or None."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def create_verification_token() -> str:
    """Cryptographically random token used for email verification / password reset."""
    return secrets.token_urlsafe(32)


# ─── Email verification & password reset ───

async def issue_verification_token(db: AsyncSession, user: User) -> str:
    """Set a fresh 24-hour verification token on the user row and return it."""
    token = create_verification_token()
    user.verification_token = token
    user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    await db.flush()
    return token


async def verify_email_token(db: AsyncSession, token: str) -> User:
    """Mark the user owning ``token`` as verified. Raises 400 on bad/expired tokens."""
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="توکن نامعتبر است")
    if (
        user.verification_token_expires_at is not None
        and user.verification_token_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="توکن منقضی شده است")
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    await db.flush()
    return user


async def reset_password_with_token(db: AsyncSession, token: str, new_password: str) -> User:
    """Validate a reset token and set a new password in BOTH databases.

    The new-database hash (bcrypt) is updated for consistency, and the legacy
    SHA256+salt hash is updated too because that is what the login endpoint
    actually verifies.
    """
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="توکن نامعتبر است")
    if (
        user.verification_token_expires_at is not None
        and user.verification_token_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="توکن منقضی شده است")

    user.password_hash = hash_password(new_password)
    user.verification_token = None
    user.verification_token_expires_at = None
    await db.flush()

    # Legacy login layer must see the new password too.
    from app.models import reset_password_by_email

    await asyncio.to_thread(reset_password_by_email, user.email, new_password)
    return user


def provision_user_sync(
    email: str, display_name: str | None = None, password: str | None = None
) -> tuple[str, str]:
    """Synchronous user provisioning + verification-token issuance.

    Called from the legacy (sync) register endpoint so a fresh account already
    exists in the Cosmic Oracle database with a 24-hour verification token.
    Uses a direct sqlite3 connection to ``cosmic.db`` — same file the async
    engine manages, so no extra server state is needed.
    Returns (email, verification_token).
    """
    import sqlite3

    from app.config.database import DEFAULT_DB_PATH

    email = (email or "").strip().lower()
    token = create_verification_token()
    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    hashed = hash_password(password) if password else hash_password(secrets.token_urlsafe(24))
    conn = sqlite3.connect(DEFAULT_DB_PATH)
    try:
        # id must be 32-char hex (no dashes) to match SQLAlchemy's Uuid storage on SQLite.
        conn.execute(
            """INSERT INTO users (id, email, password_hash, display_name, plan, is_active,
                                  email_verified, verification_token, verification_token_expires_at)
               VALUES (?, ?, ?, ?, 'free', 1, 0, ?, ?)
               ON CONFLICT(email) DO UPDATE SET
                   password_hash = excluded.password_hash,
                   display_name = excluded.display_name,
                   verification_token = excluded.verification_token,
                   verification_token_expires_at = excluded.verification_token_expires_at""",
            (uuid.uuid4().hex, email, hashed, display_name or email.split("@")[0], token, expires),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        # Table may not exist yet (fresh checkout before startup) — ignore; the
        # async layer provisions on first authenticated request anyway.
        token = ""
    finally:
        conn.close()
    return email, token


# ─── User resolution (bridges legacy JWT -> async users table) ───

async def ensure_user(db: AsyncSession, email: str, display_name: Optional[str] = None) -> User:
    """Return the async User row for ``email``, creating it on first access.

    Users are provisioned lazily from a valid legacy JWT so the new database
    never needs its own login flow — the existing register/login endpoints
    keep working and every authenticated request gets a matching ORM row.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = User(
        email=email,
        password_hash=hash_password(secrets.token_urlsafe(24)),  # random; legacy hash stays canonical
        display_name=display_name or email.split("@")[0],
        plan="free",
    )
    db.add(user)
    try:
        await db.flush()
    except Exception:
        # Lost a race — someone else created this user first.
        await db.rollback()
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one()
    return user


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: validate the Bearer JWT and return the async User.

    Works with tokens issued by the legacy ``/api/v5/auth/*`` routers (same
    secret key) and lazily creates the corresponding row in the new database.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="لطفاً وارد شوید")

    token = (
        authorization.replace("Bearer ", "")
        if authorization.startswith("Bearer ")
        else authorization
    )
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="توکن نامعتبر یا منقضی شده")

    email = (payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="توکن نامعتبر یا منقضی شده")

    user = await ensure_user(db, email)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="حساب کاربری غیرفعال است")

    # Carry the legacy integer user id for cross-system lookups (plans/charts).
    try:
        user._legacy_user_id = payload.get("user_id")
    except Exception:
        pass
    return user