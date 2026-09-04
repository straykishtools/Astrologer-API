# app/routers/yoga.py
"""Yoga practice endpoints: sessions, stats, favorites."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.schemas.yoga import FavoriteCreate, YogaSessionCreate, YogaSessionOut, YogaStatsOut
from app.services import yoga_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v5/yoga", tags=["Yoga"])


@router.post("/session", response_model=YogaSessionOut, status_code=201)
async def save_session(
    data: YogaSessionCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await yoga_service.save_session(db, user, data)
    await db.commit()
    await db.refresh(session)
    return YogaSessionOut.model_validate(session)


@router.get("/history", response_model=dict)
async def history(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sessions = await yoga_service.list_sessions(db, user, limit, offset)
    return {
        "status": "success",
        "total": len(sessions),
        "items": [YogaSessionOut.model_validate(s).model_dump(mode="json") for s in sessions],
    }


@router.get("/stats", response_model=YogaStatsOut)
async def stats(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return YogaStatsOut(**await yoga_service.get_stats(db, user))


@router.get("/favorites", response_model=dict)
async def favorites(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    favs = await yoga_service.list_favorites(db, user)
    return {
        "status": "success",
        "total": len(favs),
        "items": [
            {"pose_id": f.pose_id, "pose_name": f.pose_name, "created_at": f.created_at}
            for f in favs
        ],
    }


@router.post("/favorite", status_code=201)
async def add_favorite(
    data: FavoriteCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fav = await yoga_service.add_favorite(db, user, data)
    await db.commit()
    return {"status": "success", "pose_id": fav.pose_id, "pose_name": fav.pose_name}


@router.delete("/favorite/{pose_id}")
async def remove_favorite(
    pose_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await yoga_service.remove_favorite(db, user, pose_id)
    await db.commit()
    return {"status": "success", "detail": "از علاقهمندیها حذف شد"}