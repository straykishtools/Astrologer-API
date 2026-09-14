"""
Context endpoints - AI-optimized textual descriptions.

All endpoints that return AI context via /api/v5/context/*.
"""

from datetime import datetime, timezone
from logging import getLogger
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import os
import httpx
from pydantic import BaseModel

from ..types.request_models import (
    BirthDataRequestModel,
    BirthChartDataRequestModel,
    SynastryChartDataRequestModel,
    CompositeChartDataRequestModel,
    TransitChartDataRequestModel,
    PlanetaryReturnDataRequestModel,
    NowSubjectRequestModel,
)
from ..types.response_models import (
    SubjectContextResponseModel,
    ContextResponseModel,
    ReturnContextResponseModel,
)
from ..utils.get_time_from_google import get_time_from_google
from ..utils.router_utils import (
    build_subject,
    resolve_location_for_subject,
    calculate_return_chart_data,
    context_payload,
    create_natal_chart_data,
    create_synastry_chart_data,
    create_composite_chart_data,
    create_transit_chart_data,
    handle_exception,
    resolve_active_points,
    subject_context_payload,
)
from ..utils.logging_utils import log_request_with_body
from kerykeion import AstrologicalSubjectFactory

logger = getLogger(__name__)
router = APIRouter()


@router.post("/api/v5/context/subject", response_model=SubjectContextResponseModel)
async def subject_context(
    birth_data_request: BirthDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/subject`

    اطلاعات موضوع رو می‌سازه و یه متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context موضوع", birth_data_request.model_dump_json()
    )

    try:
        active_points = resolve_active_points(birth_data_request.active_points)
        await resolve_location_for_subject(birth_data_request.subject)
        subject = build_subject(birth_data_request.subject, active_points=active_points)
        return JSONResponse(content=subject_context_payload(subject), status_code=200)

    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/context/birth-chart", response_model=ContextResponseModel)
async def natal_context(
    request_body: BirthChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/birth-chart`

    اطلاعات چارت تولد رو با یه متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context چارت تولد", request_body.model_dump_json()
    )

    try:
        chart_data = await create_natal_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/context/synastry", response_model=ContextResponseModel)
async def synastry_context(
    request_body: SynastryChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/synastry`

    اطلاعات چارت سیناستری (مقایسه دو نفر) رو با متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context سیناستری", request_body.model_dump_json()
    )

    try:
        chart_data = await create_synastry_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/context/composite", response_model=ContextResponseModel)
async def composite_context(
    request_body: CompositeChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/composite`

    اطلاعات چارت کامپوزیت (ترکیبی) رو با متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context کامپوزیت", request_body.model_dump_json()
    )

    try:
        chart_data = await create_composite_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/context/transit", response_model=ContextResponseModel)
async def transit_context(
    request_body: TransitChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/transit`

    اطلاعات چارت ترانزیت رو با متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context ترانزیت", request_body.model_dump_json()
    )

    try:
        chart_data = await create_transit_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/context/solar-return", response_model=ReturnContextResponseModel)
async def solar_return_context(
    request_body: PlanetaryReturnDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/solar-return`

    اطلاعات بازگشت خورشیدی رو با متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context بازگشت خورشیدی", request_body.model_dump_json()
    )

    try:
        chart_data = await calculate_return_chart_data(request_body, "Solar")
        payload = context_payload(chart_data)
        payload["return_type"] = "Solar"
        payload["wheel_type"] = request_body.wheel_type
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/context/lunar-return", response_model=ReturnContextResponseModel)
async def lunar_return_context(
    request_body: PlanetaryReturnDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/lunar-return`

    اطلاعات بازگشت قمری رو با متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context بازگشت قمری", request_body.model_dump_json()
    )

    try:
        chart_data = await calculate_return_chart_data(request_body, "Lunar")
        payload = context_payload(chart_data)
        payload["return_type"] = "Lunar"
        payload["wheel_type"] = request_body.wheel_type
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:
        return await handle_exception(exc, request)


@router.post("/api/v5/now/context", response_model=SubjectContextResponseModel)
async def now_context(
    request_body: NowSubjectRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/now/context`

    اطلاعات لحظه‌ای فعلی رو با متن آماده برای هوش مصنوعی برمی‌گردونه.
    """
    log_request_with_body(
        logger, request, "درخواست context لحظه‌ای", request_body.model_dump_json()
    )

    try:
        try:
            utc_datetime = get_time_from_google()
        except Exception as time_exc:
            logger.warning("افتادم رو زمان سیستم: %s", time_exc)
            utc_datetime = datetime.now(timezone.utc)

        subject = AstrologicalSubjectFactory.from_birth_data(
            name=request_body.name,
            year=utc_datetime.year,
            month=utc_datetime.month,
            day=utc_datetime.day,
            hour=utc_datetime.hour,
            minute=utc_datetime.minute,
            seconds=utc_datetime.second,
            city="Greenwich",
            nation="GB",
            lng=-0.001545,
            lat=51.477928,
            tz_str="Etc/UTC",
            online=False,
            zodiac_type=request_body.zodiac_type,
            sidereal_mode=request_body.sidereal_mode,
            perspective_type=request_body.perspective_type,
            houses_system_identifier=request_body.houses_system_identifier,
            active_points=resolve_active_points(None),
            suppress_geonames_warning=True,
        )

        return JSONResponse(content=subject_context_payload(subject), status_code=200)

    except Exception as exc:
        return await handle_exception(exc, request)

class AnalysisRequest(BaseModel):
    context: str
    vedic_summary: str = ""


def _extract_analysis_content(response_text: str) -> str:
    """
    Extract the assistant content from an OpenAI-compatible response.
    Handles both standard JSON and SSE (Server-Sent Events) streaming formats.
    Accumulates all SSE chunks into a single string.
    """
    import json as _json
    text = response_text.strip()

    # 1) Standard JSON response
    try:
        data = _json.loads(text)
        # پاسخ‌های c2pa/manifestدار (مثل bai/qwen3.8-flash مستقیم) داخل data کدنویسی‌اند؛
        # اگر جای content، خروجیِ reasoningِ مدل‌های تفکر (mimo) را بردار
        if isinstance(data, dict) and "_manifest" in data:
            import base64 as _b64
            try:
                inner = _b64.b64decode(data["_manifest"]["data"])
                data = _json.loads(inner[inner.index(b'{"model"') if inner.find(b'{"model"') >= 0 else 0:])
            except Exception:
                data = None
        if isinstance(data, dict):
            msg = data.get("choices", [{}])[0].get("message", {})
            return msg.get("content") or msg.get("reasoning") or ""
    except Exception:
        pass

    # 2) SSE streaming format -- accumulate all chunk contents
    if "data: " in text:
        parts = []
        for line in text.splitlines():
            line = line.strip()
            if not line.startswith("data: ") or "DONE" in line:
                continue
            try:
                chunk = _json.loads(line[6:])
                delta = chunk.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content") or ""
                if not content:
                    msg = chunk.get("choices", [{}])[0].get("message", {})
                    content = msg.get("content", "")
                if content:
                    parts.append(content)
            except Exception:
                continue
        if parts:
            return "".join(parts)

    return ""


def _is_valid_analysis(content: str) -> bool:
    """
    Validate that the content is a real astrological analysis, not a
    safety-classifier output or garbage response.
    """
    if not content or len(content.strip()) < 100:
        return False
    lower = content.lower()
    garbage_patterns = [
        "user safety:",
        "response safety:",
        "user safety :",
        "response safety :",
        "safety: safe",
        "safety: unsafe",
        "the content is",
    ]
    for pat in garbage_patterns:
        if pat in lower:
            return False
    return True


async def _call_model(client, api_key, prompt, model, messages=None):
    """Call a single model. Prefers the direct AI provider configured via
    env (AI_API_BASE + AI_API_KEY + AI_MODEL), falls back to the local
    proxy when only DEEPSEEK_API_KEY is set. If `messages` is given, it is
    used verbatim (conversation/chat); otherwise the astrologer-analysis
    system+user pair is built from `prompt`."""
    msgs = messages or [
        {"role": "system", "content": "You are a professional astrologer. Write detailed Persian astrological analysis using HTML."},
        {"role": "user", "content": prompt},
    ]
    base = os.getenv("AI_API_BASE")
    if base:
        # direct provider (OpenAI-compatible)
        return await client.post(
            base.rstrip("/") + "/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('AI_API_KEY', api_key)}",
                "Content-Type": "application/json",
            },
            json={
                "model": model["name"],   # نام مدل از فراخوان می‌آید (AI_MODEL/AI_MODEL_FALLBACK)
                "messages": msgs,
                "temperature": 0.75,
                "max_tokens": model["max_tokens"],
                "stream": False,
            }
        )
    # legacy local proxy path
    return await client.post(
        "http://localhost:20128/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model["name"],
            "messages": msgs,
            "temperature": 0.75,
            "max_tokens": model["max_tokens"],
            "stream": False,
        }
    )


@router.post("/api/v5/deepseek-analysis")
async def analyze_chart(request: AnalysisRequest):
    """
    Sends chart context + Vedic summary to the AI provider and returns the AI analysis.
    Uses AI_API_BASE/AI_API_KEY/AI_MODEL env when set (direct provider),
    else falls back to DEEPSEEK_API_KEY + local proxy.
    """
    api_key = os.getenv("AI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="سرویس تحلیل هوش مصنوعی پیکربندی نشده است")

    prompt = f"""
You are an experienced astrologer specializing in Vedic astrology.

Based on the birth chart data below, write a complete, accurate, and readable analysis in Persian (Farsi).

**IMPORTANT:** Write simply and clearly so everyone can understand.

**Raw Chart Data:**
{request.context}

{request.vedic_summary}

---

## Analysis Structure:

### 1. General Personality and Psychological Traits
Based on Sun, Moon, and Rising sign

### 2. Career and Education
Based on Sun, Mars, Houses 10, 6, 2

### 3. Romantic and Social Relationships
Based on Moon, Venus, Houses 7, 5, 12

### 4. Challenges and Opportunities
Challenging planets and ways to turn challenges into opportunities

### 5. Practical Recommendations and Summary
5 practical tips + inspiring conclusion

---

**Notes:** Do not repeat. Use HTML. Keep the tone warm and friendly.
"""

    models = [
        {"name": os.getenv("AI_MODEL", "qwen3.8-flash"), "max_tokens": 16384},
    ]
    _fb = os.getenv("AI_MODEL_FALLBACK", "")   # ترکیب: qwen3.8-flash + میمو (mimo)
    if _fb and _fb != models[0]["name"]:
        models.append({"name": _fb, "max_tokens": 16384})

    # تحلیلِ ۱۶هزارتوکنیِ فارسی روی مدلِ رایگان کند است؛ ۱۸۰ ثانیه کم بود.
    # timeout تفکیکی: اتصال/خواندنِ اولیه سریع شکست بخورد ولی تولید طولانی جا داشته باشد.
    _to = httpx.Timeout(300.0, connect=15.0)
    async with httpx.AsyncClient(timeout=_to, follow_redirects=True) as client:
        errors = []
        for model in models:
            try:
                logger.info("[ANALYSIS] Trying model: %s", model["name"])
                response = await _call_model(client, api_key, prompt, model)

                if response.status_code != 200:
                    err_msg = f"{model['name']} -> HTTP {response.status_code}"
                    try:
                        err_detail = response.json().get("error", {}).get("message", "")
                        if err_detail:
                            err_msg += f": {err_detail[:200]}"
                    except Exception:
                        pass
                    logger.warning("[ANALYSIS] %s", err_msg)
                    errors.append(err_msg)
                    continue

                content = _extract_analysis_content(response.text)

                if _is_valid_analysis(content):
                    logger.info("[ANALYSIS] Success with %s (%d chars)", model["name"], len(content))
                    return {"analysis": content}

                err_msg = f"{model['name']} -> invalid response ({len(content)} chars)"
                logger.warning("[ANALYSIS] %s", err_msg)
                errors.append(err_msg)

            except httpx.TimeoutException:
                err_msg = f"{model['name']} -> timeout"
                logger.warning("[ANALYSIS] %s", err_msg)
                errors.append(err_msg)
            except Exception as e:
                err_msg = f"{model['name']} -> {type(e).__name__}: {e}"
                logger.warning("[ANALYSIS] %s", err_msg)
                errors.append(err_msg)

        raise HTTPException(
            status_code=502,
            detail=f"All models failed. Errors: {'; '.join(errors)}"
        )


class ChatTurn(BaseModel):
    role: str
    content: str


class AstroChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = []
    context: str = ""


ASTRO_SYSTEM = (
    "تو «کاسمیک اوراکل» هستی؛ اخترشناسِ ودیک و مربیِ مجازیِ یوگا. "
    "فارسیِ ساده، گرم و کوتاه (حداکثر ۴ جمله) پاسخ بده، بدون مارک‌داون و HTML. "
    "اگر کاربر سؤالِ نجومی پرسید، بر پایهٔ نمادهای زودیاک/سیارات پاسخ بده؛ "
    "اگر خارج از موضوع بود، ادبانه به اخترشناسی برگردان. وعدهٔ قطعیِ پیش‌گویی نده.\n"
    "سؤالاتِ یوگا/تمرین را از دانشِ زیر پاسخ بده و هرگز از کاربر نخواه متنِ چارت یا توضیحِ اضافه بفرستد: "
    "تمرین‌های آماده: اقیانوس(وینیاسا، HIIT)، کویر(هاتا/یین، کششی-آرام)، کوه(پاور/آشتانگا، قدرتی)، سلام‌خورشید A/B(کلاسیک)؛ "
    "سطح‌ها: مبتدی/متوسط/پیشرفته؛ کتابخانه ۵۴۲ حرکت + تنفس و مدیتیشن؛ "
    "استودیوی کلاسیک با راهنمای صوتی و فروشگاه کارما. "
    "برای پیشنهادِ تمرین، سطح و هدفِ کاربر را در یک جمله بپرس، نه بیشتر."
)


@router.post("/api/v5/astro-chat")
async def astro_chat(request: AstroChatRequest):
    """کوتاه‌مکالمه با اخترشناسِ AI. از همان پروایدر/پراکسیِ تحلیل استفاده می‌کند
    (env: AI_API_BASE/AI_API_KEY/AI_MODEL یا DEEPSEEK_API_KEY + localhost:20128)."""
    api_key = os.getenv("AI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="سرویس هوش مصنوعی پیکربندی نشده است")
    msg = (request.message or "").strip()
    if not msg:
        raise HTTPException(status_code=422, detail="پیام خالی است")
    if len(msg) > 1500:
        msg = msg[:1500]

    messages = [{"role": "system", "content": ASTRO_SYSTEM}]
    if request.context.strip():
        messages.append({"role": "system", "content": "زمینهٔ چارت کاربر (برای پاسخ دقیق‌تر):\n" + request.context.strip()[:2000]})
    for h in request.history[-6:]:
        role = "assistant" if h.role == "assistant" else "user"
        c = (h.content or "").strip()
        if c:
            messages.append({"role": role, "content": c[:1200]})
    messages.append({"role": "user", "content": msg})

    import re as _re
    # max_tokens=800: مدل‌های reasoning (mimo) بودجه را با «اندیشه» مصرف می‌کنند؛
    # با ۴۰۰، finish_reason=length و content ته‌مانده‌ی تهی می‌شد
    models = [{"name": os.getenv("AI_MODEL", "qwen3.8-flash"), "max_tokens": 800}]
    _fb = os.getenv("AI_MODEL_FALLBACK", "")   # qwen ↔ میمو — چت هم ترکیبی
    if _fb and _fb != models[0]["name"]:
        models.append({"name": _fb, "max_tokens": 1500})
    async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
        last_err = "ارتباط با مدل برقرار نشد"
        for model in models:
            try:
                resp = await _call_model(client, api_key, msg, model, messages=messages)
                if resp.status_code != 200:
                    logger.warning("[ASTRO-CHAT] %s -> HTTP %s", model["name"], resp.status_code)
                    last_err = "پاسخ مدل ناموفق بود"
                    continue
                content = _extract_analysis_content(resp.text).strip()
                # حذف برچسب‌های احتمالیِ مارک‌داون/HTML برای رندرِ تمیزِ توکن‌استریم
                content = _re.sub(r"<[^>]+>", "", content)
                content = _re.sub(r"[#*_`>]+", "", content).strip()
                if not content:
                    last_err = "پاسخ مدل خالی بود"
                    continue
                return {"status": "success", "reply": content, "model": model["name"]}
            except Exception as e:
                logger.warning("[ASTRO-CHAT] %s: %s", type(e).__name__, e)
                last_err = "ارتباط با مدل برقرار نشد"
        raise HTTPException(status_code=502, detail=last_err)

