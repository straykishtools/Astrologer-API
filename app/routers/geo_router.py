"""
Router: Geo API (جغرافیایی)
دریافت مختصات شهر — پشتیبان برای سرویس‌های موجود
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.geo_service import GeoService
from app.services.openmeteo_service import openmeteo_service

router = APIRouter(prefix="/api/v5", tags=["Geo"])
service = GeoService()


class GeoRequest(BaseModel):
    city: str
    country: Optional[str] = None


@router.post("/geo")
async def get_geo(data: GeoRequest):
    """دریافت مختصات جغرافیایی شهر"""
    try:
        result = await service.get_coordinates(data.city, data.country)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/geo")
async def get_geo_get(city: str, country: Optional[str] = None):
    """دریافت مختصات جغرافیایی شهر با GET"""
    try:
        result = await service.get_coordinates(city, country)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather")
async def get_local_weather(
    lat: float,
    lng: float,
    timezone: Optional[str] = None,
):
    """آب‌وهوا (OpenWeatherMap) + کیفیت هوا (AQICN) — برای پنل وضعیت زمین

    حتی اگر یکی از سرویس‌ها شکست بخورد، پاسخ 200 برمی‌گردد با فیلد
    _errors تا فرانت‌اند بتواند پیام مناسب نشان دهد (فقط برای دیباگ).
    """
    try:
        result = await openmeteo_service.get_daily_brief(lat, lng)
        if "_errors" in result and "weather" not in result and "air" not in result:
            # هر دو شکست خوردند — باز هم 200 با جزئیات خطا (فرانت پیام می‌سازد)
            return {"status": "partial", "data": result, "detail": result["_errors"]}
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather/debug")
async def get_weather_debug(lat: float = 35.6892, lng: float = 51.3890):
    """دیباگِ سرویس‌های آب‌وهوا — جزئیاتِ خطای هر کدام را نشان می‌دهد"""
    import os
    w = await openmeteo_service._get_weather(lat, lng)
    a = await openmeteo_service._get_air(lat, lng)
    return {
        "keys_configured": {
            "openweather": bool(os.getenv("OPENWEATHER_API_KEY")),
            "aqicn": bool(os.getenv("AQICN_API_KEY")),
        },
        "weather_result": w,
        "air_result": a,
    }
