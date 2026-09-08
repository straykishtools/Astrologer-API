# app/routers/settings_router.py
"""
تنظیمات اپ (پلن‌ها، صداهای ادمین، تصاویر پس‌زمینه) — ذخیره‌ی سمت سرور

قبلاً این داده‌ها فقط در localStorage مرورگر ادمین زندگی می‌کردند؛ حالا در
cosmic.db (جدول app_settings) ذخیره می‌شوند تا برای همه‌ی کاربران اعمال شوند.

- GET  /settings/{ns}        → عمومی (همه می‌خوانند: پلن‌ها و پس‌زمینه‌ها لازمند)
- PUT  /settings/{ns}        → فقط ادمین
- ns معتبر: plans | audio | backgrounds
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models import AppSetting
from app.routers.auth_router import get_admin_user
from sqlalchemy import select

import json

router = APIRouter(prefix="/api/v5/settings", tags=["Settings"])

VALID_NAMESPACES = ("plans", "audio", "backgrounds")


async def _read_ns(db: AsyncSession, ns: str):
    row = (await db.execute(select(AppSetting).where(AppSetting.ns == ns))).scalar_one_or_none()
    return row


async def _get_ns_or_default(db: AsyncSession, ns: str, default):
    row = await _read_ns(db, ns)
    if not row:
        return default
    try:
        return json.loads(row.value_json)
    except (ValueError, TypeError):
        return default


@router.get("/{ns}")
async def get_setting(ns: str, db: AsyncSession = Depends(get_db)):
    """خواندن یک فضای‌نام تنظیمات — عمومی."""
    if ns not in VALID_NAMESPACES:
        raise HTTPException(status_code=404, detail="فضای‌نام نامعتبر است")
    value = await _get_ns_or_default(db, ns, default=[])
    return {"ns": ns, "items": value}


@router.put("/{ns}")
async def put_setting(ns: str, body: dict, admin=Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    """نوشتن یک فضای‌نام تنظیمات — فقط ادمین. بدنه: {"items": [...]}"""
    if ns not in VALID_NAMESPACES:
        raise HTTPException(status_code=404, detail="فضای‌نام نامعتبر است")
    items = body.get("items")
    if not isinstance(items, list):
        raise HTTPException(status_code=400, detail='بدنه باید {"items": [...]} باشد')

    row = await _read_ns(db, ns)
    payload = json.dumps(items, ensure_ascii=False)
    if row:
        row.value_json = payload
    else:
        db.add(AppSetting(ns=ns, value_json=payload))
    await db.commit()
    return {"status": "ok", "ns": ns, "count": len(items)}


async def get_plans_config(db: AsyncSession):
    """پلن‌های تعریف‌شده توسط ادمین (یا [] اگر هنوز ذخیره نشده)."""
    return await _get_ns_or_default(db, "plans", default=[])


async def get_backgrounds_config(db: AsyncSession):
    """تصاویر پس‌زمینه‌ی ادمین (یا [] اگر هنوز ذخیره نشده)."""
    return await _get_ns_or_default(db, "backgrounds", default=[])
