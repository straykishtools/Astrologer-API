"""Schemas for user profile, settings and dashboard."""
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    """Birth data + preferences for the default user profile."""

    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    birth_year: Optional[int] = Field(default=None, ge=1, le=3000)
    birth_month: Optional[int] = Field(default=None, ge=1, le=12)
    birth_day: Optional[int] = Field(default=None, ge=1, le=31)
    birth_hour: Optional[int] = Field(default=None, ge=0, le=23)
    birth_minute: Optional[int] = Field(default=None, ge=0, le=59)
    city: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    timezone: Optional[str] = None
    zodiac_type: Optional[str] = Field(default=None, pattern="^(tropical|sidereal)$")
    house_system: Optional[str] = Field(default=None, pattern="^(placidus|koch|whole_sign)$")
    is_default: Optional[bool] = True


class SettingsUpdate(BaseModel):
    """App preferences that can be changed by the user."""

    model_config = ConfigDict(extra="ignore")

    theme: Optional[str] = Field(default=None, pattern="^(dark|light)$")
    notifications_enabled: Optional[bool] = None
    daily_reminder_time: Optional[str] = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    default_chart_type: Optional[str] = None
    preferred_language: Optional[str] = Field(default=None, pattern="^(fa|en)$")


class ProfileOut(BaseModel):
    """Serialized default user profile."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    name: Optional[str] = None
    birth_year: Optional[int] = None
    birth_month: Optional[int] = None
    birth_day: Optional[int] = None
    birth_hour: Optional[int] = None
    birth_minute: Optional[int] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: Optional[str] = None
    zodiac_type: Optional[str] = "tropical"
    house_system: Optional[str] = "placidus"
    is_default: bool = True
    updated_at: Optional[datetime] = None


class SettingsOut(BaseModel):
    """Serialized user settings."""

    model_config = ConfigDict(from_attributes=True)

    theme: str = "dark"
    notifications_enabled: bool = True
    daily_reminder_time: Optional[str] = "08:00"
    default_chart_type: str = "birth"
    preferred_language: str = "fa"
    updated_at: Optional[datetime] = None


class UserOut(BaseModel):
    """Serialized core user (matches the legacy /api/v5/auth/me shape)."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    email: str
    display_name: str
    plan: str = "free"
    is_admin: bool = False
    is_active: bool = True
    email_verified: bool = False
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class StreakOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    streak_type: str
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[date] = None
    updated_at: Optional[datetime] = None


class DashboardResponse(BaseModel):
    user: UserOut
    profile: Optional[ProfileOut] = None
    settings: Optional[SettingsOut] = None
    streaks: list[StreakOut] = []
    charts: dict[str, Any] = {}
    yoga: dict[str, Any] = {}
    tarot: dict[str, Any] = {}
    legacy_charts: list[dict[str, Any]] = []