#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تولید آیکون‌های یکپارچه UI با سبک تیره-طلایی کیهانی
Unified dark-gold cosmic SVG icon set for Cosmic Oracle.
Regenerate with:  python tools/generate_ui_icons.py
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "static", "images", "ui")
OUT = os.path.abspath(OUT)

GOLD_GRADIENT = (
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    '<stop offset="0" stop-color="#f8e2a4"/>'
    '<stop offset=".5" stop-color="#dbb55c"/>'
    '<stop offset="1" stop-color="#a97a2b"/>'
    '</linearGradient></defs>'
)

STROKE = 'stroke="url(#g)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"'


def sparkle(cx, cy, s=1.0, fill="#fff0bd"):
    """4-point star (sparkle) centered at cx,cy with half-size s."""
    p = []
    for dx, dy in ((0, -s), (0.28 * s, -0.28 * s), (s, 0), (0.28 * s, 0.28 * s),
                   (0, s), (-0.28 * s, 0.28 * s), (-s, 0), (-0.28 * s, -0.28 * s)):
        p.append("%.2f,%.2f" % (cx + dx, cy + dy))
    return '<path d="M%s Z" fill="%s" opacity=".95"/>' % (" L".join(p), fill)


def dot(cx, cy, r=0.4, fill="#f2d68a"):
    return '<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s" opacity=".9"/>' % (cx, cy, r, fill)


def rays(cx, cy, r_in, r_out, n=8, rot=0):
    """Sun rays as short lines around a center."""
    parts = []
    for i in range(n):
        a = math.radians(rot + i * 360.0 / n)
        x1 = cx + r_in * math.cos(a)
        y1 = cy + r_in * math.sin(a)
        x2 = cx + r_out * math.cos(a)
        y2 = cy + r_out * math.sin(a)
        parts.append('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f"/>' % (x1, y1, x2, y2))
    return "".join(parts)


ICONS = {}

# ── لوگو: کره‌ی کیهانی با مدار و ستاره ──
ICONS["logo"] = (
    '<circle cx="12" cy="12" r="10"/>'
    '<ellipse cx="12" cy="12" rx="2.1" ry="10.4" transform="rotate(24 12 12)" opacity=".55" stroke-width="1.1"/>'
    '<circle cx="12" cy="12" r="6.4" opacity=".5" stroke-width="1"/>'
    + sparkle(12, 12, 1.9) +
    dot(12, 12, 0.5, "#ffe9ad") +
    dot(5.4, 5.6, 0.35) + dot(18.6, 6.2, 0.3) + dot(17.8, 17.2, 0.35) + dot(6.4, 18.4, 0.3)
)

# ── خانه / صفحه اصلی ──
ICONS["home"] = (
    '<path d="M3 10.5 L12 3.5 L21 10.5"/>'
    '<path d="M5 9.6 V20 H19 V9.6"/>'
    '<path d="M10 20 V15 H14 V20"/>'
    + sparkle(18, 4.6, 0.8)
)

# ── داشبورد ──
ICONS["dashboard"] = (
    '<path d="M4 19 V12"/>'
    '<path d="M12 19 V7"/>'
    '<path d="M20 19 V14.5"/>'
    '<path d="M3 19.4 H21"/>'
    + sparkle(19.2, 4.4, 0.75)
)

# ── چارت تولد: چرخ زودیاک ──
ICONS["birth"] = (
    '<circle cx="12" cy="12" r="9.2"/>'
    '<circle cx="12" cy="12" r="4.6" opacity=".55" stroke-width="1.1"/>'
    '<path d="M12 2.8 V21.2" opacity=".75" stroke-width="1.2"/>'
    '<path d="M2.8 12 H21.2" opacity=".75" stroke-width="1.2"/>'
    + dot(12, 7.4, 0.3) + dot(16.6, 12, 0.3) + dot(12, 16.6, 0.3) + dot(7.4, 12, 0.3)
)

# ── سیناستری: دو دایره‌ی هم‌پوشان ──
ICONS["synastry"] = (
    '<circle cx="9.1" cy="12" r="6.7"/>'
    '<circle cx="14.9" cy="12" r="6.7"/>'
    + sparkle(12, 7.6, 0.85) + dot(12, 14.6, 0.32)
)

# ── کامپوزیت: حلقه‌های زنجیر ──
ICONS["composite"] = (
    '<ellipse cx="10.2" cy="11.2" rx="3.3" ry="5.7" transform="rotate(-26 10.2 11.2)"/>'
    '<ellipse cx="14.4" cy="13" rx="3.3" ry="5.7" transform="rotate(26 14.4 13)"/>'
    + dot(12, 12, 0.4)
)

# ── ترانزیت: کره با مدار و پیکان ──
ICONS["transit"] = (
    '<circle cx="11.6" cy="12.6" r="6.6"/>'
    '<ellipse cx="11.6" cy="12.6" rx="10.2" ry="3.6" transform="rotate(-12 11.6 12.6)" opacity=".8"/>'
    '<path d="M20.2 7.4 L22 8.6 L20.4 9.9" fill="none" stroke="url(#g)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + dot(4.2, 13.6, 0.42)
)

# ── بازگشت خورشیدی ──
ICONS["solar-return"] = (
    '<circle cx="12" cy="12" r="4.1"/>' +
    rays(12, 12, 5.7, 8.3) +
    sparkle(18.2, 5.2, 0.8)
)

# ── بازگشت ماهانه: هلال ──
ICONS["lunar-return"] = (
    '<path d="M14.6 3.6 A8.4 8.4 0 1 0 14.6 20.4 A6.4 6.4 0 1 1 14.6 3.6 Z"/>'
    + sparkle(19, 6.2, 0.75)
)

# ── مزاج‌شناسی: ترازو ──
ICONS["mizaj"] = (
    '<path d="M3 6.2 H21"/>'
    '<path d="M12 6.2 V9.2"/>'
    '<path d="M6.6 6.2 V9.2"/>'
    '<path d="M17.4 6.2 V9.2"/>'
    '<path d="M3.4 9.2 H9.8 A3.2 3.2 0 0 1 3.4 9.2 Z"/>'
    '<path d="M14.2 9.2 H20.6 A3.2 3.2 0 0 1 14.2 9.2 Z"/>'
    '<path d="M12 15 V17.6"/>'
    '<path d="M6.6 17.6 H17.4"/>'
)

# ── ابجد: قلم نی و قطره ──
ICONS["abjad"] = (
    '<path d="M7.2 18.6 C7 13.4 9 8.2 12 4.6 C15 8.2 17 13.4 16.8 18.6"/>'
    '<path d="M12 4.6 V18.6" opacity=".7" stroke-width="1.1"/>'
    + dot(12, 20.1, 0.85) + sparkle(18.6, 5.4, 0.75)
)

# ── فال حافظ: کتاب باز با شاخه ──
ICONS["hafez"] = (
    '<path d="M3 5.6 C7 4.2 10.4 4.1 12 5.1 C13.6 4.1 17 4.2 21 5.6 V17.6 C17 16.2 13.6 16.1 12 17.1 C10.4 16.1 7 16.2 3 17.6 Z"/>'
    '<path d="M12 5.1 V17.1" opacity=".65" stroke-width="1.1"/>'
    '<path d="M12 5.2 C12 3 13.7 2.4 15.4 3 C14.7 4.2 13.4 4.9 12 5.2 Z" fill="url(#g)"/>'
    + sparkle(18.4, 4.2, 0.6)
)

# ── عددشناسی: لوزی جادویی ──
ICONS["numerology"] = (
    '<path d="M12 2.6 L21.4 12 L12 21.4 L2.6 12 Z"/>'
    + dot(12, 12, 1.05, "#ffe9ad") +
    dot(8.6, 8.6, 0.55) + dot(15.4, 15.4, 0.55) + dot(8.6, 15.4, 0.55) + dot(15.4, 8.6, 0.55)
)

# ── بیوریتم: سه موج ──
ICONS["biorhythm"] = (
    '<path d="M3 6.6 C6 3.4 9 9.8 12 6.6 C15 3.4 18 9.8 21 6.6"/>'
    '<path d="M3 12 C6 8.8 9 15.2 12 12 C15 8.8 18 15.2 21 12"/>'
    '<path d="M3 17.4 C6 14.2 9 20.6 12 17.4 C15 14.2 18 20.6 21 17.4"/>'
)

# ── سال حیوانی: مُهر دایره‌ای با پنجه ──
ICONS["zodiac"] = (
    '<circle cx="12" cy="12" r="9.1"/>'
    '<ellipse cx="12" cy="15" rx="2.7" ry="2.15"/>'
    + dot(8.2, 10.6, 1.0, "#f2d68a") + dot(12, 9.6, 1.0, "#f2d68a") + dot(15.8, 10.6, 1.0, "#f2d68a")
)

# ── پرسش روزانه: ؟ در لوزی ──
ICONS["daily-question"] = (
    '<path d="M12 3 L21 12 L12 21 L3 12 Z"/>'
    '<path d="M12 8.4 A2.7 2.7 0 0 1 14.7 11.1 C14.7 13.2 12 13.3 12 15.2 V15.6"/>'
    + dot(12, 17.9, 0.7, "#ffe9ad")
)

# ── کیفیت زندگی: فهرست ──
ICONS["qol"] = (
    '<path d="M3 6 H12.5"/>'
    '<path d="M3 12 H12.5"/>'
    '<path d="M3 18 H12.5"/>'
    '<path d="M15.6 5.2 L16.8 6.4 L19.4 3.8"/>'
    '<path d="M15.6 11.2 L16.8 12.4 L19.4 9.8"/>'
    '<path d="M15.6 17.2 L16.8 18.4 L19.4 15.8"/>'
)

# ── ناسا: سیاره با حلقه و ستاره ──
ICONS["nasa"] = (
    '<circle cx="10.6" cy="13.4" r="5"/>'
    '<ellipse cx="10.6" cy="13.4" rx="9" ry="2.9" transform="rotate(-18 10.6 13.4)" opacity=".85"/>'
    + sparkle(19.2, 4.8, 0.9) + sparkle(5.2, 4.6, 0.6)
)

# ── فاز ماه ──
ICONS["moon-phase"] = (
    '<circle cx="12" cy="12" r="7.4"/>'
    '<path d="M4.8 12 A7.2 7.2 0 0 1 19.2 12" opacity=".7" stroke-width="1.1"/>'
    + dot(10.6, 5.6, 0.34) + dot(16.8, 9.4, 0.34) + dot(16.8, 14.6, 0.34) + dot(10.6, 18.4, 0.34)
)

# ── تاروت (آیکون منو؛ کارت‌های واقعی دست‌نخورده) ──
ICONS["tarot"] = (
    '<rect x="5" y="3.6" width="14" height="16.8" rx="2"/>'
    '<rect x="7.6" y="6.2" width="8.8" height="11.6" rx="1.2" opacity=".55" stroke-width="1.1"/>'
    + sparkle(12, 9.6, 1.3) + dot(12, 15.2, 0.3)
)

# ── یوگا: نیلوفر ──
ICONS["yoga"] = (
    '<path d="M12 4.4 C13.5 7.2 13.5 9.9 12 12.3 C10.5 9.9 10.5 7.2 12 4.4 Z"/>'
    '<path d="M6.9 7.6 C9.1 8.7 10.5 10.5 11 12.9 C8.7 12.3 6.9 10.7 6.9 7.6 Z"/>'
    '<path d="M17.1 7.6 C14.9 8.7 13.5 10.5 13 12.9 C15.3 12.3 17.1 10.7 17.1 7.6 Z"/>'
    '<path d="M8 15.2 C10 17 14 17 16 15.2"/>'
    '<path d="M12 12.3 V17.4"/>'
    '<path d="M8.4 17.6 H15.6"/>'
)

# ── تنفس: جریان دم/بازدم ──
ICONS["breath"] = (
    '<circle cx="12" cy="12" r="7.3"/>'
    '<path d="M12 4.7 A3.6 3.6 0 0 0 12 12 A3.6 3.6 0 0 1 12 19.3"/>'
    + dot(12, 8.4, 0.95, "#ffe9ad") + dot(12, 15.6, 0.95, "#ffe9ad")
)

# ── ابزارهای کیهانی (سرستون) ──
ICONS["star"] = (
    '<path d="M12 2.6 L13.3 10.7 L21.4 12 L13.3 13.3 L12 21.4 L10.7 13.3 L2.6 12 L10.7 10.7 Z"/>'
)

# ── حکمت ایرانی: مارپیچ DNA ──
ICONS["wisdom"] = (
    '<path d="M8.6 3 C11 6.2 6.4 9.4 8.8 12.6 C11.2 15.8 6.6 19 9 22.2"/>'
    '<path d="M15.4 3 C13 6.2 17.6 9.4 15.2 12.6 C12.8 15.8 17.4 19 15 22.2"/>'
    '<path d="M9.4 7.2 L14.8 10" opacity=".7" stroke-width="1.1"/>'
    '<path d="M9 13.8 L15 16.8" opacity=".7" stroke-width="1.1"/>'
    '<path d="M10 19.6 L14.4 17.4" opacity=".7" stroke-width="1.1"/>'
)

# ── شخصیت و پیش‌بینی (سرستون): سه کارت ──
ICONS["prediction"] = (
    '<g transform="rotate(-14 12 12)"><rect x="8" y="4.4" width="8" height="15.2" rx="1.3"/></g>'
    '<g transform="rotate(14 12 12)"><rect x="8" y="4.4" width="8" height="15.2" rx="1.3"/></g>'
    '<g transform="rotate(0 12 12)"><rect x="8" y="4.4" width="8" height="15.2" rx="1.3"/>'
    + sparkle(12, 9.4, 1.0) + '</g>'
)

# ── جهان (سرستون): کهکشان ──
ICONS["universe"] = (
    '<path d="M18.6 12 A6.6 6.6 0 1 1 12 5.4 A4.1 4.1 0 1 0 12 13.6 A2.1 2.1 0 1 1 12 9.4"/>'
    + sparkle(4.8, 6, 0.75) + sparkle(19.4, 4.8, 0.6)
)

# ── بدن و ذهن (سرستون): قلب با نبض ──
ICONS["body"] = (
    '<path d="M12 19.2 C7.4 15.7 4.4 12.9 4.4 9.3 C4.4 6.8 6.4 4.9 8.8 4.9 C10.2 4.9 11.4 5.6 12 6.6 C12.6 5.6 13.8 4.9 15.2 4.9 C17.6 4.9 19.6 6.8 19.6 9.3 C19.6 12.9 16.6 15.7 12 19.2 Z"/>'
    '<path d="M3.4 12 H7.2 L9 8.6 L11 15.4 L12.6 11.8 L13.6 12 H20.6" opacity=".85" stroke-width="1.2"/>'
)

# ── مدیریت (سرستون): چرخ‌دنده ──
ICONS["admin"] = (
    '<circle cx="12" cy="12" r="3.3"/>' +
    rays(12, 12, 4.9, 6.6, 8, 22.5)
)

# ── کاربر ──
ICONS["user"] = (
    '<circle cx="12" cy="7.6" r="3.1"/>'
    '<path d="M4.8 19.6 C4.8 14.9 8.4 12.9 12 12.9 C15.6 12.9 19.2 14.9 19.2 19.6"/>'
)

# ── زحل (کارت لندینگ) ──
ICONS["saturn"] = (
    '<circle cx="11.6" cy="12.6" r="4.7"/>'
    '<ellipse cx="11.6" cy="12.6" rx="8.9" ry="2.9" transform="rotate(-16 11.6 12.6)" opacity=".85"/>'
    + sparkle(19.4, 5, 0.8)
)

# ── صاعقه (جنبه‌های سیاره‌ای) ──
ICONS["bolt"] = (
    '<path d="M13.2 2.6 L6.4 13.2 H11.2 L10.2 21.4 L17.6 10.4 H12.6 Z"/>'
    + sparkle(18.6, 5, 0.7)
)

# ── آتش (تعادل عناصر) ──
ICONS["fire"] = (
    '<path d="M12 21.2 C8 17.8 6.4 14.6 6.4 11.6 A5.6 5.6 0 0 1 17.6 11.6 C17.6 14.6 16 17.8 12 21.2 Z"/>'
    '<path d="M12 21.2 C9.9 18.9 9.3 16.4 10 14.1 C10.8 15.9 11.6 16.8 12.6 18.2" opacity=".7" stroke-width="1.1"/>'
    + sparkle(18.2, 4.8, 0.7)
)

# ── قلب (عاطفی) ──
ICONS["heart"] = (
    '<path d="M12 19.4 C7.4 15.9 4.4 13.1 4.4 9.5 C4.4 7 6.4 5.1 8.8 5.1 C10.2 5.1 11.4 5.8 12 6.8 C12.6 5.8 13.8 5.1 15.2 5.1 C17.6 5.1 19.6 7 19.6 9.5 C19.6 13.1 16.6 15.9 12 19.4 Z"/>'
    + sparkle(12, 3.4, 0.7)
)

# ── ذهن (فکری) ──
ICONS["brain"] = (
    '<path d="M12 3.6 C8.6 3.6 6.1 6.1 6.1 9.1 C6.1 10.9 6.9 12.5 8.1 13.5 C8.1 16.1 9.7 18.1 12 18.6 C14.3 18.1 15.9 16.1 15.9 13.5 C17.1 12.5 17.9 10.9 17.9 9.1 C17.9 6.1 15.4 3.6 12 3.6 Z"/>'
    '<path d="M12 6.8 C10.9 8.2 10.9 10 12 11.4 C13.1 12.8 13.1 14.6 12 16" opacity=".7" stroke-width="1.1"/>'
    + dot(8.2, 9, 0.35) + dot(15.8, 9, 0.35)
)

# ── معنویت (معنوی) ──
ICONS["spirit"] = (
    '<circle cx="12" cy="12" r="5.6"/>'
    + sparkle(12, 5.6, 1.15) + sparkle(18.4, 11.4, 0.65) + sparkle(5.6, 11.4, 0.65) + dot(12, 13.2, 0.5)
)

# ── حلقه‌ی بارگذاری (جایگزین ⏳) ──
ICONS["loader"] = (
    '<circle cx="12" cy="12" r="8" opacity=".3" stroke-width="2"/>'
    '<path d="M20 12 A8 8 0 0 0 13.66 4.34" stroke-width="2"/>'
    + dot(12, 12, 0.5)
)


# ── عکس سرویس‌ها: مدالیون ۴۸×۴۸ با هاله‌ی رنگی و حلقه‌ی طلایی ──
# accent → رنگِ هاله (به‌همراه تم تیره-طلایی)
SERVICES = {
    "birth":         ("#f39c12", ICONS["birth"]),
    "synastry":      ("#e84393", ICONS["synastry"]),
    "composite":     ("#a29bfe", ICONS["composite"]),
    "transit":       ("#00b4d8", ICONS["transit"]),
    "solar-return":  ("#fdcb6e", ICONS["solar-return"]),
    "lunar-return":  ("#b8a9f9", ICONS["lunar-return"]),
    "mizaj":         ("#27ae60", ICONS["mizaj"]),
    "abjad":         ("#e17055", ICONS["abjad"]),
    "tarot":         ("#a29bfe", ICONS["tarot"]),
    "numerology":    ("#fdcb6e", ICONS["numerology"]),
    "biorhythm":     ("#e17055", ICONS["biorhythm"]),
    "zodiac":        ("#d35400", ICONS["zodiac"]),
    "daily-question":("#26c6da", ICONS["daily-question"]),
    "hafez":         ("#27ae60", ICONS["hafez"]),
    "nasa":          ("#0984e3", ICONS["nasa"]),
    "moon-phase":    ("#6c5ce7", ICONS["moon-phase"]),
    "yoga":          ("#00cec9", ICONS["yoga"]),
    "breath":        ("#5dade2", ICONS["breath"]),
}


def build(name, body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
            'shape-rendering="geometricPrecision">' + GOLD_GRADIENT +
            '<g %s>' % STROKE + body + '</g></svg>')


def build_medallion(accent, body):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" '
        'shape-rendering="geometricPrecision">'
        '<defs>'
        '<radialGradient id="d" cx=".5" cy=".38" r=".7">'
        '<stop offset="0" stop-color="%s" stop-opacity=".34"/>'
        '<stop offset="1" stop-color="%s" stop-opacity="0"/>'
        '</radialGradient>' % (accent, accent) +
        GOLD_GRADIENT + '</defs>'
        '<circle cx="24" cy="24" r="22.5" fill="url(#d)"/>'
        '<circle cx="24" cy="24" r="21" stroke="url(#g)" stroke-opacity=".38" stroke-width="1"/>'
        '<g stroke="url(#g)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" '
        'fill="none" transform="translate(12 12) scale(1.22)">' + body + '</g>'
        + sparkle(10.5, 9.5, 0.85) + sparkle(38.5, 11.5, 0.7) + dot(39.5, 36, 0.45)
        + dot(9.5, 37.5, 0.4) + '</svg>'
    )


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, body in ICONS.items():
        path = os.path.join(OUT, name + ".svg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(build(name, body))
        print("wrote", os.path.relpath(path))
    # مدالیون سرویس‌ها
    svc_dir = os.path.join(OUT, "..", "services")
    svc_dir = os.path.abspath(svc_dir)
    os.makedirs(svc_dir, exist_ok=True)
    for name, (accent, body) in SERVICES.items():
        path = os.path.join(svc_dir, name + ".svg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(build_medallion(accent, body))
        print("wrote", os.path.relpath(path))
    print("icons:", len(ICONS), "| services:", len(SERVICES))


if __name__ == "__main__":
    main()