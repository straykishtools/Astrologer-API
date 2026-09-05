"""
Chart history: every chart calculation a user saves.
"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ChartHistory(Base):
    """A saved chart result (the full API response is stored as JSON)."""

    __tablename__ = "chart_history"
    __table_args__ = (
        Index("ix_chart_history_user_created", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chart_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="birth",
        # 'birth', 'synastry', 'composite', 'transit', 'solar-return', 'lunar-return'
    )
    chart_data: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    interpretation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    aspects_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    subject_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    person2_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="charts")

    def __repr__(self) -> str:
        return f"<ChartHistory id={self.id} user_id={self.user_id} chart_type={self.chart_type!r}>"


class SavedChart(Base):
    """A chart saved through the legacy ``/api/v5/auth/charts/*`` endpoints.

    Mirrors the legacy ``saved_charts`` table (cosmic_oracle.db) exactly —
    ``input_data``/``result_data`` are the raw JSON strings the legacy API
    returns, so the response format stays byte-identical after the migration.
    """

    __tablename__ = "saved_charts"
    __table_args__ = (
        Index("ix_saved_charts_user_created", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chart_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    input_data: Mapped[str] = mapped_column(Text, nullable=False, default="")
    result_data: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<SavedChart id={self.id} user_id={self.user_id} chart_type={self.chart_type!r}>"