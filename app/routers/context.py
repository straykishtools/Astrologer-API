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

    Builds and returns an astrological subject with AI-optimized context.

    **Parameters:**
    - `subject`: SubjectModel (offline preferred or GeoNames via geonames_username)

    **Returns:**
    - `status`: "OK"
    - `subject_context`: AI-optimized context string
    - `subject`: AstrologicalSubjectModel (serialized)
    """
    log_request_with_body(
        logger, request, "Subject context request", birth_data_request.model_dump_json()
    )

    try:
        active_points = resolve_active_points(birth_data_request.active_points)
        subject = build_subject(birth_data_request.subject, active_points=active_points)
        return JSONResponse(content=subject_context_payload(subject), status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/context/birth-chart", response_model=ContextResponseModel)
async def natal_context(
    request_body: BirthChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/birth-chart`

    Returns natal chart data with AI-optimized context.

    **Parameters:**
    - `subject`: SubjectModel
    - `active_points` / `active_aspects` (optional overrides)
    - `distribution_method`, `custom_distribution_weights` (optional)

    **Returns:**
    - `status`: "OK"
    - `context`: AI-optimized context string
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(
        logger, request, "Natal context request", request_body.model_dump_json()
    )

    try:
        chart_data = create_natal_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/context/synastry", response_model=ContextResponseModel)
async def synastry_context(
    request_body: SynastryChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/synastry`

    Returns synastry chart data with AI-optimized context.

    **Parameters:**
    - `first_subject`, `second_subject`: SubjectModel
    - `include_house_comparison`, `include_relationship_score` (flags)
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `context`: AI-optimized context string
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(
        logger, request, "Synastry context request", request_body.model_dump_json()
    )

    try:
        chart_data = create_synastry_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/context/composite", response_model=ContextResponseModel)
async def composite_context(
    request_body: CompositeChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/composite`

    Returns composite chart data with AI-optimized context.

    **Parameters:**
    - `first_subject`, `second_subject`
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `context`: AI-optimized context string
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(
        logger, request, "Composite context request", request_body.model_dump_json()
    )

    try:
        chart_data = create_composite_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/context/transit", response_model=ContextResponseModel)
async def transit_context(
    request_body: TransitChartDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/transit`

    Returns transit chart data with AI-optimized context.

    **Parameters:**
    - `first_subject`: SubjectModel (natal)
    - `transit_subject`: SubjectModel (transit moment)
    - `include_house_comparison` flag

    **Returns:**
    - `status`: "OK"
    - `context`: AI-optimized context string
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(
        logger, request, "Transit context request", request_body.model_dump_json()
    )

    try:
        chart_data = create_transit_chart_data(request_body)
        return JSONResponse(content=context_payload(chart_data), status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/context/solar-return", response_model=ReturnContextResponseModel)
async def solar_return_context(
    request_body: PlanetaryReturnDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/solar-return`

    Calculates the solar return and returns data with AI-optimized context.

    **Parameters:**
    - `subject`: SubjectModel (natal)
    - `year` or `month`+`year` or `iso_datetime`
    - `wheel_type`: "dual"|"single" (affects data model)

    **Returns:**
    - `status`: "OK"
    - `context`: AI-optimized context string
    - `chart_data`: ChartDataModel
    - `return_type`: "Solar"
    - `wheel_type`: "dual" | "single"
    """
    log_request_with_body(
        logger, request, "Solar return context request", request_body.model_dump_json()
    )

    try:
        chart_data = calculate_return_chart_data(request_body, "Solar")
        payload = context_payload(chart_data)
        payload["return_type"] = "Solar"
        payload["wheel_type"] = request_body.wheel_type
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/context/lunar-return", response_model=ReturnContextResponseModel)
async def lunar_return_context(
    request_body: PlanetaryReturnDataRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/context/lunar-return`

    Calculates the lunar return and returns data with AI-optimized context.

    **Parameters:**
    - Same as solar-return context.

    **Returns:**
    - `status`: "OK"
    - `context`: AI-optimized context string
    - `chart_data`: ChartDataModel
    - `return_type`: "Lunar"
    - `wheel_type`: "dual" | "single"
    """
    log_request_with_body(
        logger, request, "Lunar return context request", request_body.model_dump_json()
    )

    try:
        chart_data = calculate_return_chart_data(request_body, "Lunar")
        payload = context_payload(chart_data)
        payload["return_type"] = "Lunar"
        payload["wheel_type"] = request_body.wheel_type
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/now/context", response_model=SubjectContextResponseModel)
async def now_context(
    request_body: NowSubjectRequestModel, request: Request
) -> JSONResponse:
    """
    **POST** `/api/v5/now/context`

    Returns an astrological subject with AI context for the current UTC time at Greenwich.

    **Parameters:**
    - `name`, `zodiac_type`, `sidereal_mode`, `perspective_type`, `houses_system_identifier`

    **Returns:**
    - `status`: "OK"
    - `subject_context`: AI-optimized context string
    - `subject`: AstrologicalSubjectModel (serialized)
    """
    log_request_with_body(
        logger, request, "Current context request", request_body.model_dump_json()
    )

    try:
        try:
            utc_datetime = get_time_from_google()
        except Exception as time_exc:  # pragma: no cover - fallback path
            logger.warning("Falling back to system UTC time: %s", time_exc)
            utc_datetime = datetime.now(timezone.utc)

        subject = AstrologicalSubjectFactory.from_birth_data(
            name=request_body.name,
            year=utc_datetime.year,  # type: ignore[arg-type]
            month=utc_datetime.month,  # type: ignore[arg-type]
            day=utc_datetime.day,  # type: ignore[arg-type]
            hour=utc_datetime.hour,  # type: ignore[arg-type]
            minute=utc_datetime.minute,  # type: ignore[arg-type]
            seconds=utc_datetime.second,  # type: ignore[arg-type]
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

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)

# =============================================================================
# DEEPSEEK ANALYSIS ENDPOINT
# =============================================================================

class DeepSeekRequest(BaseModel):
    context: str
    vedic_summary: str = ""

@router.post("/api/v5/deepseek-analysis")
async def deepseek_analysis(request: DeepSeekRequest):
    """
    دریافت context و vedic_summary از فرانت، ارسال به DeepSeek از طریق OpenRouter و برگرداندن تحلیل.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set in environment")

    prompt = f"""
شما یک اخترشناس حرفه‌ای و با تجربه هستید که به طالع‌بینی ودیک (Vedic Astrology) مسلط هستید.

بر اساس اطلاعات چارت تولد زیر، یک تحلیل کامل، دقیق و زیبا به زبان فارسی بنویسید.

**مهم:** از زبان ساده و روان استفاده کنید تا همه بتوانند متوجه شوند.

**اطلاعات چارت (خام):**
{request.context}

{request.vedic_summary}

---

## 📋 ساختار تحلیل (لطفاً دقیقاً به همین ترتیب):

### ۱. شخصیت کلی و ویژگی‌های روانشناختی
بر اساس خورشید (هویت)، ماه (احساسات) و برج طالع (نحوه برخورد با جهان)
نقاط قوت و ضعف، تأثیر ناکشاترای ماه

### ۲. حوزه‌های شغلی و تحصیلی
بر اساس خورشید (اهداف)، مریخ (انرژی)، خانه‌های ۱۰، ۶، ۲
استعدادها و زمینه‌های شغلی مناسب

### ۳. روابط عاطفی و اجتماعی
بر اساس ماه (نیازهای عاطفی)، ناهید (عشق)، خانه‌های ۷، ۵، ۱۲
سبک ارتباطی و الگوهای رفتاری

### ۴. چالش‌ها و فرصت‌ها
بر اساس سیارات چالش‌برانگیز (Dusthana Lords، Marakas، Neecha)
راه‌های تبدیل چالش به فرصت

### ۵. توصیه‌های کاربردی و جمع‌بندی
۵ توصیه عملی برای رشد شخصی
جمع‌بندی کلی و پیام نهایی الهام‌بخش

---

**نکات نگارش:**
- از تکرار خودداری کنید.
- از HTML برای ساختاردهی استفاده کنید (<h2>، <h3>، <ul>، <li>، <hr>).
- لحن گرم، دوستانه و الهام‌بخش باشد.
"""

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek/deepseek-chat",
                "messages": [
                    {"role": "system", "content": "شما یک اخترشناس حرفه‌ای هستید که به زبان فارسی تحلیل‌های دقیق و روان ارائه می‌دهید. از HTML برای ساختاردهی خروجی استفاده کنید."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.75,
                "max_tokens": 4000,
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="خطا در ارتباط با OpenRouter")
        data = response.json()
        return {"analysis": data["choices"][0]["message"]["content"]}