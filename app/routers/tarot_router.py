# app/routers/tarot_router.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.engines.tarot import TarotEngine
from app.schemas.tarot import TarotHistoryCreate, TarotHistoryOut
from app.services import tarot_service
from app.services.auth_service import get_current_user

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


@router.post("/tarot/history", response_model=TarotHistoryOut, status_code=201)
async def save_tarot_history(
    data: TarotHistoryCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ذخیره یک دست کارت در تاریخچه کاربر"""
    draw = await tarot_service.save_history(db, user, data)
    await db.commit()
    await db.refresh(draw)
    return TarotHistoryOut.model_validate(draw)


@router.get("/tarot/history", response_model=dict)
async def get_tarot_history(
    limit: int = 100,
    offset: int = 0,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """تاریخچه دست‌های تاروت کاربر"""
    draws = await tarot_service.list_history(db, user, limit, offset)
    return {
        "status": "success",
        "total": len(draws),
        "items": [TarotHistoryOut.model_validate(d).model_dump(mode="json") for d in draws],
    }
