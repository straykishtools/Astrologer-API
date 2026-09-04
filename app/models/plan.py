"""
Plan catalog in the Cosmic Oracle database.

Mirrors the legacy ``plans`` table (cosmic_oracle.db) so the new database is
self-describing and a fresh checkout has the free/gold/diamond tiers seeded.
The legacy sync layer remains the source of truth for plan enforcement.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Plan(Base):
    """A subscription tier (free / gold / diamond, or admin-created)."""

    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(60), nullable=False, default="")
    price_monthly: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price_yearly: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    daily_chart_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    can_save_charts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_access_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    premium_paths: Mapped[str] = mapped_column(Text, nullable=False, default="")
    features: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Plan id={self.id} name={self.name!r}>"