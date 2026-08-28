"""
Router: Chinese Zodiac (سال حیوانی چینی)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.engines.chinese_zodiac import ChineseZodiacEngine

router = APIRouter(prefix="/api/v5", tags=["Chinese Zodiac"])
engine = ChineseZodiacEngine()


class ZodiacRequest(BaseModel):
    year: int


class ZodiacCompatibilityRequest(BaseModel):
    animal1: str
    animal2: str


@router.post("/chinese-zodiac")
def get_zodiac(data: ZodiacRequest):
    """محاسبه سال حیوانی چینی"""
    try:
        result = engine.calculate(data.year)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chinese-zodiac/compatibility")
def get_zodiac_compatibility(data: ZodiacCompatibilityRequest):
    """بررسی سازگاری دو حیوان چینی"""
    try:
        result = engine.get_compatibility(data.animal1, data.animal2)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
