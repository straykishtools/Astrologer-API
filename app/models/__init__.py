# app/models.py
"""
مدل‌های دیتابیس SQLite و درخواست‌های احراز هویت
"""
import sqlite3
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel
import jwt

# ─── تنظیمات ───

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cosmic_oracle.db")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cosmic-oracle-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# ─── مدل‌های Pydantic ───

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


# ─── دیتابیس SQLite ───

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """ساخت جدول‌های دیتابیس"""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT DEFAULT '',
            plan TEXT DEFAULT 'free',
            is_admin INTEGER DEFAULT 0,
            daily_charts_used INTEGER DEFAULT 0,
            daily_charts_reset_at TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS saved_charts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            chart_type TEXT NOT NULL,
            title TEXT DEFAULT '',
            input_data TEXT NOT NULL,
            result_data TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan_id INTEGER NOT NULL,
            plan_name TEXT NOT NULL,
            amount INTEGER NOT NULL,
            period TEXT DEFAULT 'monthly',
            status TEXT DEFAULT 'pending',
            gateway_ref TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            price_monthly INTEGER DEFAULT 0,
            price_yearly INTEGER DEFAULT 0,
            daily_chart_limit INTEGER DEFAULT 10,
            can_save_charts INTEGER DEFAULT 0,
            can_access_premium INTEGER DEFAULT 0,
            premium_paths TEXT DEFAULT '',
            features TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS guest_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint_hash TEXT UNIQUE NOT NULL,
            daily_charts_used INTEGER DEFAULT 0,
            daily_charts_reset_at TEXT DEFAULT '',
            linked_user_id INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            last_seen_at TEXT DEFAULT (datetime('now'))
        );
    """)
    # درج پلن‌های پیش‌فرض اگر هنوز وجود ندارند
    defaults = [
        ("free", "\u0631\u0627\u06cc\u06af\u0627\u0646", 0, 0, 10, 0, 0, "composite,solar-return,lunar-return", "\u0686\u0627\u0631\u062a \u062a\u0648\u0644\u062f\u060c \u0633\u06cc\u0646\u0627\u0633\u062a\u0631\u06cc \u067e\u0627\u06cc\u0647\u060c \u062a\u0627\u0631\u0648\u062a\u060c \u0641\u0627\u0644 \u062d\u0627\u0641\u0638\u060c \u0646\u0627\u0633\u0627", 1, 0),
        ("gold", "\u0637\u0644\u0627\u06cc\u06cc", 99000, 990000, 200, 1, 1, "", "\u0647\u0645\u0647 \u0627\u0628\u0632\u0627\u0631 \u0631\u0627\u06cc\u06af\u0627\u0646 + \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a\u060c \u062a\u0631\u0627\u0646\u0632\u06cc\u062a \u06a9\u0627\u0645\u0644\u060c \u0628\u0627\u0632\u06af\u0634\u062a \u062e\u0648\u0631\u0634\u06cc\u062f\u06cc/\u0645\u0627\u0647\u0627\u0646\u0647\u060c \u0627\u0628\u062c\u062f\u060c \u0645\u0632\u0627\u062c\u060c \u0630\u062e\u06cc\u0631\u0647 \u0686\u0627\u0631\u062a", 1, 1),
        ("diamond", "\u0627\u0644\u0645\u0627\u0633\u06cc", 299000, 2990000, 9999, 1, 1, "", "\u0647\u0645\u0647 \u0637\u0644\u0627\u06cc\u06cc + \u062e\u0631\u0648\u062c\u06cc PDF\u060c \u0627\u0639\u0644\u0627\u0646 \u062a\u0631\u0627\u0646\u0632\u06cc\u062a\u060c \u0645\u0642\u0627\u06cc\u0633\u0647 \u06af\u0631\u0648\u0647\u06cc\u060c \u062f\u0633\u062a\u0631\u0633\u06cc API", 1, 2),
    ]
    for d in defaults:
        exists = conn.execute("SELECT id FROM plans WHERE name = ?", (d[0],)).fetchone()
        if not exists:
            conn.execute(
                "INSERT INTO plans (name, display_name, price_monthly, price_yearly, daily_chart_limit, can_save_charts, can_access_premium, premium_paths, features, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                d,
            )
    conn.commit()

    # ─── Seed default admin user if none exists ───
    admin_exists = conn.execute("SELECT id FROM users WHERE email = ?", ("admin@cosmic.ir",)).fetchone()
    if not admin_exists:
        try:
            conn.execute(
                "INSERT INTO users (email, password_hash, display_name, plan, is_admin) VALUES (?, ?, ?, ?, ?)",
                ("admin@cosmic.ir", hash_password("admin123"), "مدیر سیستم", "pro", 1),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            pass
    else:
        # Ensure existing admin user has is_admin flag set
        conn.execute("UPDATE users SET is_admin = 1 WHERE email = ? AND is_admin = 0", ("admin@cosmic.ir",))
        conn.commit()

    conn.close()


# ─── توابع JWT ───

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ─── توابع رمز عبور ───

def _generate_salt() -> str:
    return secrets.token_hex(16)


def hash_password(password: str) -> str:
    """هش کردن رمز با SHA256 + salt"""
    salt = _generate_salt()
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, stored_hash = password_hash.split("$", 1)
        return hashlib.sha256((salt + password).encode()).hexdigest() == stored_hash
    except (ValueError, AttributeError):
        return False


# ─── توابع کاربر ───

def create_user(email: str, password: str, display_name: str = "") -> Optional[dict]:
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
            (email.lower().strip(), hash_password(password), display_name or email.split("@")[0]),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
        return dict(user)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def create_user_admin(email: str, password: str, display_name: str = "", plan: str = "free", is_admin: bool = False) -> Optional[dict]:
    """ساخت کاربر توسط ادمین — با تنظیم پلن و دسترسی ادمین"""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash, display_name, plan, is_admin) VALUES (?, ?, ?, ?, ?)",
            (email.lower().strip(), hash_password(password), display_name or email.split("@")[0], plan, 1 if is_admin else 0),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
        return dict(user)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()




def change_password(user_id: int, current_password: str, new_password: str) -> bool:
    """Change user password after verifying current password"""
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        conn.close()
        return False
    if not verify_password(current_password, user['password_hash']):
        conn.close()
        return False
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (hash_password(new_password), user_id))
    conn.commit()
    conn.close()
    return True


def reset_password_by_email(email: str, new_password: str) -> bool:
    """Set a new password for the legacy user row (used by reset-password flow).

    Unlike change_password, this does not require the current password — the
    caller is responsible for validating the reset token first.
    """
    conn = get_db()
    try:
        cursor = conn.execute(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            (hash_password(new_password), (email or "").strip().lower()),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def authenticate_user(email: str, password: str) -> Optional[dict]:
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    conn.close()
    if user and verify_password(password, user["password_hash"]):
        return dict(user)
    return None


def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None


# ─── توابع محدودیت روزانه ───

def check_daily_limit(user_id: int) -> dict:
    """چک کردن محدودیت روزانه. محدودیت از جدول plans خوانده می‌شه"""
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return {"allowed": False, "reason": "کاربر یافت نشد"}

    today = datetime.now().strftime("%Y-%m-%d")
    if user["daily_charts_reset_at"] != today:
        conn.execute(
            "UPDATE users SET daily_charts_used = 0, daily_charts_reset_at = ? WHERE id = ?",
            (today, user_id),
        )
        conn.commit()
        used = 0
    else:
        used = user["daily_charts_used"]

    plan_name = user["plan"]
    # محدودیت از جدول plans خوانده می‌شه، نه hardcoded
    plan_row = conn.execute(
        "SELECT daily_chart_limit FROM plans WHERE name = ? AND is_active = 1",
        (plan_name,),
    ).fetchone()
    if plan_row:
        limit = plan_row["daily_chart_limit"]
    else:
        limit = 10  # fallback

    conn.close()
    return {
        "allowed": used < limit,
        "used": used,
        "limit": limit,
        "plan": plan_name,
        "remaining": max(0, limit - used),
    }


def increment_daily_usage(user_id: int):
    conn = get_db()
    conn.execute(
        "UPDATE users SET daily_charts_used = daily_charts_used + 1 WHERE id = ?",
        (user_id,),
    )
    conn.commit()
    conn.close()


def decrement_daily_usage(user_id: int):
    """برگرداندن مصرف در صورت خطا در درخواست پایین‌دستی"""
    conn = get_db()
    conn.execute(
        "UPDATE users SET daily_charts_used = MAX(0, daily_charts_used - 1) WHERE id = ?",
        (user_id,),
    )
    conn.commit()
    conn.close()


def atomic_check_and_increment(user_id: int) -> dict:
    """اتمیک چک و افزایش مصرف روزانه — جلوگیری از race condition"""
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            conn.close()
            return {"allowed": False, "reason": "کاربر یافت نشد"}

        today = datetime.now().strftime("%Y-%m-%d")
        # ریست روزانه اگر لازم باشه
        if user["daily_charts_reset_at"] != today:
            conn.execute(
                "UPDATE users SET daily_charts_used = 0, daily_charts_reset_at = ? WHERE id = ?",
                (today, user_id),
            )
            conn.commit()
            used = 0
        else:
            used = user["daily_charts_used"]

        plan_name = user["plan"]
        plan_row = conn.execute(
            "SELECT daily_chart_limit FROM plans WHERE name = ? AND is_active = 1",
            (plan_name,),
        ).fetchone()
        limit = plan_row["daily_chart_limit"] if plan_row else 10

        if used >= limit:
            conn.close()
            return {
                "allowed": False,
                "used": used,
                "limit": limit,
                "plan": plan_name,
                "remaining": 0,
            }

        # افزایش اتمیک فقط اگر زیر حد باشه
        cursor = conn.execute(
            "UPDATE users SET daily_charts_used = daily_charts_used + 1 WHERE id = ? AND daily_charts_used < ?",
            (user_id, limit),
        )
        conn.commit()

        if cursor.rowcount == 0:
            # در حالت ریس (concurrent) کسی دیگه افزایش داده
            conn.close()
            return {
                "allowed": False,
                "used": limit,
                "limit": limit,
                "plan": plan_name,
                "remaining": 0,
            }

        conn.close()
        return {
            "allowed": True,
            "used": used + 1,
            "limit": limit,
            "plan": plan_name,
            "remaining": max(0, limit - used - 1),
        }
    except Exception:
        conn.close()
        raise


def guest_check_and_increment(fp_hash: str, limit: int = 5) -> dict:
    """اتمیک چک و افزایش مصرف روزانه مهمان بر اساس fingerprint هش‌شده

    مثل atomic_check_and_increment ولی برای جدول guest_sessions.
    حد مهمان پیش‌فرض 5 چارت در روز است.
    """
    conn = get_db()
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        guest = conn.execute(
            "SELECT * FROM guest_sessions WHERE fingerprint_hash = ?",
            (fp_hash,),
        ).fetchone()

        if not guest:
            # مهمان جدید
            conn.execute(
                "INSERT INTO guest_sessions (fingerprint_hash, daily_charts_used, daily_charts_reset_at) VALUES (?, 0, ?)",
                (fp_hash, today),
            )
            conn.commit()
            used = 0
        elif guest["daily_charts_reset_at"] != today:
            conn.execute(
                "UPDATE guest_sessions SET daily_charts_used = 0, daily_charts_reset_at = ? WHERE id = ?",
                (today, guest["id"]),
            )
            conn.commit()
            used = 0
        else:
            used = guest["daily_charts_used"] or 0

        if used >= limit:
            conn.close()
            return {
                "allowed": False,
                "used": used,
                "limit": limit,
                "remaining": 0,
            }

        cursor = conn.execute(
            "UPDATE guest_sessions SET daily_charts_used = daily_charts_used + 1 WHERE id = ? AND daily_charts_used < ?",
            (guest["id"], limit),
        )
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return {"allowed": False, "used": limit, "limit": limit, "remaining": 0}

        conn.close()
        return {"allowed": True, "used": used + 1, "limit": limit, "remaining": max(0, limit - used - 1)}
    except Exception:
        conn.close()
        raise


def guest_decrement(fp_hash: str):
    """برگرداندن مصرف مهمان در صورت خطا"""
    conn = get_db()
    conn.execute(
        "UPDATE guest_sessions SET daily_charts_used = MAX(0, daily_charts_used - 1) WHERE fingerprint_hash = ?",
        (fp_hash,),
    )
    conn.commit()
    conn.close()


# ─── توابع چارت ذخیره‌شده ───

def save_chart(user_id: int, chart_type: str, title: str, input_data: str, result_data: str) -> dict:
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO saved_charts (user_id, chart_type, title, input_data, result_data) VALUES (?, ?, ?, ?, ?)",
        (user_id, chart_type, title, input_data, result_data),
    )
    conn.commit()
    chart = conn.execute("SELECT * FROM saved_charts WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(chart)


def get_user_charts(user_id: int, limit: int = 50) -> list:
    conn = get_db()
    charts = conn.execute(
        "SELECT * FROM saved_charts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit),
    ).fetchall()
    conn.close()
    return [dict(c) for c in charts]


def delete_chart(chart_id: int, user_id: int) -> bool:
    conn = get_db()
    cursor = conn.execute(
        "DELETE FROM saved_charts WHERE id = ? AND user_id = ?",
        (chart_id, user_id),
    )
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


# ─── توابع پلن (مدیریت توسط ادمین) ───

def get_all_plans(active_only: bool = False) -> list:
    """دریافت همه پلن‌ها"""
    conn = get_db()
    if active_only:
        rows = conn.execute(
            "SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC"
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM plans ORDER BY sort_order ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_plan_by_name(name: str) -> Optional[dict]:
    """دریافت یک پلن با نام"""
    conn = get_db()
    row = conn.execute("SELECT * FROM plans WHERE name = ?", (name,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_plan_by_id(plan_id: int) -> Optional[dict]:
    """دریافت یک پلن با ID"""
    conn = get_db()
    row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def create_plan(data: dict) -> dict:
    """ساخت پلن جدید"""
    conn = get_db()
    conn.execute(
        """INSERT INTO plans
        (name, display_name, price_monthly, price_yearly, daily_chart_limit,
         can_save_charts, can_access_premium, premium_paths, features, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data["name"],
            data["display_name"],
            data.get("price_monthly", 0),
            data.get("price_yearly", 0),
            data.get("daily_chart_limit", 10),
            1 if data.get("can_save_charts", False) else 0,
            1 if data.get("can_access_premium", False) else 0,
            data.get("premium_paths", ""),
            data.get("features", ""),
            1 if data.get("is_active", True) else 0,
            data.get("sort_order", 0),
        ),
    )
    conn.commit()
    plan_row = conn.execute("SELECT * FROM plans WHERE name = ?", (data["name"],)).fetchone()
    conn.close()
    return dict(plan_row) if plan_row else None


def update_plan(plan_id: int, data: dict) -> Optional[dict]:
    """ویرایش پلن"""
    conn = get_db()
    existing = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
    if not existing:
        conn.close()
        return None

    fields = [
        "display_name", "price_monthly", "price_yearly", "daily_chart_limit",
        "can_save_charts", "can_access_premium", "premium_paths", "features",
        "is_active", "sort_order",
    ]
    updates = []
    values = []
    for f in fields:
        if f in data:
            val = data[f]
            if f in ("can_save_charts", "can_access_premium", "is_active"):
                val = 1 if val else 0
            updates.append(f"{f} = ?")
            values.append(val)

    if updates:
        values.append(plan_id)
        conn.execute(
            f"UPDATE plans SET {', '.join(updates)} WHERE id = ?",
            values,
        )
        conn.commit()

    result = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
    conn.close()
    return dict(result) if result else None


def delete_plan(plan_id: int) -> bool:
    """حذف پلن (فقط اگر کاربری روی آن نباشد)"""
    conn = get_db()
    # چک کردن اینکه کاربری روی این پلن نیست
    plan = conn.execute("SELECT name FROM plans WHERE id = ?", (plan_id,)).fetchone()
    if not plan:
        conn.close()
        return False
    users_on_plan = conn.execute(
        "SELECT COUNT(*) as cnt FROM users WHERE plan = ?", (plan["name"],)
    ).fetchone()
    if users_on_plan["cnt"] > 0:
        conn.close()
        return False
    conn.execute("DELETE FROM plans WHERE id = ?", (plan_id,))
    conn.commit()
    conn.close()
    return True


def get_user_plan(user_id: int) -> Optional[dict]:
    """دریافت پلن فعلی کاربر از دیتابیس"""
    conn = get_db()
    user = conn.execute("SELECT plan FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return None
    plan = conn.execute("SELECT * FROM plans WHERE name = ?", (user["plan"],)).fetchone()
    conn.close()
    return dict(plan) if plan else None


class ChangePassword(BaseModel):
    """Model for password change"""
    current_password: str
    new_password: str


# ─── SQLAlchemy ORM models (Cosmic Oracle database — app/config/database.py) ───
# Kept at the bottom of the package __init__ so the legacy synchronous layer
# above keeps working unchanged while the new ORM tables are also importable
# as ``app.models.<name>`` and registered on ``app.models.Base.metadata``.
from app.models.base import Base  # noqa: E402,F401
from app.models.chart import ChartHistory  # noqa: E402,F401
from app.models.plan import Plan  # noqa: E402,F401
from app.models.tarot import TarotHistory  # noqa: E402,F401
from app.models.user import User, UserProfile, UserSettings  # noqa: E402,F401
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
    "ChartHistory",
    "YogaPractice",
    "YogaFavorite",
    "YogaInstructor",
    "YogaPracticeCatalog",
    "DailyStreak",
    "TarotHistory",
    "Plan",
]
