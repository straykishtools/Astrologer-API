"""
User models: core accounts, birth-data profiles and app preferences.

The Cosmic Oracle user database uses integer primary keys (matching the legacy
API contract: users, plans and saved charts are addressed by integer ids).
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    """Core user account (integer PK, plan, flags)."""

    __tablename__ = "users"
    __table_args__ = (
        # Admin plan ops + per-plan stats group by users.plan; the quota flow
        # reads the limit from the plans table by name.
        Index("ix_users_plan", "plan"),
        # verify-email / reset-password look up users by the random token.
        Index("ix_users_verification_token", "verification_token"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    plan: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    plan_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Daily chart quota (same semantics as the legacy users table).
    daily_charts_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    daily_charts_reset_at: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    profiles: Mapped[list["UserProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    settings: Mapped["UserSettings | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    charts = relationship("ChartHistory", back_populates="user", cascade="all, delete-orphan")
    yoga_practice = relationship("YogaPractice", back_populates="user", cascade="all, delete-orphan")
    yoga_favorites = relationship("YogaFavorite", back_populates="user", cascade="all, delete-orphan")
    streaks = relationship("DailyStreak", back_populates="user", cascade="all, delete-orphan")
    tarot_history = relationship("TarotHistory", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


class UserProfile(Base):
    """Personal birth data used for chart calculations."""

    __tablename__ = "user_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", "is_default", name="uq_profile_default_per_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_hour: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    timezone: Mapped[str | None] = mapped_column(Text, nullable=True)
    zodiac_type: Mapped[str | None] = mapped_column(String(20), nullable=True, default="tropical")
    house_system: Mapped[str | None] = mapped_column(String(20), nullable=True, default="placidus")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="profiles")

    def __repr__(self) -> str:
        return f"<UserProfile id={self.id} user_id={self.user_id} name={self.name!r}>"


class GuestSession(Base):
    """Server-side guest identity + daily chart quota (replaces the legacy table)."""

    __tablename__ = "guest_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fingerprint_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    daily_charts_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    daily_charts_reset_at: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    linked_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<GuestSession id={self.id} hash={self.fingerprint_hash[:10]}…>"


class UserSettings(Base):
    """App preferences (theme, language, reminders, default chart type)."""

    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    theme: Mapped[str] = mapped_column(String(20), nullable=False, default="dark")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    daily_reminder_time: Mapped[str | None] = mapped_column(String(5), nullable=True, default="08:00")
    default_chart_type: Mapped[str] = mapped_column(String(20), nullable=False, default="birth")
    preferred_language: Mapped[str] = mapped_column(String(5), nullable=False, default="fa")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="settings")

    def __repr__(self) -> str:
        return f"<UserSettings user_id={self.user_id} theme={self.theme!r}>"