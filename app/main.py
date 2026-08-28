# app/main.py (نسخه‌ی Lite - بدون نیاز به kerykeion)
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ============================================
# فقط روت‌هایی که به kerykeion نیاز ندارند
# ============================================
from .routers import abjad_router
from .routers import tarot_router
from .routers import mizaj
from .routers import numerology_router
from .routers import biorhythm_router
from .routers import chinese_zodiac_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cosmic Oracle API (Lite)", version="5.0.0")

# ============================================
# ثبت روت‌ها (فقط روت‌های جدید)
# ============================================
app.include_router(abjad_router.router)
app.include_router(tarot_router.router)
app.include_router(mizaj.router)
app.include_router(numerology_router.router)
app.include_router(biorhythm_router.router)
app.include_router(chinese_zodiac_router.router)

# ============================================
# سرویس فایل‌های استاتیک
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

@app.get("/api/v5/status")
async def status():
    return {"status": "ok", "version": "5.0.0-lite", "mode": "without kerykeion"}

logger.info("✅ Server started successfully WITHOUT kerykeion.")
logger.info("📌 Active routers: Abjad, Tarot, Mizaj, Numerology, Biorhythm, Chinese Zodiac")