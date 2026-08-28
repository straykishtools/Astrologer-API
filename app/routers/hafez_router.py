"""
Router: فال حافظ (Hafez Divination)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.hafez_service import HafezService

router = APIRouter(prefix="/api/v5", tags=["Hafez"])
service = HafezService()


class HafezRequest(BaseModel):
    question: Optional[str] = None


@router.post("/hafez")
async def get_hafez(data: HafezRequest):
    """دریافت فال حافظ — غزل تصادفی با تفسیر"""
    try:
        result = await service.get_poem(data.question)
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hafez")
async def get_hafez_get():
    """دریافت فال حافظ با GET (بدون سوال)"""
    try:
        result = await service.get_poem()
        if "error" in result:
            raise HTTPException(status_code=502, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
