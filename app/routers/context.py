"""
Context endpoints - AI-optimized textual descriptions.

All endpoints that return AI context via /api/v5/context/*.
"""

from datetime import datetime, timezone
from logging import getLogger
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
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


def _analysis_prompt(request: AnalysisRequest) -> str:
    return f"""
You are an experienced Vedic astrologer. Write a warm, simple, and concrete Persian (Farsi) analysis of the birth chart below.

**Raw Chart Data:**
{request.context}

{request.vedic_summary}

Output HTML with exactly these 5 short sections (no intro, no repetition, no generic filler — every sentence must refer to THIS chart):

<h4>🌟 شخصیت و روان</h4> (برج خورشید، ماه، رایزینگ — حداکثر ۴ جمله)
<h4>💼 شغل و تحصیل</h4> (خانه ۱۰، ۶، ۲ + مریخ و خورشید)
<h4>❤️ عشق و روابط</h4> (خانه ۷ و ۵ + ماه و ونوس)
<h4>⛰️ چالش و فرصت</h4> (سیارات دشوار و نحوهٔ تبدیلشان به فرصت)
<h4>✨ جمع‌بندی</h4> (۳ توصیهٔ عملی + یک جملهٔ امیدبخش)

Keep the ENTIRE analysis under 500 Persian words. Tone: friendly, non-judgmental, no absolute predictions.
"""


def _analysis_models() -> list:
    """هم مدل‌های تحلیل (primary + fallback) — استریم و غیراستریم یکی‌اند."""
    models = [{"name": os.getenv("AI_MODEL", "qwen3.8-flash"), "max_tokens": 4096}]
    fb = os.getenv("AI_MODEL_FALLBACK", "")   # qwen3.8-flash + میمو (mimo)
    if fb and fb != models[0]["name"]:
        models.append({"name": fb, "max_tokens": 4096})
    return models


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


def _sanitize_ai_text(content: str, mode: str = "chat") -> str:
    """تمیزکاری خروجی مدل برای فارسی.

    ⚠ برخی مدل‌ها (qwen/میمو) به‌جای فاصله «_» می‌گذارند؛ حذفِ مستقیمِ _
    کلمات فارسی را به هم می‌چسباند → اول تبدیل به فاصله، بعد حذف مارک‌داون.

    mode="chat"      : رندر متن‌خالص → برچسب‌های HTML و کاراکترهای مارک‌داون پاک می‌شوند.
    mode="analysis"  : خروجی با innerHTML رندر می‌شود → فقط «_»→فاصله؛
                       حذف > یا # تگ‌های HTML و رنگ‌های hex را می‌شکست.
    """
    import re as _re
    content = content.replace("_", " ")
    if mode == "chat":
        content = _re.sub(r"<[^>]+>", " ", content)
        content = _re.sub(r"[#*`>]+", "", content)
    content = _re.sub(r"[ \t]{2,}", " ", content)
    return content.strip()


def _stream_sanitizer(mode: str = "chat"):
    """نسخهٔ تکه‌ایِ _sanitize_ai_text برای استریم SSE.

    برچسب‌های <...> می‌توانند روی مرز دو تکه نصفه بمانند، پس با یک
    state-machine کوچک بین تکه‌ها follow می‌شوند.
    """
    state = {"in_tag": False}

    def feed(piece: str) -> str:
        out = []
        for ch in piece:
            if state["in_tag"]:
                if ch == ">":
                    state["in_tag"] = False
                continue
            if mode == "chat":
                if ch == "<":
                    state["in_tag"] = True
                    continue
                if ch in "#*`>":
                    continue
            if ch == "_":
                ch = " "
            out.append(ch)
        return "".join(out)

    return feed


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


def _model_request(api_key, model, messages=None, prompt=None, stream=False):
    """Build (url, headers, payload) for one OpenAI-compatible call.
    Prefers the direct AI provider configured via env (AI_API_BASE +
    AI_API_KEY + AI_MODEL), falls back to the local proxy when only
    DEEPSEEK_API_KEY is set. If `messages` is given, it is used verbatim
    (conversation/chat); otherwise the astrologer-analysis system+user
    pair is built from `prompt`. stream=True → SSE mode at the provider."""
    msgs = messages or [
        {"role": "system", "content": "You are a professional astrologer. Write detailed Persian astrological analysis using HTML."},
        {"role": "user", "content": prompt},
    ]
    base = os.getenv("AI_API_BASE")
    if base:
        url = base.rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {os.getenv('AI_API_KEY', api_key)}",
            "Content-Type": "application/json",
        }
    else:
        url = "http://localhost:20128/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
    payload = {
        "model": model["name"],   # نام مدل از فراخوان می‌آید (AI_MODEL/AI_MODEL_FALLBACK)
        "messages": msgs,
        "temperature": 0.75,
        "max_tokens": model["max_tokens"],
        "stream": stream,
    }
    return url, headers, payload


async def _call_model(client, api_key, prompt, model, messages=None):
    url, headers, payload = _model_request(api_key, model, messages, prompt)
    return await client.post(url, headers=headers, json=payload)


# read=150s: مدل‌های reasoning ممکن است پیش از اولین توکن بی‌صدا «فکر» کنند
_STREAM_TIMEOUT = httpx.Timeout(240.0, connect=15.0, read=150.0)


async def _sse_relay(models, *, messages=None, prompt=None, mode="chat"):
    """SSE relay: opens a streaming call to the model(s) and re-emits
    sanitized text pieces as `data: {"c": ...}` lines, then
    `data: {"done": true, "model": ...}` (or `{"err": ...}` if nothing
    streamed at all). Falls over to the next model only if the previous
    one failed before its first piece."""
    import json as _json
    api_key = os.getenv("AI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    got = False

    def evt(obj):
        return "data: " + _json.dumps(obj, ensure_ascii=False) + "\n\n"

    for m in models:
        # sanitizerِ تازه برای هر مدل: اگر مدلی قبل از اولین تکهٔ موفق مرد،
        # stateِ نیمه‌برچسبش نباید تکه‌های مدل بعدی را ببلعد
        feed = _stream_sanitizer(mode)
        try:
            url, headers, payload = _model_request(api_key, m, messages, prompt, stream=True)
            async with httpx.AsyncClient(timeout=_STREAM_TIMEOUT, follow_redirects=True) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as resp:
                    if resp.status_code != 200:
                        logger.warning("[SSE] %s -> HTTP %s", m["name"], resp.status_code)
                        continue
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            break
                        try:
                            chunk = _json.loads(data)
                        except Exception:
                            continue
                        choice = (chunk.get("choices") or [{}])[0]
                        delta = choice.get("delta") or {}
                        piece = delta.get("content") or (choice.get("message") or {}).get("content") or ""
                        if not piece:
                            continue
                        clean = feed(piece)
                        if not clean:
                            continue
                        got = True
                        yield evt({"c": clean})
            if got:
                yield evt({"done": True, "model": m["name"]})
                return
        except Exception as e:
            logger.warning("[SSE] %s: %s", m["name"], type(e).__name__)
            if got:   # نصفِ پاسخ رفته — عوض‌کردن مدل یعنی متن دوتایی
                yield evt({"done": True, "model": m["name"], "partial": True})
                return
    if not got:
        yield evt({"err": "پاسخ از هوش مصنوعی دریافت نشد"})


@router.post("/api/v5/deepseek-analysis/stream")
async def analyze_chart_stream(request: AnalysisRequest):
    """نسخهٔ استریمیِ تفسیر چارت — HTML تکه‌تکه می‌آید و مرورگر
    همان لحظه نشان می‌دهد؛ پایان «در حال دریافت تفسیر…» همین‌جا است."""
    api_key = os.getenv("AI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="سرویس تحلیل هوش مصنوعی پیکربندی نشده است")
    if not (request.context or "").strip():
        raise HTTPException(status_code=422, detail="context خالی است")
    return StreamingResponse(
        _sse_relay(_analysis_models(), prompt=_analysis_prompt(request), mode="analysis"),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
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

    prompt = _analysis_prompt(request)

    models = _analysis_models()

    # timeout تفکیکی: اتصال سریع شکست بخورد ولی تولید طولانی جا داشته باشد
    _to = httpx.Timeout(180.0, connect=15.0)
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
                    # ⚠ همان تمیزکاریِ چت: «_»های مدل → فاصله، تا کلمات فارسی
                    # به هم نچسبند. HTML حذف نمی‌شود چون خروجی با innerHTML رندر می‌شود.
                    return {"analysis": _sanitize_ai_text(content, mode="analysis")}

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


def _chat_request(request: AstroChatRequest):
    """اعتبارسنجی + ساخت (messages, models) برای چت.
    بین endpoint معمولی و استریمی مشترک است."""
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

    # max_tokens=800: مدل‌های reasoning (mimo) بودجه را با «اندیشه» مصرف می‌کنند؛
    # با ۴۰۰، finish_reason=length و content ته‌مانده‌ی تهی می‌شد
    models = [{"name": os.getenv("AI_MODEL", "qwen3.8-flash"), "max_tokens": 800}]
    _fb = os.getenv("AI_MODEL_FALLBACK", "")   # qwen ↔ میمو — چت هم ترکیبی
    if _fb and _fb != models[0]["name"]:
        models.append({"name": _fb, "max_tokens": 1500})
    return messages, models, api_key, msg


@router.post("/api/v5/astro-chat/stream")
async def astro_chat_stream(request: AstroChatRequest):
    """نسخهٔ استریمیِ چت — تکه‌های پاسخ همان لحظهٔ تولید می‌رسند (SSE)."""
    messages, models, _, _ = _chat_request(request)
    return StreamingResponse(
        _sse_relay(models, messages=messages, mode="chat"),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/api/v5/astro-chat")
async def astro_chat(request: AstroChatRequest):
    """کوتاه‌مکالمه با اخترشناسِ AI. از همان پروایدر/پراکسیِ تحلیل استفاده می‌کند
    (env: AI_API_BASE/AI_API_KEY/AI_MODEL یا DEEPSEEK_API_KEY + localhost:20128)."""
    messages, models, api_key, msg = _chat_request(request)
    async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
        last_err = "ارتباط با مدل برقرار نشد"
        for model in models:
            try:
                resp = await _call_model(client, api_key, msg, model, messages=messages)
                if resp.status_code != 200:
                    logger.warning("[ASTRO-CHAT] %s -> HTTP %s", model["name"], resp.status_code)
                    last_err = "پاسخ مدل ناموفق بود"
                    continue
                content = _sanitize_ai_text(
                    _extract_analysis_content(resp.text), mode="chat")
                if not content:
                    last_err = "پاسخ مدل خالی بود"
                    continue
                return {"status": "success", "reply": content, "model": model["name"]}
            except Exception as e:
                logger.warning("[ASTRO-CHAT] %s: %s", type(e).__name__, e)
                last_err = "ارتباط با مدل برقرار نشد"
        raise HTTPException(status_code=502, detail=last_err)

