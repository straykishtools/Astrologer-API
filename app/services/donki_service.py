from typing import Optional
from datetime import datetime, timedelta
from app.services.nasa_client import nasa_client
from app.services.cache import nasa_cache

# ─── نگاشت کلاس فوران خورشیدی (X/M/C) به توضیح فارسی ───
_FLARE_CLASS_FA = {
    "X": ("بسیار شدید", "🔴 فوران کلاس X — شدیدترین نوع؛ ممکن است ارتباطات رادیویی و ماهواره‌ها مختل شوند. حس ناآرامی و اضطراب جمعی بیشتر می‌شود."),
    "M": ("قوی", "🟠 فوران کلاس M — فوران قوی؛ انرژی بالا برای تصمیم‌های مهم، همراه با حساسیت بیشتر."),
    "C": ("متوسط", "🟡 فوران کلاس C — متوسط و معمول؛ روزی معمولی با انرژی طبیعی."),
    "B": ("ضعیف", "🟢 فوران کلاس B — خفیف؛ آسمان آرام و انرژی پایدار."),
}

_GST_STORM_FA = {
    "G5": ("شدیدترین", "🔴 طوفان ژئومغناطیسی G5 — حدِ اکسترم؛ شفق قطبی در عرض‌های پایین، اختلال جدی شبکه برق و مخابرات."),
    "G4": ("شدید", "🔴 طوفان ژئومغناطیسی G4 — شدید؛ تأثیر بر حس‌های برانگیخته و خواب."),
    "G3": ("قوی", "🟠 طوفان ژئومغناطیسی G3 — قوی؛ شفق قطبی قابل مشاهده، حس هیجان و بی‌قراری."),
    "G2": ("متوسط", "🟡 طوفان ژئومغناطیسی G2 — متوسط؛ حساسیت بیشتر در روابط."),
    "G1": ("خفیف", "🟢 طوفان ژئومغناطیسی G1 — خفیف؛ کمی سرحالی و آشفتگی ذهنی."),
}

def _flare_fa_class(class_type: str) -> str:
    """M5.4 → M"""
    if not class_type:
        return ""
    for k in _FLARE_CLASS_FA:
        if class_type.upper().startswith(k):
            return k
    return ""

class DONKIService:
    async def get_solar_flares(self, start_date: str, end_date: Optional[str] = None) -> dict:
        return await nasa_client.get_space_weather(start_date, end_date)

    async def get_cmes(self, start_date: str, end_date: Optional[str] = None) -> dict:
        return await nasa_client.get_cmes(start_date, end_date)

    async def get_full_summary(self, start_date: str, end_date: Optional[str] = None) -> dict:
        return await nasa_client.get_space_weather_full(start_date, end_date)

    async def get_today_overview_fa(self) -> dict:
        """خلاصه فارسی آب‌وهوای فضایی ۴۸ ساعت گذشته — برای پنل کیهانی فرانت‌اند.

        فوران‌های خورشیدی (FLR) + طوفان‌های ژئومغناطیسی (GST) رویدادهای
        دیروز و امروز را می‌گیرد و با توضیح فارسی و اثر نجومی/حسی برمی‌گرداند.
        """
        today = datetime.utcnow()
        start = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        end = today.strftime("%Y-%m-%d")
        cache_key = f"donki_overview_fa_{start}_{end}"
        cached = nasa_cache.get(cache_key)
        if cached is not None:
            return cached

        flares = await nasa_client.get_space_weather(start, end)
        flares = [] if "error" in flares else flares
        strongest = None
        for fl in flares:
            if strongest is None or (fl.get("classType") or "") > (strongest.get("classType") or ""):
                strongest = fl

        flare_info = {
            "count_24h": len(flares),
            "strongest_class": strongest.get("classType") if strongest else None,
            "peak_time": (strongest.get("peakTime") or "") if strongest else None,
            "source_location": (strongest.get("sourceLocation") or "") if strongest else None,
            "fa": None,
        }
        if strongest:
            key = _flare_fa_class(strongest.get("classType") or "")
            if key:
                _, text = _FLARE_CLASS_FA[key]
                flare_info["fa"] = text

        gst = await self._get_gst(start, end)
        gst_info = {"count_24h": len(gst), "strongest_scale": None, "fa": None}
        if gst:
            scale = (gst[-1].get("allKpIndex") or [{}])
            kp = None
            for k in reversed(gst[-1].get("allKpIndex") or []):
                if k.get("kpIndex") is not None:
                    kp = k.get("kpIndex")
                    break
            gst_info["strongest_kp"] = kp
            # Kp 5→G1 ... 9→G5
            g_key = None
            if kp is not None:
                kp = float(kp)
                if kp >= 9: g_key = "G5"
                elif kp >= 8: g_key = "G4"
                elif kp >= 7: g_key = "G3"
                elif kp >= 6: g_key = "G2"
                elif kp >= 5: g_key = "G1"
            if g_key:
                gst_info["strongest_scale"] = g_key
                _, text = _GST_STORM_FA[g_key]
                gst_info["fa"] = text

        # اثر کلی امروز (برای نمایش نوار «انرژی خورشیدی»)
        energy_level = "آرام"
        energy_emoji = "🟢"
        f_cls = flare_info.get("strongest_class") or ""
        if f_cls.startswith("X") or gst_info.get("strongest_scale") in ("G4", "G5"):
            energy_level = "بسیار شدید"
            energy_emoji = "🔴"
        elif f_cls.startswith("M") or gst_info.get("strongest_scale") in ("G3",):
            energy_level = "قوی"
            energy_emoji = "🟠"
        elif f_cls.startswith("C") or gst_info.get("strongest_scale") in ("G2", "G1"):
            energy_level = "متوسط"
            energy_emoji = "🟡"

        result = {
            "date_range": {"start": start, "end": end},
            "solar_flares": flare_info,
            "geomagnetic_storms": gst_info,
            "today_energy": {
                "level": energy_level,
                "emoji": energy_emoji,
                "fa": "فعالیت خورشیدی امروز: " + energy_level,
            },
        }
        nasa_cache.set(cache_key, result)
        return result

    async def _get_gst(self, start: str, end: str) -> list:
        """طوفان‌های ژئومغناطیسی GST — endpoint مستقل DONKI."""
        try:
            data = await nasa_client._request(
                "DONKI/GST", {"startDate": start, "endDate": end}, timeout=25.0
            )
            return [] if isinstance(data, dict) and "error" in data else (data or [])
        except Exception:
            return []
