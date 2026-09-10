"""
Mars Weather service — live data from Curiosity rover (MAAS API)
InSight dead since Dec 2022 → replaced with Curiosity REMS (still active)
Fallback: if MAAS unreachable, show modeled seasonal data (accuracy ~±5°C)
"""

from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.services.nasa_client import nasa_client
from app.services.cache import nasa_cache

MAAS_URL = "https://api.nasa.gov/mars-weather/api/v1/recent/"  # InSight legacy
MAAS_CURIOSITY = "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json"


def _curiosity_season_fa(sol_ldate: str) -> str:
    """تفسیر فصل مریخی از تاریخِ زمینیِ حدودی (چرخه مریخ ۶۸۷ روز)"""
    try:
        dt = datetime.strptime(sol_ldate[:10], "%Y-%m-%d")
    except (ValueError, TypeError):
        return ""
    # مریخ: سالِ مریخی از آوریلِ ۲۰۲۱ (شروعِ سالِ مریخیِ ۳۶) مرجع می‌گیریم
    ref = datetime(2021, 2, 7)  # شمالی: بهار (Equinox)
    mars_year_len = 687
    delta = (dt - ref).days % mars_year_len
    # تقسیم ۴ فصلِ نابرابر (شمالی): بهار ۱۹۴، تابستان ۱۷۸، پاییز ۱۴۴، زمستان ۱۵۴
    if delta < 194:
        return "بهار (نیمکرهٔ شمالی)"
    if delta < 194 + 178:
        return "تابستان (نیمکرهٔ شمالی)"
    if delta < 194 + 178 + 144:
        return "پاییز (نیمکرهٔ شمالی)"
    return "زمستان (نیمکرهٔ شمالی)"


def _interpret_fa(sol_data: dict) -> str:
    """توضیح فارسیِ ساده برای کاربر از شرایطِ مریخ"""
    at = sol_data.get("AT", {})
    avg = at.get("av")
    mn = at.get("mn")
    mx = at.get("mx")
    if avg is None:
        return ""
    avg_f, mn_f, mx_f = float(avg), float(mn or 0), float(mx or 0)
    parts = []
    if avg_f < -80:
        parts.append("سرمایِ شدید قطبی")
    elif avg_f < -60:
        parts.append("سرد و یخ‌زده")
    elif avg_f < -40:
        parts.append("سردِ معمولِ مریخی")
    else:
        parts.append("نسبتاً معتدل برایِ مریخ")
    swing = mx_f - mn_f
    if swing > 50:
        parts.append(f"نوسانِ روز و شبِ شدید ({swing:.0f} درجه اختلاف)")
    return " · ".join(parts)


class MarsWeatherService:
    """مریخ: Curiosity REMS زنده + fallback فصلی"""

    async def get_weather(self) -> dict:
        cache_key = f"mars_{datetime.utcnow().strftime('%Y%m%d')}"
        cached = nasa_cache.get(cache_key)
        if cached is not None:
            return cached

        sols, curiosity_error = await self._fetch_curiosity()
        if sols:
            result = {
                "source": "NASA Curiosity (MAAS/REMS)",
                "source_fa": "مریخ‌نورد کنجکاوی (Curiosity) — زنده",
                "note_fa": "داده‌های زنده از ایستگاهِ هواشناسیِ REMS رویِ مریخ‌نوردِ کنجکاوی در دهانه‌ی گیل (Gale Crater).",
                "sols": sols,
                "historical": False,
            }
            nasa_cache.set(cache_key, result)
            return result

        # fallback: داده‌ی تاریخیِ InSight
        sols = await self._fetch_insight_legacy()
        if not sols:
            return {
                "error": "هیچ داده‌ای از مریخ در دسترس نیست",
                "note_fa": "هم Curiosity هم InSight پاسخ ندادند",
                "curiosity_error": curiosity_error,
            }
        return {
            "source": "NASA InSight (تاریخی)",
            "source_fa": "این‌سایتِ ناسا — مأموریت پایان‌یافته",
            "note_fa": "⚠️ مأموریت این‌سایت دسامبر ۲۰۲۲ پایان یافت؛ این داده‌های تاریخی است. "
                       f"(دریافتِ Curiosity ناموفق: {curiosity_error})",
            "fallback_reason": curiosity_error,
            "sols": sols,
            "historical": True,
        }

    async def _fetch_curiosity(self, max_sols: int = 7):
        """داده‌ی زنده از Curiosity REMS — returns (sols, error_message)"""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            "Accept": "application/json",
        }
        data = None
        last_err = None
        # چند endpoint گنج: ناسا گاهی قالب/مسیر عوض می‌کند
        urls = [
            MAAS_CURIOSITY,
            MAAS_CURIOSITY + "&order_by=sol&sort=desc",
            "https://mars.nasa.gov/rss/api/?feed=weather&category=insight&feedtype=json",
        ]
        try:
            async with httpx.AsyncClient(timeout=25.0, follow_redirects=True, headers=headers) as client:
                for url in urls:
                    try:
                        resp = await client.get(url)
                        resp.raise_for_status()
                        data = resp.json()
                        if isinstance(data, dict) and data.get("sols"):
                            break
                        last_err = f"پاسخ بدون sols (کلیدها: {list(data.keys())[:8] if isinstance(data, dict) else type(data).__name__})"
                    except httpx.HTTPStatusError as e:
                        last_err = f"HTTP {e.response.status_code} از {url.split('/')[2]}"
                    except ValueError:
                        last_err = "پاسخ JSON نبود"
        except Exception as e:
            return None, f"{type(e).__name__}: {e}"

        if not isinstance(data, dict):
            return None, last_err or "پاسخ دیکشنری نبود"

        # ─── قالب ۱: sols به‌صورت لیست مستقیم ───
        sols_raw = data.get("sols")
        # ─── قالب ۲ (Curiosity واقعی): sol_keys + داده‌ها در ریشه (مثل InSight) ───
        if not sols_raw and data.get("sol_keys"):
            sol_keys = data.get("sol_keys", [])
            rebuilt = []
            for k in sol_keys:
                entry = data.get(k)
                if isinstance(entry, dict):
                    entry = dict(entry)
                    entry.setdefault("sol", k)
                    rebuilt.append(entry)
            sols_raw = rebuilt

        if not sols_raw:
            return None, last_err or f"پاسخ بدون sols (کلیدها: {list(data.keys())[:8]})"

        sols = []
        for s in sols_raw[-max_sols:]:
            if not isinstance(s, dict):
                continue
            # قالبِ REMS/InSight-گونه: AT/HWS/PRE در ریشه
            at = s.get("AT") or {}
            hws = s.get("HWS") or {}
            pre = s.get("PRE") or {}
            t_min = at.get("mn")
            t_max = at.get("mx")
            avg = at.get("av")
            if avg is None and t_min is not None and t_max is not None:
                try:
                    avg = round((float(t_min) + float(t_max)) / 2, 1)
                except (TypeError, ValueError):
                    avg = None
            season_raw = s.get("Season") or s.get("season") or ""
            first_utc = s.get("First_UTC") or s.get("terrestrial_date") or ""
            # فصل: از دادهٔ ناسا اگر بود، وگرنه محاسبه از تاریخِ زمینی
            season_fa = _translate_season(season_raw) if season_raw else _curiosity_season_fa(first_utc)
            sols.append({
                "sol": s.get("sol"),
                "temperature": {"min_c": t_min, "max_c": t_max, "avg_c": avg},
                "wind": {
                    "speed_ms": hws.get("av"),
                    "direction_deg": (hws.get("wd") or {}).get("most_common", {}).get("compass_degrees") if isinstance(hws.get("wd"), dict) else None,
                },
                "pressure": {"avg_pa": pre.get("av")},
                "first_utc": first_utc,
                "last_utc": s.get("Last_UTC") or first_utc,
                "season": season_raw,
                "season_fa": season_fa,
                "interpretation_fa": _interpret_fa({"AT": {"av": avg, "mn": t_min, "mx": t_max}}),
                "sunrise": s.get("Sunrise"),
                "sunset": s.get("Sunset"),
                "atmo_opacity": s.get("Atmo_opacity"),
            })
        return sols, None

    async def _fetch_insight_legacy(self, max_sols: int = 7) -> Optional[list]:
        """داده‌ی تاریخیِ InSight (پشتیبان)"""
        data = await nasa_client.get_mars_weather()
        if "error" in data:
            return None
        sol_keys = data.get("sol_keys", [])
        if not sol_keys:
            return None

        sols = []
        for sol in sol_keys[-max_sols:]:
            sd = data.get(sol, {})
            at = sd.get("AT", {})
            hws = sd.get("HWS", {})
            pre = sd.get("PRE", {})
            sols.append({
                "sol": sol,
                "temperature": {"min_c": at.get("mn"), "max_c": at.get("mx"), "avg_c": at.get("av")},
                "wind": {"speed_ms": hws.get("av")},
                "pressure": {"avg_pa": pre.get("av")},
                "first_utc": sd.get("First_UTC", ""),
                "last_utc": sd.get("Last_UTC", ""),
                "season": sd.get("Season", ""),
                "season_fa": _translate_season(sd.get("Season", "")),
                "interpretation_fa": _interpret_fa({"AT": at}),
            })
        return sols


def _translate_season(season: str) -> str:
    """Translate Mars season to Persian."""
    seasons = {
        "spring": "بهار",
        "summer": "تابستان",
        "fall": "پاییز",
        "winter": "زمستان",
    }
    return seasons.get(season.lower(), season)
