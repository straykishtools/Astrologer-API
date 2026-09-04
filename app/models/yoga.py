"""
Yoga: practice sessions and streak tracking.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    UniqueConstraint,
    func,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class YogaPractice(Base):
    """A single completed (or attempted) yoga/breathing/meditation session."""

    __tablename__ = "yoga_practice"
    __table_args__ = (
        Index("ix_yoga_practice_user_date", "user_id", "practice_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pose_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pose_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(30), nullable=False, default="asanas"  # 'asanas', 'breathing', 'meditation'
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    practice_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="yoga_practice")

    def __repr__(self) -> str:
        return f"<YogaPractice id={self.id} user_id={self.user_id} date={self.practice_date}>"


class YogaFavorite(Base):
    """A yoga pose marked as favorite by the user."""

    __tablename__ = "yoga_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "pose_id", name="uq_favorite_user_pose"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pose_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pose_name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="yoga_favorites")

    def __repr__(self) -> str:
        return f"<YogaFavorite user_id={self.user_id} pose_id={self.pose_id} name={self.pose_name!r}>"


class DailyStreak(Base):
    """Current + longest streak per user per activity type."""

    __tablename__ = "daily_streak"
    __table_args__ = (
        UniqueConstraint("user_id", "streak_type", name="uq_streak_user_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    streak_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="yoga"  # 'yoga', 'tarot', 'daily-question', 'login'
    )
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="streaks")

    def __repr__(self) -> str:
        return f"<DailyStreak user_id={self.user_id} type={self.streak_type!r} current={self.current_streak}>"