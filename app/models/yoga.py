"""
Yoga: practice sessions and streak tracking.
"""
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    JSON,
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pose_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pose_name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="yoga_favorites")

    def __repr__(self) -> str:
        return f"<YogaFavorite user_id={self.user_id} pose_id={self.pose_id} name={self.pose_name!r}>"


class YogaInstructor(Base):
    """A yoga instructor (seeded demo data, manageable by admins)."""

    __tablename__ = "yoga_instructors"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    specialty: Mapped[str | None] = mapped_column(String(200), nullable=True)
    level: Mapped[str] = mapped_column(String(30), nullable=False, default="intermediate")
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    practices = relationship("YogaPracticeCatalog", back_populates="instructor")

    def __repr__(self) -> str:
        return f"<YogaInstructor id={self.id} name={self.name!r}>"


class YogaPracticeCatalog(Base):
    """Ready-made yoga practice (desert, ocean, ...) stored in the database.

    ``sequence`` holds the full body (steps, loops, difficulty branches) as JSON
    — the same shape the static ``static/yoga-data/*.json`` files use — and
    ``subscription_tier`` gates access per plan (free/gold/diamond).
    """

    __tablename__ = "yoga_practices"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name_fa: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_fa: Mapped[str | None] = mapped_column(Text, nullable=True)
    style: Mapped[str | None] = mapped_column(String(30), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(20), nullable=True)
    durations: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    difficulties: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    pose_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instructor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("yoga_instructors.id", ondelete="SET NULL"), nullable=True
    )
    head: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sequence: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    subscription_tier: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # منشأ تمرین: seed (داده‌ی پیش‌فرض) | manual (ساخته‌شده دستی) | xml (آپلود فایل)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    source_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    instructor = relationship("YogaInstructor", back_populates="practices")

    def __repr__(self) -> str:
        return f"<YogaPracticeCatalog id={self.id} name={self.name!r} tier={self.subscription_tier}>"


class DailyStreak(Base):
    """Current + longest streak per user per activity type."""

    __tablename__ = "daily_streak"
    __table_args__ = (
        UniqueConstraint("user_id", "streak_type", name="uq_streak_user_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
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