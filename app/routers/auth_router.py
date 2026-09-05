# app/routers/auth_router.py
"""
روت‌های احراز هویت: ثبت‌نام، ورود، پروفایل، ذخیره/دریافت چارت

همه‌ی این روت‌ها روی دیتابیس ناهمگام Cosmic Oracle (cosmic.db) کار می‌کنند —
لایه‌ی legacy همگام (cosmic_oracle.db) حذف شده است. شکل پاسخ‌ها با قبل یکسان
است (شناسه‌های صحیح، همین کلیدها و پیام‌ها).
"""
import hashlib
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models import (
    AdminCreateUser,
    AdminUserEdit,
    ChangePassword,
    ChartResponse,
    PlanCreate,
    PlanResponse,
    PlanUpdate,
    ProfileUpdate,
    SaveChartRequest,
    TokenResponse,
    User,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.schemas.user import UserOut
from app.services import auth_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v5/auth", tags=["Auth"])


# ─── Dependency: دریافت کاربر جاری از توکن ───

def get_admin_user(user=Depends(get_current_user)):
    """فقط ادمین دسترسی داره"""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="دسترسی مخصوص ادمین")
    return user


def _user_response(user) -> UserResponse:
    return UserResponse(**auth_service.user_response_dict(user))


# ─── روت‌های احراز هویت ───

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """ثبت‌نام کاربر جدید"""
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")

    if "@" not in data.email or "." not in data.email:
        raise HTTPException(status_code=400, detail="ایمیل نامعتبر است")

    user = await auth_service.create_user(db, data.email, data.password, data.display_name or "")
    if not user:
        raise HTTPException(status_code=409, detail="این ایمیل قبلاً ثبت شده")

    token = auth_service.create_access_token({"user_id": user.id, "email": user.email})

    # توکن تأیید ایمیل + ارسال ایمیل (best-effort — هرگز ثبت‌نام را مسدود نمی‌کند)
    try:
        from app.services.email_service import send_verification_email

        v_token = await auth_service.issue_verification_token(db, user)
        send_verification_email(user.email, v_token)
    except Exception:
        pass
    await db.commit()

    return TokenResponse(
        access_token=token,
        user=UserResponse(**auth_service.user_response_dict(user)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """ورود کاربر"""
    user = await auth_service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="ایمیل یا رمز عبور اشتباه است")
    await db.commit()

    token = auth_service.create_access_token({"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**auth_service.user_response_dict(user)),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    """دریافت اطلاعات کاربر جاری"""
    return _user_response(user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """به‌روزرسانی پروفایل کاربر جاری (نام نمایشی / ایمیل)"""
    new_email = (data.email or "").strip().lower()
    new_name = (data.display_name or "").strip()
    if not new_email and not new_name:
        raise HTTPException(status_code=400, detail="حداقل یک فیلد برای ویرایش لازم است")

    if new_email:
        if "@" not in new_email or "." not in new_email:
            raise HTTPException(status_code=400, detail="ایمیل نامعتبر است")
        conflict = (
            await db.execute(
                select(User.id).where(
                    User.email == new_email,
                    User.id != user.id,
                ).limit(1)
            )
        ).scalar_one_or_none()
        if conflict:
            raise HTTPException(status_code=409, detail="این ایمیل قبلاً ثبت شده")

    if new_email:
        user.email = new_email
        # The new address is unverified until the user confirms it — reset the
        # flag and issue a fresh verification token (best-effort email send).
        user.email_verified = False
        user.verification_token = None
        user.verification_token_expires_at = None
    if new_name:
        user.display_name = new_name
    await db.commit()
    await db.refresh(user)

    if new_email:
        try:
            from app.services.email_service import send_verification_email

            v_token = await auth_service.issue_verification_token(db, user)
            await db.commit()
            send_verification_email(user.email, v_token)
        except Exception:
            pass
    return _user_response(user)


@router.get("/daily-limit")
async def get_daily_limit(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """چک کردن محدودیت روزانه"""
    result = await auth_service.check_daily_limit(db, user.id)
    await db.commit()
    return result


@router.get("/usage")
async def get_usage_stats(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """آمار لحظه‌ای مصرف چارت بر اساس پلن کاربر"""
    limit_info = await auth_service.check_daily_limit(db, user.id)
    plan_row = await auth_service.get_plan_by_name(db, user.plan or "free")
    await db.commit()

    plan_details = {}
    if plan_row:
        plan_details = {
            "name": plan_row.name,
            "display_name": plan_row.display_name,
            "daily_chart_limit": plan_row.daily_chart_limit,
            "can_save_charts": bool(plan_row.can_save_charts),
            "can_access_premium": bool(plan_row.can_access_premium),
        }

    return {
        "used": limit_info["used"],
        "limit": limit_info["limit"],
        "remaining": limit_info["remaining"],
        "allowed": limit_info["allowed"],
        "plan": user.plan or "free",
        "plan_details": plan_details,
        "is_admin": bool(user.is_admin),
        "reset_at": user.daily_charts_reset_at,
    }


# ─── روت‌های ذخیره چارت (فقط کاربران ویژه) ───

@router.post("/charts/save", response_model=ChartResponse)
async def save_chart_endpoint(data: SaveChartRequest, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """ذخیره چارت (بر اساس پلن کاربر)"""
    plan = await auth_service.get_user_plan(db, user)
    if not plan or not plan.can_save_charts:
        raise HTTPException(status_code=403, detail="ذخیره چارت در پلن شما فعال نیست. اشتراک خود را ارتقا دهید.")

    chart = await auth_service.save_legacy_chart(
        db, user_id=user.id,
        chart_type=data.chart_type,
        title=data.title or "",
        input_data=data.input_data,
        result_data=data.result_data,
    )
    await db.commit()
    c = auth_service.saved_chart_dict(chart)
    return ChartResponse(
        id=c["id"],
        chart_type=c["chart_type"],
        title=c["title"],
        input_data=c["input_data"],
        result_data=c["result_data"],
        created_at=c["created_at"],
    )


@router.get("/charts")
async def get_charts(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """لیست چارت‌های ذخیره‌شده"""
    plan = await auth_service.get_user_plan(db, user)
    if not plan or not plan.can_save_charts:
        return {"charts": [], "message": "برای ذخیره چارت، اشتراک خود را ارتقا دهید"}

    charts = await auth_service.get_legacy_charts(db, user.id)
    await db.commit()
    return {"charts": [auth_service.saved_chart_dict(c) for c in charts]}


@router.delete("/charts/{chart_id}")
async def delete_chart_endpoint(chart_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """حذف چارت ذخیره‌شده"""
    deleted = await auth_service.delete_legacy_chart(db, chart_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="چارت یافت نشد")
    await db.commit()
    return {"status": "deleted"}


@router.put("/change-password")
async def change_user_password(data: ChangePassword, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """تغییر رمز عبور

    - **current_password**: رمز عبور امروزی
    - **new_password**: رمز جدید (حداقل 6 کاراکتر)
    """
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل 6 کاراکتر باشد")
    ok = await auth_service.change_password(db, user, data.current_password, data.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="رمز عبور امروزی اشتباه است")
    await db.commit()
    return {"status": "ok", "message": "رمز عبور تغییر کرد"}


@router.post("/forgot-password")
async def forgot_password(data: dict, db: AsyncSession = Depends(get_db)):
    """درخواست بازیابی رمز عبور

    همیشه پیام موفقیت برمی‌گرداند (حتی اگر ایمیل وجود نداشته باشد)
    تا اطلاعات کاربر فاش نشود. در حالت توسعه، لینک بازیابی در کنسول چاپ می‌شود.
    """
    email = (data.get("email") or "").lower().strip()
    if not email or "@" not in email:
        return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک بازیابی ارسال شد."}

    from app.services.email_service import send_password_reset_email

    # Provision a matching row (no-op when it already exists) — enumeration-safe.
    user = await auth_service.ensure_user(db, email)
    try:
        token = await auth_service.issue_verification_token(db, user)
        await db.commit()
        send_password_reset_email(email, token)
    except Exception:
        # Never fail the request; the response is always generic anyway.
        pass

    return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک بازیابی ارسال شد."}


@router.post("/verify-email")
async def verify_email(data: dict, db: AsyncSession = Depends(get_db)):
    """تأیید ایمیل با توکن ارسال‌شده (۲۴ ساعت معتبر)"""
    token = (data.get("token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="توکن لازم است")
    user = await auth_service.verify_email_token(db, token)
    await db.commit()
    return {
        "status": "ok",
        "email_verified": True,
        "user": UserOut.model_validate(user).model_dump(mode="json"),
    }


@router.post("/resend-verification")
async def resend_verification(data: dict, db: AsyncSession = Depends(get_db)):
    """ارسال مجدد لینک تأیید ایمیل (بدون افشای وجود ایمیل)"""
    from app.services.email_service import send_verification_email

    email = (data.get("email") or "").lower().strip()
    if not email or "@" not in email:
        return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک تأیید ارسال شد."}

    user = await auth_service.ensure_user(db, email)
    try:
        token = await auth_service.issue_verification_token(db, user)
        await db.commit()
        send_verification_email(email, token)
    except Exception:
        pass

    return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک تأیید ارسال شد."}


@router.get("/dev/emails")
def dev_email_inbox():
    """لیست ایمیل‌های اخیر صادرشده (فقط محیط توسعه/تست)."""
    import os as _os

    if _os.getenv("ENV_TYPE") == "production":
        raise HTTPException(status_code=404, detail="این مسیر فقط در محیط توسعه فعال است")
    from app.services.email_service import get_inbox

    return {"status": "ok", "count": len(get_inbox()), "emails": get_inbox()}


@router.post("/reset-password")
async def reset_password(data: dict, db: AsyncSession = Depends(get_db)):
    """تعیین رمز عبور جدید با توکن بازیابی (۲۴ ساعت معتبر)"""
    token = (data.get("token") or "").strip()
    new_password = data.get("new_password") or ""
    if not token:
        raise HTTPException(status_code=400, detail="توکن لازم است")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")

    await auth_service.reset_password_with_token(db, token, new_password)
    await db.commit()
    return {"status": "ok", "message": "رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید."}


# ============================================================
# روت‌های کاربر مهمان: هویت سمت سرور + quota
# ============================================================

def _fp_hash(fingerprint: str) -> str:
    """Hash the fingerprint for privacy (don't store the raw browser fingerprint)."""
    return hashlib.sha256(fingerprint.encode()).hexdigest()[:48]


@router.post("/guest-session")
async def create_guest_session(data: dict, db: AsyncSession = Depends(get_db)):
    """ایجاد یا بازیابی session مهمان

    سمت کلاینت یک "fingerprint" (ترکیب user-agent + یک رشته تصادفی ذخیره‌شده در localStorage)
    ارسال می‌شود. سرور بر اساس آن یک هویت مهمان server-side ایجاد می‌کند.
    """
    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        fingerprint = secrets.token_urlsafe(32)

    fp_hash = _fp_hash(fingerprint)
    guest = await auth_service.get_guest_by_fingerprint(db, fp_hash)
    today = datetime.now().strftime("%Y-%m-%d")

    if guest is None:
        from app.models import GuestSession

        guest = GuestSession(
            fingerprint_hash=fp_hash, daily_charts_used=0, daily_charts_reset_at=today
        )
        db.add(guest)
        used = 0
    elif guest.daily_charts_reset_at != today:
        guest.daily_charts_used = 0
        guest.daily_charts_reset_at = today
        used = 0
    else:
        used = guest.daily_charts_used or 0
        guest.last_seen_at = datetime.now()
    await db.commit()

    guest_limit = auth_service.GUEST_DAILY_LIMIT
    remaining = max(0, guest_limit - used)
    return {
        "guest_token": fingerprint,
        "daily_charts_used": used,
        "daily_chart_limit": guest_limit,
        "remaining": remaining,
        "allowed": remaining > 0,
    }


@router.post("/guest/check-limit")
async def guest_check_limit(data: dict, db: AsyncSession = Depends(get_db)):
    """بررسی محدودیت روزانه مهمان"""
    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        raise HTTPException(status_code=400, detail="fingerprint لازم است")

    fp_hash = _fp_hash(fingerprint)
    guest = await auth_service.get_guest_by_fingerprint(db, fp_hash)
    today = datetime.now().strftime("%Y-%m-%d")
    used = 0
    if guest and guest.daily_charts_reset_at == today:
        used = guest.daily_charts_used or 0
    await db.commit()

    guest_limit = auth_service.GUEST_DAILY_LIMIT
    return {
        "used": used,
        "limit": guest_limit,
        "remaining": max(0, guest_limit - used),
        "allowed": used < guest_limit,
    }


@router.post("/guest/increment")
async def guest_increment_usage(data: dict, db: AsyncSession = Depends(get_db)):
    """افزایش شمارنده مصرف مهمان (فقط سمت سرور)"""
    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        raise HTTPException(status_code=400, detail="fingerprint لازم است")

    fp_hash = _fp_hash(fingerprint)
    guest = await auth_service.get_guest_by_fingerprint(db, fp_hash)
    if guest is None:
        raise HTTPException(status_code=404, detail="session مهمان یافت نشد")

    today = datetime.now().strftime("%Y-%m-%d")
    guest_limit = auth_service.GUEST_DAILY_LIMIT
    if guest.daily_charts_reset_at != today:
        guest.daily_charts_used = 1
        guest.daily_charts_reset_at = today
        new_used = 1
    else:
        current = guest.daily_charts_used or 0
        if current >= guest_limit:
            raise HTTPException(status_code=429, detail="محدودیت روزانه مهمان تمام شده")
        guest.daily_charts_used = current + 1
        new_used = current + 1
    await db.commit()

    return {"status": "ok", "daily_charts_used": new_used, "daily_chart_limit": guest_limit}


@router.post("/guest/claim")
async def claim_guest_session(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """اتصال session مهمان به حساب کاربری واقعی

    وقتی کاربر مهمان login می‌کند، این endpoint فراخوانی می‌شود تا:
    1. مصرف باقی‌مانده مهمان به حساب واقعی منتقل شود
    2. session مهمان علامت‌گذاری شود که قبلاً claim شده
    """
    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        return {"status": "ok", "message": "fingerprint ارسال نشد — بدون migrated"}

    fp_hash = _fp_hash(fingerprint)
    today = datetime.now().strftime("%Y-%m-%d")
    guest = await auth_service.get_guest_by_fingerprint(db, fp_hash)

    if guest is None or guest.linked_user_id:
        return {"status": "ok", "message": "بازدید قبلاً متصل شده یا یافت نشد"}

    # Transfer guest usage to user if same day
    guest_used = 0
    if guest.daily_charts_reset_at == today:
        guest_used = guest.daily_charts_used or 0

    if guest_used > 0:
        if user.daily_charts_reset_at == today:
            user.daily_charts_used = (user.daily_charts_used or 0) + guest_used
        else:
            user.daily_charts_used = guest_used
            user.daily_charts_reset_at = today

    guest.linked_user_id = user.id
    await db.commit()
    return {"status": "claimed", "migrated_usage": guest_used}


# ============================================================
# روت‌های عمومی پلن‌ها (نمایش برای همه)
# ============================================================

@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    """لیست همه پلن‌های فعال (نمایش عمومی)"""
    plans = await auth_service.get_all_plans(db, active_only=True)
    return {
        "plans": [
            {
                "id": p.id,
                "name": p.name,
                "display_name": p.display_name,
                "price_monthly": p.price_monthly,
                "price_yearly": p.price_yearly,
                "daily_chart_limit": p.daily_chart_limit,
                "can_save_charts": bool(p.can_save_charts),
                "can_access_premium": bool(p.can_access_premium),
                "features": p.features,
                "sort_order": p.sort_order,
            }
            for p in plans
        ]
    }


@router.get("/plans/my-plan")
async def get_my_plan(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """دریافت پلن فعلی کاربر با جزئیات"""
    plan = await auth_service.get_user_plan(db, user)
    if not plan:
        return {"plan": None, "message": "پلن یافت نشد"}
    return {
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "display_name": plan.display_name,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "daily_chart_limit": plan.daily_chart_limit,
            "can_save_charts": bool(plan.can_save_charts),
            "can_access_premium": bool(plan.can_access_premium),
            "features": plan.features,
        },
        "daily_usage": await auth_service.check_daily_limit(db, user.id),
    }


# ============================================================
# روت‌های ادمین: مدیریت پلن‌ها (CRUD)
# ============================================================

@router.get("/admin/plans")
async def admin_list_all_plans(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """لیست همه پلن‌ها (فعال و غیرفعال) — فقط ادمین"""
    plans = await auth_service.get_all_plans(db, active_only=False)
    return {"plans": [auth_service.plan_response_dict(p) for p in plans]}


@router.post("/admin/plans", response_model=PlanResponse)
async def admin_create_plan(data: PlanCreate, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """ساخت پلن جدید — فقط ادمین"""
    existing = await auth_service.get_plan_by_name(db, data.name)
    if existing:
        raise HTTPException(status_code=409, detail=f"پلن با نام '{data.name}' از قبل وجود دارد")
    plan = await auth_service.create_plan(db, data.model_dump())
    await db.commit()
    return PlanResponse(**auth_service.plan_response_dict(plan))


@router.put("/admin/plans/{plan_id}", response_model=PlanResponse)
async def admin_update_plan(plan_id: int, data: PlanUpdate, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """ویرایش پلن — فقط ادمین

    فیلدهای قابل ویرایش: display_name, price_monthly, price_yearly,
    daily_chart_limit, can_save_charts, can_access_premium,
    premium_paths, features, is_active, sort_order
    """
    update_data = data.model_dump(exclude_unset=True)
    plan = await auth_service.update_plan(db, plan_id, update_data)
    if not plan:
        raise HTTPException(status_code=404, detail="پلن یافت نشد")
    await db.commit()
    return PlanResponse(**auth_service.plan_response_dict(plan))


@router.delete("/admin/plans/{plan_id}")
async def admin_delete_plan(plan_id: int, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """حذف پلن — فقط ادمین (اگر کاربری روی آن نباشد)"""
    plan = await auth_service.get_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="پلن یافت نشد")
    deleted = await auth_service.delete_plan(db, plan_id)
    if not deleted:
        raise HTTPException(
            status_code=409,
            detail="این پلن قابل حذف نیست — کاربرانی روی آن هستند. ابتدا کاربران را به پلن دیگری منتقل کنید.",
        )
    await db.commit()
    return {"status": "deleted", "plan_name": plan.name}


# ============================================================
# روت‌های ادمین: مدیریت کاربران
# ============================================================

@router.get("/admin/users")
async def admin_list_users(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db), limit: int = 100):
    """لیست همه کاربران به همراه محدودیت پلن — فقط ادمین"""
    rows = (
        await db.execute(select(User).order_by(User.created_at.desc()).limit(limit))
    ).scalars().all()
    users = []
    for u in rows:
        plan = await auth_service.get_plan_by_name(db, u.plan or "free")
        users.append(
            {
                "id": u.id,
                "email": u.email,
                "display_name": u.display_name or "",
                "plan": u.plan or "free",
                "is_admin": bool(u.is_admin),
                "daily_charts_used": u.daily_charts_used or 0,
                "daily_charts_reset_at": u.daily_charts_reset_at or "",
                "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else "",
                "daily_chart_limit": plan.daily_chart_limit if plan else 10,
                "plan_display_name": plan.display_name if plan else (u.plan or "free"),
            }
        )
    return {"users": users}


@router.post("/admin/create-user", response_model=UserResponse)
async def admin_create_user(data: AdminCreateUser, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """ساخت کاربر جدید توسط ادمین — با امکان تنظیم پلن و دسترسی ادمین

    - **email**: ایمیل کاربر (باید یکتا باشد)
    - **password**: رمز عبور (حداقل ۶ کاراکتر)
    - **display_name**: نام نمایشی (اختیاری)
    - **plan**: نام پلن (پیش‌فرض: free)
    - **is_admin**: آیا کاربر ادمین باشد (پیش‌فرض: false)
    """
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")
    if "@" not in data.email or "." not in data.email:
        raise HTTPException(status_code=400, detail="ایمیل نامعتبر است")

    # چک کن پلن وجود داشته باشد
    plan = await auth_service.get_plan_by_name(db, data.plan)
    if not plan:
        raise HTTPException(status_code=404, detail=f"پلن '{data.plan}' یافت نشد")

    from app.models import User

    email = data.email.lower().strip()
    existing = (
        await db.execute(select(User.id).where(User.email == email).limit(1))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="این ایمیل قبلاً ثبت شده")

    user = User(
        email=email,
        password_hash=auth_service.hash_password(data.password),
        display_name=data.display_name or email.split("@")[0],
        plan=data.plan,
        is_admin=bool(data.is_admin),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _user_response(user)


@router.put("/admin/users/{user_id}/plan")
async def admin_change_user_plan(user_id: int, data: dict, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """تغییر پلن یک کاربر — فقط ادمین

    بدنه: {"plan": "gold"} یا {"plan": "diamond"}
    """
    plan_name = data.get("plan")
    if not plan_name:
        raise HTTPException(status_code=400, detail="نام پلن لازم است")
    plan = await auth_service.get_plan_by_name(db, plan_name)
    if not plan:
        raise HTTPException(status_code=404, detail=f"پلن '{plan_name}' یافت نشد")
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    user.plan = plan_name
    await db.commit()
    return {"status": "updated", "user_id": user_id, "plan": plan_name}


@router.put("/admin/users/{user_id}/admin")
async def admin_toggle_user_admin(user_id: int, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """تغییر وضعیت ادمین یک کاربر — فقط ادمین

    فلگ is_admin را toggle می‌کند. ادمین نمی‌تواند خودش را از ادمینی خارج کند.
    """
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    # جلوگیری از خروج ادمین جاری از وضعیت ادمین
    if user.id == admin.id and user.is_admin:
        raise HTTPException(status_code=400, detail="نمی‌توانید وضعیت ادمین خودتان را تغییر دهید")

    new_status = not user.is_admin
    user.is_admin = new_status
    await db.commit()
    return {"status": "updated", "user_id": user_id, "is_admin": bool(new_status)}


@router.put("/admin/users/{user_id}/reset-usage")
async def admin_reset_user_usage(user_id: int, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """ریست مصرف روزانه یک کاربر — فقط ادمین"""
    from app.models import User

    today = datetime.now().strftime("%Y-%m-%d")
    result = await db.execute(
        User.__table__.update()
        .where(User.id == user_id)
        .values(daily_charts_used=0, daily_charts_reset_at=today)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return {"status": "reset", "user_id": user_id}


@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def admin_edit_user(user_id: int, data: AdminUserEdit, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """ویرایش کاربر توسط ادمین — پلن، فلگ ادمین، نام نمایشی

    - **plan**: نام پلن معتبر (404 اگر وجود نداشته باشد)
    - **is_admin**: ارتقا/تنزل دسترسی ادمین
    - **display_name**: نام نمایشی جدید

    ادمین نمی‌تواند فلگ ادمین خودش را تغییر دهد.
    """
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    if data.is_admin is not None and user.id == admin.id:
        raise HTTPException(status_code=400, detail="نمی‌توانید وضعیت ادمین خودتان را تغییر دهید")

    if data.plan:
        plan = await auth_service.get_plan_by_name(db, data.plan)
        if not plan:
            raise HTTPException(status_code=404, detail=f"پلن '{data.plan}' یافت نشد")

    if data.plan:
        user.plan = data.plan
    if data.is_admin is not None:
        user.is_admin = data.is_admin
    if data.display_name is not None:
        user.display_name = data.display_name.strip()
    await db.commit()
    await db.refresh(user)
    return _user_response(user)


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """حذف کاربر توسط ادمین — ادمین نمی‌تواند خودش را حذف کند"""
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="نمی‌توانید خودتان را حذف کنید")
    await db.delete(user)
    await db.commit()
    return {"status": "deleted"}


@router.post("/admin/users/{user_id}/reset-usage")
async def admin_reset_user_usage_post(user_id: int, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """صفر کردن مصرف روزانه چارت یک کاربر — فقط ادمین"""
    from app.models import User

    result = await db.execute(
        User.__table__.update()
        .where(User.id == user_id)
        .values(daily_charts_used=0)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return {"daily_charts_used": 0}


# ============================================================
# روت‌های ادمین: آمار کلی مصرف
# ============================================================

@router.get("/admin/stats")
async def admin_stats(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """آمار کلی کاربران — فقط ادمین"""
    from app.models import User

    total_users = (
        await db.execute(select(func.count()).select_from(User))
    ).scalar_one()
    total_admins = (
        await db.execute(select(func.count()).select_from(User).where(User.is_admin.is_(True)))
    ).scalar_one()
    plan_rows = (
        await db.execute(
            select(User.plan, func.count()).group_by(User.plan).order_by(func.count().desc())
        )
    ).all()

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "per_plan": [{"plan": name, "count": count} for name, count in plan_rows],
    }


@router.get("/admin/usage-stats")
async def admin_usage_stats(admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """آمار کلی مصرف تمام کاربران — فقط ادمین"""
    from app.models import Plan, User

    total_users = (
        await db.execute(select(func.count()).select_from(User))
    ).scalar_one()

    user_rows = (
        await db.execute(
            select(User.plan, User.daily_charts_used)
        )
    ).all()
    plans = await auth_service.get_all_plans(db, active_only=True)
    plan_by_name = {p.name: p for p in plans}

    per_plan: dict = {}
    for plan_name, used in user_rows:
        entry = per_plan.setdefault(
            plan_name,
            {
                "plan_label": (plan_by_name[plan_name].display_name if plan_name in plan_by_name else plan_name),
                "plan_key": plan_name,
                "user_count": 0,
                "total_used": 0,
                "plan_limit": (plan_by_name[plan_name].daily_chart_limit if plan_name in plan_by_name else 10),
            },
        )
        entry["user_count"] += 1
        entry["total_used"] += used or 0
    plans_breakdown = sorted(per_plan.values(), key=lambda p: p["user_count"], reverse=True)

    today = datetime.now().strftime("%Y-%m-%d")
    active_today = (
        await db.execute(
            select(func.count()).select_from(User).where(
                User.daily_charts_used > 0, User.daily_charts_reset_at == today
            )
        )
    ).scalar_one()
    total_used = sum(p["total_used"] for p in plans_breakdown)

    return {
        "total_users": total_users,
        "total_used": total_used,
        "active_today": active_today,
        "plans": plans_breakdown,
    }


# ─── Endpoint: Seed / Promote Admin ───

ADMIN_SEED_SECRET = "cosmic-admin-seed-2024"


@router.post("/seed-admin")
async def seed_admin_user(data: dict, db: AsyncSession = Depends(get_db)):
    """ایجاد یا ارتقای کاربر ادمین پیش‌فرض

    این endpoint بدون نیاز به احراز هویت کار می‌کند و برای راه‌اندازی اولیه سیستم طراحی شده.

    - **secret**: رمز مخفی (پیش‌فرض: cosmic-admin-seed-2024)
    - **email**: ایمیل ادمین (پیش‌فرض: admin@cosmic.ir)
    - **password**: رمز عبور ادمین (پیش‌فرض: admin123)
    """
    from app.models import User

    secret = data.get("secret", "")
    if secret != ADMIN_SEED_SECRET:
        raise HTTPException(status_code=403, detail="رمز مخفی اشتباه است")

    email = (data.get("email", "admin@cosmic.ir") or "admin@cosmic.ir").lower().strip()
    password = data.get("password", "admin123") or "admin123"

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")

    user = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()

    if user:
        # User exists — promote to admin if not already
        if user.is_admin:
            return {
                "status": "already_admin",
                "message": f"کاربر {email} قبلاً ادمین است",
                "user_id": user.id,
            }
        user.is_admin = True
        await db.commit()
        return {
            "status": "promoted",
            "message": f"کاربر {email} به ادمین ارتقا یافت",
            "user_id": user.id,
        }

    # User doesn't exist — create as admin
    user = User(
        email=email,
        password_hash=auth_service.hash_password(password),
        display_name="مدیر سیستم",
        plan="pro",
        is_admin=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {
        "status": "created",
        "message": f"کاربر ادمین {email} با موفقیت ایجاد شد",
        "user_id": user.id,
        "email": email,
        "password": password,
    }