"""
App-level key/value settings stored in cosmic.db.

The admin panel previously kept plans, audio tracks and background images in
localStorage — visible only to that one browser. Storing them server-side makes
admin configuration apply to every user; the frontend still mirrors them into
localStorage so the app keeps working offline.
"""
from datetime import datetime

from sqlalchemy import DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AppSetting(Base):
    """Namespaced JSON blob: ns='plans' | 'audio' | 'backgrounds'."""

    __tablename__ = "app_settings"

    ns: Mapped[str] = mapped_column(Text, primary_key=True)
    value_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<AppSetting ns={self.ns!r} bytes={len(self.value_json)}>"
