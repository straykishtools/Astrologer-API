"""
Persian Translation Service for NASA & Astrology data.
Provides static mappings for planets, zodiac signs, and space terminology.
"""

from typing import Dict, Optional

# ============================================
# STATIC TRANSLATION MAPS
# ============================================

PLANETS = {
    "Sun": "خورشید", "Moon": "ماه", "Mercury": "عطارد",
    "Venus": "ناهید", "Mars": "مریخ", "Jupiter": "مشتری",
    "Saturn": "کیوان", "Uranus": "اورانوس", "Neptune": "نپتون",
    "Pluto": "پلوتو",
}

ZODIAC_SIGNS = {
    "Aries": "حمل", "Taurus": "ثور", "Gemini": "جوزا",
    "Cancer": "سرطان", "Leo": "اسد", "Virgo": "سنبله",
    "Libra": "میزان", "Scorpio": "عقرب", "Sagittarius": "قوس",
    "Capricorn": "جدی", "Aquarius": "دلو", "Pisces": "حوت",
}

SPACE_TERMS = {
    "asteroid": "سیارک", "comet": "دنباله\u200cدار",
    "meteor": "شهاب", "meteorite": "شهاب\u200cسنگ",
    "full moon": "ماه کامل", "new moon": "ماه نو",
    "solar eclipse": "خورشیدگرفتگی", "lunar eclipse": "ماه\u200cگرفتگی",
    "supernova": "ابرنواختر", "nebula": "سحابی",
    "galaxy": "کهکشان", "star": "ستاره",
    "planet": "سیاره", "satellite": "ماهواره",
    "space station": "ایستگاه فضایی", "astronaut": "فضانورد",
}

# Merge all maps for general text replacement
ALL_TERMS = {**PLANETS, **ZODIAC_SIGNS, **SPACE_TERMS}

# Solar event translations for DONKI
SOLAR_EVENTS = {
    "FLR": ("پرتو ایکس خورشیدی", "flare"),
    "CME": ("افشای جرم تاجی", "coronal mass ejection"),
    "IPS": ("طوفان ژئومغناطیسی", "geomagnetic storm"),
    "GST": ("طوفان ژئومغناطیسی", "geomagnetic storm"),
    "SPE": ("پرتو ذرات خورشیدی", "solar particle event"),
    "ACT": ("فعالیت خورشیدی", "solar activity"),
    "WIN": ("باد خورشیدی", "solar wind"),
    "ABS": ("جذبِ پرتو", "absorption"),
    "CUE": ("پیش\u200cآگاهی CME", "CME alert"),
}


def translate_planet(name: str) -> str:
    """Translate a planet name to Persian."""
    return PLANETS.get(name, name)


def translate_sign(name: str) -> str:
    """Translate a zodiac sign to Persian."""
    return ZODIAC_SIGNS.get(name, name)


def translate_text(text: str) -> str:
    """Translate English text by replacing known terms with Persian equivalents.
    
    Processes longer phrases first to avoid partial replacements.
    """
    if not text:
        return text
    # Sort by length (longest first) to avoid partial replacements
    sorted_terms = sorted(ALL_TERMS.items(), key=lambda x: len(x[0]), reverse=True)
    for en, fa in sorted_terms:
        text = text.replace(en, fa)
    return text


def enrich_dict(data: dict, name_key: str = "name") -> dict:
    """Add _fa (Persian) fields to a dict for any known planet/sign keys.
    
    Example: {"name": "Mars"} → {"name": "Mars", "name_fa": "مریخ"}
    """
    result = data.copy()
    if name_key in result:
        val = result[name_key]
        if val in ALL_TERMS:
            result[f"{name_key}_fa"] = ALL_TERMS[val]
    return result


def translate_event_type(event_type: str) -> str:
    """Translate a DONKI event type to Persian."""
    if event_type in SOLAR_EVENTS:
        return SOLAR_EVENTS[event_type][0]
    return event_type
