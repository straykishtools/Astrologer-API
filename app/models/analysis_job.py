"""
Job پس‌زمینه برای تفسیر چارت توسط AI.

چرا در دیتابیس و نه حافظهٔ پروسه؟ Railway (و هر لاودبالانسر) ممکن است
رکوئست POST و GET بعدی را به پروسه‌های متفاوت بفرستد؛ پس وضعیت و نتیجهٔ
job باید در DB (SQLite روی Volume) بماند تا رفرش/تغییر تب/سرویس دیگر هم
بتواند آن را ببیند.
"""
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AnalysisJob(Base):
    """یک درخواست تفسیر چارت + نتیجهٔ آن (state machine ساده)."""

    __tablename__ = "analysis_jobs"
    __table_args__ = (
        Index("ix_analysis_jobs_owner_created", "owner_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # مالک: "u:<user_id>" برای کاربر لاگین‌شده، "g:<fingerprint>" برای مهمان
    owner_id: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    # وضعیت چرخهٔ عمر: pending | running | done | error | not_found
    status: Mapped[str] = mapped_column(String(12), nullable=False, default="pending")
    # کلید یکتای تاریخ‌تولد (hash subject) — dedupe سمت سرور: درخواست مجدد
    # با همین کلید = بازگرداندن همان job، نه صدازدن دوبارهٔ AI
    birth_key: Mapped[str | None] = mapped_column(String(24), nullable=True, index=True)
    # دادهٔ خام subject (JSON رشته‌ای) — برای dropdown «چارت‌های ذخیره‌شده» و
    # بازیابی فرم در دستگاه/مرورگر دیگر، بدون وابستگی به localStorage
    subject_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    # ورودی‌های لازم برای اجرای تحلیل (متن context و خلاصهٔ ودیک)
    context: Mapped[str] = mapped_column(Text, nullable=False, default="")
    vedic_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # نتیجه — فقط وقتی status == "done"
    result_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    chart_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<AnalysisJob id={self.id} owner={self.owner_id!r} status={self.status}>"
