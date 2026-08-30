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

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles

from .routers import (
    misc, charts, data, context, moon_phase,
    mizaj, abjad_router, tarot_router,
    numerology_router, biorhythm_router, chinese_zodiac_router,
    daily_question_router, hafez_router, geo_router,
    nasa_router
)
from .config.settings import settings
from .middleware.secret_key_checker_middleware import SecretKeyCheckerMiddleware
from .utils.validation_helpers import format_extra_field_error

# ============================================
# تنظیمات لاگ
# ============================================
logging.config.dictConfig(settings.LOGGING_CONFIG)
logger = logging.getLogger(__name__)

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
    description="The Astrologer API is a RESTful service providing extensive astrology calculations.",
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

# ============================================
# سرویس فایل‌های استاتیک (فرانت‌اند)
# ============================================
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
@app.get("/index.html")
async def serve_index():
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    return {"status": "ok", "message": "Cosmic Oracle is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("✅ Server started successfully with libephemeris (no pyswisseph required).")
logger.info("📌 All routes are active.")