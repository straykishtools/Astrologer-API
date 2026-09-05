"""Schemas for saving and reading chart history."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChartSaveRequest(BaseModel):
    """Body for POST /api/v5/user/charts/save.

    ``chart_data`` holds the full chart API response. For compatibility with
    the legacy frontend payload, ``input_data``/``result_data`` are also
    accepted and folded into ``chart_data`` when ``chart_data`` is absent.
    """

    model_config = ConfigDict(extra="ignore")

    chart_type: str = Field(default="birth", pattern="^(birth|synastry|composite|transit|solar-return|lunar-return|custom)$")
    chart_data: Optional[Any] = None
    score: Optional[int] = Field(default=None, ge=0, le=100)
    interpretation: Optional[dict] = None
    aspects_count: Optional[int] = None
    subject_name: Optional[str] = None
    person2_name: Optional[str] = None
    title: Optional[str] = None
    # Legacy fields (kept so existing clients can reuse this endpoint)
    input_data: Optional[str] = None
    result_data: Optional[str] = None


class ChartOut(BaseModel):
    """Serialized chart history record."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    chart_type: str
    chart_data: Optional[Any] = None
    score: Optional[int] = None
    interpretation: Optional[dict] = None
    aspects_count: Optional[int] = None
    subject_name: Optional[str] = None
    person2_name: Optional[str] = None
    title: Optional[str] = None
    created_at: Optional[datetime] = None