"""
Chart history service: save, list, get and delete saved chart results.
"""
import json
import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChartHistory, User


def _as_uuid(chart_id: str) -> uuid.UUID:
    """Coerce a route parameter into a UUID, 404 on malformed ids."""
    try:
        return uuid.UUID(str(chart_id))
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=404, detail="چارت یافت نشد")


async def save_chart(db: AsyncSession, user: User, data: dict) -> ChartHistory:
    """Persist a chart result. ``chart_data`` is stored as JSON."""
    chart_data = data.get("chart_data")
    if chart_data is None:
        # Legacy payload compatibility: fold input/result strings into one blob.
        chart_data = {}
        if data.get("input_data"):
            try:
                chart_data["input"] = json.loads(data["input_data"])
            except (TypeError, json.JSONDecodeError):
                chart_data["input"] = data["input_data"]
        if data.get("result_data"):
            try:
                chart_data["result"] = json.loads(data["result_data"])
            except (TypeError, json.JSONDecodeError):
                chart_data["result"] = data["result_data"]

    chart = ChartHistory(
        user_id=user.id,
        chart_type=data.get("chart_type", "birth"),
        chart_data=chart_data,
        score=data.get("score"),
        interpretation=data.get("interpretation"),
        aspects_count=data.get("aspects_count"),
        subject_name=data.get("subject_name"),
        person2_name=data.get("person2_name"),
        title=data.get("title"),
    )
    db.add(chart)
    await db.flush()
    return chart


async def list_charts(
    db: AsyncSession,
    user: User,
    chart_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[ChartHistory], int]:
    query = select(ChartHistory).where(ChartHistory.user_id == user.id)
    count_query = select(func.count()).select_from(ChartHistory).where(ChartHistory.user_id == user.id)
    if chart_type:
        query = query.where(ChartHistory.chart_type == chart_type)
        count_query = count_query.where(ChartHistory.chart_type == chart_type)
    query = query.order_by(ChartHistory.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    charts = list(result.scalars())
    total = (await db.execute(count_query)).scalar_one()
    return charts, total


async def get_chart(db: AsyncSession, user: User, chart_id: str) -> ChartHistory:
    result = await db.execute(
        select(ChartHistory).where(ChartHistory.id == _as_uuid(chart_id), ChartHistory.user_id == user.id)
    )
    chart = result.scalar_one_or_none()
    if chart is None:
        raise HTTPException(status_code=404, detail="چارت یافت نشد")
    return chart


async def delete_chart(db: AsyncSession, user: User, chart_id: str) -> bool:
    chart = await get_chart(db, user, chart_id)
    await db.delete(chart)
    await db.flush()
    return True