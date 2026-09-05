"""Schemas for saving and reading tarot history."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TarotHistoryCreate(BaseModel):
    """Body for POST /api/v5/tarot/history."""

    model_config = ConfigDict(extra="ignore")

    spread_type: str = Field(default="daily", pattern="^(daily|three-card|celtic-cross|custom)$")
    card_ids: Optional[list] = None
    reversed: Optional[list] = None
    question: Optional[str] = None


class TarotHistoryOut(BaseModel):
    """Serialized tarot draw record."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    spread_type: str
    card_ids: Optional[list] = None
    reversed: Optional[list] = None
    question: Optional[str] = None
    created_at: Optional[datetime] = None