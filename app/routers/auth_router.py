# app/routers/auth_router.py
"""
روت‌های احراز هویت: ثبت‌نام، ورود، پروفایل، ذخیره/دریافت چارت
"""
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
    create_user,
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
    """لیست همه کاربران — فقط ادمین"""
    from app.models import get_db
    conn = get_db()
    users = conn.execute(
        "SELECT id, email, display_name, plan, is_admin, daily_charts_used, created_at FROM users ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return {"users": [dict(u) for u in users]}


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
