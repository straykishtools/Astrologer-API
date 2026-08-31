# app/middleware/rate_limit_middleware.py
"""
واسطه‌ای که قبل از هر درخواست API چک کنه کاربر چه پلنی داره و محدودیت روزانه رعایت شده
"""
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from app.models import (
    decode_token, get_user_by_id, check_daily_limit, increment_daily_usage,
    atomic_check_and_increment, decrement_daily_usage,
    get_all_plans, get_plan_by_name,
)
import logging
import json

logger = logging.getLogger(__name__)

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


def _get_premium_keywords():
    """خواندن مسیرهای ویژه از جدول plans (قابل تغییر توسط ادمین)
    
    پلن رایگان یک لیست premium_paths داره (مسیرهایی که روی پلن رایگان مسدودن).
    این کلمات کلیدی استخراج می‌شن و چک می‌شن.
    """
    global _premium_keywords_cache, _premium_cache_time
    import time
    now = time.time()
    # کش ۵ دقیقه (۳۰۰ ثانیه)
    if _premium_keywords_cache is not None and _premium_cache_time and (now - _premium_cache_time) < 300:
        return _premium_keywords_cache

    keywords = set()
    try:
        plans = get_all_plans(active_only=True)
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
        # fallback
        keywords = {"composite", "solar-return", "lunar-return"}

    if not keywords:
        keywords = {"composite", "solar-return", "lunar-return"}

    _premium_keywords_cache = keywords
    _premium_cache_time = now
    return keywords


def _plan_allows_premium(plan_name: str, path_keyword: str) -> bool:
    """چک کن آیا پلن کاربر اجازه دسترسی به مسیر ویژه رو داره"""
    plan = get_plan_by_name(plan_name)
    if not plan:
        return False
    # ادمین همه چیز رو داره
    # اگر can_access_premium = 1 → همه مسیرهای ویژه بازن
    if plan.get("can_access_premium"):
        return True
    # در غیر این صورت، چک کن آیا این مسیر خاص در premium_paths پلن این کاربر هست
    # (یعنی پلن‌های دیگه هم می‌تونن مسیرهای ویژه اختصاصی داشته باشن)
    raw = plan.get("premium_paths", "") or ""
    blocked = [k.strip() for k in raw.split(",") if k.strip()]
    return path_keyword not in blocked


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        # مسیرهای عمومی → رد شو
        if path in PUBLIC_PATHS or path.startswith("/static/") or path == "/" or path == "/index.html":
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
            if payload:
                user = get_user_by_id(payload.get("user_id"))

        # تشخیص مسیر ویژه (از دیتابیس خوانده می‌شه)
        premium_keywords = _get_premium_keywords()
        matched_keyword = None
        for kw in premium_keywords:
            if kw in path:
                matched_keyword = kw
                break
        is_premium = matched_keyword is not None

        # اگر کاربر نیست، فقط مسیرهای رایگان
        if not user:
            if is_premium:
                response = JSONResponse(
                    status_code=403,
                    content={"status": "ERROR", "message": "برای استفاده از این بخش، وارد شو یا اشتراک فعال کنید"},
                )
                await response(scope, receive, send)
                return
            # کاربر مهمان: بدون محدودیت فعلی
            await self.app(scope, receive, send)
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
        limit_info = atomic_check_and_increment(user["id"])
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
            decrement_daily_usage(user["id"])
            raise
