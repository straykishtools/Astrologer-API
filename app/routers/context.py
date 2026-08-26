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
        chart_data = create_natal_chart_data(request_body)
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
        chart_data = create_synastry_chart_data(request_body)
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
        chart_data = create_composite_chart_data(request_body)
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
        chart_data = create_transit_chart_data(request_body)
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
        chart_data = calculate_return_chart_data(request_body, "Solar")
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
        chart_data = calculate_return_chart_data(request_body, "Lunar")
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
        return data["choices"][0]["message"]["content"]
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


async def _call_model(client, api_key, prompt, model):
    """Call a single model via the local proxy."""
    return await client.post(
        "http://localhost:20128/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model["name"],
            "messages": [
                {"role": "system", "content": "You are a professional astrologer. Write detailed Persian astrological analysis using HTML."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.75,
            "max_tokens": model["max_tokens"],
            "stream": False,
        }
    )


@router.post("/api/v5/deepseek-analysis")
async def analyze_chart(request: AnalysisRequest):
    """
    Sends chart context + Vedic summary to the local proxy and returns the AI analysis.
    """
    api_key = os.getenv("DEEPSEEK_API_KEY", "sk-76422dc5ee03d9c3-j1m8he-be3fb0c5")

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
        {"name": "openrouter/nvidia/nemotron-3.5-lightning:free", "max_tokens": 16384},
        {"name": "openrouter/nvidia/nemotron-3-super-120b-a12b:free", "max_tokens": 16384},
        {"name": "openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "max_tokens": 16384},
        {"name": "openrouter/openrouter/free", "max_tokens": 16384},
        {"name": "openrouter/cohere/north-mini-code:free", "max_tokens": 16384},
    ]

    async with httpx.AsyncClient(timeout=180.0, follow_redirects=True) as client:
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

