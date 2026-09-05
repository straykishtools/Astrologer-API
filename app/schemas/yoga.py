"""Schemas for yoga practice sessions, favorites and stats."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class YogaSessionCreate(BaseModel):
    """Body for POST /api/v5/yoga/session."""

    model_config = ConfigDict(extra="ignore")

    pose_id: Optional[int] = None
    pose_name: Optional[str] = None
    category: str = Field(default="asanas", pattern="^(asanas|breathing|meditation)$")
    duration_seconds: int = Field(default=0, ge=0, le=86400)
    completed: bool = True
    notes: Optional[str] = None
    practice_date: Optional[date] = None  # defaults to today


class YogaSessionOut(BaseModel):
    """Serialized yoga practice record."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    pose_id: Optional[int] = None
    pose_name: Optional[str] = None
    category: str
    duration_seconds: int
    completed: bool
    notes: Optional[str] = None
    practice_date: date
    created_at: Optional[datetime] = None


class FavoriteCreate(BaseModel):
    """Body for POST /api/v5/yoga/favorite."""

    model_config = ConfigDict(extra="ignore")

    pose_id: Optional[int] = None
    pose_name: str = Field(min_length=1)


class YogaStatsOut(BaseModel):
    total_sessions: int = 0
    total_minutes: int = 0
    total_seconds: int = 0
    streak: int = 0
    longest_streak: int = 0
    last_practice_date: Optional[date] = None
    practiced_today: bool = False
    most_practiced: list[dict] = []
    by_category: dict[str, int] = {}