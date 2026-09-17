from __future__ import annotations

import asyncio
import json
from logging import getLogger
from typing import Optional, Sequence, Union

from fastapi import Request
from fastapi.responses import JSONResponse
from kerykeion import (
    AstrologicalSubjectFactory,
    ChartDataFactory,
    ChartDrawer,
    CompositeSubjectFactory,
    MoonPhaseDetailsFactory,
    to_context,
)
from kerykeion.planetary_return_factory import PlanetaryReturnFactory
from kerykeion.schemas import ActiveAspect, KerykeionException
from kerykeion.settings.config_constants import (
    DEFAULT_ACTIVE_ASPECTS,
    DEFAULT_ACTIVE_POINTS,
)

from kerykeion.schemas.kr_models import MoonPhaseOverviewModel

from ..services.geo_service import GeoService
from ..types.request_models import (
    BirthChartDataRequestModel,
    BirthChartRequestModel,
    CompositeChartDataRequestModel,
    CompositeChartRequestModel,
    MoonPhaseRequestModel,
    PlanetaryReturnDataRequestModel,
    PlanetaryReturnRequestModel,
    SubjectModel,
    SynastryChartDataRequestModel,
    SynastryChartRequestModel,
    TransitChartDataRequestModel,
    TransitChartRequestModel,
)

logger = getLogger(__name__)

# Shared Geo API service instance
_geo_service = GeoService()

GEONAMES_HINT = (
    "You can create a free GeoNames username at https://www.geonames.org/login/. "
    "To bypass GeoNames, provide latitude, longitude, and timezone directly and remove the geonames_username field."
)

_SUBJECT_LOCATION_PATHS = (
    ("subject",),
    ("first_subject",),
    ("second_subject",),
    ("transit_subject",),
    ("return_location",),
)


def normalize_coordinate(value: Optional[float]) -> Optional[float]:
    """
    Normalize coordinate values to avoid zero division or other numerical issues.

    Args:
        value (Optional[float]): The coordinate value to normalize.

    Returns:
        Optional[float]: The normalized coordinate value, or None if input is None.
                         Values close to zero are adjusted to +/- 1e-6.
    """
    if value is None:
        return None
    if abs(value) < 1e-6:
        return 1e-6 if value >= 0 else -1e-6
    return value


def dump(value: object) -> object:
    """
    Recursively dump Pydantic models to dictionaries.

    Args:
        value: The value to dump (can be a Pydantic model, list, tuple, or primitive).

    Returns:
        The dumped value as a dictionary or primitive type.
    """
    if isinstance(value, list):
        return [dump(item) for item in value]
    if isinstance(value, tuple):
        return tuple(dump(item) for item in value)
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return value


def resolve_nation(value: Optional[str]) -> Optional[str]:
    """
    Resolve nation code to uppercase or None.

    Args:
        value (Optional[str]): The nation code.

    Returns:
        Optional[str]: The uppercase nation code, or None if input is invalid/null.
    """
    if not value or value.lower() == "null":
        return None
    return value.upper()


def resolve_active_points(points: Optional[Sequence[str]]) -> list[str]:
    """
    Resolve active points, falling back to defaults if not provided.

    Args:
        points (Optional[Sequence[str]]): List of active points.

    Returns:
        list[str]: The resolved list of active points.
    """
    if points:
        return list(points)
    return list(DEFAULT_ACTIVE_POINTS)


def resolve_active_aspects(aspects: Optional[Sequence[ActiveAspect]]) -> list[dict]:
    """
    Resolve active aspects, falling back to defaults if not provided.

    Args:
        aspects (Optional[Sequence[ActiveAspect]]): List of active aspects.

    Returns:
        list[dict]: The resolved list of active aspects as dictionaries.
    """
    if aspects:
        return [dict(aspect) for aspect in aspects]
    return [dict(item) for item in DEFAULT_ACTIVE_ASPECTS]


async def try_geo_api_resolution(
    city: Optional[str],
    nation: Optional[str],
) -> Optional[dict]:
    """
    Try to resolve city coordinates using the Geo API (primary source).

    Args:
        city: City name.
        nation: Optional ISO country code.

    Returns:
        Dict with lat, lng, timezone on success, or None on failure.
    """
    if not city:
        return None

    result = await _geo_service.get_coordinates(city, nation)
    if "error" in result:
        logger.warning("Geo API failed for city=%r, nation=%r: %s", city, nation, result["error"])
        return None

    lat = result.get("lat")
    lng = result.get("lng")
    tz = result.get("timezone")

    if not all([lat, lng, tz]):
        logger.warning("Geo API returned incomplete data for city=%r: %s", city, result)
        return None

    logger.info(
        "Geo API resolved city=%r -> lat=%.4f, lng=%.4f, tz=%s",
        city, lat, lng, tz,
    )
    return {"lat": lat, "lng": lng, "timezone": tz}


async def resolve_location_for_subject(
    subject_request: SubjectModel,
) -> None:
    """
    Resolve missing location fields on a SubjectModel.

    Strategy:
      1. If lat, lng, and timezone are all provided → no resolution needed.
      2. If coords are missing → try Geo API (primary).
      3. If Geo API fails and geonames_username is set → fall back to GeoNames.
      4. If Geo API fails and no geonames_username → raise an error.

    This function mutates the subject_request in-place, filling in
    latitude, longitude, and timezone from the Geo API when possible.
    """
    lat = subject_request.latitude
    lng = subject_request.longitude
    tz = subject_request.timezone
    city = subject_request.city
    nation = subject_request.nation
    geonames = subject_request.geonames_username

    # All coords already present — nothing to do
    if lat is not None and lng is not None and tz is not None:
        return

    # Try Geo API first (primary source)
    geo_result = await try_geo_api_resolution(city, nation)
    if geo_result:
        if subject_request.latitude is None:
            subject_request.latitude = geo_result["lat"]
        if subject_request.longitude is None:
            subject_request.longitude = geo_result["lng"]
        if subject_request.timezone is None:
            subject_request.timezone = geo_result["timezone"]
        # Geo API succeeded — clear geonames_username so kerykeion uses offline mode
        subject_request.geonames_username = None
        logger.info(
            "Location resolved via Geo API for city=%r: lat=%.4f, lng=%.4f, tz=%s",
            city, subject_request.latitude, subject_request.longitude, subject_request.timezone,
        )
        return

    # Geo API failed — fall back to GeoNames if available
    if geonames:
        logger.info(
            "Geo API failed for city=%r, falling back to GeoNames",
            city,
        )
        # Clear any partial coords so kerykeion resolves everything via GeoNames
        subject_request.latitude = None
        subject_request.longitude = None
        subject_request.timezone = None
        return

    # Geo API failed and no GeoNames username — raise a clear error
    raise KerykeionException(
        f"Could not resolve coordinates for city '{city}'. "
        "The Geo API is currently unavailable and no GeoNames username was provided. "
        "Please provide latitude, longitude, and timezone directly, "
        "or include a geonames_username for fallback resolution."
    )


async def resolve_location_for_return_location(
    location,
) -> None:
    """
    Resolve missing location fields on a ReturnLocationModel.

    Same strategy as resolve_location_for_subject but for return locations.
    """
    lat = location.latitude
    lng = location.longitude
    tz = location.timezone
    city = location.city
    nation = location.nation
    geonames = location.geonames_username

    if lat is not None and lng is not None and tz is not None:
        return

    geo_result = await try_geo_api_resolution(city, nation)
    if geo_result:
        if location.latitude is None:
            location.latitude = geo_result["lat"]
        if location.longitude is None:
            location.longitude = geo_result["lng"]
        if location.timezone is None:
            location.timezone = geo_result["timezone"]
        location.geonames_username = None
        logger.info(
            "Return location resolved via Geo API for city=%r",
            city,
        )
        return

    if geonames:
        logger.info("Geo API failed for return city=%r, falling back to GeoNames", city)
        location.latitude = None
        location.longitude = None
        location.timezone = None
        return

    raise KerykeionException(
        f"Could not resolve coordinates for return city '{city}'. "
        "The Geo API is currently unavailable and no GeoNames username was provided."
    )


def build_subject(
    subject_request: SubjectModel, *, active_points: Optional[Sequence[str]] = None
) -> object:
    """
    Build an AstrologicalSubject instance from a request model.

    Args:
        subject_request (SubjectModel): The subject data from the request.
        active_points (Optional[Sequence[str]]): Optional list of active points to override defaults.

    Returns:
        AstrologicalSubject: The constructed astrological subject.
    """
    resolved_points = resolve_active_points(active_points)
    online = bool(subject_request.geonames_username)

    return AstrologicalSubjectFactory.from_birth_data(
        name=subject_request.name,
        year=subject_request.year,
        month=subject_request.month,
        day=subject_request.day,
        hour=subject_request.hour,
        minute=subject_request.minute,
        seconds=subject_request.second or 0,
        city=subject_request.city,
        nation=resolve_nation(subject_request.nation) or "GB",
        lng=subject_request.longitude,
        lat=subject_request.latitude,
        tz_str=subject_request.timezone,
        geonames_username=subject_request.geonames_username,
        online=online,
        zodiac_type=subject_request.zodiac_type or "Tropical",
        sidereal_mode=subject_request.sidereal_mode,
        houses_system_identifier=subject_request.houses_system_identifier or "P",
        perspective_type=subject_request.perspective_type or "Apparent Geocentric",
        is_dst=subject_request.is_dst,
        altitude=subject_request.altitude,
        active_points=resolved_points,
        suppress_geonames_warning=True,
        custom_ayanamsa_t0=subject_request.custom_ayanamsa_t0,
        custom_ayanamsa_ayan_t0=subject_request.custom_ayanamsa_ayan_t0,
    )


def build_transit_subject(
    transit_request,
    reference_subject,
    *,
    active_points: Optional[Sequence[str]] = None,
    custom_ayanamsa_t0: Optional[float] = None,
    custom_ayanamsa_ayan_t0: Optional[float] = None,
) -> object:
    """
    Build a Transit Subject instance, inheriting settings from a reference subject.

    Args:
        transit_request: The transit data request model.
        reference_subject: The reference (natal) subject to inherit settings from.
        active_points (Optional[Sequence[str]]): Optional list of active points.
        custom_ayanamsa_t0: Reference epoch for USER sidereal mode (from natal subject request).
        custom_ayanamsa_ayan_t0: Ayanamsa offset for USER sidereal mode (from natal subject request).

    Returns:
        AstrologicalSubject: The constructed transit subject.
    """
    resolved_points = resolve_active_points(active_points)
    online = bool(transit_request.geonames_username)

    return AstrologicalSubjectFactory.from_birth_data(
        name=transit_request.name or "Transit",
        year=transit_request.year,
        month=transit_request.month,
        day=transit_request.day,
        hour=transit_request.hour,
        minute=transit_request.minute,
        seconds=transit_request.second or 0,
        city=transit_request.city,
        nation=resolve_nation(transit_request.nation) or reference_subject.nation,
        lng=transit_request.longitude,
        lat=transit_request.latitude,
        tz_str=transit_request.timezone,
        geonames_username=transit_request.geonames_username,
        online=online,
        zodiac_type=reference_subject.zodiac_type,
        sidereal_mode=reference_subject.sidereal_mode,
        houses_system_identifier=reference_subject.houses_system_identifier,
        perspective_type=reference_subject.perspective_type,
        is_dst=transit_request.is_dst,
        altitude=transit_request.altitude,
        active_points=resolved_points,
        suppress_geonames_warning=True,
        custom_ayanamsa_t0=custom_ayanamsa_t0,
        custom_ayanamsa_ayan_t0=custom_ayanamsa_ayan_t0,
    )


def render_chart(
    chart_data,
    theme: Optional[str],
    language: Optional[str],
    split_chart: bool = False,
    transparent_background: bool = False,
    show_house_position_comparison: bool = True,
    show_cusp_position_comparison: bool = True,
    show_degree_indicators: bool = True,
    show_aspect_icons: bool = True,
    custom_title: Optional[str] = None,
    style: str = "classic",
    show_zodiac_background_ring: bool = True,
    double_chart_aspect_grid_type: str = "list",
) -> dict:
    """
    Render chart(s) based on configuration.

    Args:
        chart_data: The chart data object.
        theme (Optional[str]): The visual theme for the chart.
        language (Optional[str]): The language for chart labels.
        split_chart (bool): Whether to return separate wheel and grid SVGs.
        transparent_background (bool): Whether the chart background should be transparent.
        show_house_position_comparison (bool): Whether to show house comparison table.
        show_cusp_position_comparison (bool): Whether to show cusp position comparison table (dual charts).
        show_degree_indicators (bool): Whether to show radial lines and degree numbers for planets.
        show_aspect_icons (bool): Whether to show aspect icons on aspect lines.
        custom_title (Optional[str]): Custom title for the chart.
        style (str): Chart rendering style — 'classic' (traditional wheel) or 'modern' (concentric rings).
        show_zodiac_background_ring (bool): Show colored zodiac sign wedges (modern style only).
        double_chart_aspect_grid_type (str): Layout for double-chart aspects — 'list' or 'table'.

    Returns:
        dict: The complete payload with chart data and SVG strings.
    """
    drawer = ChartDrawer(
        chart_data=chart_data,
        theme=theme or "classic",
        chart_language=language or "EN",
        transparent_background=transparent_background,
        show_house_position_comparison=show_house_position_comparison,
        show_cusp_position_comparison=show_cusp_position_comparison,
        show_degree_indicators=show_degree_indicators,
        show_aspect_icons=show_aspect_icons,
        custom_title=custom_title,
        double_chart_aspect_grid_type=double_chart_aspect_grid_type,
        style=style,
        show_zodiac_background_ring=show_zodiac_background_ring,
    )

    if split_chart:
        return {
            "chart_wheel": drawer.generate_wheel_only_svg_string(minify=True),
            "chart_grid": drawer.generate_aspect_grid_only_svg_string(minify=True),
        }
    else:
        return {"chart": drawer.generate_svg_string(minify=True)}


def chart_data_payload(chart_data) -> dict:
    """
    Wrap chart data in a standard response payload.

    Args:
        chart_data: The chart data object.

    Returns:
        dict: The response payload containing status and dumped chart data.
    """
    return {
        "status": "OK",
        "chart_data": dump(chart_data),
    }


def chart_payload(
    chart_data,
    theme: Optional[str],
    language: Optional[str],
    split_chart: bool = False,
    transparent_background: bool = False,
    show_house_position_comparison: bool = True,
    show_cusp_position_comparison: bool = True,
    show_degree_indicators: bool = True,
    show_aspect_icons: bool = True,
    custom_title: Optional[str] = None,
    style: str = "classic",
    show_zodiac_background_ring: bool = True,
    double_chart_aspect_grid_type: str = "list",
) -> dict:
    """
    Generate a complete chart payload including data and rendered SVG(s).

    Args:
        chart_data: The chart data object.
        theme (Optional[str]): The visual theme for the chart.
        language (Optional[str]): The language for chart labels.
        split_chart (bool): Whether to return separate wheel and grid SVGs.
        transparent_background (bool): Whether the chart background should be transparent.
        show_house_position_comparison (bool): Whether to show house comparison table.
        show_cusp_position_comparison (bool): Whether to show cusp position comparison table (dual charts).
        show_degree_indicators (bool): Whether to show radial lines and degree numbers for planets.
        show_aspect_icons (bool): Whether to show aspect icons on aspect lines.
        custom_title (Optional[str]): Custom title for the chart.
        style (str): Chart rendering style — 'classic' (traditional wheel) or 'modern' (concentric rings).
        show_zodiac_background_ring (bool): Show colored zodiac sign wedges (modern style only).
        double_chart_aspect_grid_type (str): Layout for double-chart aspects — 'list' or 'table'.

    Returns:
        dict: The complete payload with chart data and SVG strings.
    """
    payload = chart_data_payload(chart_data)
    charts = render_chart(
        chart_data,
        theme,
        language,
        split_chart,
        transparent_background,
        show_house_position_comparison,
        show_cusp_position_comparison,
        show_degree_indicators,
        show_aspect_icons,
        custom_title,
        style,
        show_zodiac_background_ring,
        double_chart_aspect_grid_type,
    )
    payload.update(charts)
    return payload


def subject_context_payload(subject) -> dict:
    """
    Wrap subject data with AI-optimized context in a standard response payload.

    Args:
        subject: The astrological subject object.

    Returns:
        dict: The response payload containing status, subject_context, and subject.
    """
    return {
        "status": "OK",
        "subject_context": to_context(subject),
        "subject": dump(subject),
    }


def context_payload(chart_data) -> dict:
    """
    Wrap chart data with AI-optimized context in a standard response payload.

    Args:
        chart_data: The chart data object.

    Returns:
        dict: The response payload containing status, context, and chart_data.
    """
    xml = to_context(chart_data)
    brief = build_chart_brief(chart_data)
    return {
        "status": "OK",
        # ⚠ ai_brief اول context می‌آید: مسیر چت آن را به ۲۰۰۰ کاراکتر برش
        # می‌زند و زوایا/توزیع‌ها در انتهای XML خام همیشه دور ریخته می‌شدند
        "context": (brief + "\n" if brief else "") + xml,
        "chart_data": dump(chart_data),
    }


# ─── ai_brief — خلاصه تحلیلی فشرده ابتدای context (۲۰۲۶-۰۹-۱۵) ───
# kerykeion زوایا و توازن عنصر/کیفیت را محاسبه می‌کند ولی آخر XML خام
# می‌گذاردشان (از دیدِ مدل بریده‌شدنی)؛ حاکم چارت و خانه‌های خالی هم هیچ‌جا
# نیستند. این تابع هر دو را از همان داده‌های ازپیش‌حساب‌آمده بیرون می‌کشد.

_TRAD_RULERS = {
    0: ("Mars", None), 1: ("Venus", None), 2: ("Mercury", None), 3: ("Moon", None),
    4: ("Sun", None), 5: ("Mercury", None), 6: ("Venus", None), 7: ("Mars", "Pluto"),
    8: ("Jupiter", None), 9: ("Saturn", None), 10: ("Saturn", "Uranus"), 11: ("Jupiter", "Neptune"),
}
_SIGN_WORDS = (
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
)
_HOUSE_WORDS = (
    "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
    "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth",
)
_HOUSE_NUM = {w: i for i, w in enumerate(_HOUSE_WORDS) if i}
_MAJOR_ASPECTS = {"conjunction", "opposition", "trine", "square", "sextile"}
_OCCUPANT_ATTRS = (
    "sun", "moon", "mercury", "venus", "mars",
    "jupiter", "saturn", "uranus", "neptune", "pluto",
)


def _brief_sign(point) -> str:
    num = getattr(point, "sign_num", None)
    if isinstance(num, int) and 0 <= num <= 11:
        return _SIGN_WORDS[num]
    return str(getattr(point, "sign", "?"))


def _brief_house(point):
    h = getattr(point, "house", None)
    if not h:
        return None
    word = str(h).split(".")[-1].split("_")[0]
    return _HOUSE_NUM.get(word)


def build_chart_brief(chart_data) -> str:
    """بلوک XML فشرده (<ai_brief>) با داده‌ای که مدل باید ببیند:
    زوایای اصلیِ واقعی (سبک‌ترین اُرب‌ها)، سه‌گانه، حاکم چارت،
    توازن عنصر/کیفیت، خانه‌های خالی + حاکم‌شان، امتیاز رابطه (دوالی).
    هیچ‌وقت خطا نمی‌دهد — در بدترین حالت "" برمی‌گرداند."""
    try:
        lines = ["<ai_brief>"]

        majors = [a for a in (getattr(chart_data, "aspects", None) or [])
                  if str(a.aspect).lower() in _MAJOR_ASPECTS]
        majors.sort(key=lambda a: abs(a.orbit))
        if majors:
            items = []
            for a in majors[:14]:
                mv = str(a.aspect_movement or "").lower()
                if mv.startswith("appl"):
                    tag = " applying"
                elif mv.startswith("separ"):
                    tag = " separating"
                else:  # static و حالت‌های ناشناخته
                    tag = ""
                if a.p1_owner and a.p2_owner and a.p1_owner != a.p2_owner:
                    pair = f"{a.p1_owner}'s {a.p1_name} - {a.p2_owner}'s {a.p2_name}"
                else:
                    pair = f"{a.p1_name}-{a.p2_name}"
                items.append(f"{pair} {str(a.aspect).lower()} orb {abs(a.orbit):.1f}°{tag}")
            lines.append("aspects_top: " + "; ".join(items))

        subject = getattr(chart_data, "subject", None)
        if subject is not None:
            sun = getattr(subject, "sun", None)
            moon = getattr(subject, "moon", None)
            asc = getattr(subject, "ascendant", None)
            if sun is not None and moon is not None and asc is not None:
                lines.append(
                    f"big_three: Sun {_brief_sign(sun)} H{_brief_house(sun)} | "
                    f"Moon {_brief_sign(moon)} H{_brief_house(moon)} | "
                    f"Ascendant {_brief_sign(asc)}"
                )
                sign_num = getattr(asc, "sign_num", None)
                if isinstance(sign_num, int) and 0 <= sign_num <= 11:
                    ruler_name, modern = _TRAD_RULERS[sign_num]
                    ruler = getattr(subject, ruler_name.lower(), None)
                    extra = f" (modern: {modern})" if modern else ""
                    pos = (f" in {_brief_sign(ruler)}, H{_brief_house(ruler)}" if ruler is not None else "")
                    lines.append(f"chart_ruler: {ruler_name}{extra}{pos}")

                occupied = set()
                for attr in _OCCUPANT_ATTRS:
                    p = getattr(subject, attr, None)
                    if p is not None:
                        hn = _brief_house(p)
                        if hn:
                            occupied.add(hn)
                empties = []
                for n in range(1, 13):
                    if n in occupied:
                        continue
                    hp = getattr(subject, _HOUSE_WORDS[n].lower() + "_house", None)
                    if hp is not None:
                        rn, _m = _TRAD_RULERS.get(getattr(hp, "sign_num", 0) or 0, ("?", None))
                        empties.append(f"H{n} {_brief_sign(hp)} ruler {rn}")
                lines.append("empty_houses: " + (", ".join(empties) if empties else "none"))

        ed = getattr(chart_data, "element_distribution", None)
        if ed is not None:
            lines.append(
                f"element_balance: Fire {ed.fire_percentage}% Earth {ed.earth_percentage}% "
                f"Air {ed.air_percentage}% Water {ed.water_percentage}%"
            )
        qd = getattr(chart_data, "quality_distribution", None)
        if qd is not None:
            lines.append(
                f"quality_balance: Cardinal {qd.cardinal_percentage}% "
                f"Fixed {qd.fixed_percentage}% Mutable {qd.mutable_percentage}%"
            )
        rs = getattr(chart_data, "relationship_score", None)
        if rs is not None:
            lines.append(f"relationship_score: {rs.score_value}/44 {rs.score_description}")

        lines.append("</ai_brief>")
        return "\n".join(lines)
    except Exception as exc:  # هرگز context اصلی را فدای خلاصه نکن
        logger.warning("ai_brief build failed: %s", exc)
        return ""


def _classify_geonames_error(message: str) -> Optional[str]:
    """Classify a GeoNames-related error from the exception message.

    Returns one of: ``"city_not_found"``, ``"timeout"``,
    ``"connection_error"``, ``"missing_coordinates"``, or ``None``.
    """
    city_not_found_markers = (
        "Missing data from geonames",
        "No data found for this city",
        "data found for this city",
    )
    if any(m in message for m in city_not_found_markers):
        return "city_not_found"

    if "ConnectTimeout" in message or "ReadTimeout" in message:
        return "timeout"

    if "ConnectionError" in message or "Check your connection" in message:
        return "connection_error"

    if "You need to set the coordinates" in message:
        return "missing_coordinates"

    return None


def _extract_location_from_body(body_str: str) -> tuple[Optional[str], Optional[str]]:
    """Try to extract ``(city, nation)`` from a JSON request body.

    Walks the known subject paths (``subject``, ``first_subject``,
    ``second_subject``, ``transit_subject``, ``return_location``) and
    returns the city/nation from the first entry that has
    ``geonames_username`` set.
    """
    try:
        body = json.loads(body_str)
    except (json.JSONDecodeError, TypeError):
        return None, None

    if not isinstance(body, dict):
        return None, None

    for path in _SUBJECT_LOCATION_PATHS:
        node = body.get(path[0])
        if not isinstance(node, dict):
            continue
        if node.get("geonames_username"):
            return node.get("city"), node.get("nation")

    # Fallback: first subject with city/nation regardless of geonames
    for path in _SUBJECT_LOCATION_PATHS:
        node = body.get(path[0])
        if isinstance(node, dict) and node.get("city"):
            return node.get("city"), node.get("nation")

    return None, None


def _build_geonames_error_response(
    error_category: str,
    city: Optional[str],
    nation: Optional[str],
) -> tuple[int, dict]:
    """Return ``(status_code, response_dict)`` for a GeoNames error."""

    location_hint = ""
    if city or nation:
        parts = []
        if city:
            parts.append(f"city='{city}'")
        if nation:
            parts.append(f"nation='{nation}'")
        location_hint = f" for {', '.join(parts)}"

    if error_category == "city_not_found":
        msg = (
            f"No location data found{location_hint}. "
            "Verify the city name spelling and ensure the nation code matches "
            "the country where the city is located. The nation field uses "
            "ISO 3166-1 alpha-2 country codes (e.g. 'EG' for Egypt, 'US' for United States)."
        )
        status_code = 400
    elif error_category == "timeout":
        msg = (
            f"GeoNames API timed out while resolving{location_hint}. "
            "The service may be temporarily overloaded. Please retry in a few moments."
        )
        status_code = 504
    elif error_category == "connection_error":
        msg = (
            f"Unable to reach the GeoNames API while resolving{location_hint}. "
            "Please retry later."
        )
        status_code = 502
    elif error_category == "missing_coordinates":
        msg = (
            "You need to provide coordinates (latitude, longitude) and timezone "
            "for offline mode, or include a geonames_username for online resolution."
        )
        status_code = 400
    else:
        msg = (
            f"GeoNames lookup failed{location_hint}. "
            "Please check the city name, nation code, and your GeoNames username."
        )
        status_code = 400

    details = {"error_category": error_category}
    if city:
        details["city"] = city
    if nation:
        details["nation"] = nation

    return status_code, {
        "status": "ERROR",
        "message": msg,
        "error_type": "GeoNamesLookupError",
        "details": details,
        "hint": GEONAMES_HINT,
    }


async def handle_exception(exc: Exception, request: Request) -> JSONResponse:
    """
    Handle exceptions and return appropriate JSON responses.

    GeoNames errors get contextual messages with city/nation details and are
    logged at WARNING level. All other errors are logged at ERROR with full
    traceback.

    Args:
        exc (Exception): The exception raised.
        request (Request): The incoming request object.

    Returns:
        JSONResponse: The error response with appropriate status code and message.
    """
    message = str(exc).strip() or exc.__class__.__name__

    # Read the request body once — used for both logging and context extraction.
    try:
        body = await request.body()
        body_str = body.decode("utf-8") if body else "Empty body"
    except Exception as body_exc:
        logger.error(
            "%s: %s | Failed to read request body: %s",
            request.url, message, body_exc, exc_info=True,
        )
        body_str = "Empty body"

    # --- GeoNames-specific path ---
    geonames_category = _classify_geonames_error(message)
    if geonames_category is not None:
        city, nation = _extract_location_from_body(body_str)
        logger.warning(
            "GeoNames %s for city=%r, nation=%r at %s",
            geonames_category, city, nation, request.url,
        )
        status_code, content = _build_geonames_error_response(
            geonames_category, city, nation,
        )
        return JSONResponse(content=content, status_code=status_code)

    # --- Generic error path ---
    logger.error(
        "%s: %s | Request body: %s", request.url, message, body_str, exc_info=True,
    )
    status_code = 400 if isinstance(exc, KerykeionException) else 500
    return JSONResponse(
        content={
            "status": "ERROR",
            "message": message,
            "error_type": exc.__class__.__name__,
        },
        status_code=status_code,
    )


def build_return_factory(
    natal_subject,
    request_body: Union[PlanetaryReturnRequestModel, PlanetaryReturnDataRequestModel],
) -> PlanetaryReturnFactory:
    """
    Build a PlanetaryReturnFactory based on request parameters.

    Args:
        natal_subject: The natal subject.
        request_body: The request body containing return location and settings.

    Returns:
        PlanetaryReturnFactory: The factory instance for calculating returns.
    """
    location = request_body.return_location

    # Extract custom ayanamsa params from the natal subject request for USER sidereal mode
    custom_ayanamsa_kwargs: dict = {}
    if hasattr(request_body, "subject") and hasattr(
        request_body.subject, "custom_ayanamsa_t0"
    ):
        if request_body.subject.custom_ayanamsa_t0 is not None:
            custom_ayanamsa_kwargs["custom_ayanamsa_t0"] = (
                request_body.subject.custom_ayanamsa_t0
            )
        if request_body.subject.custom_ayanamsa_ayan_t0 is not None:
            custom_ayanamsa_kwargs["custom_ayanamsa_ayan_t0"] = (
                request_body.subject.custom_ayanamsa_ayan_t0
            )

    if location:
        nation = resolve_nation(location.nation) or natal_subject.nation

        if (
            location.geonames_username
            or location.latitude is None
            or location.longitude is None
            or location.timezone is None
        ):
            logger.info(
                "Building return factory with GeoNames (online mode) for location: %s, %s",
                location.city or natal_subject.city,
                nation,
            )
            return PlanetaryReturnFactory(
                natal_subject,
                city=location.city or natal_subject.city,
                nation=nation,
                online=True,
                geonames_username=location.geonames_username,
                cache_expire_after_days=30,
                altitude=location.altitude,
                **custom_ayanamsa_kwargs,
            )

        logger.info(
            "Building return factory with explicit coordinates (offline mode) for location: %s, %s (lat=%.4f, lng=%.4f)",
            location.city or natal_subject.city,
            nation,
            location.latitude,
            location.longitude,
        )
        return PlanetaryReturnFactory(
            natal_subject,
            city=location.city or natal_subject.city,
            nation=nation,
            lng=normalize_coordinate(location.longitude),
            lat=normalize_coordinate(location.latitude),
            tz_str=location.timezone,
            online=False,
            altitude=location.altitude,
            **custom_ayanamsa_kwargs,
        )

    logger.info(
        "Building return factory using natal subject location (offline mode): %s, %s",
        natal_subject.city,
        natal_subject.nation,
    )
    return PlanetaryReturnFactory(
        natal_subject,
        city=natal_subject.city,
        nation=natal_subject.nation,
        lng=normalize_coordinate(natal_subject.lng),
        lat=normalize_coordinate(natal_subject.lat),
        tz_str=natal_subject.tz_str,
        online=False,
        altitude=getattr(natal_subject, "altitude", None),
        **custom_ayanamsa_kwargs,
    )


async def calculate_return_chart_data(
    request_body: Union[PlanetaryReturnRequestModel, PlanetaryReturnDataRequestModel],
    return_type: str,
):
    """
    Calculate return chart data (Solar or Lunar).
    """
    active_points = resolve_active_points(request_body.active_points)
    active_aspects = resolve_active_aspects(request_body.active_aspects)

    await resolve_location_for_subject(request_body.subject)
    if request_body.return_location:
        await resolve_location_for_return_location(request_body.return_location)
    natal_subject = build_subject(request_body.subject, active_points=active_points)

    # Validate that the natal subject has required planetary positions
    if not hasattr(natal_subject, 'sun') or natal_subject.sun is None:
        raise KerykeionException(
            f"Sun position is required for {return_type} return but is not available in the subject. "
            "This can happen when the birth data (date, time, location) is invalid or incomplete. "
            "Please verify the birth date, time, and location are correct."
        )

    try:
        return_factory = build_return_factory(natal_subject, request_body)
    except Exception as exc:
        logger.warning("Failed to build return factory: %s", exc)
        raise KerykeionException(
            f"Could not build {return_type} return factory: {exc}. "
            "Please verify the birth data and return location."
        ) from exc

    try:
        if request_body.iso_datetime:
            return_subject = await asyncio.to_thread(
                return_factory.next_return_from_iso_formatted_time,
                request_body.iso_datetime,
                return_type=return_type,
            )  # type: ignore[arg-type]
        elif request_body.month:
            if request_body.year is None:
                raise KerykeionException("Year must be provided when month is specified.")
            return_subject = await asyncio.to_thread(
                return_factory.next_return_from_date,
                request_body.year,
                request_body.month,
                request_body.day or 1,
                return_type=return_type,
            )
        else:
            if request_body.year is None:
                raise KerykeionException(
                    "Year must be provided when iso_datetime is not set."
                )
            return_subject = await asyncio.to_thread(
                return_factory.next_return_from_date,
                request_body.year, 1, 1,
                return_type=return_type,
            )
    except KerykeionException:
        raise
    except Exception as exc:
        logger.warning("Failed to calculate %s return: %s", return_type, exc)
        raise KerykeionException(
            f"Failed to calculate {return_type} return: {exc}. "
            "Please verify the birth data is correct."
        ) from exc

    if request_body.wheel_type == "dual":
        chart_data = await asyncio.to_thread(
            ChartDataFactory.create_return_chart_data,
            natal_subject,
            return_subject,
            active_points=active_points,
            active_aspects=active_aspects,
            include_house_comparison=request_body.include_house_comparison,
            distribution_method=request_body.distribution_method,
            custom_distribution_weights=request_body.custom_distribution_weights,
        )
    else:
        chart_data = await asyncio.to_thread(
            ChartDataFactory.create_single_wheel_return_chart_data,
            return_subject,
            active_points=active_points,
            active_aspects=active_aspects,
            distribution_method=request_body.distribution_method,
            custom_distribution_weights=request_body.custom_distribution_weights,
        )

    return chart_data


async def create_natal_chart_data(
    request_body: Union[BirthChartRequestModel, BirthChartDataRequestModel],
) -> SingleChartDataModel:
    """
    Create natal chart data from request.

    Resolves missing location via Geo API (primary) or GeoNames (fallback)
    before building the astrological subject.
    """
    active_points = resolve_active_points(request_body.active_points)
    active_aspects = resolve_active_aspects(request_body.active_aspects)
    await resolve_location_for_subject(request_body.subject)
    subject = build_subject(request_body.subject, active_points=active_points)
    # محاسبه افمریس CPU-bound است → thread-pool تا event loop بلاک نشود
    chart_data = await asyncio.to_thread(
        ChartDataFactory.create_natal_chart_data,
        subject,
        active_points=active_points,
        active_aspects=active_aspects,
        distribution_method=request_body.distribution_method,
        custom_distribution_weights=request_body.custom_distribution_weights,
    )
    return chart_data


async def create_synastry_chart_data(
    request_body: Union[SynastryChartRequestModel, SynastryChartDataRequestModel],
) -> DualChartDataModel:
    """
    Create synastry chart data from request.
    """
    active_points = resolve_active_points(request_body.active_points)
    active_aspects = resolve_active_aspects(request_body.active_aspects)
    await resolve_location_for_subject(request_body.first_subject)
    await resolve_location_for_subject(request_body.second_subject)
    first_subject = build_subject(
        request_body.first_subject, active_points=active_points
    )
    second_subject = build_subject(
        request_body.second_subject, active_points=active_points
    )
    try:
        chart_data = await asyncio.to_thread(
            ChartDataFactory.create_synastry_chart_data,
            first_subject,
            second_subject,
            active_points=active_points,
            active_aspects=active_aspects,
            include_house_comparison=request_body.include_house_comparison,
            include_relationship_score=request_body.include_relationship_score,
            distribution_method=request_body.distribution_method,
            custom_distribution_weights=request_body.custom_distribution_weights,
        )
        return chart_data
    except (TypeError, AttributeError, KerykeionException) as exc:
        # Fallback: retry without relationship score if kerykeion fails
        # (e.g. when sun/moon positions are None due to edge-case dates)
        if request_body.include_relationship_score:
            logger.warning(
                "Synastry relationship scoring failed (%s), retrying without it.",
                exc,
            )
            chart_data = await asyncio.to_thread(
                ChartDataFactory.create_synastry_chart_data,
                first_subject,
                second_subject,
                active_points=active_points,
                active_aspects=active_aspects,
                include_house_comparison=request_body.include_house_comparison,
                include_relationship_score=False,
                distribution_method=request_body.distribution_method,
                custom_distribution_weights=request_body.custom_distribution_weights,
            )
            return chart_data
        raise


async def create_transit_chart_data(
    request_body: Union[TransitChartRequestModel, TransitChartDataRequestModel],
) -> DualChartDataModel:
    """
    Create transit chart data from request.
    """
    active_points = resolve_active_points(request_body.active_points)
    active_aspects = resolve_active_aspects(request_body.active_aspects)
    await resolve_location_for_subject(request_body.first_subject)
    await resolve_location_for_subject(request_body.transit_subject)
    natal_subject = build_subject(
        request_body.first_subject, active_points=active_points
    )
    transit_subject = build_transit_subject(
        request_body.transit_subject,
        reference_subject=natal_subject,
        active_points=active_points,
        custom_ayanamsa_t0=request_body.first_subject.custom_ayanamsa_t0,
        custom_ayanamsa_ayan_t0=request_body.first_subject.custom_ayanamsa_ayan_t0,
    )
    chart_data = await asyncio.to_thread(
        ChartDataFactory.create_transit_chart_data,
        natal_subject,
        transit_subject,
        active_points=active_points,
        active_aspects=active_aspects,
        include_house_comparison=request_body.include_house_comparison,
        distribution_method=request_body.distribution_method,
        custom_distribution_weights=request_body.custom_distribution_weights,
    )
    return chart_data


async def create_composite_chart_data(
    request_body: Union[CompositeChartRequestModel, CompositeChartDataRequestModel],
) -> SingleChartDataModel:
    """
    Create composite chart data from request.
    """
    active_points = resolve_active_points(request_body.active_points)
    active_aspects = resolve_active_aspects(request_body.active_aspects)
    await resolve_location_for_subject(request_body.first_subject)
    await resolve_location_for_subject(request_body.second_subject)
    first_subject = build_subject(
        request_body.first_subject, active_points=active_points
    )
    second_subject = build_subject(
        request_body.second_subject, active_points=active_points
    )
    try:
        composite_subject = await asyncio.to_thread(
            CompositeSubjectFactory(first_subject, second_subject).get_midpoint_composite_subject_model
        )
    except (TypeError, AttributeError, KerykeionException) as exc:
        logger.warning(
            "Composite subject creation failed (%s).", exc,
        )
        raise KerykeionException(
            f"Could not create composite subject: {exc}. "
            "This can happen with certain birth date/time/location combinations. "
            "Please verify both persons' birth data is correct."
        ) from exc
    except Exception as exc:
        logger.warning(
            "Composite subject creation unexpected error (%s).", exc,
        )
        raise KerykeionException(
            f"Unexpected error creating composite subject: {exc}"
        ) from exc

    try:
        chart_data = await asyncio.to_thread(
            ChartDataFactory.create_composite_chart_data,
            composite_subject,
            active_points=active_points,
            active_aspects=active_aspects,
            distribution_method=request_body.distribution_method,
            custom_distribution_weights=request_body.custom_distribution_weights,
        )
        return chart_data
    except Exception as exc:
        logger.warning(
            "Composite chart data creation failed (%s).", exc,
        )
        raise KerykeionException(
            f"Composite chart data creation failed: {exc}"
        ) from exc


def create_moon_phase_overview(
    request_body: MoonPhaseRequestModel,
) -> MoonPhaseOverviewModel:
    """
    Build a minimal AstrologicalSubject from flat moon phase request fields
    and compute a detailed moon phase overview.

    Args:
        request_body: The request body containing date/time and location fields.

    Returns:
        MoonPhaseOverviewModel: The detailed moon phase overview.
    """
    subject = AstrologicalSubjectFactory.from_birth_data(
        name="Moon Phase",
        year=request_body.year,
        month=request_body.month,
        day=request_body.day,
        hour=request_body.hour,
        minute=request_body.minute,
        seconds=request_body.second,
        city="",
        nation="GB",
        lng=request_body.longitude,
        lat=request_body.latitude,
        tz_str=request_body.timezone,
        online=False,
        active_points=resolve_active_points(None),
        suppress_geonames_warning=True,
    )

    return MoonPhaseDetailsFactory.from_subject(
        subject,
        using_default_location=request_body.using_default_location,
        location_precision=request_body.location_precision,
    )


def _format_coordinate(value: str, precision: int) -> str:
    """
    Round a coordinate string to the given number of decimal places.

    Handles edge cases like ``-0`` by normalising the sign.

    Args:
        value: The coordinate as a string (e.g. ``"51.477928"``).
        precision: Number of decimal places (0 = integer).

    Returns:
        The rounded coordinate as a string.
    """
    rounded = round(float(value), precision)

    # Normalise negative zero (e.g. round(-0.001, 0) → -0.0)
    if rounded == 0.0:
        rounded = 0.0

    if precision == 0:
        return str(int(rounded))

    return f"{rounded:.{precision}f}"


def moon_phase_payload(overview) -> dict:
    """
    Wrap a moon phase overview in a standard response payload.

    Post-processes ``location.latitude`` and ``location.longitude`` so they
    are rounded to ``location.precision`` decimal places, making the
    ``location_precision`` request parameter effective.

    Args:
        overview: The MoonPhaseOverviewModel instance.

    Returns:
        dict: The response payload containing status and dumped overview.
    """
    data = dump(overview)

    location = data.get("location")
    if location:
        precision = location.get("precision", 0)
        location["latitude"] = _format_coordinate(location["latitude"], precision)
        location["longitude"] = _format_coordinate(location["longitude"], precision)

    return {
        "status": "OK",
        "moon_phase_overview": data,
    }


def moon_phase_context_payload(overview) -> dict:
    """
    Wrap a moon phase overview with AI-optimized context in a standard response payload.

    The returned dict places *context* before *moon_phase_overview* so that
    the field ordering is consistent with the other context endpoints.

    Args:
        overview: The MoonPhaseOverviewModel instance.

    Returns:
        dict: The response payload containing status, context, and moon_phase_overview.
    """
    data_payload = moon_phase_payload(overview)
    return {
        "status": data_payload["status"],
        "context": to_context(overview),
        "moon_phase_overview": data_payload["moon_phase_overview"],
    }
