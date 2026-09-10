"""
Authentication & account service for the Cosmic Oracle database (Phase 1).

Single async ORM-backed service — the legacy synchronous store
(cosmic_oracle.db, SHA256+salt hashes, integer ids) has been fully migrated
onto this layer, so there is no dual-store bridging anymore.

Responsibilities:
- Password hashing: bcrypt for new hashes; the legacy SHA256+salt format is
  still accepted on login so migrated accounts keep working, and the hash is
  transparently upgraded to bcrypt on first successful login.
- JWT creation/verification (7-day expiry; same secret as the original auth
  layer, so previously issued tokens keep working).
- Email verification + password-reset tokens (24-hour expiry).
- User CRUD, daily chart quota, the configurable plans table, guest sessions
  and the legacy saved-charts endpoints (same response formats as before).
"""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models import GuestSession, Plan, SavedChart, User

# Must match the legacy auth config (shared secret key) so existing JWTs work.
# Security fix: never fall back to a known constant. app.config.security resolves
# JWT_SECRET_KEY from the environment and, when unset (dev/test), generates a
# random per-process key so tokens can never be forged with a guessable secret.
from app.config.security import JWT_SECRET_KEY as SECRET_KEY  # noqa: E402
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
VERIFICATION_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

GUEST_DAILY_LIMIT = 5  # 5 charts per day for guests


# ─── Password hashing (bcrypt primary; legacy SHA256+salt still verifies) ───

def hash_password(password: str) -> str:
    """Hash a password with bcrypt (returns the full ``$2b$...`` string)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def is_legacy_hash(password_hash: str) -> bool:
    """True when the stored hash is the old ``salt$sha256hex`` format."""
    return bool(password_hash) and "$" in password_hash and not password_hash.startswith("$2")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a bcrypt or legacy SHA256+salt hash."""
    if not password_hash:
        return False
    if password_hash.startswith("$2"):  # bcrypt
        try:
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        except (ValueError, TypeError):
            return False
    # Legacy format: salt$sha256(salt + password)
    try:
        salt, stored_hash = password_hash.split("$", 1)
        candidate = hashlib.sha256((salt + password).encode()).hexdigest()
        return hmac.compare_digest(candidate, stored_hash)
    except (ValueError, AttributeError):
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
    """Validate a reset token and set a new bcrypt password (ORM only)."""
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
    return user


# ─── User CRUD ───

async def create_user(
    db: AsyncSession, email: str, password: str, display_name: str = ""
) -> Optional[User]:
    """Create a user row. Returns None when the email is already taken."""
    email = (email or "").strip().lower()
    existing = (
        await db.execute(select(User.id).where(User.email == email).limit(1))
    ).scalar_one_or_none()
    if existing is not None:
        return None
    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name or email.split("@")[0],
        plan="free",
    )
    db.add(user)
    await db.flush()
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Find a user by email and verify the password (bcrypt or legacy hash).

    On success the ``last_login`` timestamp is refreshed and, when the stored
    hash is still the legacy SHA256 format, it is upgraded to bcrypt.
    """
    result = await db.execute(
        select(User).where(User.email == (email or "").strip().lower())
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        return None
    if is_legacy_hash(user.password_hash):
        user.password_hash = hash_password(password)
    user.last_login = datetime.now(timezone.utc)
    await db.flush()
    return user


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def change_password(db: AsyncSession, user: User, current_password: str, new_password: str) -> bool:
    """Change a user's password after verifying the current one."""
    if not verify_password(current_password, user.password_hash):
        return False
    user.password_hash = hash_password(new_password)
    await db.flush()
    return True


async def ensure_user(db: AsyncSession, email: str, display_name: Optional[str] = None) -> User:
    """Return the User row for ``email``, creating it on first access."""
    email = (email or "").strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = User(
        email=email,
        password_hash=hash_password(secrets.token_urlsafe(24)),  # random; reset flow sets the real one
        display_name=display_name or email.split("@")[0],
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


# ─── User resolution (FastAPI dependency) ───

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: validate the Bearer JWT and return the ORM User row."""
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

    user = None
    user_id = payload.get("user_id")
    if user_id is not None:
        user = await get_user_by_id(db, int(user_id))
    if user is None:
        email = (payload.get("email") or "").strip().lower()
        if email:
            user = (
                await db.execute(select(User).where(User.email == email))
            ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="کاربر یافت نشد")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="حساب کاربری غیرفعال است")
    return user


def user_response_dict(user: User) -> dict:
    """Serialize a User row into the legacy ``UserResponse`` shape."""
    created_at = user.created_at
    created_at_str = created_at.strftime("%Y-%m-%d %H:%M:%S") if created_at else ""
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name or "",
        "plan": user.plan or "free",
        "is_admin": bool(user.is_admin),
        "created_at": created_at_str,
        "email_verified": bool(user.email_verified),
    }


# ─── Daily chart quota ───

def _today() -> str:
    # UTC — کوتیای روزانه باید با rate-limit middleware و محدودیت مهمان‌ها
    # (که هر دو UTC هستند) یک مرز ریست داشته باشد
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def _plan_limit(db: AsyncSession, plan_name: str) -> int:
    row = (
        await db.execute(
            select(Plan.daily_chart_limit).where(
                Plan.name == plan_name, Plan.is_active.is_(True)
            )
        )
    ).scalar_one_or_none()
    return row if row is not None else 10  # fallback


async def check_daily_limit(db: AsyncSession, user_id: int) -> dict:
    """Check the daily chart limit. Limit comes from the plans table."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return {"allowed": False, "reason": "کاربر یافت نشد"}

    today = _today()
    if user.daily_charts_reset_at != today:
        user.daily_charts_used = 0
        user.daily_charts_reset_at = today
        await db.flush()
        used = 0
    else:
        used = user.daily_charts_used or 0

    limit = await _plan_limit(db, user.plan or "free")
    return {
        "allowed": used < limit,
        "used": used,
        "limit": limit,
        "plan": user.plan or "free",
        "remaining": max(0, limit - used),
    }


async def atomic_check_and_increment(db: AsyncSession, user_id: int) -> dict:
    """Atomically check + increment daily usage (race-safe via guarded UPDATE)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return {"allowed": False, "reason": "کاربر یافت نشد"}

    today = _today()
    if user.daily_charts_reset_at != today:
        user.daily_charts_used = 0
        user.daily_charts_reset_at = today
        await db.flush()
        used = 0
    else:
        used = user.daily_charts_used or 0

    limit = await _plan_limit(db, user.plan or "free")
    if used >= limit:
        return {
            "allowed": False,
            "used": used,
            "limit": limit,
            "plan": user.plan or "free",
            "remaining": 0,
        }

    result = await db.execute(
        update(User)
        .where(User.id == user_id, User.daily_charts_used < limit)
        .values(daily_charts_used=User.daily_charts_used + 1)
    )
    await db.flush()
    if result.rowcount == 0:
        # Concurrent request incremented first.
        return {
            "allowed": False,
            "used": limit,
            "limit": limit,
            "plan": user.plan or "free",
            "remaining": 0,
        }
    return {
        "allowed": True,
        "used": used + 1,
        "limit": limit,
        "plan": user.plan or "free",
        "remaining": max(0, limit - used - 1),
    }


async def decrement_daily_usage(db: AsyncSession, user_id: int) -> None:
    """Roll back one unit of usage after a downstream request failed."""
    await db.execute(
        update(User)
        .where(User.id == user_id, User.daily_charts_used > 0)
        .values(daily_charts_used=User.daily_charts_used - 1)
    )
    await db.flush()


# ─── Plans (configurable catalog) ───

async def get_all_plans(db: AsyncSession, active_only: bool = False) -> list[Plan]:
    query = select(Plan).order_by(Plan.sort_order.asc())
    if active_only:
        query = query.where(Plan.is_active.is_(True))
    result = await db.execute(query)
    return list(result.scalars())


async def get_plan_by_name(db: AsyncSession, name: str) -> Optional[Plan]:
    result = await db.execute(select(Plan).where(Plan.name == name))
    return result.scalar_one_or_none()


async def get_plan_by_id(db: AsyncSession, plan_id: int) -> Optional[Plan]:
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    return result.scalar_one_or_none()


async def create_plan(db: AsyncSession, data: dict) -> Plan:
    plan = Plan(
        name=data["name"],
        display_name=data.get("display_name", ""),
        price_monthly=data.get("price_monthly", 0),
        price_yearly=data.get("price_yearly", 0),
        daily_chart_limit=data.get("daily_chart_limit", 10),
        can_save_charts=bool(data.get("can_save_charts", False)),
        can_access_premium=bool(data.get("can_access_premium", False)),
        premium_paths=data.get("premium_paths", ""),
        features=data.get("features", ""),
        is_active=bool(data.get("is_active", True)),
        sort_order=data.get("sort_order", 0),
    )
    db.add(plan)
    await db.flush()
    return plan


async def update_plan(db: AsyncSession, plan_id: int, data: dict) -> Optional[Plan]:
    plan = await get_plan_by_id(db, plan_id)
    if plan is None:
        return None
    for field in (
        "display_name", "price_monthly", "price_yearly", "daily_chart_limit",
        "can_save_charts", "can_access_premium", "premium_paths", "features",
        "is_active", "sort_order",
    ):
        if field in data:
            setattr(plan, field, data[field])
    await db.flush()
    return plan


async def delete_plan(db: AsyncSession, plan_id: int) -> bool:
    """Delete a plan — refused while any user is on it."""
    plan = await get_plan_by_id(db, plan_id)
    if plan is None:
        return False
    on_plan = (
        await db.execute(select(User.id).where(User.plan == plan.name).limit(1))
    ).scalar_one_or_none()
    if on_plan is not None:
        return False
    await db.delete(plan)
    await db.flush()
    return True


async def get_user_plan(db: AsyncSession, user: User) -> Optional[Plan]:
    return await get_plan_by_name(db, user.plan or "free")


def plan_response_dict(plan: Plan) -> dict:
    """Serialize a Plan row into the legacy plan dict shape."""
    return {
        "id": plan.id,
        "name": plan.name,
        "display_name": plan.display_name,
        "price_monthly": plan.price_monthly,
        "price_yearly": plan.price_yearly,
        "daily_chart_limit": plan.daily_chart_limit,
        "can_save_charts": bool(plan.can_save_charts),
        "can_access_premium": bool(plan.can_access_premium),
        "premium_paths": plan.premium_paths,
        "features": plan.features,
        "is_active": bool(plan.is_active),
        "sort_order": plan.sort_order,
    }


# ─── Guest sessions (server-side identity + quota) ───

async def guest_check_and_increment(db: AsyncSession, fp_hash: str, limit: int = GUEST_DAILY_LIMIT) -> dict:
    """Atomically check + increment a guest's daily chart usage."""
    today = _today()
    result = await db.execute(
        select(GuestSession).where(GuestSession.fingerprint_hash == fp_hash)
    )
    guest = result.scalar_one_or_none()

    if guest is None:
        guest = GuestSession(
            fingerprint_hash=fp_hash, daily_charts_used=0, daily_charts_reset_at=today
        )
        db.add(guest)
        await db.flush()
        used = 0
    elif guest.daily_charts_reset_at != today:
        guest.daily_charts_used = 0
        guest.daily_charts_reset_at = today
        await db.flush()
        used = 0
    else:
        used = guest.daily_charts_used or 0

    if used >= limit:
        return {"allowed": False, "used": used, "limit": limit, "remaining": 0}

    result = await db.execute(
        update(GuestSession)
        .where(GuestSession.id == guest.id, GuestSession.daily_charts_used < limit)
        .values(daily_charts_used=GuestSession.daily_charts_used + 1)
    )
    await db.flush()
    if result.rowcount == 0:
        return {"allowed": False, "used": limit, "limit": limit, "remaining": 0}
    return {"allowed": True, "used": used + 1, "limit": limit, "remaining": max(0, limit - used - 1)}


async def guest_decrement(db: AsyncSession, fp_hash: str) -> None:
    """Roll back a guest's usage after a downstream request failed."""
    await db.execute(
        update(GuestSession)
        .where(GuestSession.fingerprint_hash == fp_hash, GuestSession.daily_charts_used > 0)
        .values(daily_charts_used=GuestSession.daily_charts_used - 1)
    )
    await db.flush()


async def get_guest_by_fingerprint(db: AsyncSession, fp_hash: str) -> Optional[GuestSession]:
    result = await db.execute(
        select(GuestSession).where(GuestSession.fingerprint_hash == fp_hash)
    )
    return result.scalar_one_or_none()


# ─── Legacy saved charts (``/api/v5/auth/charts/*``) ───

def saved_chart_dict(chart: SavedChart) -> dict:
    """Serialize a SavedChart row into the legacy saved-chart dict shape."""
    created_at = chart.created_at
    return {
        "id": chart.id,
        "user_id": chart.user_id,
        "chart_type": chart.chart_type,
        "title": chart.title or "",
        "input_data": chart.input_data or "",
        "result_data": chart.result_data or "",
        "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S") if created_at else "",
    }


async def save_legacy_chart(
    db: AsyncSession, user_id: int, chart_type: str, title: str, input_data: str, result_data: str
) -> SavedChart:
    chart = SavedChart(
        user_id=user_id,
        chart_type=chart_type,
        title=title or "",
        input_data=input_data or "",
        result_data=result_data or "",
    )
    db.add(chart)
    await db.flush()
    return chart


async def get_legacy_charts(db: AsyncSession, user_id: int, limit: int = 50) -> list[SavedChart]:
    result = await db.execute(
        select(SavedChart)
        .where(SavedChart.user_id == user_id)
        .order_by(SavedChart.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars())


async def delete_legacy_chart(db: AsyncSession, chart_id: int, user_id: int) -> bool:
    result = await db.execute(
        select(SavedChart).where(SavedChart.id == chart_id, SavedChart.user_id == user_id)
    )
    chart = result.scalar_one_or_none()
    if chart is None:
        return False
    await db.delete(chart)
    await db.flush()
    return True