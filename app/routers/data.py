"""
Chart data endpoints - JSON data only.

All endpoints that return chart data without SVG rendering via /api/v5/chart-data/*.
"""

from datetime import datetime, timezone
from logging import getLogger
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from ..types.request_models import (
    BirthDataRequestModel,
    BirthChartDataRequestModel,
    NowSubjectRequestModel,
    SynastryChartDataRequestModel,
    CompositeChartDataRequestModel,
    TransitChartDataRequestModel,
    PlanetaryReturnDataRequestModel,
)
from ..types.response_models import (
    ChartDataResponseModel,
    SubjectResponseModel,
    CompatibilityScoreResponseModel,
)
from ..utils.get_time_from_google import get_time_from_google
from ..utils.router_utils import (
    build_subject,
    calculate_return_chart_data,
    chart_data_payload,
    create_natal_chart_data,
    create_synastry_chart_data,
    create_composite_chart_data,
    create_transit_chart_data,
    dump,
    handle_exception,
    resolve_active_points,
)
from ..utils.logging_utils import log_request_with_body
from kerykeion import AstrologicalSubjectFactory

# ============================================================
# 🔮 افزودن سرویس Vedic
# ============================================================
from ..services.vedic_service import VedicDB

logger = getLogger(__name__)
router = APIRouter()


# ============================================================

# Interpretation Loader (reads from shared JSON - single source of truth)

# ============================================================

from pathlib import Path

import json



_INTERPRETATIONS_FILE = Path(__file__).resolve().parent.parent.parent / "static" / "interpretations.json"

_INTERPRETATIONS_CACHE: dict = {}





def _load_interpretations() -> dict:

    """Load interpretations from shared JSON file (cached after first read)."""

    global _INTERPRETATIONS_CACHE

    if not _INTERPRETATIONS_CACHE:

        with open(_INTERPRETATIONS_FILE, "r", encoding="utf-8") as f:

            _INTERPRETATIONS_CACHE = json.load(f)

    return _INTERPRETATIONS_CACHE





def _get_interpretation(chart_type: str, score: int) -> dict:

    """Look up interpretation by chart type and score from shared JSON."""

    data = _load_interpretations()

    ranges = data.get(chart_type, [])

    for r in ranges:

        if r["low"] <= score <= r["high"]:

            return {"level": r["level"], "title": r["title"], "text": r["text"]}

    return {"level": "نامشخص", "title": "❓", "text": "امتیاز خارج از محدوده است."}





def get_composite_interpretation(score: int) -> dict:

    return _get_interpretation("composite", score)





def get_transit_interpretation(score: int) -> dict:

    return _get_interpretation("transit", score)





def get_solar_return_interpretation(score: int) -> dict:

    return _get_interpretation("solar_return", score)





def get_lunar_return_interpretation(score: int) -> dict:

    return _get_interpretation("lunar_return", score)



@router.post("/api/v5/subject", response_model=SubjectResponseModel)
async def subject_data(birth_data_request: BirthDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/subject`

    Builds and returns an astrological subject.

    **Parameters:**
    - `subject`: SubjectModel (offline preferred or GeoNames via geonames_username)

    **Returns:**
    - `status`: "OK"
    - `subject`: AstrologicalSubjectModel (serialized)
    """
    log_request_with_body(logger, request, "Subject data request", birth_data_request.model_dump_json())

    try:
        active_points = resolve_active_points(birth_data_request.active_points)
        subject = build_subject(birth_data_request.subject, active_points=active_points)
        return JSONResponse(content={"status": "OK", "subject": dump(subject)}, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/subject", response_model=SubjectResponseModel)
async def subject_data(birth_data_request: BirthDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/subject`

    Builds and returns an astrological subject.

    **Parameters:**
    - `subject`: SubjectModel (offline preferred or GeoNames via geonames_username)

    **Returns:**
    - `status`: "OK"
    - `subject`: AstrologicalSubjectModel (serialized)
    """
    log_request_with_body(logger, request, "Subject data request", birth_data_request.model_dump_json())

    try:
        active_points = resolve_active_points(birth_data_request.active_points)
        subject = build_subject(birth_data_request.subject, active_points=active_points)
        return JSONResponse(content={"status": "OK", "subject": dump(subject)}, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/now/subject", response_model=SubjectResponseModel)
async def now_subject(request_body: NowSubjectRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/now/subject`

    Returns an astrological subject for the current UTC time at Greenwich.

    **Parameters:**
    - `name`, `zodiac_type`, `sidereal_mode`, `perspective_type`, `houses_system_identifier`

    **Returns:**
    - `status`: "OK"
    - `subject`: AstrologicalSubjectModel
    """
    log_request_with_body(logger, request, "Current subject request", request_body.model_dump_json())

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

        return JSONResponse(content={"status": "OK", "subject": dump(subject)}, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/compatibility-score", response_model=CompatibilityScoreResponseModel)
async def compatibility_score(request_body: SynastryChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/compatibility-score`

    Calculates Ciro Discepolo compatibility score between two subjects.

    **Parameters:**
    - `first_subject`, `second_subject`: SubjectModel
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `score`: Compatibility score value
    - `score_description`: Text description of score
    - `is_destiny_sign`: Boolean indicating destiny sign relationship
    - `aspects`: List of aspects used in score calculation
    - `chart_data`: Full synastry chart data
    """
    log_request_with_body(logger, request, "Compatibility score request", request_body.model_dump_json())

    try:
        chart_data = await create_synastry_chart_data(request_body)

        if not chart_data.relationship_score:  # pragma: no cover - defensive
            raise ValueError("Relationship score computation failed")

        return JSONResponse(
            content={
                "status": "OK",
                "score": chart_data.relationship_score.score_value,
                "score_description": chart_data.relationship_score.score_description,
                "is_destiny_sign": chart_data.relationship_score.is_destiny_sign,
                "aspects": dump(chart_data.relationship_score.aspects),
                "score_breakdown": dump(chart_data.relationship_score.score_breakdown),
                "chart_data": dump(chart_data),
            },
            status_code=200,
        )

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


# ============================================================
# 🔮 اصلاح شده: اضافه کردن تفسیرهای Vedic + Nakshatra + Drishti
# ============================================================
@router.post("/api/v5/chart-data/birth-chart", response_model=ChartDataResponseModel)
async def natal_chart_data(request_body: BirthChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/birth-chart`

    Returns full natal chart data without SVG rendering.

    **Parameters:**
    - `subject`: SubjectModel
    - `active_points` / `active_aspects` (optional overrides)
    - `distribution_method`, `custom_distribution_weights` (optional)

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    - `vedic_interpretations`: تفسیرهای ودیک + ناکشاترا + دریشتی
    """
    log_request_with_body(logger, request, "Natal chart data request", request_body.model_dump_json())

    try:
        # ۱. ایجاد چارت اصلی
        chart_data = await create_natal_chart_data(request_body)

        # ۲. ایجاد نمونه از دیتابیس Vedic (Singleton)
        vedic_db = VedicDB()

        # ۳. استخراج Lagna از چارت
        lagna_sign = None
        if hasattr(chart_data, 'subject') and chart_data.subject:
            asc_data = getattr(chart_data.subject, 'ascendant', None)
            if asc_data:
                lagna_sign = getattr(asc_data, 'sign', None)
                print(f"[DEBUG] Lagna استخراج شد: {lagna_sign}")

        vedic_interpretations = {}

        # ۴. اگر Lagna وجود داشت، برای هر سیاره تفسیر بگیر
        if lagna_sign:
            # لیست سیارات (۹ سیاره)
            planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']

            for planet in planets:
                # داده‌های سیاره را از subject بگیر
                planet_data = getattr(chart_data.subject, planet.lower(), None)
                if planet_data:
                    sign = getattr(planet_data, 'sign', None)
                    house = getattr(planet_data, 'house', None)
                    position = getattr(planet_data, 'position', None)  # درجه در برج
                    
                    if sign and house:
                        # تبدیل house به عدد (مثلاً "Tenth_House" -> "10")
                        house_num = house.replace('_House', '')
                        vedic_interpretations[planet] = vedic_db.get_full_interpretation(
                            planet=planet,
                            sign=sign,
                            house=house_num,  # 👈 به‌عنوان رشته ارسال می‌شود، ولی در تابع به عدد تبدیل می‌شود
                            lagna_sign=lagna_sign,
                            sign_degree=position
                        )
                        print(f"[DEBUG] تفسیر برای {planet} در {sign} خانه {house_num} با Lagna {lagna_sign}")

        # ۵. ساخت payload و اضافه کردن تفسیرهای Vedic
        payload = chart_data_payload(chart_data)
        payload['vedic_interpretations'] = vedic_interpretations

        return JSONResponse(content=payload, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/synastry", response_model=ChartDataResponseModel)
async def synastry_chart_data(request_body: SynastryChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/synastry`

    Returns synastry chart data comparing two subjects; no SVG rendering.

    **Parameters:**
    - `first_subject`, `second_subject`: SubjectModel
    - `include_house_comparison`, `include_relationship_score` (flags)
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Synastry chart data request", request_body.model_dump_json())

    try:
        chart_data = await create_synastry_chart_data(request_body)
        payload = chart_data_payload(chart_data)
        # Add synastry interpretation based on relationship score
        rs = getattr(chart_data, 'relationship_score', None)
        if rs and hasattr(rs, 'score_value'):
            payload['interpretation'] = _get_interpretation('synastry', rs.score_value)
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/composite", response_model=ChartDataResponseModel)
async def composite_chart_data(request_body: CompositeChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/composite`

    Returns midpoint composite chart data (no SVG rendering).

    **Parameters:**
    - `first_subject`, `second_subject`
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Composite chart data request", request_body.model_dump_json())

    try:
        chart_data = await create_composite_chart_data(request_body)
        payload = chart_data_payload(chart_data)
        # Calculate composite score from aspects
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0
        weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None:
                continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w
            weighted += av * w
        if total_w > 0:
            normalized = weighted / (total_w * 4)
            score = max(5, min(95, round(50 + normalized * 45)))
        else:
            score = 50
        interpretation = get_composite_interpretation(score)
        payload['composite_score'] = score
        payload['interpretation'] = interpretation
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/transit", response_model=ChartDataResponseModel)
async def transit_chart_data(request_body: TransitChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/transit`

    Returns transit analysis data (current/selected transits to natal chart), no SVG.

    **Parameters:**
    - `first_subject`: SubjectModel (natal)
    - `transit_subject`: SubjectModel (transit moment)
    - `include_house_comparison` flag

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Transit chart data request", request_body.model_dump_json())

    try:
        chart_data = await create_transit_chart_data(request_body)
        payload = chart_data_payload(chart_data)
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0; weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None: continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w; weighted += av * w
        score = max(5, min(95, round(50 + (weighted / (total_w * 4)) * 45))) if total_w > 0 else 50
        payload['chart_score'] = score
        payload['interpretation'] = get_transit_interpretation(score)
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/solar-return", response_model=ChartDataResponseModel)
async def solar_return_data(request_body: PlanetaryReturnDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/solar-return`

    Calculates the solar return for a given year/month/instant and returns data only.

    **Parameters:**
    - `subject`: SubjectModel (natal)
    - `year` or `month`+`year` or `iso_datetime`
    - `wheel_type`: "dual"|"single" (affects data model)

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Solar return data request", request_body.model_dump_json())

    try:
        chart_data = await calculate_return_chart_data(request_body, "Solar")
        payload = chart_data_payload(chart_data)
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0; weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None: continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w; weighted += av * w
        score = max(5, min(95, round(50 + (weighted / (total_w * 4)) * 45))) if total_w > 0 else 50
        payload['chart_score'] = score
        payload['interpretation'] = get_solar_return_interpretation(score)
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/lunar-return", response_model=ChartDataResponseModel)
async def lunar_return_data(request_body: PlanetaryReturnDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/lunar-return`

    Calculates the lunar return and returns data only.

    **Parameters:**
    - Same as solar-return chart-data.

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Lunar return data request", request_body.model_dump_json())

    try:
        chart_data = await calculate_return_chart_data(request_body, "Lunar")
        payload = chart_data_payload(chart_data)
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0; weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None: continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w; weighted += av * w
        score = max(5, min(95, round(50 + (weighted / (total_w * 4)) * 45))) if total_w > 0 else 50
        payload['chart_score'] = score
        payload['interpretation'] = get_lunar_return_interpretation(score)
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/subject", response_model=SubjectResponseModel)
async def subject_data(birth_data_request: BirthDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/subject`

    Builds and returns an astrological subject.

    **Parameters:**
    - `subject`: SubjectModel (offline preferred or GeoNames via geonames_username)

    **Returns:**
    - `status`: "OK"
    - `subject`: AstrologicalSubjectModel (serialized)
    """
    log_request_with_body(logger, request, "Subject data request", birth_data_request.model_dump_json())

    try:
        active_points = resolve_active_points(birth_data_request.active_points)
        subject = build_subject(birth_data_request.subject, active_points=active_points)
        return JSONResponse(content={"status": "OK", "subject": dump(subject)}, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/now/subject", response_model=SubjectResponseModel)
async def now_subject(request_body: NowSubjectRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/now/subject`

    Returns an astrological subject for the current UTC time at Greenwich.

    **Parameters:**
    - `name`, `zodiac_type`, `sidereal_mode`, `perspective_type`, `houses_system_identifier`

    **Returns:**
    - `status`: "OK"
    - `subject`: AstrologicalSubjectModel
    """
    log_request_with_body(logger, request, "Current subject request", request_body.model_dump_json())

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

        return JSONResponse(content={"status": "OK", "subject": dump(subject)}, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/compatibility-score", response_model=CompatibilityScoreResponseModel)
async def compatibility_score(request_body: SynastryChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/compatibility-score`

    Calculates Ciro Discepolo compatibility score between two subjects.

    **Parameters:**
    - `first_subject`, `second_subject`: SubjectModel
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `score`: Compatibility score value
    - `score_description`: Text description of score
    - `is_destiny_sign`: Boolean indicating destiny sign relationship
    - `aspects`: List of aspects used in score calculation
    - `chart_data`: Full synastry chart data
    """
    log_request_with_body(logger, request, "Compatibility score request", request_body.model_dump_json())

    try:
        chart_data = await create_synastry_chart_data(request_body)

        if not chart_data.relationship_score:  # pragma: no cover - defensive
            raise ValueError("Relationship score computation failed")

        return JSONResponse(
            content={
                "status": "OK",
                "score": chart_data.relationship_score.score_value,
                "score_description": chart_data.relationship_score.score_description,
                "is_destiny_sign": chart_data.relationship_score.is_destiny_sign,
                "aspects": dump(chart_data.relationship_score.aspects),
                "score_breakdown": dump(chart_data.relationship_score.score_breakdown),
                "chart_data": dump(chart_data),
            },
            status_code=200,
        )

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


# ============================================================
# 🔮 اصلاح شده: اضافه کردن تفسیرهای Vedic + Nakshatra + Drishti
# ============================================================
@router.post("/api/v5/chart-data/birth-chart", response_model=ChartDataResponseModel)
async def natal_chart_data(request_body: BirthChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/birth-chart`

    Returns full natal chart data without SVG rendering.

    **Parameters:**
    - `subject`: SubjectModel
    - `active_points` / `active_aspects` (optional overrides)
    - `distribution_method`, `custom_distribution_weights` (optional)

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    - `vedic_interpretations`: تفسیرهای ودیک + ناکشاترا + دریشتی
    """
    log_request_with_body(logger, request, "Natal chart data request", request_body.model_dump_json())

    try:
        # ۱. ایجاد چارت اصلی
        chart_data = await create_natal_chart_data(request_body)

        # ۲. ایجاد نمونه از دیتابیس Vedic (Singleton)
        vedic_db = VedicDB()

        # ۳. استخراج Lagna از چارت
        lagna_sign = None
        if hasattr(chart_data, 'subject') and chart_data.subject:
            asc_data = getattr(chart_data.subject, 'ascendant', None)
            if asc_data:
                lagna_sign = getattr(asc_data, 'sign', None)
                print(f"[DEBUG] Lagna استخراج شد: {lagna_sign}")

        vedic_interpretations = {}

        # ۴. اگر Lagna وجود داشت، برای هر سیاره تفسیر بگیر
        if lagna_sign:
            # لیست سیارات (۹ سیاره)
            planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']

            for planet in planets:
                # داده‌های سیاره را از subject بگیر
                planet_data = getattr(chart_data.subject, planet.lower(), None)
                if planet_data:
                    sign = getattr(planet_data, 'sign', None)
                    house = getattr(planet_data, 'house', None)
                    position = getattr(planet_data, 'position', None)  # درجه در برج
                    
                    if sign and house:
                        # تبدیل house به عدد (مثلاً "Tenth_House" -> "10")
                        house_num = house.replace('_House', '')
                        vedic_interpretations[planet] = vedic_db.get_full_interpretation(
                            planet=planet,
                            sign=sign,
                            house=house_num,  # 👈 به‌عنوان رشته ارسال می‌شود، ولی در تابع به عدد تبدیل می‌شود
                            lagna_sign=lagna_sign,
                            sign_degree=position
                        )
                        print(f"[DEBUG] تفسیر برای {planet} در {sign} خانه {house_num} با Lagna {lagna_sign}")

        # ۵. ساخت payload و اضافه کردن تفسیرهای Vedic
        payload = chart_data_payload(chart_data)
        payload['vedic_interpretations'] = vedic_interpretations

        return JSONResponse(content=payload, status_code=200)

    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)



@router.post("/api/v5/chart-data/composite", response_model=ChartDataResponseModel)
async def composite_chart_data(request_body: CompositeChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/composite`

    Returns midpoint composite chart data (no SVG rendering).

    **Parameters:**
    - `first_subject`, `second_subject`
    - `active_points` / `active_aspects` overrides

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Composite chart data request", request_body.model_dump_json())

    try:
        chart_data = await create_composite_chart_data(request_body)
        payload = chart_data_payload(chart_data)
        # Calculate composite score from aspects
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0
        weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None:
                continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w
            weighted += av * w
        if total_w > 0:
            normalized = weighted / (total_w * 4)
            score = max(5, min(95, round(50 + normalized * 45)))
        else:
            score = 50
        interpretation = get_composite_interpretation(score)
        payload['composite_score'] = score
        payload['interpretation'] = interpretation
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/transit", response_model=ChartDataResponseModel)
async def transit_chart_data(request_body: TransitChartDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/transit`

    Returns transit analysis data (current/selected transits to natal chart), no SVG.

    **Parameters:**
    - `first_subject`: SubjectModel (natal)
    - `transit_subject`: SubjectModel (transit moment)
    - `include_house_comparison` flag

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Transit chart data request", request_body.model_dump_json())

    try:
        chart_data = await create_transit_chart_data(request_body)
        payload = chart_data_payload(chart_data)
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0; weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None: continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w; weighted += av * w
        score = max(5, min(95, round(50 + (weighted / (total_w * 4)) * 45))) if total_w > 0 else 50
        payload['chart_score'] = score
        payload['interpretation'] = get_composite_interpretation(score)  # Reuse same structure
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/solar-return", response_model=ChartDataResponseModel)
async def solar_return_data(request_body: PlanetaryReturnDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/solar-return`

    Calculates the solar return for a given year/month/instant and returns data only.

    **Parameters:**
    - `subject`: SubjectModel (natal)
    - `year` or `month`+`year` or `iso_datetime`
    - `wheel_type`: "dual"|"single" (affects data model)

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Solar return data request", request_body.model_dump_json())

    try:
        chart_data = await calculate_return_chart_data(request_body, "Solar")
        payload = chart_data_payload(chart_data)
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0; weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None: continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w; weighted += av * w
        score = max(5, min(95, round(50 + (weighted / (total_w * 4)) * 45))) if total_w > 0 else 50
        payload['chart_score'] = score
        payload['interpretation'] = get_solar_return_interpretation(score)
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)


@router.post("/api/v5/chart-data/lunar-return", response_model=ChartDataResponseModel)
async def lunar_return_data(request_body: PlanetaryReturnDataRequestModel, request: Request) -> JSONResponse:
    """
    **POST** `/api/v5/chart-data/lunar-return`

    Calculates the lunar return and returns data only.

    **Parameters:**
    - Same as solar-return chart-data.

    **Returns:**
    - `status`: "OK"
    - `chart_data`: ChartDataModel
    """
    log_request_with_body(logger, request, "Lunar return data request", request_body.model_dump_json())

    try:
        chart_data = await calculate_return_chart_data(request_body, "Lunar")
        payload = chart_data_payload(chart_data)
        aspects = getattr(chart_data, 'aspects', []) or []
        aspect_value = {'trine': 4, 'sextile': 2.5, 'conjunction': 3, 'square': -4, 'opposition': -3.5}
        planet_weight = {'Sun': 3, 'Moon': 3, 'Mercury': 2.5, 'Venus': 2.5, 'Mars': 2, 'Jupiter': 1.5, 'Saturn': 1.2}
        total_w = 0; weighted = 0.0
        for a in aspects:
            av = aspect_value.get(a.get('aspect', '').lower())
            if av is None: continue
            w = planet_weight.get(a.get('p1_name', ''), 1) * planet_weight.get(a.get('p2_name', ''), 1)
            total_w += w; weighted += av * w
        score = max(5, min(95, round(50 + (weighted / (total_w * 4)) * 45))) if total_w > 0 else 50
        payload['chart_score'] = score
        payload['interpretation'] = get_lunar_return_interpretation(score)
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:  # pragma: no cover - defensive
        return await handle_exception(exc, request)