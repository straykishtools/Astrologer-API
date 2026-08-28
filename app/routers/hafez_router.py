"""
Router: فال حافظ (Hafez Divination)
ترکیب دریافت داده از API + پردازش و تکمیل اطلاعات
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.hafez_service import HafezService
from app.services.hafez_processor import HafezProcessor

router = APIRouter(prefix="/api/v5", tags=["Hafez"])
service = HafezService()
processor = HafezProcessor()


class HafezRequest(BaseModel):
    question: Optional[str] = None


@router.post("/hafez")
async def get_hafez(data: HafezRequest):
    """دریافت فال حافظ با اطلاعات تکمیل‌شده"""
    try:
        # ۱. دریافت داده خام از API
        raw_result = await service.get_poem(data.question)

        # اگر خطا بود، همان خطا را برگردان
        if raw_result.get("error"):
            return {"status": "error", **raw_result}

        # ۲. پردازش و تکمیل اطلاعات
        enriched_result = processor.enrich(raw_result)

        return {"status": "success", "data": enriched_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hafez")
async def get_hafez_get():
    """دریافت فال حافظ با GET (بدون سوال)"""
    try:
        raw_result = await service.get_poem()

        if raw_result.get("error"):
            return {"status": "error", **raw_result}

        enriched_result = processor.enrich(raw_result)
        return {"status": "success", "data": enriched_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
