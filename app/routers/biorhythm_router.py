"""
Router: Biorhythm (بیوریتم)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.engines.biorhythm import BiorhythmEngine

router = APIRouter(prefix="/api/v5", tags=["Biorhythm"])
engine = BiorhythmEngine()


class BiorhythmRequest(BaseModel):
    birth_date: str  # YYYY-MM-DD
    target_date: Optional[str] = None  # YYYY-MM-DD


class MonthlyOverviewRequest(BaseModel):
    birth_date: str  # YYYY-MM-DD
    year: int
    month: int


@router.post("/biorhythm")
def get_biorhythm(data: BiorhythmRequest):
    """محاسبه‌ی بیوریتم برای تاریخ مشخص"""
    try:
        result = engine.calculate(data.birth_date, data.target_date)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/biorhythm/monthly")
def get_monthly_overview(data: MonthlyOverviewRequest):
    """نمای کلی بیوریتم یک ماه"""
    try:
        result = engine.get_monthly_overview(data.birth_date, data.year, data.month)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
