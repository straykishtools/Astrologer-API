# app/middleware/rate_limit_middleware.py
"""
واسطه‌ای که قبل از هر درخواست API چک کنه کاربر چه پلنی داره و محدودیت روزانه رعایت شده

همه‌ی خواندن/نوشتن‌های دیتابیس روی همان cosmic.db (دیتابیس ناهمگام ORM) انجام
می‌شود — لایه‌ی legacy (cosmic_oracle.db) حذف شده است. دسترسی از طریق sqlite3
سینکرون است (نه Session ORM) چون این middleware خارج از چرخه‌ی درخواست FastAPI
اجرا می‌شود و اتصال به حلقه‌ی رویداد گره نمی‌خورد؛ ستون‌ها دقیقاً با اسکیمای ORM
یکسان هستند.
"""
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.services.auth_service import decode_token

import hashlib
import logging
import os
import sqlite3
import time

logger = logging.getLogger(__name__)

from app.config.database import DEFAULT_DB_PATH  # noqa: E402

# مسیرهایی که نیاز به احراز هویت ندارن (رایگان برای همه)
PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}

# مسیرهای auth که همیشه بازن
AUTH_PREFIX = "/api/v5/auth/"

# مسیرهای API که نیاز به چک کردن محدودیت دارن (chart data + chart rendering)
CHART_API_PREFIXES = (
    "/api/v5/chart-data/",
    "/api/v5/chart/",
)

# کش مسیرهای ویژه (هر ۵ دقیقه از دیتابیس به‌روز می‌شه)
_premium_keywords_cache = None
_premium_cache_time = None


# ─── دسترسی سینکرون به cosmic.db (اسکیمای ORM) ───

def _connect():
    """اتصال sqlite3 به همان فایل دیتابیس ناهمگام (cosmic.db)."""
    conn = sqlite3.connect(str(DEFAULT_DB_PATH), timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def _db_get_user(user_id):
    """خواندن ردیف کاربر از cosmic.db (همان جدول ORM)."""
    try:
        conn = _connect()
        try:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("rate-limit user lookup failed: %s", exc)
        return None


def _db_get_plans():
    """همه‌ی پلن‌ها از cosmic.db (همان جدول ORM plans)."""
    try:
        conn = _connect()
        try:
            rows = conn.execute("SELECT * FROM plans ORDER BY sort_order ASC").fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("rate-limit plans lookup failed: %s", exc)
        return []


def _db_get_plan_by_name(name):
    try:
        conn = _connect()
        try:
            row = conn.execute("SELECT * FROM plans WHERE name = ?", (name,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("rate-limit plan lookup failed: %s", exc)
        return None


def _db_atomic_check_and_increment(user_id):
    """اتمیک چک و افزایش مصرف روزانه کاربر (جلوگیری از race condition)."""
    from datetime import datetime, timezone

    try:
        conn = _connect()
        try:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                return {"allowed": False, "reason": "کاربر یافت نشد"}

            # UTC — هم‌راستا با محدودیت مهمان‌ها و endpoint daily-limit (باقی‌ماندن
            # زمان محلی باعث ریست دیرهنگام/زودهنگام کوتیا در سرورهای غیرUTC می‌شد)
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if user["daily_charts_reset_at"] != today:
                conn.execute(
                    "UPDATE users SET daily_charts_used = 0, daily_charts_reset_at = ? WHERE id = ?",
                    (today, user_id),
                )
                conn.commit()
                used = 0
            else:
                used = user["daily_charts_used"] or 0

            plan_name = user["plan"]
            plan_row = conn.execute(
                "SELECT daily_chart_limit FROM plans WHERE name = ? AND is_active = 1",
                (plan_name,),
            ).fetchone()
            limit = plan_row["daily_chart_limit"] if plan_row else 10

            if used >= limit:
                return {
                    "allowed": False,
                    "used": used,
                    "limit": limit,
                    "plan": plan_name,
                    "remaining": 0,
                }

            cursor = conn.execute(
                "UPDATE users SET daily_charts_used = daily_charts_used + 1 WHERE id = ? AND daily_charts_used < ?",
                (user_id, limit),
            )
            conn.commit()
            if cursor.rowcount == 0:
                return {
                    "allowed": False,
                    "used": limit,
                    "limit": limit,
                    "plan": plan_name,
                    "remaining": 0,
                }
            return {
                "allowed": True,
                "used": used + 1,
                "limit": limit,
                "plan": plan_name,
                "remaining": max(0, limit - used - 1),
            }
        finally:
            conn.close()
    except Exception as exc:
        # جدول قدیمی/ناسازگار؟ fail-open تا سرویس چارت از کار نیفتد (بعد از migration درست می‌شود).
        logger.warning("rate-limit atomic increment failed (fail-open): %s", exc)
        return {"allowed": True, "used": 0, "limit": 9999, "plan": "free", "remaining": 9999}


def _db_decrement(user_id):
    """برگرداندن مصرف در صورت خطا در درخواست پایین‌دستی."""
    try:
        conn = _connect()
        try:
            conn.execute(
                "UPDATE users SET daily_charts_used = MAX(0, daily_charts_used - 1) WHERE id = ?",
                (user_id,),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("rate-limit decrement failed: %s", exc)


def _db_guest_check_and_increment(fp_hash, limit=5):
    """اتمیک چک و افزایش مصرف روزانه مهمان بر اساس fingerprint هش‌شده."""
    from datetime import datetime, timezone

    try:
        conn = _connect()
        try:
            # UTC — هم‌راستا با محدودیت مهمان بر اساس IP (_check_guest_limit)
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            guest = conn.execute(
                "SELECT * FROM guest_sessions WHERE fingerprint_hash = ?",
                (fp_hash,),
            ).fetchone()

            if not guest:
                conn.execute(
                    "INSERT INTO guest_sessions (fingerprint_hash, daily_charts_used, daily_charts_reset_at) VALUES (?, 0, ?)",
                    (fp_hash, today),
                )
                conn.commit()
                used = 0
                guest_id = conn.execute(
                    "SELECT id FROM guest_sessions WHERE fingerprint_hash = ?", (fp_hash,)
                ).fetchone()["id"]
            elif guest["daily_charts_reset_at"] != today:
                conn.execute(
                    "UPDATE guest_sessions SET daily_charts_used = 0, daily_charts_reset_at = ? WHERE id = ?",
                    (today, guest["id"]),
                )
                conn.commit()
                used = 0
                guest_id = guest["id"]
            else:
                used = guest["daily_charts_used"] or 0
                guest_id = guest["id"]

            if used >= limit:
                return {"allowed": False, "used": used, "limit": limit, "remaining": 0}

            cursor = conn.execute(
                "UPDATE guest_sessions SET daily_charts_used = daily_charts_used + 1 WHERE id = ? AND daily_charts_used < ?",
                (guest_id, limit),
            )
            conn.commit()
            if cursor.rowcount == 0:
                return {"allowed": False, "used": limit, "limit": limit, "remaining": 0}
            return {"allowed": True, "used": used + 1, "limit": limit, "remaining": max(0, limit - used - 1)}
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("rate-limit guest increment failed (fail-open): %s", exc)
        return {"allowed": True, "used": 0, "limit": 5, "remaining": 5}


def _db_guest_decrement(fp_hash):
    """برگرداندن مصرف مهمان در صورت خطا."""
    try:
        conn = _connect()
        try:
            conn.execute(
                "UPDATE guest_sessions SET daily_charts_used = MAX(0, daily_charts_used - 1) WHERE fingerprint_hash = ?",
                (fp_hash,),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("rate-limit guest decrement failed: %s", exc)


# ─── مسیرهای ویژه (از جدول plans — قابل تغییر توسط ادمین) ───

def _get_premium_keywords():
    """خواندن مسیرهای ویژه از جدول plans (قابل تغییر توسط ادمین)

    پلن رایگان یک لیست premium_paths داره (مسیرهایی که روی پلن رایگان مسدودن).
    این کلمات کلیدی استخراج می‌شن و چک می‌شن.
    """
    global _premium_keywords_cache, _premium_cache_time
    now = time.time()
    # کش ۵ دقیقه (۳۰۰ ثانیه)
    if _premium_keywords_cache is not None and _premium_cache_time and (now - _premium_cache_time) < 300:
        return _premium_keywords_cache

    keywords = set()
    try:
        plans = _db_get_plans()
        for plan in plans:
            # مسیرهای ویژه پلن رایگان = مسیرهایی که روی این پلن مسدودن
            if plan["name"] == "free":
                raw = plan.get("premium_paths", "") or ""
                if raw.strip():
                    for kw in raw.split(","):
                        kw = kw.strip()
                        if kw:
                            keywords.add(kw)
    except Exception as e:
        logger.warning(f"Failed to load premium keywords from DB: {e}")

    if not keywords:
        keywords = {"composite", "solar-return", "lunar-return"}

    _premium_keywords_cache = keywords
    _premium_cache_time = now
    return keywords


def _plan_allows_premium(plan_name, path_keyword):
    """چک کن آیا پلن کاربر اجازه دسترسی به مسیر ویژه رو داره"""
    plan = _db_get_plan_by_name(plan_name)
    if not plan:
        return False
    # اگر can_access_premium = 1 → همه مسیرهای ویژه بازن
    if plan.get("can_access_premium"):
        return True
    raw = plan.get("premium_paths", "") or ""
    blocked = [k.strip() for k in raw.split(",") if k.strip()]
    return path_keyword not in blocked


# ─── محدودیت روزانه مهمان (بر اساس IP) ───
GUEST_DAILY_LIMIT = 5  # 5 چارت در روز برای مهمان
_guest_usage = {}  # {ip: {"count": int, "date": str}}
_guest_cleanup_time = 0


def _get_guest_ip(scope):
    """Extract client IP from ASGI scope"""
    headers = dict(scope.get("headers", []))
    forwarded = headers.get(b"x-forwarded-for", b"").decode()
    if forwarded:
        return forwarded.split(",")[0].strip()
    client = scope.get("client")
    return client[0] if client else "unknown"


def _guest_key(ip):
    """Return today's date string for keying"""
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _check_guest_limit(ip):
    """Check and increment guest daily limit. Returns (allowed, count, limit)."""
    global _guest_usage, _guest_cleanup_time
    from datetime import datetime, timezone
    now = time.time()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Cleanup every 10 minutes
    if now - _guest_cleanup_time > 600:
        _guest_cleanup_time = now
        expired = [k for k, v in _guest_usage.items() if v.get("date") != today]
        for k in expired:
            del _guest_usage[k]

    key = f"{ip}:{today}"
    entry = _guest_usage.get(key)
    if not entry or entry.get("date") != today:
        _guest_usage[key] = {"count": 1, "date": today}
        return True, 1, GUEST_DAILY_LIMIT

    entry["count"] += 1
    count = entry["count"]
    return count <= GUEST_DAILY_LIMIT, count, GUEST_DAILY_LIMIT


# ─── محدودیت تلاش‌های ناموفق ورود/بازیابی رمز (بر اساس IP) ───
# روی مسیرهای auth اعمال می‌شود (که خودشان از چک کوتیا معافند). هدف جلوگیری از
# brute-force است، نه محدودکردن ترافیک عادی: فقط «شکست‌ها» شمرده می‌شوند و هر
# ورود موفق شمارنده‌ی همان IP را پاک می‌کند. کاربران پشت NAT یکسان فقط وقتی
# آسیب می‌بینند که واقعاً رمز اشتباه بزنند.
LOGIN_FAILURE_LIMIT = 10  # شکست متوالی قبل از قفل موقت
LOGIN_LOCKOUT_SECONDS = 300  # 5 دقیقه قفل پس از عبور از حد

_login_failures = {}  # {ip: {"count": int, "locked_until": float}}
_login_cleanup_time = 0.0


def _login_cleanup_if_due():
    global _login_cleanup_time
    now = time.time()
    if now - _login_cleanup_time < 600:
        return
    _login_cleanup_time = now
    expired = [ip for ip, v in _login_failures.items() if v.get("locked_until", 0) <= now and not v.get("count")]
    for ip in expired:
        del _login_failures[ip]


def login_attempt_allowed(ip: str) -> bool:
    """False وقتی IP به‌خاطر شکست‌های مکرر در قفل موقت است.

    ENV_TYPE=test معاف است (هم‌راستا با معافیت کوتیای مهمان) تا سوئیت‌های تست
    در یک پروسه آزادانه رمز اشتباه بزنند؛ تست‌های اختصاصی این قفل، محیط را
    موقتاً production می‌کنند (الگوی tests/test_rate_limit_middleware.py).
    """
    if os.getenv("ENV_TYPE") == "test":
        return True
    _login_cleanup_if_due()
    entry = _login_failures.get(ip)
    if not entry:
        return True
    return time.time() >= entry.get("locked_until", 0)


def record_login_failure(ip: str) -> None:
    """یک شکست ثبت کن؛ اگر از حد عبور کرد، IP را موقتاً قفل کن."""
    global _login_cleanup_time
    _login_cleanup_if_due()
    now = time.time()
    entry = _login_failures.setdefault(ip, {"count": 0, "locked_until": 0})
    entry["count"] += 1
    if entry["count"] >= LOGIN_FAILURE_LIMIT:
        entry["locked_until"] = now + LOGIN_LOCKOUT_SECONDS
        entry["count"] = 0  # پس از پایان قفل، شمارنده از صفر شروع می‌شود
        logger.warning("login throttled for IP %s (too many failed attempts)", ip)


def clear_login_failures(ip: str) -> None:
    """ورود/بازیابی موفق — شمارنده‌ی IP را پاک کن."""
    _login_failures.pop(ip, None)


def _decrement_guest(ip):
    """Rollback guest usage count on failure"""
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"{ip}:{today}"
    entry = _guest_usage.get(key)
    if entry and entry.get("date") == today and entry["count"] > 0:
        entry["count"] -= 1


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Test environment: disable quota + premium gating so the test suite can
        # make unlimited chart calls in a single process (set by tests/conftest.py).
        if os.getenv("ENV_TYPE") == "test":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        # مسیرهای عمومی → رد شو
        if path in PUBLIC_PATHS or path.startswith("/static/") or path == "/" or path.endswith(".html"):
            await self.app(scope, receive, send)
            return

        # مسیرهای auth → همیشه باز
        if path.startswith(AUTH_PREFIX):
            await self.app(scope, receive, send)
            return

        # فقط مسیرهای چارت API رو چک کن
        is_chart_path = path.startswith(CHART_API_PREFIXES)
        if not is_chart_path:
            await self.app(scope, receive, send)
            return

        # توکن رو از هدر بخون
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization", b"").decode()
        token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else auth_header

        user = None
        if token:
            payload = decode_token(token)
            if payload and payload.get("user_id") is not None:
                user = _db_get_user(payload.get("user_id"))

        # تشخیص مسیر ویژه (از دیتابیس خوانده می‌شه)
        premium_keywords = _get_premium_keywords()
        matched_keyword = None
        for kw in premium_keywords:
            if kw in path:
                matched_keyword = kw
                break
        is_premium = matched_keyword is not None

        # اگر کاربر نیست — محدودیت مهمان: اولویت با fingerprint (هویت سمت سرور)، fallback به IP
        if not user:
            if is_premium:
                response = JSONResponse(
                    status_code=403,
                    content={"status": "ERROR", "message": "برای استفاده از این بخش، وارد شو یا اشتراک فعال کنید"},
                )
                await response(scope, receive, send)
                return

            # هویت مهمان سمت سرور: اگر fingerprint ارسال شده، quota از جدول guest_sessions خونده میشه
            fp_header = headers.get(b"x-guest-fingerprint", b"").decode().strip()
            if fp_header:
                fp_hash = hashlib.sha256(fp_header.encode()).hexdigest()[:48]
                try:
                    info = _db_guest_check_and_increment(fp_hash)
                except Exception:
                    # در صورت خطای دیتابیس، fallback به محدودیت IP تا سرویس از کار نیفته
                    guest_ip = _get_guest_ip(scope)
                    allowed, count, limit = _check_guest_limit(guest_ip)
                    if not allowed:
                        response = JSONResponse(
                            status_code=429,
                            content={"status": "ERROR", "message": f"محدودیت روزانه مهمان ({limit} چارت) تمام شده. لطفاً وارد شوید.", "used": count, "limit": limit},
                        )
                        await response(scope, receive, send)
                        return
                    try:
                        await self.app(scope, receive, send)
                    except Exception:
                        _decrement_guest(guest_ip)
                        raise
                    return
                if not info["allowed"]:
                    response = JSONResponse(
                        status_code=429,
                        content={
                            "status": "ERROR",
                            "message": f"محدودیت روزانه مهمان ({info['limit']} چارت) تمام شده. لطفاً وارد شوید.",
                            "used": info["used"],
                            "limit": info["limit"],
                        },
                    )
                    await response(scope, receive, send)
                    return
                try:
                    await self.app(scope, receive, send)
                except Exception:
                    _db_guest_decrement(fp_hash)
                    raise
                return

            # fallback: محدودیت روزانه مهمان بر اساس IP (قدیمی)
            guest_ip = _get_guest_ip(scope)
            allowed, count, limit = _check_guest_limit(guest_ip)
            if not allowed:
                response = JSONResponse(
                    status_code=429,
                    content={
                        "status": "ERROR",
                        "message": f"محدودیت روزانه مهمان ({limit} چارت) تمام شده. لطفاً وارد شوید.",
                        "used": count,
                        "limit": limit,
                    },
                )
                await response(scope, receive, send)
                return
            try:
                await self.app(scope, receive, send)
            except Exception:
                _decrement_guest(guest_ip)
                raise
            return

        # ادمین همه دسترسی‌ها رو داره
        if user.get("is_admin"):
            await self.app(scope, receive, send)
            return

        # چک کردن مسیر ویژه بر اساس پلن کاربر (از دیتابیس)
        if is_premium:
            if not _plan_allows_premium(user["plan"], matched_keyword):
                response = JSONResponse(
                    status_code=403,
                    content={"status": "ERROR", "message": "برای استفاده از این بخش، اشتراک خود را ارتقا دهید"},
                )
                await response(scope, receive, send)
                return

        # چک کردن و افزایش اتمیک محدودیت روزانه (جلوگیری از race condition)
        limit_info = _db_atomic_check_and_increment(user["id"])
        if not limit_info["allowed"]:
            response = JSONResponse(
                status_code=429,
                content={
                    "status": "ERROR",
                    "message": f"محدودیت روزانه {limit_info['limit']} چارت تمام شده. فردا دوباره تلاش کنید.",
                    "plan": limit_info["plan"],
                    "used": limit_info["used"],
                    "limit": limit_info["limit"],
                },
            )
            await response(scope, receive, send)
            return

        # درخواست رو رد کن — اگر با خطا مواجه شد، مصرف رو برگردون
        try:
            await self.app(scope, receive, send)
        except Exception:
            _db_decrement(user["id"])
            raise