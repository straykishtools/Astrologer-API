# app/routers/numerology_router.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.engines.numerology import NumerologyEngine

router = APIRouter(prefix="/api/v5", tags=["Numerology"])
engine = NumerologyEngine()


class LifePathRequest(BaseModel):
    year: int
    month: int
    day: int


class PersonalYearRequest(BaseModel):
    birth_year: int
    birth_month: int
    birth_day: int
    target_year: Optional[int] = None


class NameRequest(BaseModel):
    name: str


class CompatibilityRequest(BaseModel):
    num1: int
    num2: int


@router.post("/numerology/life-path")
def get_life_path(data: LifePathRequest):
    """محاسبه‌ی عدد مسیر زندگی از تاریخ تولد"""
    try:
        result = engine.life_path_number(data.year, data.month, data.day)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/numerology/personal-year")
def get_personal_year(data: PersonalYearRequest):
    """محاسبه‌ی سال شخصی برای سال هدف"""
    try:
        result = engine.personal_year(
            data.birth_year, data.birth_month, data.birth_day, data.target_year
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/numerology/expression")
def get_expression(data: NameRequest):
    """محاسبه‌ی عدد بیان از نام"""
    try:
        result = engine.expression_number(data.name)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/numerology/soul-urge")
def get_soul_urge(data: NameRequest):
    """محاسبه‌ی عدد درونی از نام"""
    try:
        result = engine.soul_urge_number(data.name)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/numerology/compatibility")
def get_compatibility(data: CompatibilityRequest):
    """بررسی سازگاری بین دو عدد"""
    try:
        result = engine.compatibility(data.num1, data.num2)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
