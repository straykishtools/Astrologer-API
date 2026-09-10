"""
Open-Meteo Service — آب‌وهوای کامل بدون کلید و بدون تحریم
منبع: api.open-meteo.com (رایگان، بدونِ ثبت‌نام)
شامل: دمای فعلی، احساس واقعی، رطوبت، باد، طلوع/غروب، ماه، بارش، UV، کیفیت هوا (European AQI + US AQI)
"""

from datetime import datetime, timedelta, timezone as dt_tz
from typing import Optional
import httpx

from app.services.cache import nasa_cache

OM_BASE = "https://api.open-meteo.com/v1/forecast"
OM_AIR = "https://air-quality-api.open-meteo.com/v1/air-quality"

# کد وضعیت WMO → فارسی
WMO_FA = {
    0: "آفتابی ☀️", 1: "عمدتاً آفتابی 🌤️", 2: "نیمه‌ابری ⛅", 3: "ابری ☁️",
    45: "مه 🌫️", 48: "مه یخ‌زده 🌫️",
    51: "نم‌نم باران 🌦️", 53: "باران پراکنده 🌦️", 55: "نم‌نمِ متراکم 🌧️",
    56: "نم‌نم یخ‌زده 🌧️", 57: "نم‌نم یخ‌زدهٔ شدید 🌨️",
    61: "باران سبک 🌦️", 63: "باران 🌧️", 65: "باران شدید ⛈️",
    66: "باران یخ‌زده 🌧️", 67: "باران یخ‌زدهٔ شدید 🌨️",
    71: "برف سبک 🌨️", 73: "برف ❄️", 75: "برف سنگین 🌨️", 77: "دانه‌های برف 🌨️",
    80: "رگبار سبک 🌦️", 81: "رگبار 🌧️", 82: "رگبار شدید ⛈️",
    85: "رگبار برف 🌨️", 86: "رگبار برف سنگین ❄️",
    95: "رعد و برق ⛈️", 96: "رعد و برق با تگرگ ⛈️", 99: "طوفان شدید با تگرگ ⛈️",
}

# European AQI (0-20 عالی، 20-40 خوب، 40-60 متوسط، 60-80 بد، 80-100 بسیار بد، 100+ فاجعه)
def _european_aqi_fa(aqi) -> tuple:
    try:
        a = float(aqi)
    except (TypeError, ValueError):
        return ("—", "")
    if a <= 20:
        return ("🟢 عالی", "هوا پاک است — بهترین زمان برای تمرین در فضای باز")
    if a <= 40:
        return ("🟢 خوب", "هوا سالم است — تمرین بیرون مشکلی ندارد")
    if a <= 60:
        return ("🟡 متوسط", "افراد حساس مراقب باشند — تمرین بیرون کوتاه‌تر باشد")
    if a <= 80:
        return ("🟠 بد", "بهتر است تمرین سنگین را به درون منتقل کنی")
    if a <= 100:
        return ("🔴 بسیار بد", "تمرین در فضای بسته توصیه می‌شود")
    return ("🟣 فاجعه", "بیرون اصلاً نرو — هوای سمی")


class OpenMeteoService:
    """سرویس واحدِ آب‌وهوا + کیفیت هوا از Open-Meteo — بدونِ کلید"""

    async def get_daily_brief(self, latitude: float, longitude: float) -> dict:
        """همه‌چیز در یک پاسخ: آب‌وهوا + هوا + ماه + خورشید"""
        cache_key = f"om_{round(latitude, 2)}_{round(longitude, 2)}_{datetime.utcnow().strftime('%Y%m%d%H')}"
        cached = nasa_cache.get(cache_key)
        if cached is not None:
            return cached

        result: dict = {"latitude": latitude, "longitude": longitude}
        errors: dict = {}

        # ─── ۱) پیش‌بینی اصلی (آب‌وهوا + خورشید + ماه) ───
        weather = await self._get_weather(latitude, longitude)
        if weather and "error" not in weather:
            result["weather"] = weather
            result["sunrise"] = weather.get("sunrise")
            result["sunset"] = weather.get("sunset")
            result["day_length"] = weather.get("day_length")
            result["moon"] = weather.get("moon", {})
        else:
            errors["weather"] = (weather or {}).get("error", "unknown")

        # ─── ۲) کیفیت هوا (European AQI + ذرات) ───
        air = await self._get_air(latitude, longitude)
        if air and "error" not in air:
            result["air"] = air
        else:
            errors["air"] = (air or {}).get("error", "unknown")

        if errors:
            result["_errors"] = errors
        if "weather" not in result and "air" not in result:
            return result

        if not errors:
            nasa_cache.set(cache_key, result)
        return result

    async def _get_weather(self, lat: float, lng: float) -> Optional[dict]:
        params = {
            "latitude": lat,
            "longitude": lng,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,precipitation,wind_gusts_10m,cloud_cover,weather_code,surface_pressure",
            "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,moonrise,moonset,moon_phase",
            "timezone": "auto",
            "forecast_days": 1,
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(OM_BASE, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            return {"error": f"om {e.response.status_code}"}
        except Exception:
            return {"error": "om unreachable"}

        cur = data.get("current", {})
        daily = data.get("daily", {})

        def _hhmm(iso: str) -> str:
            try:
                return iso.split("T")[1][:5]
            except (IndexError, AttributeError):
                return iso or ""

        sunrise = _hhmm((daily.get("sunrise") or [""])[0])
        sunset = _hhmm((daily.get("sunset") or [""])[0])
        day_len_h = ""
        try:
            secs = (daily.get("daylight_duration") or [0])[0]
            mins = int(secs // 60)
            day_len_h = f"{mins // 60}h {mins % 60}m"
        except (TypeError, ValueError, IndexError):
            pass

        # ماه — کد فاز ۰-۱ را به نام و ایموجی + طلوع/غروبِ ماه
        moon_phase_code = (daily.get("moon_phase") or [None])[0]
        moon = self._moon_fa(moon_phase_code)
        moon["moonrise"] = _hhmm((daily.get("moonrise") or [""])[0]) or None
        moon["moonset"] = _hhmm((daily.get("moonset") or [""])[0]) or None

        code = (cur.get("weather_code") or 0)
        wind_dir = cur.get("wind_direction_10m")

        return {
            "temp": cur.get("temperature_2m"),
            "feels_like": cur.get("apparent_temperature"),
            "temp_max": (daily.get("temperature_2m_max") or [None])[0],
            "temp_min": (daily.get("temperature_2m_min") or [None])[0],
            "feels_max": (daily.get("apparent_temperature_max") or [None])[0],
            "humidity": cur.get("relative_humidity_2m"),
            "condition_fa": WMO_FA.get(code, "—"),
            "weather_code": code,
            "cloud_cover": cur.get("cloud_cover"),
            "wind_speed": cur.get("wind_speed_10m"),          # km/h در OM
            "wind_gusts": cur.get("wind_gusts_10m"),
            "wind_direction": wind_dir,
            "wind_dir_fa": self._wind_dir_fa(wind_dir),
            "pressure": cur.get("surface_pressure"),
            "precipitation": cur.get("precipitation"),
            "precip_prob_max": (daily.get("precipitation_probability_max") or [None])[0],
            "precip_sum": (daily.get("precipitation_sum") or [0])[0],
            "uv_index_max": (daily.get("uv_index_max") or [None])[0],
            "sunrise": sunrise,
            "sunset": sunset,
            "day_length": day_len_h,
            "is_day": cur.get("is_day"),
            "moon": moon,
            "timezone": data.get("timezone", ""),
        }

    @staticmethod
    def _moon_fa(code) -> dict:
        """کد فاز ماهِ Open-Meteo (0-1) → نام و ایموجی فارسی"""
        try:
            c = float(code)
        except (TypeError, ValueError):
            return {"phase_fa": "", "emoji": ""}
        if c < 0.03 or c > 0.97:
            return {"phase_fa": "ماه نو", "emoji": "🌑"}
        if c < 0.22:
            return {"phase_fa": "هلالِ رو به رشد", "emoji": "🌒"}
        if c < 0.28:
            return {"phase_fa": "تربیعِ اول", "emoji": "🌓"}
        if c < 0.47:
            return {"phase_fa": "محدبِ رو به رشد", "emoji": "🌔"}
        if c < 0.53:
            return {"phase_fa": "ماه کامل", "emoji": "🌕"}
        if c < 0.72:
            return {"phase_fa": "محدبِ رو به زوال", "emoji": "🌖"}
        if c < 0.78:
            return {"phase_fa": "تربیعِ آخر", "emoji": "🌗"}
        return {"phase_fa": "هلالِ رو به زوال", "emoji": "🌘"}

    @staticmethod
    def _wind_dir_fa(deg) -> str:
        try:
            d = float(deg)
        except (TypeError, ValueError):
            return ""
        dirs = [("شمالی", "⬆️"), ("شمال‌شرقی", "↗️"), ("شرقی", "➡️"), ("جنوب‌شرقی", "↘️"),
                ("جنوبی", "⬇️"), ("جنوب‌غربی", "↙️"), ("غربی", "⬅️"), ("شمال‌غربی", "↖️")]
        idx = int(((d + 22.5) % 360) // 45)
        return f"{dirs[idx][1]} {dirs[idx][0]}"

    async def _get_air(self, lat: float, lng: float) -> Optional[dict]:
        params = {
            "latitude": lat,
            "longitude": lng,
            "current": "european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
            "timezone": "auto",
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(OM_AIR, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            return {"error": f"air {e.response.status_code}"}
        except Exception:
            return {"error": "air unreachable"}

        cur = data.get("current", {})
        aqi = cur.get("european_aqi")
        label, advice = _european_aqi_fa(aqi)

        return {
            "aqi": aqi,
            "aqi_label": label,
            "advice_fa": advice,
            "us_aqi": cur.get("us_aqi"),
            "pm25": cur.get("pm2_5"),
            "pm10": cur.get("pm10"),
            "ozone": cur.get("ozone"),
            "no2": cur.get("nitrogen_dioxide"),
            "so2": cur.get("sulphur_dioxide"),
            "co": cur.get("carbon_monoxide"),
            "station": "Open-Meteo (مدلِ CAMS)",
        }


openmeteo_service = OpenMeteoService()
