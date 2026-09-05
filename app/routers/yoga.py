# app/routers/yoga.py
"""Yoga practice endpoints: catalog (poses/moves/practices), sessions, stats, favorites."""
import json
import random
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config.database import get_db
from app.models.yoga import YogaInstructor, YogaPracticeCatalog
from app.schemas.yoga import FavoriteCreate, YogaSessionCreate, YogaSessionOut, YogaStatsOut
from app.services import yoga_service, yoga_session_parser, yoga_steps_validator
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v5/yoga", tags=["Yoga"])

PREMIUM_PLANS = {"gold", "diamond", "pro", "enterprise"}
VALID_TIERS = ("free", "gold", "diamond")


def _get_admin_user(user=Depends(get_current_user)):
    """فقط ادمین دیتابیس جدید (is_admin) دسترسی دارد."""
    if not getattr(user, "is_admin", False):
        raise HTTPException(status_code=403, detail="دسترسی مخصوص ادمین")
    return user


async def _optional_user(authorization: Optional[str], db: AsyncSession):
    """کاربر اختیاری — مهمان بدون توکن مشکلی ندارد."""
    try:
        return await get_current_user(authorization, db)
    except HTTPException as exc:
        if exc.status_code == 401:
            return None
        raise

# ─── کاتالوگ XML تبدیل‌شده (static/yoga-data/) ───
_YOGA_DATA_DIR = Path(__file__).resolve().parents[2] / "static" / "yoga-data"
_catalog_cache: dict = {}
_catalog_mtimes: dict = {}


def _load_catalog(name: str):
    """بارگذاری کش‌دار فایل JSON؛ در حالت dev اگر فایل عوض شود کش باطل می‌شود."""
    path = _YOGA_DATA_DIR / f"{name}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"داده‌ی یوگا «{name}» پیدا نشد")
    mtime = path.stat().st_mtime
    if _catalog_cache.get(name) is None or _catalog_mtimes.get(name) != mtime:
        _catalog_cache[name] = json.loads(path.read_text(encoding="utf-8"))
        _catalog_mtimes[name] = mtime
    return _catalog_cache[name]


@router.get("/poses")
async def poses(
    difficulty: Optional[str] = Query(None, description="beginner | intermediate | expert"),
    category: Optional[str] = Query(None, description="standing | seated | supine | ..."),
):
    """فهرست حرکات با فیلتر سطح و دسته‌بندی."""
    items = _load_catalog("poses")
    if difficulty:
        items = [p for p in items if p["difficulty"] == difficulty]
    if category:
        items = [p for p in items if p["category"] == category]
    return {"status": "success", "total": len(items), "items": items}


@router.get("/moves")
async def moves():
    """گراف انتقال‌ها (ازPose → بهPose)."""
    items = _load_catalog("moves")
    return {"status": "success", "total": len(items), "items": items}


def _practice_item(row: YogaPracticeCatalog) -> dict:
    """تبدیل ردیف دیتابیس به آیتم فهرست (سازگار با فرمت قبلی static)."""
    seq = row.sequence or {}
    return {
        "name": row.name,
        "displayName": row.name_fa or row.name,
        "description": row.description_fa or row.description or "",
        "style": row.style or "hatha",
        "durations": row.durations or [30],
        "difficulties": row.difficulties or [0],
        "poseCount": row.pose_count or 0,
        "locked": row.subscription_tier != "free",
        "tier": row.subscription_tier,
        "instructor_id": str(row.instructor_id) if row.instructor_id else None,
        "instructor_name": row.instructor.name if row.instructor else None,
        "is_active": row.is_active,
        "source": row.source or "manual",
        "source_file": row.source_file,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "preferred_background": seq.get("preferredBackgroundName", "Home"),
    }


@router.get("/practices")
async def practices(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """فهرست تمرین‌های آماده — از دیتابیس، با قفل پلنی برای تمرین‌های ویژه.

    تمرین‌هایی که هنوز به دیتابیس منتقل نشده‌اند از فایل‌های static/yoga-data
    اضافه می‌شوند تا هیچ تمرینی از دست نرود.
    """
    user = await _optional_user(authorization, db)
    rows = (
        await db.execute(
            select(YogaPracticeCatalog)
            .options(selectinload(YogaPracticeCatalog.instructor))
            .where(YogaPracticeCatalog.is_active.is_(True))
            .order_by(YogaPracticeCatalog.created_at)
        )
    ).scalars().all()

    items = []
    seen = set()
    for row in rows:
        seen.add(row.name)
        item = _practice_item(row)
        if item["tier"] != "free":
            item["locked"] = user is None or (user.plan or "free") not in PREMIUM_PLANS
        items.append(item)

    # مکمل: تمرین‌های static که در دیتابیس نیستند (حالت ارتقا‌نیافته)
    try:
        static_items = _load_catalog("practices")
    except HTTPException:
        static_items = []
    for s in static_items:
        if s.get("name") in seen:
            continue
        items.append(
            {
                **s,
                "locked": False,
                "tier": "free",
                "instructor_id": None,
                "instructor_name": None,
                "is_active": True,
                "preferred_background": (s.get("body") or {}).get("preferredBackgroundName", "Home"),
            }
        )
        seen.add(s.get("name"))

    return {"status": "success", "total": len(items), "items": items}


@router.get("/practices/{name}")
async def practice_detail(
    name: str,
    db: AsyncSession = Depends(get_db),
):
    """اسکریپت کامل یک تمرین — اول دیتابیس، سپس فایل static."""
    safe = name.strip().lower()
    row = (
        await db.execute(
            select(YogaPracticeCatalog)
            .options(selectinload(YogaPracticeCatalog.instructor))
            .where(YogaPracticeCatalog.name == safe)
        )
    ).scalar_one_or_none()
    if row is not None:
        if not row.is_active:
            raise HTTPException(status_code=404, detail="تمرین پیدا نشد")
        return {
            "status": "success",
            "practice": {
                "name": safe,
                "file": safe,
                "head": row.head,
                "body": row.sequence,
                "tier": row.subscription_tier,
                "instructor_name": row.instructor.name if row.instructor else None,
            },
        }
    data = _load_catalog(safe)
    data = {**data, "name": safe}
    return {"status": "success", "practice": data}


# ─── مربی‌ها ───

class InstructorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    specialty: Optional[str] = None
    level: str = "intermediate"
    bio: Optional[str] = None


class InstructorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    level: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/instructors")
async def instructors(db: AsyncSession = Depends(get_db)):
    """فهرست مربی‌های یوگا (عمومی)."""
    rows = (
        await db.execute(
            select(YogaInstructor)
            .where(YogaInstructor.is_active.is_(True))
            .order_by(YogaInstructor.name)
        )
    ).scalars().all()
    return {
        "status": "success",
        "total": len(rows),
        "items": [
            {
                "id": str(i.id),
                "name": i.name,
                "specialty": i.specialty,
                "level": i.level,
                "bio": i.bio,
            }
            for i in rows
        ],
    }


@router.post("/instructors", status_code=201)
async def create_instructor(
    data: InstructorCreate,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """ساخت مربی جدید — فقط ادمین."""
    row = YogaInstructor(
        name=data.name.strip(),
        specialty=data.specialty,
        level=data.level,
        bio=data.bio,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"status": "success", "instructor": {"id": str(row.id), "name": row.name, "specialty": row.specialty, "level": row.level, "bio": row.bio}}


@router.put("/instructors/{instructor_id}")
async def update_instructor(
    instructor_id: str,
    data: InstructorUpdate,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """ویرایش مربی — فقط ادمین."""
    from uuid import UUID

    try:
        uid = UUID(instructor_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="مربی پیدا نشد")
    row = (
        await db.execute(select(YogaInstructor).where(YogaInstructor.id == uid))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="مربی پیدا نشد")
    patch = data.model_dump(exclude_unset=True)
    for k, v in patch.items():
        if k == "name" and v is not None:
            v = v.strip()
        setattr(row, k, v)
    await db.commit()
    return {"status": "success", "instructor": {"id": str(row.id), "name": row.name, "specialty": row.specialty, "level": row.level, "bio": row.bio}}


@router.delete("/instructors/{instructor_id}")
async def delete_instructor(
    instructor_id: str,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """حذف (غیرفعال‌سازی) مربی — فقط ادمین."""
    from uuid import UUID

    try:
        uid = UUID(instructor_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="مربی پیدا نشد")
    row = (
        await db.execute(select(YogaInstructor).where(YogaInstructor.id == uid))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="مربی پیدا نشد")
    row.is_active = False
    await db.commit()
    return {"status": "deleted"}


# ─── مدیریت تمرین‌ها (ادمین) ───

class PracticeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80, description="شناسه انگلیسی یکتا")
    name_fa: str = ""
    description_fa: str = ""
    description: str = ""
    style: str = "hatha"
    durations: list[int] = [30]
    difficulties: list[int] = [0, 1, 2]
    subscription_tier: str = "free"
    instructor_id: Optional[str] = None
    preferred_background: str = "Home"
    source_file: Optional[str] = None
    steps: list = Field(default_factory=list, description="دنباله‌ی گام‌ها (JSON)")


class PracticeUpdate(BaseModel):
    name_fa: Optional[str] = None
    description_fa: Optional[str] = None
    description: Optional[str] = None
    style: Optional[str] = None
    durations: Optional[list[int]] = None
    difficulties: Optional[list[int]] = None
    subscription_tier: Optional[str] = None
    instructor_id: Optional[str] = None
    is_active: Optional[bool] = None
    steps: Optional[list] = None
    preferred_background: Optional[str] = None


class PracticeFromXml(BaseModel):
    xml: str = Field(min_length=1, description="محتوی کامل فایل XML تمرین")
    name: Optional[str] = Field(None, description="شناسه انگلیسی یکتا (پیش‌فرض: از <name> ساخته می‌شود)")
    name_fa: Optional[str] = None
    description_fa: Optional[str] = None
    style: Optional[str] = None
    subscription_tier: str = "free"
    instructor_id: Optional[str] = None
    preferred_background: Optional[str] = None
    source_file: Optional[str] = None


class PracticeParseXml(BaseModel):
    xml: str = Field(min_length=1, description="محتوی کامل فایل XML تمرین — فقط برای پیش‌پُرشدن فرم")
    source_file: Optional[str] = None


class StepsValidateText(BaseModel):
    text: str = Field(description="محتوی خام JSON دنباله‌ی گام‌ها")


@router.post("/practices/validate-steps")
async def validate_steps(
    data: StepsValidateText,
    admin=Depends(_get_admin_user),
):
    """اعتبارسنجی JSON دنباله‌ی گام‌ها با شماره خط — فقط ادمین.

    خروجی موفق: {"status": "success", "count": N}
    خطا: 400 با detail شامل errors خط‌به‌خط (همان قالب parse-xml).
    """
    result = yoga_steps_validator.validate_steps_text(data.text)
    return {"status": "success", "count": len(result["steps"])}


@router.post("/practices/parse-xml")
async def parse_practice_xml(
    data: PracticeParseXml,
    admin=Depends(_get_admin_user),
):
    """پارس فایل XML تمرین و برگرداندن head/steps تا فرم ادمین پیش‌پُر شود — فقط ادمین."""
    parsed = yoga_session_parser.parse_session_xml(data.xml)
    head = parsed["head"]
    fmt = yoga_session_parser.session_format(data.xml)
    warnings = [fmt["warning"]] if fmt.get("warning") else []
    return {
        "status": "success",
        "name": yoga_session_parser.session_slug(head["name"]),
        "name_en": head["name"],
        "description": head.get("description", ""),
        "style": head.get("style", "hatha"),
        "durations": head.get("durations", [30]),
        "difficulties": head.get("difficulties", [0]),
        "preferred_background": parsed["body"].get("preferredBackgroundName", "Home"),
        "pose_count": yoga_session_parser._count_steps(parsed["body"]["steps"]),
        "steps": parsed["body"]["steps"],
        "format_version": fmt.get("version"),
        "warnings": warnings,
    }


@router.post("/practices/from-xml", status_code=201)
async def create_practice_from_xml(
    data: PracticeFromXml,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """ساخت تمرین مستقیماً از فایل XML آپلودشده — فقط ادمین."""
    parsed = yoga_session_parser.parse_session_xml(data.xml)
    head = parsed["head"]
    steps = parsed["body"]["steps"]

    name = (data.name or "").strip().lower() or yoga_session_parser.session_slug(head["name"])
    if not name:
        raise HTTPException(status_code=400, detail="شناسه تمرین لازم است")
    if data.subscription_tier not in VALID_TIERS:
        raise HTTPException(status_code=422, detail="سطح اشتراک باید free، gold یا diamond باشد")
    exists = (
        await db.execute(select(YogaPracticeCatalog).where(YogaPracticeCatalog.name == name))
    ).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(status_code=409, detail="تمرینی با این شناسه از قبل وجود دارد")

    name_fa = data.name_fa or (head["name"] if not head["name"].isascii() else None)
    body = {
        "preferredBackgroundName": data.preferred_background or parsed["body"].get("preferredBackgroundName", "Home"),
        "steps": steps,
    }
    row = YogaPracticeCatalog(
        name=name,
        name_fa=name_fa or None,
        description=head.get("description") or None,
        description_fa=data.description_fa or None,
        style=data.style or head.get("style", "hatha"),
        difficulty="beginner",
        durations=head.get("durations") or [30],
        difficulties=head.get("difficulties") or [0],
        pose_count=yoga_session_parser._count_steps(steps),
        instructor_id=await _resolve_instructor(db, data.instructor_id),
        head={
            "name": name_fa or name,
            "description": data.description_fa or head.get("description", ""),
            "style": data.style or head.get("style", "hatha"),
            "durations": head.get("durations") or [30],
            "difficulties": head.get("difficulties") or [0],
            "pose": head.get("pose", {"name": "Child Traditional", "side": "left"}),
        },
        sequence=body,
        subscription_tier=data.subscription_tier,
        is_active=True,
        source="xml",
        source_file=data.source_file or None,
    )
    db.add(row)
    await db.commit()
    row = (
        await db.execute(
            select(YogaPracticeCatalog)
            .options(selectinload(YogaPracticeCatalog.instructor))
            .where(YogaPracticeCatalog.id == row.id)
        )
    ).scalar_one()
    fmt = yoga_session_parser.session_format(data.xml)
    return {
        "status": "success",
        "practice": _practice_item(row),
        "warnings": [fmt["warning"]] if fmt.get("warning") else [],
    }


async def _resolve_instructor(db: AsyncSession, instructor_id: Optional[str]):
    if not instructor_id:
        return None
    from uuid import UUID

    try:
        uid = UUID(instructor_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="مربی پیدا نشد")
    row = (
        await db.execute(select(YogaInstructor).where(YogaInstructor.id == uid))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="مربی پیدا نشد")
    return uid


def _build_head_body(data) -> tuple[dict, dict]:
    if not data.steps:
        raise HTTPException(status_code=400, detail="دنباله‌ی تمرین (steps) خالی است — حداقل یک گام بفرستید")
    head = {
        "name": data.name_fa or data.name,
        "description": data.description_fa or data.description,
        "style": data.style,
        "durations": data.durations or [30],
        "difficulties": data.difficulties or [0],
        "pose": {"name": "Child Traditional", "side": "left"},
    }
    body = {"preferredBackgroundName": data.preferred_background, "steps": data.steps}
    return head, body


@router.post("/practices", status_code=201)
async def create_practice(
    data: PracticeCreate,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """ساخت تمرین سفارشی توسط ادمین — با مربی و سطح اشتراک."""
    name = data.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="شناسه تمرین لازم است")
    if data.subscription_tier not in VALID_TIERS:
        raise HTTPException(status_code=422, detail="سطح اشتراک باید free، gold یا diamond باشد")
    exists = (
        await db.execute(select(YogaPracticeCatalog).where(YogaPracticeCatalog.name == name))
    ).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(status_code=409, detail="تمرینی با این شناسه از قبل وجود دارد")
    head, body = _build_head_body(data)
    row = YogaPracticeCatalog(
        name=name,
        name_fa=data.name_fa or None,
        description=data.description or None,
        description_fa=data.description_fa or None,
        style=data.style,
        difficulty="beginner",
        durations=data.durations or [30],
        difficulties=data.difficulties or [0],
        pose_count=len(data.steps),
        instructor_id=await _resolve_instructor(db, data.instructor_id),
        head=head,
        sequence=body,
        subscription_tier=data.subscription_tier,
        is_active=True,
        source="manual",
        source_file=data.source_file or None,
    )
    db.add(row)
    await db.commit()
    row = (
        await db.execute(
            select(YogaPracticeCatalog)
            .options(selectinload(YogaPracticeCatalog.instructor))
            .where(YogaPracticeCatalog.id == row.id)
        )
    ).scalar_one()
    return {"status": "success", "practice": _practice_item(row)}


@router.put("/practices/{name}")
async def update_practice(
    name: str,
    data: PracticeUpdate,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """ویرایش تمرین (نام فارسی، توضیح، سطح اشتراک، مربی، گام‌ها) — فقط ادمین."""
    safe = name.strip().lower()
    row = (
        await db.execute(select(YogaPracticeCatalog).where(YogaPracticeCatalog.name == safe))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="تمرین پیدا نشد")
    patch = data.model_dump(exclude_unset=True)
    if "subscription_tier" in patch and patch["subscription_tier"] not in VALID_TIERS:
        raise HTTPException(status_code=422, detail="سطح اشتراک باید free، gold یا diamond باشد")
    if "instructor_id" in patch:
        row.instructor_id = await _resolve_instructor(db, patch.pop("instructor_id"))
    if "preferred_background" in patch:
        bg = patch.pop("preferred_background")
        row.sequence = {**row.sequence, "preferredBackgroundName": bg or "Home"}
    if "steps" in patch:
        steps = patch.pop("steps")
        if not steps:
            raise HTTPException(status_code=400, detail="دنباله‌ی تمرین خالی است")
        row.sequence = {"preferredBackgroundName": row.sequence.get("preferredBackgroundName", "Home"), "steps": steps}
        row.pose_count = len(steps)
    if "durations" in patch and patch["durations"]:
        row.durations = patch["durations"]
        patch.pop("durations")
        row.head = {**row.head, "durations": row.durations}
    for k, v in patch.items():
        if v is not None:
            setattr(row, k, v)
    await db.commit()
    row = (
        await db.execute(
            select(YogaPracticeCatalog)
            .options(selectinload(YogaPracticeCatalog.instructor))
            .where(YogaPracticeCatalog.id == row.id)
        )
    ).scalar_one()
    return {"status": "success", "practice": _practice_item(row)}


@router.delete("/practices/{name}")
async def delete_practice(
    name: str,
    admin=Depends(_get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """غیرفعال‌سازی تمرین — فقط ادمین (تمرین‌های built-in هم قابل برگشت‌اند)."""
    safe = name.strip().lower()
    row = (
        await db.execute(select(YogaPracticeCatalog).where(YogaPracticeCatalog.name == safe))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="تمرین پیدا نشد")
    row.is_active = False
    await db.commit()
    return {"status": "deleted"}


# ─── توصیه تمرین روزانه (بر اساس سطح + سابقه) ───

LEVEL_ORDER = {"beginner": 0, "intermediate": 1, "expert": 2}
LEVEL_FA = {"beginner": "مبتدی", "intermediate": "متوسط", "expert": "پیشرفته"}


def _infer_level(total_minutes: int) -> str:
    """استنتاج سطح از حجم تمرین ثبت‌شده."""
    if total_minutes < 60:
        return "beginner"
    if total_minutes < 300:
        return "intermediate"
    return "expert"


@router.get("/recommend")
async def recommend_practice(
    authorization: Optional[str] = Header(None),
    level: Optional[str] = Query(None, description="beginner | intermediate | expert — سطح اعلام‌شده (مثلاً از تست تشخیص)"),
    db: AsyncSession = Depends(get_db),
):
    """توصیه‌ی تمرین روزانه بر اساس سطح کاربر و سابقه‌ی تمرین.

    - سطح: پارامتر `level` اگر داده شود، وگرنه از سابقه استنتاج می‌شود.
    - انتخاب تمرین: هم‌سطح بودن، تنوع (نه تکرار تمرین اخیر)، مناسب‌بودن برای ساعت روز.
    - تمرین‌های قفل‌شده (طلایی/الماسی) برای کاربران بدون اشتراک کنار گذاشته می‌شوند.
    """
    if level and level not in LEVEL_ORDER:
        raise HTTPException(status_code=422, detail="سطح باید beginner، intermediate یا expert باشد")
    user = await _optional_user(authorization, db)

    # ── سابقه از دیتابیس ──
    total_minutes = 0
    streak_days = 0
    recent_names: set = set()
    if user is not None:
        from app.models import DailyStreak, YogaPractice as YogaSessionRow

        sessions = (
            await db.execute(
                select(YogaSessionRow)
                .where(YogaSessionRow.user_id == user.id)
                .order_by(YogaSessionRow.practice_date.desc(), YogaSessionRow.created_at.desc())
                .limit(100)
            )
        ).scalars().all()
        total_minutes = round(sum(s.duration_seconds or 0 for s in sessions) / 60)
        # نام تمرین از notes («تمرین آماده (desert)» یا نام آزاد)
        for s in sessions[:10]:
            note = (s.notes or "").lower()
            for name in ("ocean", "desert", "mountain", "sun_salutation_a", "sun_salutation_b"):
                if name in note:
                    recent_names.add(name)
            if s.pose_name and len(recent_names) < 12:
                recent_names.add(s.pose_name.lower())

        # استریک از جدول streaks
        streak_row = (
            await db.execute(
                select(DailyStreak).where(DailyStreak.user_id == user.id, DailyStreak.streak_type == "yoga")
            )
        ).scalar_one_or_none()
        if streak_row:
            streak_days = streak_row.current_streak or 0

    # ── سطح نهایی ──
    eff_level = level or _infer_level(total_minutes)
    level_idx = LEVEL_ORDER[eff_level]
    reasons = [f"سطح شما: {LEVEL_FA[eff_level]}"]
    if total_minutes > 0:
        reasons.append(f"⏱ مجموع تمرین ثبت‌شده: {total_minutes} دقیقه")
    if streak_days >= 2:
        reasons.append(f"🔥 استریک {streak_days} روزه — همین مسیر را ادامه بده")

    # ── ساعت روز ──
    from datetime import datetime

    hour = datetime.now().hour
    if 5 <= hour < 12:
        preferred_styles = {"power", "vinyasa", "ashtanga"}
        reasons.append("☀️ صبح است — تمرین پرانرژی پیشنهاد می‌شود")
    elif 12 <= hour < 17:
        preferred_styles = {"hatha", "flow", "vinyasa"}
        reasons.append("🌤 بعدازظهر — تمرین متعادل پیشنهاد می‌شود")
    else:
        preferred_styles = {"yin", "restorative", "hatha"}
        reasons.append("🌙 شب است — تمرین آرام و ترمیمی پیشنهاد می‌شود")

    # ── انتخاب از کاتالوگ ──
    catalog = (
        await db.execute(
            select(YogaPracticeCatalog)
            .options(selectinload(YogaPracticeCatalog.instructor))
            .where(YogaPracticeCatalog.is_active.is_(True))
        )
    ).scalars().all()
    # اگر کاتالوگ دیتابیس خالی است (مثلاً بدون migration) از static استفاده کن
    static_catalog = []
    try:
        static_catalog = _load_catalog("practices")
    except HTTPException:
        pass
    db_names = {row.name for row in catalog}
    for s in static_catalog:
        if s.get("name") in db_names:
            continue
        s = {**s, "locked": False, "tier": "free", "instructor_id": None, "instructor_name": None, "is_active": True}
        # استایل فیلدها را برای scoring یکسان کن
        catalog.append(
            type(
                "StaticPractice",
                (),
                {
                    "name": s["name"],
                    "difficulties": s.get("difficulties") or [0],
                    "difficulty": None,
                    "subscription_tier": s["tier"],
                    "style": s.get("style", "hatha"),
                    "durations": s.get("durations") or [30],
                    "_item": s,
                },
            )()
        )
    if not catalog:
        raise HTTPException(status_code=404, detail="تمرینی برای توصیه پیدا نشد")

    is_premium = bool(user and (user.plan or "free") in PREMIUM_PLANS)

    def _as_item(p) -> dict:
        return getattr(p, "_item", None) or _practice_item(p)

    def _score(p) -> int:
        score = 0
        if (p.difficulties or [0]) and level_idx in p.difficulties:
            score += 3  # هم‌سطح
        elif p.difficulty == eff_level:
            score += 2
        if p.subscription_tier == "free":
            score += 1
        elif not is_premium:
            score -= 10  # قفل — تقریباً حذف
        if p.name not in recent_names:
            score += 2  # تنوع
        if p.style in preferred_styles:
            score += 2  # مناسب ساعت روز
        return score

    best = max(catalog, key=_score)
    item = _as_item(best)
    if item["tier"] != "free" and not is_premium:
        reasons.append(f"🔒 «{item['displayName']}» برای پلن طلایی/الماسی است — برای باز شدن ارتقا بده")
    if best.name in recent_names:
        reasons.append("♻ این تمرین را اخیراً انجام داده‌اید — برای تنوع پیشنهاد می‌شود")
    else:
        reasons.append("✨ تمرینی تازه برای تنوع در برنامه")

    # مدت پیشنهادی: نزدیک‌ترین به راهنمای سطح
    target = {0: 20, 1: 30, 2: 45}[level_idx]
    durations = best.durations or [30]
    suggested_duration = min(durations, key=lambda d: abs(d - target))

    ranked = sorted(catalog, key=_score, reverse=True)
    return {
        "status": "success",
        "level": eff_level,
        "level_source": "declared" if level else "history",
        "reasons": reasons,
        "suggested_duration": suggested_duration,
        "recommended": item,
        "alternatives": [_as_item(p) for p in ranked[1:3]],
    }


class GenerateRequest(BaseModel):
    level: str = Field("beginner", description="beginner | intermediate | expert")
    duration: int = Field(30, ge=10, le=120, description="مدت تمرین به دقیقه")
    background: str = Field("Home", description="نام پس‌زمینه از backgrounds.json")


@router.post("/generate")
async def generate_practice(req: GenerateRequest):
    """تولید تمرین پویا: انتخاب حرکات هم‌سطح + اتصال با گراف انتقال‌ها."""
    poses_list = _load_catalog("poses")
    moves_list = _load_catalog("moves")
    backgrounds = _load_catalog("backgrounds")

    if req.level not in ("beginner", "intermediate", "expert"):
        raise HTTPException(status_code=422, detail="سطح باید beginner، intermediate یا expert باشد")
    pool_map = {
        "beginner": ["beginner"],
        "intermediate": ["beginner", "intermediate"],
        "expert": ["beginner", "intermediate", "expert"],
    }
    pool = [p for p in poses_list if p["difficulty"] in pool_map[req.level]]
    by_name = {p["name"]: p for p in poses_list}
    # حرکت از pose مشخص به pose هدف
    outgoing: dict = {}
    for mv in moves_list:
        outgoing.setdefault(mv["fromPose"], []).append(mv)
    incoming: dict = {}
    for mv in moves_list:
        incoming.setdefault(mv["toPose"], []).append(mv)

    hold_counts = {"beginner": 3, "intermediate": 5, "expert": 8}
    pose_count = max(6, min(30, round(req.duration * 60 / 28)))

    start_name = "Child Traditional"
    end_name = "Corpse"
    current = start_name
    chain = []  # [(move_name, pose_name)]
    for _ in range(pose_count):
        chosen = None
        for _try in range(12):
            target = random.choice(pool)
            if target["name"] == current:
                continue
            mv = next((m for m in outgoing.get(current, []) if m["toPose"] == target["name"]), None)
            if mv is None:
                mv = next((m for m in incoming.get(target["name"], []) if m["fromPose"] == current), None)
            if mv is None:
                mv = next(iter(incoming.get(target["name"], [])), None)
            if mv is not None:
                chosen = (mv, target)
                break
        if chosen is None:
            continue
        mv, target = chosen
        chain.append((mv["name"], target["name"]))
        current = target["name"]

    # بستن با حرکت به Corpse — ترجیح حرکت واقعی از حالت فعلی، وگرنه هر انتقالی به Corpse
    fin = next((m for m in outgoing.get(current, []) if m["toPose"] == end_name), None)
    if fin is None:
        fin = next(iter(incoming.get(end_name, [])), None)
    if fin:
        chain.append((fin["name"], end_name))
        current = end_name

    hold_n = hold_counts[req.level]
    steps = [
        {"type": "tempo", "duration": 4.0},
        {"type": "music", "kind": "builtin", "id": "0"},
    ]
    steps.append({"type": "move", "name": f"childtraditional_to_childtraditional"})
    steps.append({"type": "hold", "count": 3, "phrase": "none", "audibleCount": False})
    for move_name, pose_name in chain:
        steps.append({"type": "move", "name": move_name})
        steps.append({"type": "hold", "count": hold_n, "phrase": "none", "audibleCount": False})
        pose = by_name.get(pose_name)
        if pose and pose.get("twosided"):
            steps.append({"type": "switchside"})
            steps.append({"type": "hold", "count": hold_n, "phrase": "none", "audibleCount": False})
            steps.append({"type": "switchside"})
    if not fin:
        # انتقال واقعی به Corpse در گراف نیست؛ فقط حالت نهایی را نمایش بده
        steps.append({"type": "pose", "name": end_name, "side": "left"})
    steps.append({"type": "hold", "count": 8, "phrase": "relax", "audibleCount": False})

    bg = next((b for b in backgrounds if b["name"] == req.background), backgrounds[0])
    return {
        "status": "success",
        "practice": {
            "name": req.level,
            "file": f"generated_{req.level}_{req.duration}",
            "head": {
                "name": {"beginner": "تمرین مبتدی", "intermediate": "تمرین متوسط", "expert": "تمرین پیشرفته"}[req.level],
                "description": f"تمرین پویای {req.duration} دقیقه‌ای برای سطح {req.level}",
                "style": "vinyasa",
                "durations": [req.duration],
                "difficulties": [0, 1, 2][: ["beginner", "intermediate", "expert"].index(req.level) + 1],
                "pose": {"name": start_name, "side": "left"},
            },
            "body": {
                "preferredBackgroundName": bg["name"],
                "background": bg,
                "generated": True,
                "poseNames": [n for _, n in chain] + [end_name],
                "steps": steps,
            },
        },
    }



@router.post("/session", response_model=YogaSessionOut, status_code=201)
async def save_session(
    data: YogaSessionCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await yoga_service.save_session(db, user, data)
    await db.commit()
    await db.refresh(session)
    return YogaSessionOut.model_validate(session)


@router.get("/history", response_model=dict)
async def history(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sessions = await yoga_service.list_sessions(db, user, limit, offset)
    return {
        "status": "success",
        "total": len(sessions),
        "items": [YogaSessionOut.model_validate(s).model_dump(mode="json") for s in sessions],
    }


@router.get("/stats", response_model=YogaStatsOut)
async def stats(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return YogaStatsOut(**await yoga_service.get_stats(db, user))


@router.get("/favorites", response_model=dict)
async def favorites(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    favs = await yoga_service.list_favorites(db, user)
    return {
        "status": "success",
        "total": len(favs),
        "items": [
            {"pose_id": f.pose_id, "pose_name": f.pose_name, "created_at": f.created_at}
            for f in favs
        ],
    }


@router.post("/favorite", status_code=201)
async def add_favorite(
    data: FavoriteCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fav = await yoga_service.add_favorite(db, user, data)
    await db.commit()
    return {"status": "success", "pose_id": fav.pose_id, "pose_name": fav.pose_name}


@router.delete("/favorite/{pose_id}")
async def remove_favorite(
    pose_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await yoga_service.remove_favorite(db, user, pose_id)
    await db.commit()
    return {"status": "success", "detail": "از علاقهمندیها حذف شد"}