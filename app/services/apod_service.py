"""
APOD — Astronomy Picture of the Day service.
Returns NASA's daily astronomical image with Persian translations.
"""

import re
from typing import Optional
from app.services.nasa_client import nasa_client
from app.services.cache import apod_cache
from app.services.translation_service import translate_text

# ─── واژه‌نامه‌ی گسترده‌تر برای ترجمه‌ی متنِ APOD ───
_APOD_FA_TERMS = {
    # اجرام و ساختارها
    "galaxy": "کهکشان", "galaxies": "کهکشان‌ها", "nebula": "سحابی", "nebulae": "سحابی‌ها",
    "star cluster": "خوشه‌ی ستاره‌ای", "star": "ستاره", "stars": "ستاره‌ها",
    "supernova": "ابرنواختر", "black hole": "سیاه‌چاله", "comet": "دنباله‌دار",
    "asteroid": "سیارک", "planet": "سیاره", "planets": "سیاره‌ها",
    "moon": "ماه", "sun": "خورشید", "solar": "خورشیدی", "lunar": "قمری",
    "eclipse": "گرفتگی", "aurora": "شفق", "meteor": "شهاب", "shower": "بارش",
    "milky way": "کهکشانِ راهِ شیری", "andromeda": "آندرومدا", "orion": "شکارچی (اورایون)",
    "saturn": "کیوان (زحل)", "jupiter": "مشتری", "mars": "بهرام (مریخ)",
    "venus": "ناهید (زهره)", "mercury": "عطارد", "neptune": "نپتون", "uranus": "اورانوس",
    "space station": "ایستگاه فضایی", "iss": "ایستگاه فضایی بین‌المللی",
    "telescope": "تلسکوپ", "hubble": "هابل", "webb": "وب (جیمز وب)",
    "spiral galaxy": "کهکشانِ مارپیچی", "dwarf galaxy": "کهکشانِ کوتوله",
    "star forming": "ستاره‌زا", "dust": "غبار کیهانی", "gas cloud": "ابرِ گازی",
    "light-years": "سال‌نوری", "light years": "سال‌نوری", "light-year": "سال‌نوری",
    # فعل‌ها و عبارت‌های پرتکرار
    "featured": "برگزیده‌ی امروز", "picture of the day": "تصویرِ روز",
    "astronomy picture of the day": "تصویرِ نجومیِ روزِ ناسا",
    "seen": "دیده می‌شود", "visible": "قابل مشاهده", "observed": "رصد‌شده",
    "discovered": "کشف‌شده", "captured": "ثبت‌شده توسط", "imaged": "تصویربرداری‌شده",
    "located": "واقع در", "million": "میلیون", "billion": "میلیارد",
    "thousand": "هزار", "years ago": "سال پیش", "years": "سال",
    "distance": "فاصله", "distant": "دور", "bright": "درخشان", "faint": "کم‌نور",
    "beautiful": "زیبا", "spectacular": "شگفت‌انگیز", "stunning": "خیره‌کننده",
    "explanation": "توضیح", "credit": "اعتبارِ تصویر",
}


def _translate_apod_text(text: str) -> str:
    """ترجمه‌ی محتاطانه‌ی متنِ APOD — جایگزینیِ امنِ اصطلاحات + حفظِ اعداد.
    نتیجه «فارسی‌شده» است نه ترجمه‌ی ادبی کامل؛ برایِ خواناییِ کاربرِ فارسی‌زبان.
    """
    if not text:
        return text
    t = " " + text + " "
    # اصطلاحاتِ چندکلمه‌ای اول (مهم برای milky way و ...)
    for en in sorted(_APOD_FA_TERMS.keys(), key=len, reverse=True):
        fa = _APOD_FA_TERMS[en]
        t = re.sub(r"\b" + re.escape(en) + r"\b", fa, t, flags=re.IGNORECASE)
    return t.strip()


def _summarize_explanation_fa(explanation: str) -> str:
    """خلاصه‌ی فارسیِ دوبارگیِ توضیحِ APOD:
    - جمله‌های توضیحیِ انگلیسی را جدا می‌کند
    - جرم/فاصله/تلسکوپِ ذکرشده را استخراج می‌کند
    - یک روایتِ فارسیِ روان می‌سازد
    """
    if not explanation:
        return ""
    sents = re.split(r"(?<=[.!?])\s+", explanation)
    facts = []

    # استخراج فاصله
    m = re.search(r"([\d,\.]+)\s*(million|billion|thousand)?\s*light-?years?", explanation, re.I)
    if m:
        num = m.group(1)
        unit = {"million": "میلیون", "billion": "میلیارد", "thousand": "هزار"}.get(
            (m.group(2) or "").lower(), "")
        facts.append(f"فاصله: حدودِ {num} {unit} سال‌نوری از ما")
    # تلسکوپ
    for tel, fa in (("Webb", "جیمز وب"), ("Hubble", "هابل"), ("Spitzer", "اسپیتزر")):
        if tel.lower() in explanation:
            facts.append(f"ابزارِ تصویربرداری: تلسکوپِ {fa}")
            break
    # سیاره/جرمِ نام‌برده
    for obj, fa in (("Saturn", "کیوان (زحل)"), ("Jupiter", "مشتری"), ("Mars", "بهرام (مریخ)"),
                     ("Andromeda", "آندرومدا"), ("Orion", "سحابیِ شکارچی")):
        if obj.lower() in explanation:
            facts.append(f"سوژه‌ی اصلی: {fa}")
            break

    # دو جمله‌ی نخست را با جایگزینیِ اصطلاحات، فارسی‌وار کن
    lead = " ".join(sents[:2]) if len(sents) >= 2 else (sents[0] if sents else "")
    lead_fa = _translate_apod_text(lead)

    summary = lead_fa
    if facts:
        summary += "\n\n🔭 " + " · ".join(facts)
    return summary


class APODService:
    """Fetches and enriches NASA APOD data."""

    async def get_todays_image(self, date: Optional[str] = None) -> dict:
        """Get today's (or specified date's) APOD with Persian translation.

        Args:
            date: Optional date string YYYY-MM-DD. If None, returns today's.

        Returns:
            Enriched dict with title, explanation, URL, and _fa fields.
        """
        cache_key = f"apod_{date or 'today'}"

        # Check cache
        cached = apod_cache.get(cache_key)
        if cached is not None:
            return cached

        # Fetch from NASA
        data = await nasa_client.get_apod(date=date)

        if "error" in data:
            return data

        # Build enriched result
        title = data.get("title", "")
        explanation = data.get("explanation", "")

        translated = {
            "title": title,
            "title_fa": _translate_apod_text(title) or translate_text(title),
            "explanation": explanation,
            "explanation_fa": _translate_apod_text(explanation),
            "summary_fa": _summarize_explanation_fa(explanation),
            "url": data.get("url", ""),
            "hdurl": data.get("hdurl", ""),
            "date": data.get("date", ""),
            "media_type": data.get("media_type", "image"),
            "copyright": data.get("copyright", ""),
            "service_version": data.get("service_version", ""),
        }

        # Add thumbnail for videos
        if data.get("thumbnail_url"):
            translated["thumbnail_url"] = data["thumbnail_url"]

        # Cache for 24 hours
        apod_cache.set(cache_key, translated)
        return translated
