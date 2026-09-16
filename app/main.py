# app/main.py
import io
import sys
import logging
import logging.config
import os

# Fix Windows cp1252 encoding error for Persian/emoji output
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles

from .routers import (
    misc, charts, data, context, moon_phase,
    mizaj, abjad_router, tarot_router,
    numerology_router, biorhythm_router, chinese_zodiac_router,
    daily_question_router, hafez_router, geo_router,
    nasa_router, auth_router, settings_router,
    user as user_router, yoga as yoga_router, audio_router,
    analysis_jobs
)
from .config.settings import settings
from .middleware.secret_key_checker_middleware import SecretKeyCheckerMiddleware
from .middleware.rate_limit_middleware import RateLimitMiddleware
from .middleware.static_cache_buster_middleware import StaticCacheBusterMiddleware
from .utils.validation_helpers import format_extra_field_error

# ============================================
# تنظیمات لاگ
# ============================================
logging.config.dictConfig(settings.LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# ─── Sentry (اختیاری) — فقط اگر SENTRY_DSN ست باشد فعال می‌شود ───
_sentry_dsn = os.getenv("SENTRY_DSN", "").strip()
if _sentry_dsn:
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=_sentry_dsn, traces_sample_rate=0.1)
        logger.info("Sentry error tracking enabled.")
    except ImportError:
        logger.warning("SENTRY_DSN set but sentry-sdk not installed — error tracking disabled.")

# ============================================
# ساخت اپلیکیشن FastAPI
# ============================================
app = FastAPI(
    debug=settings.debug,
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
    title="Astrologer API",
    version="5.0.0",
    summary="Data Driven Astrology",
    description=("The Astrologer API is a RESTful service providing extensive astrology calculations.\n\n"
        "## Rate Limits\n"
        "| User Type | Limit | Scope |\n"
        "|-----------|-------|-------|\n"
        "| Guest (unauthenticated) | 5 charts/day | Per IP address |\n"
        "| Free plan | 15 charts/day | Per user account |\n"
        "| Gold plan | 200 charts/day | Per user account |\n"
        "| Diamond plan | Unlimited | Per user account |\n\n"
        "Guest rate limits are tracked by IP address (via X-Forwarded-For or client IP). \n"
        "Authenticated users are tracked by JWT token.\n\n"
        "## Authentication\n"
        "All protected endpoints require a Bearer token in the Authorization header. \n"
        "Obtain a token via /api/v5/auth/register or /api/v5/auth/login."),


    contact={
        "name": "Kerykeion Astrology",
        "url": "https://www.kerykeion.net/",
        "email": settings.admin_email,
    },
    license_info={
        "name": "AGPL-3.0",
        "url": "https://www.gnu.org/licenses/agpl-3.0.html",
    },
)

# ============================================
# ثبت روت‌ها (همه‌ی بخش‌ها)
# ============================================
app.include_router(charts.router, tags=["Charts"])
app.include_router(data.router, tags=["Chart Data"])
app.include_router(context.router, tags=["AI Context"])
app.include_router(analysis_jobs.router)
app.include_router(moon_phase.router, tags=["Moon Phase"])
app.include_router(misc.router, tags=["Miscellaneous"])
app.include_router(mizaj.router, tags=["Mizaj"])
app.include_router(abjad_router.router, tags=["Abjad"])
app.include_router(tarot_router.router, tags=["Tarot"])
app.include_router(numerology_router.router, tags=["Numerology"])
app.include_router(biorhythm_router.router, tags=["Biorhythm"])
app.include_router(chinese_zodiac_router.router, tags=["Chinese Zodiac"])
app.include_router(daily_question_router.router, tags=["Daily Question"])
app.include_router(hafez_router.router, tags=["Hafez"])
app.include_router(geo_router.router, tags=["Geo"])
app.include_router(nasa_router.router, tags=["NASA"])
app.include_router(auth_router.router, tags=["Auth"])
app.include_router(user_router.router, tags=["User"])
app.include_router(yoga_router.router, tags=["Yoga"])
app.include_router(settings_router.router, tags=["Settings"])
app.include_router(audio_router.router, tags=["Audio"])

# ============================================
# سرویس فایل‌های استاتیک (فرانت‌اند)
# ============================================
app.mount("/static", StaticFiles(directory="static"), name="static")

_NO_CACHE = {"Cache-Control": "no-cache, no-store, must-revalidate"}

@app.get("/")
@app.get("/index.html")
async def serve_index():
    if os.path.exists("index.html"):
        return FileResponse("index.html", headers=_NO_CACHE)
    return {"status": "ok", "message": "Cosmic Oracle is running"}


@app.get("/admin.html")
async def serve_admin_page():
    """صفحه‌ی پنل مدیریت — صفحه‌ی مستقل admin-panel.js"""
    if os.path.exists("static/admin.html"):
        return FileResponse("static/admin.html", headers=_NO_CACHE)
    return FileResponse("index.html")


@app.get("/account.html")
async def serve_account_page():
    """صفحه‌ی تنظیمات حساب — صفحه‌ی مستقل account-page.js"""
    if os.path.exists("static/account.html"):
        return FileResponse("static/account.html", headers=_NO_CACHE)
    return FileResponse("index.html")


@app.get("/yoga.html")
async def serve_yoga_studio():
    """محیط تمرین یوگا — صفحه‌ی تمام‌صفحه با تایم‌لاین و پخش جلسه"""
    if os.path.exists("yoga.html"):
        return FileResponse("yoga.html", headers=_NO_CACHE)
    raise HTTPException(status_code=404, detail="yoga.html not found")


@app.get("/yoga-classic.html")
async def serve_yoga_classic():
    """بازسازی وفادار Pocket Yoga — مستقیم از static/yoga-data/resources/"""
    if os.path.exists("yoga-classic.html"):
        return FileResponse("yoga-classic.html", headers=_NO_CACHE)
    raise HTTPException(status_code=404, detail="yoga-classic.html not found")


@app.get("/sw.js")
async def serve_service_worker():
    """Service Worker — باید از ریشه سرو شود (scope: /) تا نوتیف‌های تعاملی در همه صفحات کار کنند"""
    sw_path = os.path.join("static", "sw.js")
    if os.path.exists(sw_path):
        return FileResponse(sw_path, media_type="application/javascript",
                            headers={"Cache-Control": "no-cache", "Service-Worker-Allowed": "/"})
    raise HTTPException(status_code=404, detail="sw.js not found")


@app.get("/yoga-cue/{key}")
async def serve_yoga_cue(key: str):
    """فایل‌های صوتی تمرین — بدون پسوند و با MIME عمومی (application/octet-stream
    + X-Content-Type-Options) تا نرم‌افزارهای دانلود (مثل IDM) لینک را شناسایی
    و رهگیری نکنند. مرورگر با decodeAudioData مبدأ را می‌خواند و پسوند بی‌اهمیت است."""
    import re as _re
    m = _re.fullmatch(r"([a-z0-9_]+)", key or "")
    if not m:
        raise HTTPException(status_code=404, detail="bad cue key")
    safe = key + ".ogg"
    path = os.path.join("static", "yoga-data", "resources", "res", "raw", safe)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="cue not found")
    return FileResponse(
        path,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": 'inline; filename="cue"',
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store",
        },
    )


# توجه: /health واقعی در app/routers/misc.py ثبت شده (با چک DB) — این مسیر
# به دلیل ثبت‌شدن زودترِ روتر هیچ‌وقت فراخوانی نمی‌شد و حذف گردید.


@app.get("/api/v5/rate-limits", tags=["Info"])
async def rate_limits_info():
    """اطلاعات محدودیت‌های نرخ درخواست (Rate Limits)
    
    این endpoint اطلاعات محدودیت‌های روزانه برای انواع کاربران را برمی‌گرداند.
    محدودیت‌ها بر اساس پلن کاربر یا آدرس IP (برای مهمان‌ها) اعمال می‌شوند.
    """
    return {
        "rate_limits": {
            "guest": {
                "description": "Unauthenticated users (tracked by IP)",
                "daily_limit": 5,
                "scope": "per IP address",
                "reset": "daily at midnight UTC",
                "tracked_by": "X-Forwarded-For header or client IP",
            },
            "free": {
                "description": "Free plan users",
                "daily_limit": 15,
                "scope": "per user account",
                "reset": "daily",
            },
            "gold": {
                "description": "Gold plan users",
                "daily_limit": 200,
                "scope": "per user account",
                "reset": "daily",
            },
            "diamond": {
                "description": "Diamond plan users",
                "daily_limit": 9999,
                "scope": "per user account",
                "reset": "daily",
            },
            "admin": {
                "description": "Admin users (is_admin=true)",
                "daily_limit": "unlimited",
                "scope": "none",
            },
        },
        "premium_gating": {
            "description": "Some chart types are restricted to paid plans. Check the plan's premium_paths field.",
            "default_blocked_for_free": ["composite", "solar-return", "lunar-return"],
        },
        "notes": [
            "Rate limits apply to chart calculation endpoints: /api/v5/chart-data/* and /api/v5/chart/*",
            "Auth endpoints (/api/v5/auth/*) are not rate-limited",
            "Static files and health checks are not rate-limited",
            "Guest limits reset daily; authenticated user limits reset on daily_charts_reset_at",
        ],
    }

# ============================================
# مدیریت خطاها
# ============================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    enriched_errors = []
    for error in exc.errors():
        error_type = error.get("type", "")
        if error_type == "extra_forbidden":
            location = error.get("loc", [])
            if location:
                field_name = str(location[-1])
                enriched_message = format_extra_field_error(field_name, list(location))
                enriched_errors.append({"loc": location, "msg": enriched_message, "type": error_type})
                continue
        sanitized_error = {"loc": error.get("loc"), "msg": error.get("msg"), "type": error_type}
        enriched_errors.append(sanitized_error)
    
    logger.warning(f"Validation error on {request.url}: {enriched_errors}")
    return JSONResponse(
        status_code=422,
        content={"status": "ERROR", "message": "Validation failed", "errors": enriched_errors},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "ERROR", "message": "Internal Server Error"},
    )

# ============================================
# Middleware
# ============================================
if not settings.debug:
    app.add_middleware(
        SecretKeyCheckerMiddleware,
        secret_key_names=settings.secret_key_names,
        secret_keys=[
            settings.rapid_api_secret_key,
            settings.astrologer_studio_secret_key,
            settings.private_astrologer_api_secret_key,
            settings.rapid_api_key,
        ],
    )

# ─── واسطه‌ی محدودیت روزانه ───
app.add_middleware(RateLimitMiddleware)

# ─── کش‌باستینگ خودکار استاتیک (پایان باگ‌های پنهان‌شده در کش مرورگر) ───
app.add_middleware(StaticCacheBusterMiddleware)

# CORS origins: use configured list, fallback to localhost for development
_cors_origins = settings.allowed_cors_origins or [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]
# ⚠ wildcard فقط در محیط غیرتولیدی: اگر debug در prod اشتباهاً true شود
# (env فراموش‌شده)، باز هم * اضافه نمی‌شود
if settings.debug and str(getattr(settings, "env_type", "")) not in ("production", "prod") and "*" not in _cors_origins:
    _cors_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── راه‌اندازی دیتابیس (SQLite) ───
from .config.database import init_db

@app.on_event("startup")
async def startup_create_tables():
    """Create missing tables on startup (dev convenience; Alembic is the source of truth)."""
    await init_db()

logger.info("✅ Server started successfully with libephemeris (no pyswisseph required).")
logger.info("📌 All routes are active.")