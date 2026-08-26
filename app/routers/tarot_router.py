# app/routers/tarot_router.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.engines.tarot import TarotEngine

router = APIRouter(prefix="/api/v5", tags=["Tarot"])
engine = TarotEngine()

class DrawRequest(BaseModel):
    count: int = 1
    with_reversed: bool = True

@router.get("/tarot/cards")
def get_all_cards():
    """دریافت لیست کامل ۷۸ کارت تاروت"""
    try:
        return {"status": "success", "data": engine.get_all_cards()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tarot/daily")
def get_daily_card():
    """دریافت کارت روزانه"""
    try:
        return {"status": "success", "data": engine.get_daily_card()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tarot/draw")
def draw_cards(request: DrawRequest):
    """کشیدن کارت‌های تصادفی"""
    try:
        if request.count < 1 or request.count > 78:
            raise HTTPException(status_code=400, detail="تعداد کارت باید بین ۱ تا ۷۸ باشد")
        return {"status": "success", "data": engine.draw_cards(request.count, request.with_reversed)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tarot/spread/three")
def three_card_spread():
    """اسپرید ۳ کارتی (گذشته، حال، آینده)"""
    try:
        return {"status": "success", "data": engine.three_card_spread()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tarot/spread/celtic")
def celtic_cross_spread():
    """اسپرید سلتیک کراس (۱۰ کارتی)"""
    try:
        return {"status": "success", "data": engine.celtic_cross_spread()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
