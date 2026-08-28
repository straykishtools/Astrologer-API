"""
Router: Geo API (جغرافیایی)
دریافت مختصات شهر — پشتیبان برای سرویس‌های موجود
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.geo_service import GeoService

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
