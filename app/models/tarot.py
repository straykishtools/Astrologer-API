"""
Tarot: saved card draws.
"""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TarotHistory(Base):
    """A saved tarot draw (spread type, card ids, reversed flags)."""

    __tablename__ = "tarot_history"
    __table_args__ = (
        Index("ix_tarot_history_user_created", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    spread_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="daily"  # 'daily', 'three-card', 'celtic-cross', 'custom'
    )
    card_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    reversed: Mapped[list | None] = mapped_column(JSON, nullable=True)
    question: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tarot_history")

    def __repr__(self) -> str:
        return f"<TarotHistory id={self.id} user_id={self.user_id} spread={self.spread_type!r}>"