"""
Job‌های تفسیر چارت (پس‌زمینه، ماندگار در DB).

چرا؟ مدل b.ai رایگان تفسیر کامل را ۲-۳ دقیقه تولید می‌کند. اگر این را با
fetch زندهٔ مرورگر انجام دهیم، با رفرش/رفتن به تب دیگر/سرویسِ دیگر نتیجه
از دست می‌رود. این روتر تفسیر را به یک «job» سمت سرور تبدیل می‌کند که در
جدول analysis_jobs می‌ماند؛ فرانت یک job_id نگه می‌دارد و با poll کردن
(حتی بعد از رفرش) نتیجه را می‌گیرد و با نوتیف اطلاع می‌دهد.
"""
from __future__ import annotations

import hashlib
from logging import getLogger
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import SessionLocal, get_db
from app.models import AnalysisJob, ChartHistory
from app.services.auth_service import decode_token
from .context import AnalysisRequest, _run_analysis

logger = getLogger(__name__)
router = APIRouter(prefix="/api/v5/analysis-jobs", tags=["AI Analysis Jobs"])

# jobهای در حال اجرا که بیش از این‌قدر بی‌خبر مانده‌اند (پروسه ریستارت شده)
# در بعدی‌ترین poll به error تبدیل می‌شوند تا کاربر تا ابد منتظر نماند.
_STALE_SECONDS = 420


def _fp_hash(fingerprint: str) -> str:
    return hashlib.sha256(fingerprint.encode()).hexdigest()[:48]


async def _owner(authorization: Optional[str], request: Request) -> str:
    """هویت مالک job: کاربر لاگین‌شده → u:<id>؛ مهمان → g:<fp_hash>.

    بدون احراز هویت اجباری — هر دو مسیر مجاز به داشتن job هستند.
    """
    token = (authorization or "")
    if token.startswith("Bearer "):
        token = token[7:]
    if token.strip():
        payload = decode_token(token.strip())
        if payload and payload.get("user_id") is not None:
            return f"u:{int(payload['user_id'])}"
    fp = (request.headers.get("x-guest-fingerprint") or "").strip()
    if fp:
        return f"g:{_fp_hash(fp)}"
    raise HTTPException(status_code=401, detail="هویت نامشخص (لاگین یا فینگرپرینت لازم است)")


@router.post("")
async def create_job(
    request: Request,
    background: BackgroundTasks,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """تفسیر را به‌صورت job پس‌زمینه ثبت می‌کند و job_id برمی‌گرداند."""
    body = await request.json()
    ctx = (body.get("context") or "").strip()
    if not ctx:
        raise HTTPException(status_code=422, detail="context خالی است")
    owner = await _owner(authorization, request)

    # ⚑ dedupe سمت سرور با کلیدِ تاریخ‌تولد: اگر قبلاً برای همین تولد
    # (و همین مالک) تحلیل نوشته/شروع شده، همان job برمی‌گردد — AI دوباره
    # صدا زده نمی‌شود، حتی اگر localStorage مرورگر پاک شده باشد.
    birth_key = (body.get("birth_key") or "")[:24] or None
    subject_json = (body.get("subject_json") or "")[:4000] or None
    if birth_key:
        existing = (
            await db.execute(
                select(AnalysisJob)
                .where(AnalysisJob.owner_id == owner, AnalysisJob.birth_key == birth_key)
                .order_by(AnalysisJob.id.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if existing is not None and existing.status in ("pending", "running", "done"):
            out = {"status": "accepted", "job_id": existing.id, "state": existing.status, "reused": True}
            if existing.status == "done":
                out["result_html"] = existing.result_html
            return out

    job = AnalysisJob(
        owner_id=owner,
        status="pending",
        birth_key=birth_key,
        subject_json=subject_json,
        context=ctx[:6000],
        vedic_summary=(body.get("vedic_summary") or "")[:2000],
        chart_title=(body.get("title") or "")[:200],
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    background.add_task(_execute_job, job.id)
    return {"status": "accepted", "job_id": job.id, "state": job.status}


@router.get("/mine")
async def list_mine(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
    limit: int = 25,
):
    """فهرست چارت‌های محاسبه‌شدهٔ همین مالک (برای dropdown «چارت‌های من»).

    از analysis_jobs خوانده می‌شود چون subject_json (بازیابی فرم)،
    birth_key (dedupe) و result_html (تفسیر) را یک‌جا دارد — بر خلاف
    ChartHistory که فقط تفسیر ثبت‌شدهٔ دستی را نگه می‌دارد.
    """
    owner = await _owner(authorization, request)
    rows = (
        await db.execute(
            select(AnalysisJob)
            .where(AnalysisJob.owner_id == owner, AnalysisJob.birth_key.isnot(None))
            .order_by(AnalysisJob.created_at.desc(), AnalysisJob.id.desc())
            .limit(min(max(1, limit), 100))
        )
    ).scalars().all()
    import json as _json
    items = []
    for j in rows:
        subj = None
        if j.subject_json:
            try:
                subj = _json.loads(j.subject_json)
            except Exception:
                subj = None
        items.append({
            "job_id": j.id,
            "birth_key": j.birth_key,
            "title": j.chart_title or (subj or {}).get("name") or "چارت",
            "status": j.status,
            "has_interp": bool(j.result_html),
            "subject": subj,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        })
    return {"status": "success", "items": items}


@router.get("/{job_id}")
async def get_job(
    job_id: int,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """وضعیت job (و نتیجه وقتی done). فقط مالک می‌تواند ببیند."""
    owner = await _owner(authorization, request)
    job = (
        await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
    ).scalar_one_or_none()
    if job is None or job.owner_id != owner:
        # not_found امن‌تر از «متعلق به شما نیست» است (عدم افشای وجود job دیگران)
        return {"status": "not_found"}

    # sweeper: اگر پروسه وسط کار ریستارت شده باشد، job در running گیر نمی‌کند
    if job.status in ("pending", "running"):
        from datetime import datetime, timezone

        upd = job.updated_at
        if upd is not None and upd.tzinfo is None:
            upd = upd.replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - upd).total_seconds() if upd else 0
        if age > _STALE_SECONDS:
            await db.execute(
                update(AnalysisJob)
                .where(AnalysisJob.id == job_id)
                .values(status="error", error="تحلیل بیش از حد طول کشید — دوباره تلاش کنید")
            )
            await db.commit()
            return {"status": "error", "error": "تحلیل بیش از حد طول کشید — دوباره تلاش کنید"}

    out = {"status": job.status}
    if job.status == "done":
        out["result_html"] = job.result_html
    elif job.status == "error":
        out["error"] = job.error or "خطای نامشخص"
    return out


@router.post("/{job_id}/save")
async def save_job_to_profile(
    job_id: int,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """ثبت نتیجهٔ done در پروفایل کاربر (فقط کاربر لاگین‌شده)."""
    owner = await _owner(authorization, request)
    if not owner.startswith("u:"):
        raise HTTPException(status_code=400, detail="برای ثبت در پروفایل وارد حساب شوید")
    user_id = int(owner.split(":", 1)[1])

    job = (
        await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
    ).scalar_one_or_none()
    if job is None or job.owner_id != owner:
        raise HTTPException(status_code=404, detail="job یافت نشد")
    if job.status != "done" or not job.result_html:
        raise HTTPException(status_code=409, detail="تحلیل هنوز آماده نشده است")

    row = ChartHistory(
        user_id=user_id,
        chart_type="birth",
        interpretation={"html": job.result_html, "title": job.chart_title or ""},
        subject_name=job.chart_title or None,
        title=job.chart_title or "تفسیر چارت",
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"status": "success", "chart_id": row.id}


async def _execute_job(job_id: int) -> None:
    """runner پس‌زمینه: job را اجرا و نتیجه/خطا را در DB می‌نویسد.

    سشن مستقل — به درخواستِ تمام‌شده وابسته نیست. هیچ‌وقت استثنا نمی‌دهد
    (BackgroundTasks خطا را نمی‌گیرد؛ اینجا خودمان ثبت می‌کنیم)."""
    async with SessionLocal() as db:
        job = (
            await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
        ).scalar_one_or_none()
        if job is None:
            return
        job.status = "running"
        await db.commit()

        req = AnalysisRequest(context=job.context, vedic_summary=job.vedic_summary)
        try:
            res = await _run_analysis(req)
            job.result_html = res.get("analysis", "") or ""
            job.status = "done" if job.result_html else "error"
            if not job.result_html:
                job.error = "پاسخ مدل خالی بود"
        except HTTPException as e:
            job.status = "error"
            job.error = str(e.detail)
        except Exception as e:  # noqa: BLE001
            logger.warning("[JOB] %s failed: %s", job_id, type(e).__name__)
            job.status = "error"
            job.error = f"خطای غیرمنتظره: {type(e).__name__}"
        await db.commit()
