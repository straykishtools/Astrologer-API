# app/routers/user.py
"""User profile, settings, dashboard and chart-history endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.schemas.chart import ChartOut, ChartSaveRequest
from app.schemas.user import (
    DashboardResponse,
    ProfileOut,
    ProfileUpdate,
    SettingsOut,
    SettingsUpdate,
    StreakOut,
    UserOut,
)
from app.services import chart_service, user_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v5/user", tags=["User"])


# ─── Profile ───

@router.get("/profile", response_model=ProfileOut)
async def get_profile(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await user_service.get_default_profile(db, user)
    if profile is None:
        return ProfileOut()
    return ProfileOut.model_validate(profile)


@router.put("/profile", response_model=ProfileOut)
async def update_profile(
    data: ProfileUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await user_service.update_profile(db, user, data.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(profile)
    return ProfileOut.model_validate(profile)


@router.get("/settings", response_model=SettingsOut)
async def get_settings(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await user_service.get_or_create_settings(db, user)
    await db.commit()
    return SettingsOut.model_validate(settings)


@router.put("/settings", response_model=SettingsOut)
async def update_settings(
    data: SettingsUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await user_service.update_settings(db, user, data)
    await db.commit()
    await db.refresh(settings)
    return SettingsOut.model_validate(settings)


# ─── Dashboard ───

@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await user_service.get_default_profile(db, user)
    settings = await user_service.get_settings(db, user)
    streaks = await user_service.get_streaks(db, user)
    charts = await user_service.get_chart_summary(db, user)
    yoga = await user_service.get_yoga_summary(db, user)
    tarot = await user_service.get_tarot_summary(db, user)
    legacy = await user_service.get_legacy_saved_charts(user)
    return DashboardResponse(
        user=UserOut.model_validate(user),
        profile=ProfileOut.model_validate(profile) if profile else None,
        settings=SettingsOut.model_validate(settings) if settings else None,
        streaks=[StreakOut.model_validate(s) for s in streaks],
        charts=charts,
        yoga=yoga,
        tarot=tarot,
        legacy_charts=legacy,
    )


# ─── Chart history ───

@router.get("/charts", response_model=dict)
async def list_charts(
    chart_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    charts, total = await chart_service.list_charts(db, user, chart_type, limit, offset)
    return {
        "status": "success",
        "total": total,
        "items": [ChartOut.model_validate(c).model_dump(mode="json") for c in charts],
    }


@router.get("/charts/{chart_id}", response_model=ChartOut)
async def get_chart(
    chart_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chart = await chart_service.get_chart(db, user, chart_id)
    return ChartOut.model_validate(chart)


@router.post("/charts/save", response_model=ChartOut, status_code=201)
async def save_chart(
    data: ChartSaveRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chart = await chart_service.save_chart(db, user, data.model_dump())
    await db.commit()
    await db.refresh(chart)
    return ChartOut.model_validate(chart)


@router.delete("/charts/{chart_id}")
async def delete_chart(
    chart_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await chart_service.delete_chart(db, user, chart_id)
    await db.commit()
    return {"status": "success", "detail": "چارت حذف شد"}