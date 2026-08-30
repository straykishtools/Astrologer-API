"""
NASA API Router — proxies all NASA API calls through the backend.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.apod_service import APODService
from app.services.nasa_images_service import NASAImagesService
from app.services.donki_service import DONKIService
from app.services.neo_service import NeoService
from app.services.mars_weather_service import MarsWeatherService
from app.services.ssd_service import SSDService

router = APIRouter(prefix="/api/v5/nasa", tags=["NASA"])

# Service instances
apod_svc = APODService()
images_svc = NASAImagesService()
donki_svc = DONKIService()
neo_svc = NeoService()
mars_svc = MarsWeatherService()
ssd_svc = SSDService()



def _validate_date(date_value: str, field_name: str = "date") -> str:
    from datetime import datetime
    try:
        datetime.strptime(date_value, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} must be in YYYY-MM-DD format",
        )
    return date_value


# ============================================
# 1. APOD — Astronomy Picture of the Day
# ============================================
@router.get("/apod")
async def get_apod(date: Optional[str] = Query(None, description="Date YYYY-MM-DD")):
    """تصویر نجومی روز از ناسا"""
    try:
        if date:
            _validate_date(date)
        result = await apod_svc.get_todays_image(date)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 2. SSD/CNEOS — Planetary Positions (Fallback)
# ============================================
@router.get("/planets")
async def get_planets(date: str = Query(..., description="Date YYYY-MM-DD")):
    """موقعیت سیارات؛ JPL Horizons با fallback محلی"""
    try:
        _validate_date(date)
        result = await ssd_svc.get_planetary_positions_live(date)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 3. NASA Image Library
# ============================================
@router.get("/images")
async def search_images(
    query: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
):
    """جستجوی تصاویر در آرشیو ناسا"""
    try:
        result = await images_svc.search(query, page)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 4. DONKI — Space Weather
# ============================================
@router.get("/space-weather")
async def get_space_weather(
    startDate: str = Query(..., description="Start date YYYY-MM-DD"),
    endDate: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """ رویدادهای آب و هوای فضایی (پرتو خورشیدی، طوفان مغناطیسی)"""
    try:
        _validate_date(startDate, "startDate")
        if endDate:
            _validate_date(endDate, "endDate")
        result = await donki_svc.get_solar_flares(startDate, endDate)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/space-weather/cme")
async def get_space_weather_cme(
    startDate: str = Query(..., description="Start date YYYY-MM-DD"),
    endDate: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """رویدادهای CME از DONKI"""
    try:
        _validate_date(startDate, "startDate")
        if endDate:
            _validate_date(endDate, "endDate")
        result = await donki_svc.get_cmes(startDate, endDate)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/space-weather/summary")
async def get_space_weather_summary(
    startDate: str = Query(..., description="Start date YYYY-MM-DD"),
    endDate: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """خلاصه تمام رویدادهای آب و هوای فضایی"""
    try:
        _validate_date(startDate, "startDate")
        if endDate:
            _validate_date(endDate, "endDate")
        result = await donki_svc.get_full_summary(startDate, endDate)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 5. NeoWs — Near-Earth Asteroids
# ============================================
@router.get("/asteroids")
async def get_asteroids(
    startDate: str = Query(..., description="Start date YYYY-MM-DD"),
    endDate: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """سیارک‌های نزدیک به زمین در یک بازه زمانی"""
    try:
        _validate_date(startDate, "startDate")
        if endDate:
            _validate_date(endDate, "endDate")
        result = await neo_svc.get_asteroids(startDate, endDate)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 6. Mars Weather (InSight)
# ============================================
@router.get("/mars-weather")
async def get_mars_weather():
    """گزارش آب و هوای مریخ از مریخ‌نورد این‌سایت"""
    try:
        result = await mars_svc.get_weather()
        if "error" in result and not result.get("sols"):
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
