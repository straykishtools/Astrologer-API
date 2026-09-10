"""
Weather & Air Quality Service — OpenWeatherMap + AQICN
جایگزین Open-Meteo (که با timezoneهای عددی 400 می‌داد).

- OpenWeatherMap: آب‌وهوای فعلی + طلوع/غروب دقیق (unix) + توضیح فارسی خودش
- AQICN: شاخص کیفیت هوا (AQI) واقعی نزدیک‌ترین ایستگاه — برای توصیه تمرین بیرون/درون
هیچ سرویس ناسایی را لمس نمی‌کند.
"""

from datetime import datetime, timedelta, timezone as dt_tz
from typing import Optional
import httpx

from app.services.cache import nasa_cache

OWM_BASE = "https://api.openweathermap.org/data/2.5/weather"
AQICN_BASE = "https://api.waqi.info/feed/geo:"

# شرط هوای OWM → فارسی (بر اساس prefix آیکون OWM)
OWM_CONDITION_FA = {
    "thunderstorm": "رعد و برق ⛈️",
    "drizzle": "نم‌نم باران 🌦️",
    "rain": "باران 🌧️",
    "snow": "برف ❄️",
    "atmosphere": ("مه/غبار 🌫️"),
    "clear": "آفتابی ☀️",
    "clouds": "ابری ☁️",
}

AQI_FA = {
    1: ("🟢 عالی", "هوا پاک است — بهترین زمان برای تمرین در فضای باز"),
    2: ("🟢 خوب", "هوا سالم است — تمرین بیرون مشکلی ندارد"),
    3: ("🟡 متوسط", "افراد حساس مراقب باشند — تمرین بیرون کوتاه‌تر باشد"),
    4: ("🟠 ناسالم برای حساس‌ها", "بهتر است تمرین سنگین را به درون منتقل کنی"),
    5: ("🔴 ناسالم", "تمرین در فضای بسته توصیه می‌شود"),
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """فاصله هوایی دو نقطه بر روی زمین (کیلومتر)"""
    import math
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


class WeatherAirService:
    def __init__(self):
        import os
        self.owm_key = os.getenv("OPENWEATHER_API_KEY", "")
        self.aqicn_key = os.getenv("AQICN_API_KEY", "")

    async def get_daily_brief(self, latitude: float, longitude: float) -> dict:
        """آب‌وهوا (OWM) + کیفیت هوا (AQICN) در یک پاسخ واحد.

        هیچ‌کدام fatal نیست — هر کدام که در دسترس نبود، حذف می‌شود.
        """
        cache_key = f"wair_{round(latitude, 2)}_{round(longitude, 2)}_{datetime.utcnow().strftime('%Y%m%d%H')}"
        cached = nasa_cache.get(cache_key)
        if cached is not None:
            return cached

        result: dict = {"latitude": latitude, "longitude": longitude}
        errors: dict = {}

        # ─── ۱) OpenWeatherMap — آب‌وهوا و طلوع/غروب ───
        weather = await self._get_weather(latitude, longitude)
        if weather and "error" not in weather:
            result["weather"] = weather
            result["sunrise"] = weather.get("sunrise")
            result["sunset"] = weather.get("sunset")
            result["day_length"] = weather.get("day_length")
        else:
            errors["weather"] = (weather or {}).get("error", "unknown")

        # ─── ۲) AQICN — کیفیت هوا ───
        air = await self._get_air(latitude, longitude)
        if air and "error" not in air:
            result["air"] = air
        else:
            errors["air"] = (air or {}).get("error", "unknown")

        if errors:
            result["_errors"] = errors
        if "weather" not in result and "air" not in result:
            # هر دو شکست خوردند — همان را برگردان (نه exception)
            return result

        # فقط نتیجه موفق کش می‌شود (خطاها را دوباره امتحان کنیم)
        if not errors:
            nasa_cache.set(cache_key, result)
        return result

    async def _get_weather(self, lat: float, lng: float) -> Optional[dict]:
        if not self.owm_key:
            return {"error": "no OWM key"}
        try:
            params = {
                "lat": lat,
                "lon": lng,
                "appid": self.owm_key,
                "units": "metric",
                "lang": "fa",
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(OWM_BASE, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            return {"error": f"owm {e.response.status_code}"}
        except Exception:
            return {"error": "owm unreachable"}

        main = data.get("main", {})
        weather_arr = data.get("weather") or [{}]
        cond = weather_arr[0]
        group = (cond.get("main") or "").lower()  # Clear / Clouds / Rain ...
        sys = data.get("sys", {})

        sunrise_ts = sys.get("sunrise")
        sunset_ts = sys.get("sunset")
        sunrise = self._ts_to_hhmm(sunrise_ts, data.get("timezone"))
        sunset = self._ts_to_hhmm(sunset_ts, data.get("timezone"))
        day_length = ""
        if sunrise_ts and sunset_ts:
            mins = int((sunset_ts - sunrise_ts) / 60)
            day_length = f"{mins // 60}h {mins % 60}m"

        return {
            "temp": main.get("temp"),
            "feels_like": main.get("feels_like"),
            "temp_min": main.get("temp_min"),
            "temp_max": main.get("temp_max"),
            "humidity": main.get("humidity"),
            "condition": cond.get("description") or "",  # فارسی از خود OWM
            "condition_group_fa": OWM_CONDITION_FA.get(group, ""),
            "wind_speed": data.get("wind", {}).get("speed"),
            "sunrise": sunrise,
            "sunset": sunset,
            "day_length": day_length,
            "city": data.get("name", ""),
        }

    async def _get_air(self, lat: float, lng: float) -> Optional[dict]:
        if not self.aqicn_key:
            return {"error": "no AQICN key"}
        try:
            # ۱) نزدیک‌ترین ایستگاه به مختصات
            url = f"{AQICN_BASE}{lat};{lng}/?token={self.aqicn_key}"
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            # ۲) اگر ایستگاه برگشتی خیلی دور بود (>80km) از /here هم امتحان کن
            d0 = data.get("data", {}) if data.get("status") == "ok" else {}
            city_geo = (d0.get("city") or {}).get("geo") or []
            if city_geo and len(city_geo) >= 2:
                try:
                    dist_km = _haversine_km(lat, lng, float(city_geo[0]), float(city_geo[1]))
                except (TypeError, ValueError):
                    dist_km = 0
                if dist_km > 80:
                    alt = await client.get(
                        f"https://api.waqi.info/feed/here/?token={self.aqicn_key}"
                    )
                    alt_data = alt.json()
                    if alt_data.get("status") == "ok":
                        alt_geo = (alt_data.get("data", {}).get("city") or {}).get("geo") or []
                        alt_dist = _haversine_km(lat, lng, *map(float, alt_geo)) if len(alt_geo) >= 2 else 1e9
                        if alt_dist < dist_km:
                            data = alt_data
        except httpx.HTTPStatusError as e:
            return {"error": f"aqicn {e.response.status_code}"}
        except Exception:
            return {"error": "aqicn unreachable"}

        if data.get("status") != "ok":
            return {"error": "aqicn bad response"}

        d = data.get("data", {})
        aqi = d.get("aqi")
        label, advice = self._aqi_fa(aqi)
        iaqi = d.get("iaqi", {})
        city_geo = (d.get("city") or {}).get("geo") or []
        dist_note = ""
        if city_geo and len(city_geo) >= 2:
            try:
                dist_note = f" (~{round(_haversine_km(lat, lng, float(city_geo[0]), float(city_geo[1])))} کیلومتری)"
            except (TypeError, ValueError):
                pass
        return {
            "aqi": aqi,
            "aqi_label": label,
            "advice_fa": advice,
            "dominent_pol": d.get("dominentpol", ""),
            "pm25": (iaqi.get("pm25") or {}).get("v"),
            "pm10": (iaqi.get("pm10") or {}).get("v"),
            "station": (d.get("city") or {}).get("name", ""),
            "station_distance": dist_note,
        }

    @staticmethod
    def _aqi_fa(aqi) -> tuple:
        try:
            a = int(aqi)
        except (TypeError, ValueError):
            return ("—", "")
        if a <= 50:
            return AQI_FA[1]
        if a <= 100:
            return AQI_FA[2]
        if a <= 150:
            return AQI_FA[3]
        if a <= 200:
            return AQI_FA[4]
        return AQI_FA[5]

    @staticmethod
    def _ts_to_hhmm(ts, tz_offset_seconds) -> Optional[str]:
        """unix timestamp → HH:MM در منطقه زمانی خود شهر (نه سرور)"""
        if not ts:
            return None
        try:
            tz = dt_tz(timedelta(seconds=int(tz_offset_seconds or 0)))
            dt = datetime.fromtimestamp(int(ts), tz=tz)
            return dt.strftime("%H:%M")
        except (ValueError, OSError, OverflowError):
            return None


openmeteo_service = WeatherAirService()
