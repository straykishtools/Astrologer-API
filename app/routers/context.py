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

def _cap(text: str, limit: int) -> str:
    """ورودی مدل رو به یک سقف کاراکتری می‌بره — چارت خام و خلاصهٔ ودیک
    گاهی چندهزار کاراکتر متن XML/دیتای غیرضروری دارن که فقط پرامپت رو
    سنگین و تولید رو کند می‌کنن، بدون این‌که کیفیت تحلیل رو بهتر کنن."""
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit("\n", 1)[0] + "\n…"

def _analysis_prompt(request: AnalysisRequest) -> str:
    # سقف‌ها عمداً سخاوتمندانه‌ان (چارت خام معمولاً زیر این حدهاست) ولی جلوی
    # پرامپت‌های غیرعادی بزرگ رو می‌گیرن که فقط باعث کندی می‌شن.
    context = _cap(request.context, 6000)
    vedic = _cap(request.vedic_summary, 2000)
    from app.utils.analysis_prompts import build_analysis_prompt as _build
    return _build(context, vedic)

    max_tokens از ۴۰۹۶ به ۱۶۰۰ کاهش پیدا کرد: ۵۰۰ کلمهٔ فارسی + تگ‌های HTML
    حدود ۹۰۰-۱۱۰۰ توکنه؛ ۴۰۹۶ فقط روی مدل‌های reasoning باعث می‌شد بودجه
    صرفِ «فکرکردنِ» بی‌ثمر بشه و پاسخ دیر (یا حتی خالی، اگر بودجه قبل از
    نوشتنِ متن نهایی تموم می‌شد) برسه. temperature هم پایین‌تر اومده تا
    ساختار ۵ بخشی رو محکم‌تر رعایت کنه (کاهش نیاز به retry روی خروجی نامعتبر).
    """
    models = [{"name": os.getenv("AI_MODEL", "qwen3.8-flash"), "max_tokens": 2400, "temperature": 0.5}]
    fb = os.getenv("AI_MODEL_FALLBACK", "")
    if fb and fb != models[0]["name"]:
        models.append({"name": fb, "max_tokens": 2400, "temperature": 0.5})
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
            # ⚠ عمداً بدونِ `or msg.get("reasoning")`: با max_tokens=600 روی
            # هر سه مدل b.ai تست شد — همه contentِ واقعی برمی‌گردانند؛
            # برداشتن reasoning مونولوگ انگلیسیِ مدل را به‌عنوان تفسیر
            # فارسی به کاربر نشان می‌داد
            return msg.get("content") or ""
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
            # gatewayهای پشت Cloudflare (مثل xkiro) درخواست‌هایی با UA پیش‌فرض
            # پایتون (`python-httpx/...`) را با ۴۰۳ بلاک می‌کنند؛ یک UA شبیه
            # مرورگر مشکل را حل می‌کند.
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
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
        "temperature": model.get("temperature", 0.75),
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
    import asyncio
    import json as _json
    api_key = os.getenv("AI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    got = False
    reason = "no attempt"   # برای پیام خطای تشخیصی (علتِ بی‌پاسخی)

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
                        reason = f"{m['name']} HTTP {resp.status_code}"
                        continue
                    # ⚑ heartbeat: مدل‌های tier رایگان قبل از اولین توکن ۳۰-۹۰
                    # ثانیه بی‌صدا «فکر» می‌کنند؛ بدون ترافیک، پروکسی‌های
                    # میانی (Railway/CDN) اتصال را می‌بُرند. هر ۱۵s یک SSE
                    # کامنت (خطِ ":") می‌فرستیم — پارسر فرانت نادیده می‌گیرد.
                    # ⚠ عمداً بدون wait_for: لغوکردنِ anext وسط read،
                    # iterator پاسخ httpx را خراب می‌کند — تسک دست‌نخورده
                    # بین دورها نگه داشته می‌شود.
                    it = resp.aiter_lines().__aiter__()
                    pending = None
                    try:
                        while True:
                            if pending is None:
                                pending = asyncio.ensure_future(it.__anext__())
                            done, _ = await asyncio.wait((pending,), timeout=15.0)
                            if not done:
                                yield ": keep-alive\n\n"
                                continue
                            task, pending = pending, None
                            try:
                                line = task.result()
                            except StopAsyncIteration:
                                break
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
                    finally:
                        if pending is not None:
                            pending.cancel()
            if got:
                yield evt({"done": True, "model": m["name"]})
                return
        except Exception as e:
            reason = f"{m['name']} {type(e).__name__}"
            logger.warning("[SSE] %s: %s", m["name"], type(e).__name__)
            if got:   # نصفِ پاسخ رفته — عوض‌کردن مدل یعنی متن دوتایی
                yield evt({"done": True, "model": m["name"], "partial": True})
                return
    if not got:
        hint = " (سرویس هوش مصنوعی از این دستگاه در دسترس نیست — VPN/پروکسی یا مسیر 9Router را چک کنید)" \
            if "Connect" in reason or "Timeout" in reason else ""
        yield evt({"err": f"پاسخ از هوش مصنوعی دریافت نشد [{reason}]{hint}"})

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
    return await _run_analysis(request)

async def _run_analysis(request: AnalysisRequest) -> dict:
    """تفسیر چارت روی همهٔ مدل‌ها (primary + fallback) — قابل‌استفادهٔ
    مجدد: هم endpoint غیراستریم و هم runnerِ job از همین‌جا می‌خوانند."""
    api_key = os.getenv("AI_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="سرویس تحلیل هوش مصنوعی پیکربندی نشده است")

    prompt = _analysis_prompt(request)
    models = _analysis_models()

    # timeout تفکیکی: اتصال سریع شکست بخورد ولی تولید جا داشته باشد.
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
    "تو استاد عرفانی معنوی کیهانی «کاسمیک» هستی. با کاربر مثل یک دوست آگاه و "
    "خوش رفتار کن: درباره‌ی هر موضوعی که پرسید — نجوم، یوگا، یا هر چیز "
    "دیگه‌ای، حتی خارج از این حوزه‌ها — طبیعی و مفید جواب بده؛ر "
    "تخصصت اخترشناسی انرژی کیهان تمدن های باستانی و اساطیر و تئوری های توطعه و یوگاست ، و وقتی واقعاً مرتبط بود می‌تونی "
    " امکانات سایت رو کوتاه معرفی کنی: چارت تولد، سیناستری (تطابق دو "
    "نفر)، ترانزیت، کامپوزیت، بازگشت خورشیدی/قمری، فاز و منزلِ ماه، "
    "مزاج‌شناسی، ابجد، تاروت، عددشناسی، فال حافظ، بیوریتم، زودیاکِ چینی، "
    " پرسشِ روزانه،ناسا، و یوگا و مدیتیشن و تنفس "
    "فارسیِ ساده، گرم و کوتاه (حداکثر 5-6 جمله) بدون مارک‌داون و HTML بنویس. "
    "اگر دربارهٔ نجوم صحبت می‌کنی، به نمادهای زودیاک/سیارات مربوط بمون و "
    "وعدهٔ قطعیِ پیش‌گویی نده."
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