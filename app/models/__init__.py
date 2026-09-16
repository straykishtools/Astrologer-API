# app/models/__init__.py
"""
مدل‌های دیتابیس Cosmic Oracle و درخواست‌های احراز هویت

این بسته فقط دو چیز را صادر می‌کند:

1. مدل‌های Pydantic مربوط به احراز هویت (همان شکل پاسخ‌های API قبلی —
   شناسه‌های صحیح (int) و همین کلیدها/فرمت‌ها).
2. مدل‌های ORM (SQLAlchemy) که در فایل‌های app/models/*.py تعریف شده‌اند
   و در انتهای همین فایل دوباره صادر می‌شوند.

لایه‌ی legacy همگام (cosmic_oracle.db با هش SHA256 و اتصال مستقیم sqlite3)
به‌طور کامل حذف شده است — همه‌ی عملیات اکنون از طریق ORM ناهمگام روی
cosmic.db انجام می‌شود (app/services/auth_service.py).
"""
from typing import Optional
from pydantic import BaseModel


# ─── مدل‌های Pydantic (فرمت‌های پاسخ API — بدون تغییر) ───

class UserRegister(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    plan: str  # "free", "gold", "diamond", یا هر پلن ادمین‌ساخته
    is_admin: bool = False
    created_at: str
    email_verified: bool = False  # افزودنی — شکل پاسخ‌های قبلی را تغییر نمی‌دهد


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SaveChartRequest(BaseModel):
    chart_type: str  # "birth", "synastry", "composite", etc.
    title: Optional[str] = None
    input_data: str  # JSON string
    result_data: str  # JSON string


class ChartResponse(BaseModel):
    id: int
    chart_type: str
    title: str
    input_data: str
    result_data: str
    created_at: str


# ─── مدل‌های پلن (قابل مدیریت توسط ادمین) ───

class PlanCreate(BaseModel):
    name: str  # "free", "gold", "diamond", یا هر نام جدید
    display_name: str  # نام نمایشی فارسی: "رایگان", "طلایی"
    price_monthly: int = 0  # قیمت ماهانه به تومان
    price_yearly: int = 0  # قیمت سالانه به تومان
    daily_chart_limit: int = 10  # محدودیت چارت در روز
    can_save_charts: bool = False  # اجازه ذخیره چارت
    can_access_premium: bool = False  # اجازه دسترسی به چارت‌های ویژه
    premium_paths: str = ""  # مسیرهای ویژه، جدا شده با کاما
    features: str = ""  # لیست ویژگی‌ها به صورت متن آزاد
    is_active: bool = True
    sort_order: int = 0  # ترتیب نمایش

class PlanResponse(BaseModel):
    id: int
    name: str
    display_name: str
    price_monthly: int
    price_yearly: int
    daily_chart_limit: int
    can_save_charts: bool
    can_access_premium: bool
    premium_paths: str
    features: str
    is_active: bool
    sort_order: int


class PlanUpdate(BaseModel):
    """مدل به‌روزرسانی پلن — فقط فیلدهای ارسال‌شده تغییر می‌کنن"""
    display_name: Optional[str] = None
    price_monthly: Optional[int] = None
    price_yearly: Optional[int] = None
    daily_chart_limit: Optional[int] = None
    can_save_charts: Optional[bool] = None
    can_access_premium: Optional[bool] = None
    premium_paths: Optional[str] = None
    features: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class AdminCreateUser(BaseModel):
    """Model for admin-created users with plan and admin flag"""
    email: str
    password: str
    display_name: Optional[str] = None
    plan: str = "free"
    is_admin: bool = False


class ProfileUpdate(BaseModel):
    """به‌روزرسانی پروفایل توسط خود کاربر"""
    display_name: Optional[str] = None
    email: Optional[str] = None


class AdminUserEdit(BaseModel):
    """ویرایش کاربر توسط ادمین — فقط فیلدهای ارسال‌شده تغییر می‌کنند"""
    display_name: Optional[str] = None
    plan: Optional[str] = None
    is_admin: Optional[bool] = None


class ChangePassword(BaseModel):
    """Model for password change"""
    current_password: str
    new_password: str


# ─── مدل‌های ORM (Cosmic Oracle database — app/config/database.py) ───
# همه‌ی جدول‌ها روی Base.metadata ثبت می‌شوند تا create_all و Alembic
# آن‌ها را بشناسند.
from app.models.base import Base  # noqa: E402,F401
from app.models.chart import ChartHistory, SavedChart  # noqa: E402,F401
from app.models.analysis_job import AnalysisJob  # noqa: E402,F401
from app.models.plan import Plan  # noqa: E402,F401
from app.models.setting import AppSetting  # noqa: E402,F401
from app.models.tarot import TarotHistory  # noqa: E402,F401
from app.models.user import GuestSession, LoginThrottle, User, UserProfile, UserSettings  # noqa: E402,F401
from app.models.yoga import (  # noqa: E402,F401
    DailyStreak,
    YogaFavorite,
    YogaInstructor,
    YogaPractice,
    YogaPracticeCatalog,
)

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "UserSettings",
    "GuestSession",
    "LoginThrottle",
    "ChartHistory",
    "SavedChart",
    "YogaPractice",
    "YogaFavorite",
    "YogaInstructor",
    "YogaPracticeCatalog",
    "DailyStreak",
    "TarotHistory",
    "Plan",
    "AppSetting",
]