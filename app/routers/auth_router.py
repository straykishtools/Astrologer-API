# app/routers/auth_router.py
"""
روت‌های احراز هویت: ثبت‌نام، ورود، پروفایل، ذخیره/دریافت چارت
"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.models import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    SaveChartRequest,
    ChartResponse,
    PlanCreate,
    PlanResponse,
    PlanUpdate,
    AdminCreateUser,
    create_user,
    create_user_admin,
    ChangePassword,
    change_password,
    authenticate_user,
    get_user_by_id,
    create_access_token,
    decode_token,
    check_daily_limit,
    increment_daily_usage,
    save_chart as db_save_chart,
    get_user_charts,
    delete_chart,
    init_db,
    get_all_plans,
    get_plan_by_name,
    get_plan_by_id,
    create_plan,
    update_plan,
    delete_plan,
    get_user_plan,
)

router = APIRouter(prefix="/api/v5/auth", tags=["Auth"])

# ─── ساخت دیتابیس موقع شروع ───
init_db()


# ─── Dependency: دریافت کاربر جاری از توکن ───

def get_current_user(authorization: Optional[str] = Header(None)):
    """از هدر Authorization توکن JWT رو بخون و کاربر رو برگردون"""
    if not authorization:
        raise HTTPException(status_code=401, detail="لطفاً وارد شوید")

    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="توکن نامعتبر یا منقضی شده")

    user = get_user_by_id(payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="کاربر یافت نشد")

    return user


def get_admin_user(user=Depends(get_current_user)):
    """فقط ادمین دسترسی داره"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="دسترسی مخصوص ادمین")
    return user


# ─── روت‌های احراز هویت ───

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister):
    """ثبت‌نام کاربر جدید"""
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")

    if "@" not in data.email or "." not in data.email:
        raise HTTPException(status_code=400, detail="ایمیل نامعتبر است")

    user = create_user(data.email, data.password, data.display_name or "")
    if not user:
        raise HTTPException(status_code=409, detail="این ایمیل قبلاً ثبت شده")

    token = create_access_token({"user_id": user["id"], "email": user["email"]})

    # Provision the Cosmic Oracle database row + send the verification email.
    try:
        from app.services.auth_service import provision_user_sync
        from app.services.email_service import send_verification_email

        _, v_token = provision_user_sync(data.email, data.display_name, data.password)
        if v_token:
            send_verification_email(data.email, v_token)
    except Exception:
        # Email/DB provisioning is best-effort — never block registration on it.
        pass

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            display_name=user["display_name"],
            plan=user["plan"],
            is_admin=bool(user.get("is_admin")),
            created_at=user["created_at"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin):
    """ورود کاربر"""
    user = authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="ایمیل یا رمز عبور اشتباه است")

    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            display_name=user["display_name"],
            plan=user["plan"],
            is_admin=bool(user.get("is_admin")),
            created_at=user["created_at"],
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user)):
    """دریافت اطلاعات کاربر جاری"""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        display_name=user["display_name"],
        plan=user["plan"],
        is_admin=bool(user.get("is_admin")),
        created_at=user["created_at"],
    )


@router.get("/daily-limit")
def get_daily_limit(user=Depends(get_current_user)):
    """چک کردن محدودیت روزانه"""
    return check_daily_limit(user["id"])


@router.get("/usage")
def get_usage_stats(user=Depends(get_current_user)):
    """آمار لحظه‌ای مصرف چارت بر اساس پلن کاربر"""
    from app.models import get_db
    conn = get_db()
    u = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    conn.close()
    if not u:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    limit_info = check_daily_limit(user["id"])
    plan_name = u["plan"]

    # Get plan details
    conn2 = get_db()
    plan_row = conn2.execute(
        "SELECT * FROM plans WHERE name = ? AND is_active = 1",
        (plan_name,),
    ).fetchone()
    conn2.close()

    plan_details = {}
    if plan_row:
        plan_details = {
            "name": plan_row["name"],
            "display_name": plan_row["display_name"],
            "daily_chart_limit": plan_row["daily_chart_limit"],
            "can_save_charts": bool(plan_row["can_save_charts"]),
            "can_access_premium": bool(plan_row["can_access_premium"]),
        }

    return {
        "used": limit_info["used"],
        "limit": limit_info["limit"],
        "remaining": limit_info["remaining"],
        "allowed": limit_info["allowed"],
        "plan": plan_name,
        "plan_details": plan_details,
        "is_admin": bool(u["is_admin"]),
        "reset_at": u["daily_charts_reset_at"],
    }


# ─── روت‌های ذخیره چارت (فقط کاربران ویژه) ───

@router.post("/charts/save", response_model=ChartResponse)
def save_chart_endpoint(data: SaveChartRequest, user=Depends(get_current_user)):
    """ذخیره چارت (بر اساس پلن کاربر)"""
    plan = get_user_plan(user["id"])
    if not plan or not plan["can_save_charts"]:
        raise HTTPException(status_code=403, detail="ذخیره چارت در پلن شما فعال نیست. اشتراک خود را ارتقا دهید.")

    chart = db_save_chart(
        user_id=user["id"],
        chart_type=data.chart_type,
        title=data.title or "",
        input_data=data.input_data,
        result_data=data.result_data,
    )
    return ChartResponse(
        id=chart["id"],
        chart_type=chart["chart_type"],
        title=chart["title"],
        input_data=chart["input_data"],
        result_data=chart["result_data"],
        created_at=chart["created_at"],
    )


@router.get("/charts")
def get_charts(user=Depends(get_current_user)):
    """لیست چارت‌های ذخیره‌شده"""
    plan = get_user_plan(user["id"])
    if not plan or not plan["can_save_charts"]:
        return {"charts": [], "message": "برای ذخیره چارت، اشتراک خود را ارتقا دهید"}

    return {"charts": get_user_charts(user["id"])}


@router.put("/change-password")
def change_user_password(data: ChangePassword, user=Depends(get_current_user)):
    """تغییر رمز عبور

    - **current_password**: رمز عبور امروزی
    - **new_password**: رمز جدید (حداقل 6 کاراکتر)
    """
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل 6 کاراکتر باشد")
    ok = change_password(user["id"], data.current_password, data.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="رمز عبور امروزی اشتباه است")
    return {"status": "ok", "message": "رمز عبور تغییر کرد"}


from sqlalchemy.ext.asyncio import AsyncSession as _AsyncSession
from app.config.database import SessionLocal as _SessionLocal, get_db as _get_db
from app.schemas.user import UserOut as _UserOut


@router.post("/forgot-password")
async def forgot_password(data: dict):
    """درخواست بازیابی رمز عبور

    همیشه پیام موفقیت برمی‌گرداند (حتی اگر ایمیل وجود نداشته باشد)
    تا اطلاعات کاربر فاش نشود. در حالت توسعه، لینک بازیابی در کنسول چاپ می‌شود.
    """
    email = (data.get("email") or "").lower().strip()
    if not email or "@" not in email:
        return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک بازیابی ارسال شد."}

    from app.services.auth_service import ensure_user, issue_verification_token
    from app.services.email_service import send_password_reset_email

    async with _SessionLocal() as db:
        # Provision a matching row (no-op when it already exists) so any
        # registered email can be verified/reset — enumeration-safe.
        user = await ensure_user(db, email)
        try:
            token = await issue_verification_token(db, user)
            await db.commit()
            send_password_reset_email(email, token)
        except Exception:
            # Never fail the request; the response is always generic anyway.
            pass

    return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک بازیابی ارسال شد."}


@router.post("/verify-email")
async def verify_email(data: dict, db: _AsyncSession = Depends(_get_db)):
    """تأیید ایمیل با توکن ارسال‌شده (۲۴ ساعت معتبر)"""
    from app.services.auth_service import verify_email_token

    token = (data.get("token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="توکن لازم است")
    user = await verify_email_token(db, token)
    await db.commit()
    return {
        "status": "ok",
        "email_verified": True,
        "user": _UserOut.model_validate(user).model_dump(mode="json"),
    }


@router.post("/resend-verification")
async def resend_verification(data: dict):
    """ارسال مجدد لینک تأیید ایمیل (بدون افشای وجود ایمیل)"""
    from app.services.auth_service import ensure_user, issue_verification_token
    from app.services.email_service import send_verification_email

    email = (data.get("email") or "").lower().strip()
    if not email or "@" not in email:
        return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک تأیید ارسال شد."}

    async with _SessionLocal() as db:
        user = await ensure_user(db, email)
        try:
            token = await issue_verification_token(db, user)
            await db.commit()
            send_verification_email(email, token)
        except Exception:
            pass

    return {"status": "ok", "message": "اگر ایمیل معتبری وارد کرده باشید، لینک تأیید ارسال شد."}


@router.get("/dev/emails")
def dev_email_inbox():
    """لیست ایمیل‌های اخیر صادرشده (فقط محیط توسعه/تست).

    جایگزین خراشیدن لاگ کنسول: پیام‌های تأیید ایمیل و بازیابی رمز در حافظه
    نگه‌داری و از اینجا قابل مشاهده هستند. در محیط production غیرفعال است.
    """
    import os as _os

    if _os.getenv("ENV_TYPE") == "production":
        raise HTTPException(status_code=404, detail="این مسیر فقط در محیط توسعه فعال است")
    from app.services.email_service import get_inbox

    return {"status": "ok", "count": len(get_inbox()), "emails": get_inbox()}


@router.post("/reset-password")
async def reset_password(data: dict, db: _AsyncSession = Depends(_get_db)):
    """تعیین رمز عبور جدید با توکن بازیابی (۲۴ ساعت معتبر)"""
    from app.services.auth_service import reset_password_with_token

    token = (data.get("token") or "").strip()
    new_password = data.get("new_password") or ""
    if not token:
        raise HTTPException(status_code=400, detail="توکن لازم است")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")

    await reset_password_with_token(db, token, new_password)
    await db.commit()
    return {"status": "ok", "message": "رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید."}


# ============================================================
# روت‌های کاربر مهمان: هویت سمت سرور + quota
# ============================================================

import secrets
import hashlib


def _generate_guest_token():
    """تولید یک guest identifier یکتا از ترکیب fingerprint سمت کلاینت + random salt"""
    return secrets.token_urlsafe(32)


@router.post("/guest-session")
def create_guest_session(data: dict):
    """ایجاد یا بازیابی session مهمان

    سمت کلاینت یک "fingerprint" (ترکیب user-agent + یک رشته تصادفی ذخیره‌شده در localStorage)
    ارسال می‌شود. سرور بر اساس آن یک هویت مهمان server-side ایجاد می‌کند.
    """
    from app.models import get_db

    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        fingerprint = _generate_guest_token()

    # Hash the fingerprint for privacy (don't store raw browser fingerprint)
    fp_hash = hashlib.sha256(fingerprint.encode()).hexdigest()[:48]

    conn = get_db()

    # Ensure guest_sessions table exists
    conn.execute("""
        CREATE TABLE IF NOT EXISTS guest_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint_hash TEXT UNIQUE NOT NULL,
            daily_charts_used INTEGER DEFAULT 0,
            daily_charts_reset_at TEXT DEFAULT '',
            linked_user_id INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            last_seen_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()

    guest = conn.execute(
        "SELECT * FROM guest_sessions WHERE fingerprint_hash = ?",
        (fp_hash,),
    ).fetchone()

    today = datetime.now().strftime("%Y-%m-%d")

    if guest:
        # Check if daily reset needed
        if guest["daily_charts_reset_at"] != today:
            conn.execute(
                "UPDATE guest_sessions SET daily_charts_used = 0, daily_charts_reset_at = ?, last_seen_at = datetime('now') WHERE id = ?",
                (today, guest["id"]),
            )
            conn.commit()
            used = 0
        else:
            used = guest["daily_charts_used"] or 0
            conn.execute(
                "UPDATE guest_sessions SET last_seen_at = datetime('now') WHERE id = ?",
                (guest["id"],),
            )
            conn.commit()
    else:
        # New guest
        conn.execute(
            "INSERT INTO guest_sessions (fingerprint_hash, daily_charts_used, daily_charts_reset_at) VALUES (?, 0, ?)",
            (fp_hash, today),
        )
        conn.commit()
        used = 0

    conn.close()

    # Guest plan: free with 5 charts per day
    guest_limit = 5
    remaining = max(0, guest_limit - used)

    return {
        "guest_token": fingerprint,
        "daily_charts_used": used,
        "daily_chart_limit": guest_limit,
        "remaining": remaining,
        "allowed": remaining > 0,
    }


@router.post("/guest/check-limit")
def guest_check_limit(data: dict):
    """بررسی محدودیت روزانه مهمان"""
    from app.models import get_db

    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        raise HTTPException(status_code=400, detail="fingerprint لازم است")

    fp_hash = hashlib.sha256(fingerprint.encode()).hexdigest()[:48]
    conn = get_db()
    guest = conn.execute(
        "SELECT * FROM guest_sessions WHERE fingerprint_hash = ?",
        (fp_hash,),
    ).fetchone()
    conn.close()

    today = datetime.now().strftime("%Y-%m-%d")
    used = 0
    if guest and guest["daily_charts_reset_at"] == today:
        used = guest["daily_charts_used"] or 0

    guest_limit = 5
    return {
        "used": used,
        "limit": guest_limit,
        "remaining": max(0, guest_limit - used),
        "allowed": used < guest_limit,
    }


@router.post("/guest/increment")
def guest_increment_usage(data: dict):
    """افزایش شمارنده مصرف مهمان (فقط سمت سرور)"""
    from app.models import get_db

    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        raise HTTPException(status_code=400, detail="fingerprint لازم است")

    fp_hash = hashlib.sha256(fingerprint.encode()).hexdigest()[:48]
    today = datetime.now().strftime("%Y-%m-%d")
    conn = get_db()
    guest = conn.execute(
        "SELECT * FROM guest_sessions WHERE fingerprint_hash = ?",
        (fp_hash,),
    ).fetchone()

    if not guest:
        conn.close()
        raise HTTPException(status_code=404, detail="session مهمان یافت نشد")

    if guest["daily_charts_reset_at"] != today:
        conn.execute(
            "UPDATE guest_sessions SET daily_charts_used = 1, daily_charts_reset_at = ? WHERE id = ?",
            (today, guest["id"]),
        )
        new_used = 1
    else:
        current = guest["daily_charts_used"] or 0
        guest_limit = 5
        if current >= guest_limit:
            conn.close()
            raise HTTPException(status_code=429, detail="محدودیت روزانه مهمان تمام شده")
        conn.execute(
            "UPDATE guest_sessions SET daily_charts_used = ? WHERE id = ?",
            (current + 1, guest["id"]),
        )
        new_used = current + 1

    conn.commit()
    conn.close()

    return {"status": "ok", "daily_charts_used": new_used, "daily_chart_limit": 5}


@router.post("/guest/claim")
def claim_guest_session(data: dict, user=Depends(get_current_user)):
    """اتصال session مهمان به حساب کاربری واقعی

    وقتی کاربر مهمان login می‌کند، این endpoint فراخوانی می‌شود تا:
    1. مصرف باقی‌مانده مهمان به حساب واقعی منتقل شود
    2. session مهمان علامت‌گذاری شود که قبلاً claim شده
    """
    from app.models import get_db

    fingerprint = (data.get("fingerprint") or "").strip()
    if not fingerprint:
        return {"status": "ok", "message": "fingerprint ارسال نشد — بدون migrated"}

    fp_hash = hashlib.sha256(fingerprint.encode()).hexdigest()[:48]
    today = datetime.now().strftime("%Y-%m-%d")
    conn = get_db()

    guest = conn.execute(
        "SELECT * FROM guest_sessions WHERE fingerprint_hash = ?",
        (fp_hash,),
    ).fetchone()

    if not guest or guest["linked_user_id"]:
        conn.close()
        return {"status": "ok", "message": "بازدید قبلاً متصل شده یا یافت نشد"}

    # Transfer guest usage to user if same day
    guest_used = 0
    if guest["daily_charts_reset_at"] == today:
        guest_used = guest["daily_charts_used"] or 0

    if guest_used > 0:
        user_row = conn.execute("SELECT daily_charts_used, daily_charts_reset_at FROM users WHERE id = ?", (user["id"],)).fetchone()
        if user_row:
            if user_row["daily_charts_reset_at"] == today:
                new_used = (user_row["daily_charts_used"] or 0) + guest_used
            else:
                new_used = guest_used
            conn.execute(
                "UPDATE users SET daily_charts_used = ?, daily_charts_reset_at = ? WHERE id = ?",
                (new_used, today, user["id"]),
            )

    # Mark guest as linked
    conn.execute(
        "UPDATE guest_sessions SET linked_user_id = ? WHERE id = ?",
        (user["id"], guest["id"]),
    )
    conn.commit()
    conn.close()

    return {"status": "claimed", "migrated_usage": guest_used}


@router.delete("/charts/{chart_id}")
def delete_chart_endpoint(chart_id: int, user=Depends(get_current_user)):
    """حذف چارت ذخیره‌شده"""
    deleted = delete_chart(chart_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="چارت یافت نشد")
    return {"status": "deleted"}


# ============================================================
# روت‌های عمومی پلن‌ها (نمایش برای همه)
# ============================================================

@router.get("/plans")
def list_plans():
    """لیست همه پلن‌های فعال (نمایش عمومی)"""
    plans = get_all_plans(active_only=True)
    return {
        "plans": [
            {
                "id": p["id"],
                "name": p["name"],
                "display_name": p["display_name"],
                "price_monthly": p["price_monthly"],
                "price_yearly": p["price_yearly"],
                "daily_chart_limit": p["daily_chart_limit"],
                "can_save_charts": bool(p["can_save_charts"]),
                "can_access_premium": bool(p["can_access_premium"]),
                "features": p["features"],
                "sort_order": p["sort_order"],
            }
            for p in plans
        ]
    }


@router.get("/plans/my-plan")
def get_my_plan(user=Depends(get_current_user)):
    """دریافت پلن فعلی کاربر با جزئیات"""
    plan = get_user_plan(user["id"])
    if not plan:
        return {"plan": None, "message": "پلن یافت نشد"}
    return {
        "plan": {
            "id": plan["id"],
            "name": plan["name"],
            "display_name": plan["display_name"],
            "price_monthly": plan["price_monthly"],
            "price_yearly": plan["price_yearly"],
            "daily_chart_limit": plan["daily_chart_limit"],
            "can_save_charts": bool(plan["can_save_charts"]),
            "can_access_premium": bool(plan["can_access_premium"]),
            "features": plan["features"],
        },
        "daily_usage": check_daily_limit(user["id"]),
    }


# ============================================================
# روت‌های ادمین: مدیریت پلن‌ها (CRUD)
# ============================================================

@router.get("/admin/plans")
def admin_list_all_plans(admin=Depends(get_admin_user)):
    """لیست همه پلن‌ها (فعال و غیرفعال) — فقط ادمین"""
    plans = get_all_plans(active_only=False)
    return {"plans": [dict(p) for p in plans]}


@router.post("/admin/plans", response_model=PlanResponse)
def admin_create_plan(data: PlanCreate, admin=Depends(get_admin_user)):
    """ساخت پلن جدید — فقط ادمین"""
    existing = get_plan_by_name(data.name)
    if existing:
        raise HTTPException(status_code=409, detail=f"پلن با نام '{data.name}' از قبل وجود دارد")
    plan = create_plan(data.model_dump())
    return PlanResponse(**plan)


@router.put("/admin/plans/{plan_id}", response_model=PlanResponse)
def admin_update_plan(plan_id: int, data: PlanUpdate, admin=Depends(get_admin_user)):
    """ویرایش پلن — فقط ادمین
    
    فیلدهای قابل ویرایش: display_name, price_monthly, price_yearly,
    daily_chart_limit, can_save_charts, can_access_premium,
    premium_paths, features, is_active, sort_order
    """
    update_data = data.model_dump(exclude_unset=True)
    plan = update_plan(plan_id, update_data)
    if not plan:
        raise HTTPException(status_code=404, detail="پلن یافت نشد")
    return PlanResponse(**plan)


@router.delete("/admin/plans/{plan_id}")
def admin_delete_plan(plan_id: int, admin=Depends(get_admin_user)):
    """حذف پلن — فقط ادمین (اگر کاربری روی آن نباشد)"""
    plan = get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="پلن یافت نشد")
    deleted = delete_plan(plan_id)
    if not deleted:
        raise HTTPException(
            status_code=409,
            detail="این پلن قابل حذف نیست — کاربرانی روی آن هستند. ابتدا کاربران را به پلن دیگری منتقل کنید.",
        )
    return {"status": "deleted", "plan_name": plan["name"]}


# ============================================================
# روت‌های ادمین: مدیریت کاربران
# ============================================================

@router.get("/admin/users")
def admin_list_users(admin=Depends(get_admin_user), limit: int = 100):
    """لیست همه کاربران به همراه محدودیت پلن — فقط ادمین"""
    from app.models import get_db
    conn = get_db()
    users = conn.execute(
        """
        SELECT u.id, u.email, u.display_name, u.plan, u.is_admin,
               u.daily_charts_used, u.daily_charts_reset_at, u.created_at,
               COALESCE(p.daily_chart_limit, 10) AS daily_chart_limit,
               COALESCE(p.display_name, u.plan) AS plan_display_name
        FROM users u
        LEFT JOIN plans p ON u.plan = p.name AND p.is_active = 1
        ORDER BY u.created_at DESC LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return {"users": [dict(u) for u in users]}


@router.post("/admin/create-user", response_model=UserResponse)
def admin_create_user(data: AdminCreateUser, admin=Depends(get_admin_user)):
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
    plan = get_plan_by_name(data.plan)
    if not plan:
        raise HTTPException(status_code=404, detail=f"پلن '{data.plan}' یافت نشد")
    
    user = create_user_admin(
        email=data.email,
        password=data.password,
        display_name=data.display_name or "",
        plan=data.plan,
        is_admin=data.is_admin,
    )
    if not user:
        raise HTTPException(status_code=409, detail="این ایمیل قبلاً ثبت شده")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        display_name=user["display_name"],
        plan=user["plan"],
        is_admin=bool(user.get("is_admin")),
        created_at=user["created_at"],
    )


@router.put("/admin/users/{user_id}/plan")
def admin_change_user_plan(user_id: int, data: dict, admin=Depends(get_admin_user)):
    """تغییر پلن یک کاربر — فقط ادمین
    
    بدنه: {"plan": "gold"} یا {"plan": "diamond"}
    """
    plan_name = data.get("plan")
    if not plan_name:
        raise HTTPException(status_code=400, detail="نام پلن لازم است")
    plan = get_plan_by_name(plan_name)
    if not plan:
        raise HTTPException(status_code=404, detail=f"پلن '{plan_name}' یافت نشد")
    from app.models import get_db
    conn = get_db()
    cursor = conn.execute("UPDATE users SET plan = ? WHERE id = ?", (plan_name, user_id))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return {"status": "updated", "user_id": user_id, "plan": plan_name}


@router.put("/admin/users/{user_id}/admin")
def admin_toggle_user_admin(user_id: int, admin=Depends(get_admin_user)):
    """تغییر وضعیت ادمین یک کاربر — فقط ادمین

    فلگ is_admin را toggle می‌کند. ادمین نمی‌تواند خودش را از ادمینی خارج کند.
    """
    from app.models import get_db
    conn = get_db()
    user = conn.execute("SELECT id, is_admin FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    # جلوگیری از خروج ادمین جاری از وضعیت ادمین
    if user["id"] == admin["id"] and user["is_admin"]:
        conn.close()
        raise HTTPException(status_code=400, detail="نمی‌توانید وضعیت ادمین خودتان را تغییر دهید")

    new_status = 0 if user["is_admin"] else 1
    conn.execute("UPDATE users SET is_admin = ? WHERE id = ?", (new_status, user_id))
    conn.commit()
    conn.close()
    return {"status": "updated", "user_id": user_id, "is_admin": bool(new_status)}


@router.put("/admin/users/{user_id}/reset-usage")
def admin_reset_user_usage(user_id: int, admin=Depends(get_admin_user)):
    """ریست مصرف روزانه یک کاربر — فقط ادمین"""
    from app.models import get_db
    today = datetime.now().strftime("%Y-%m-%d")
    conn = get_db()
    cursor = conn.execute(
        "UPDATE users SET daily_charts_used = 0, daily_charts_reset_at = ? WHERE id = ?",
        (today, user_id),
    )
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return {"status": "reset", "user_id": user_id}


# ============================================================
# روت‌های ادمین: آمار کلی مصرف
# ============================================================

@router.get("/admin/usage-stats")
def admin_usage_stats(admin=Depends(get_admin_user)):
    """آمار کلی مصرف تمام کاربران — فقط ادمین"""
    from app.models import get_db
    conn = get_db()

    # Total users
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]

    # Users per plan
    plan_rows = conn.execute(
        """
        SELECT COALESCE(p.display_name, u.plan) AS plan_label,
               u.plan AS plan_key,
               COUNT(*) AS user_count,
               SUM(COALESCE(u.daily_charts_used, 0)) AS total_used,
               COALESCE(MAX(p.daily_chart_limit), 10) AS plan_limit
        FROM users u
        LEFT JOIN plans p ON u.plan = p.name AND p.is_active = 1
        GROUP BY u.plan
        ORDER BY user_count DESC
        """
    ).fetchall()
    plans_breakdown = [dict(r) for r in plan_rows]

    # Overall totals
    total_used = sum(p["total_used"] for p in plans_breakdown)
    active_today = conn.execute(
        "SELECT COUNT(*) FROM users WHERE daily_charts_used > 0 AND daily_charts_reset_at = ?",
        (datetime.now().strftime("%Y-%m-%d"),),
    ).fetchone()[0]

    conn.close()
    return {
        "total_users": total_users,
        "total_used": total_used,
        "active_today": active_today,
        "plans": plans_breakdown,
    }


# ─── Endpoint: Seed / Promote Admin ───

ADMIN_SEED_SECRET = "cosmic-admin-seed-2024"


@router.post("/seed-admin")
def seed_admin_user(data: dict):
    """ایجاد یا ارتقای کاربر ادمین پیش‌فرض

    این endpoint بدون نیاز به احراز هویت کار می‌کند و برای راه‌اندازی اولیه سیستم طراحی شده.

    - **secret**: رمز مخفی (پیش‌فرض: cosmic-admin-seed-2024)
    - **email**: ایمیل ادمین (پیش‌فرض: admin@cosmic.ir)
    - **password**: رمز عبور ادمین (پیش‌فرض: admin123)
    """
    from app.models import get_db, hash_password

    secret = data.get("secret", "")
    if secret != ADMIN_SEED_SECRET:
        raise HTTPException(status_code=403, detail="رمز مخفی اشتباه است")

    email = data.get("email", "admin@cosmic.ir")
    password = data.get("password", "admin123")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور باید حداقل ۶ کاراکتر باشد")

    conn = get_db()
    user = conn.execute("SELECT id, is_admin FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()

    if user:
        # User exists — promote to admin if not already
        if user["is_admin"]:
            conn.close()
            return {
                "status": "already_admin",
                "message": f"کاربر {email} قبلاً ادمین است",
                "user_id": user["id"],
            }
        conn.execute("UPDATE users SET is_admin = 1 WHERE id = ?", (user["id"]))
        conn.commit()
        conn.close()
        return {
            "status": "promoted",
            "message": f"کاربر {email} به ادمین ارتقا یافت",
            "user_id": user["id"],
        }
    else:
        # User doesn't exist — create as admin
        try:
            conn.execute(
                "INSERT INTO users (email, password_hash, display_name, plan, is_admin) VALUES (?, ?, ?, ?, ?)",
                (email.lower().strip(), hash_password(password), "مدیر سیستم", "pro", 1),
            )
            conn.commit()
            new_user = conn.execute("SELECT id FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
            conn.close()
            return {
                "status": "created",
                "message": f"کاربر ادمین {email} با موفقیت ایجاد شد",
                "user_id": new_user["id"],
                "email": email,
                "password": password,
            }
        except Exception as e:
            conn.close()
            raise HTTPException(status_code=500, detail=f"خطا در ایجاد کاربر: {str(e)}")
