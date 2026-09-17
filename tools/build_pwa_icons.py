#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_pwa_icons.py — تولید ایکون‌های PWA برای «اختر».

چون فونت فارسی لوکال نداریم (Vazirmatn فقط روی CDN است)، متن «اختر» را با
شکل هندسی-لوگوی هشت‌پر طلایی + خط مواج زیرش می‌سازیم. در هر سایزی شارپ می‌ماند
و به فونت وابسته نیست. wordmark.svg نیز به‌عنوان fallback برای manifest.

خروجی:
  static/icons/akhtar-192.png         (ایکون اصلی PWA)
  static/icons/akhtar-512.png         (ایکون بزرگ)
  static/icons/akhtar-maskable-512.png(maskable با safe-zone 80%)
  static/icons/apple-touch-icon-180.png(apple-touch-icon)
  static/icons/akhtar-wordmark.svg    (لوگوی برداری برای manifest)

اجرا:  python tools/build_pwa_icons.py
"""
import math
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit("Pillow لازم است:  pip install Pillow --break-system-packages")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

# ── پالت طلایی/بنفش پروژه ──
BG_TOP    = (28, 22, 56)     # #1c1638
BG_BOTTOM = (7, 12, 31)     # #070c1f
GOLD_HOT  = (248, 226, 164) # #f8e2a4
GOLD_MID  = (219, 181, 92)  # #dbb55c
GOLD_DARK = (169, 122, 43)  # #a97a2b
STAR_WHITE = (255, 240, 189)  # #fff0bd


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gold_at(t):
    """رنگ طلایی روی منحنی t ∈ [0, 1] (0=روشن، 1=تیره)."""
    if t < 0.5:
        return lerp(GOLD_HOT, GOLD_MID, t * 2)
    return lerp(GOLD_MID, GOLD_DARK, (t - 0.5) * 2)


def fill_bg(size):
    """پس‌زمینه: گرادینت عمودی بنفش تیره + چند نقطه‌ی طلایی محو."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(1, size - 1)
        c = lerp(BG_TOP, BG_BOTTOM, t)
        d.line([(0, y), (size, y)], fill=c + (255,))
    # هاله‌ی نور مرکز بالا
    halo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r in range(size // 2, 0, -2):
        a = int(60 * (1 - r / (size / 2)) ** 2)
        hd.ellipse([size / 2 - r, size / 2 - r * 0.9, size / 2 + r, size / 2 + r * 0.9],
                   fill=(219, 181, 92, a))
    img = Image.alpha_composite(img, halo)
    return img


def draw_eight_petaled(d, cx, cy, R, color, stroke=None, petal_t=0.42, n=8, rot=0):
    """ستاره‌ی هشت‌پر طلایی (لوگوی اصلی)."""
    # بیرونی
    pts_outer = []
    for i in range(n * 2):
        a = math.radians(rot + i * 360 / (n * 2) - 90)
        if i % 2 == 0:
            r = R
        else:
            r = R * petal_t
        pts_outer.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts_outer, fill=color, outline=stroke)
    # دایره‌ی مرکزی توپُر
    d.ellipse([cx - R * 0.18, cy - R * 0.18, cx + R * 0.18, cy + R * 0.18],
              fill=STAR_WHITE, outline=stroke)
    # نقطه‌ی طلایی مرکز
    d.ellipse([cx - R * 0.06, cy - R * 0.06, cx + R * 0.06, cy + R * 0.06],
              fill=color)


def draw_wave(d, x0, x1, y, amp, w, color, n_waves=2):
    """خط مواج زیر لوگو (نماد جریان/نسیم)."""
    pts = []
    steps = 64
    for i in range(steps + 1):
        x = x0 + (x1 - x0) * i / steps
        y_wave = y + amp * math.sin(2 * math.pi * n_waves * i / steps)
        pts.append((x, y_wave))
    d.line(pts, fill=color, width=max(1, int(w)))


def build_icon(size, maskable=False, corner_radius_ratio=0.22):
    """ساخت یک PNG در سایز داده‌شده. maskable=True یعنی با safe-zone 80%."""
    img = fill_bg(size)
    # rounded square (maskable اجازه نمی‌دهد clip داشته باشیم ولی
    # گوشه‌گرد نرم مشکلی ایجاد نمی‌کند؛ برای maskable از radius=0.18 استفاده می‌کنیم)
    radius = int(size * (0.10 if maskable else corner_radius_ratio))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    bg_layer = img
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    img.paste(bg_layer, (0, 0), mask)

    # safe-zone برای maskable: محتوا باید در 80% مرکز باشد
    if maskable:
        sf = 0.80
    else:
        sf = 0.82
    cx, cy = size / 2, size / 2 - size * 0.04
    R = size * 0.5 * sf * 0.55  # شعاع لوگو

    d = ImageDraw.Draw(img)
    # هاله‌ی پشت لوگو
    for r in range(int(R * 1.6), int(R * 0.5), -2):
        a = int(40 * (1 - (r - R * 0.5) / (R * 1.1)) ** 1.6)
        if a < 0:
            continue
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(219, 181, 92, a))

    # ستاره‌ی هشت‌پر
    draw_eight_petaled(d, cx, cy, R, GOLD_HOT, stroke=GOLD_DARK,
                       petal_t=0.45, n=8, rot=0)

    # خط مواج زیر (نماد اختر = ستاره + افق)
    wy = cy + R * 1.5
    draw_wave(d, cx - R * 1.1, cx + R * 1.1, wy, R * 0.12, max(1, int(R * 0.06)),
              GOLD_MID, n_waves=2)

    # چند نقطه‌ی ستاره در اطراف
    star_specs = [
        (0.30, -0.32, 0.05),
        (-0.28, -0.18, 0.04),
        (0.22, 0.30, 0.035),
        (-0.32, 0.30, 0.045),
        (0.36, 0.10, 0.03),
    ]
    for fx, fy, fr in star_specs:
        sx, sy = cx + fx * R * 2, cy + fy * R * 2
        sr = fr * R * 2
        d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=STAR_WHITE)
    return img


def build_wordmark_svg():
    """یک SVG برای manifest: همان لوگو ولی برداری تمیز."""
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1c1638"/>
    <stop offset="1" stop-color="#070c1f"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f8e2a4"/>
    <stop offset=".5" stop-color="#dbb55c"/>
    <stop offset="1" stop-color="#a97a2b"/>
  </linearGradient>
  <radialGradient id="halo" cx=".5" cy=".45" r=".55">
    <stop offset="0" stop-color="#dbb55c" stop-opacity=".35"/>
    <stop offset="1" stop-color="#dbb55c" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="512" height="512" rx="96" fill="url(#bg)"/>
<ellipse cx="256" cy="220" rx="220" ry="180" fill="url(#halo)"/>
<g transform="translate(256 230)">
  <path d="M 0 -110 L 24 -28 L 110 0 L 24 28 L 0 110 L -24 28 L -110 0 L -24 -28 Z"
        fill="url(#gold)" stroke="#a97a2b" stroke-width="3"/>
  <circle r="20" fill="#fff0bd"/>
  <circle r="7" fill="url(#gold)"/>
</g>
<path d="M 130 380 Q 180 360 230 380 T 330 380 T 430 380"
      fill="none" stroke="#dbb55c" stroke-width="6" stroke-linecap="round"/>
<g fill="#fff0bd">
  <circle cx="170" cy="160" r="4"/>
  <circle cx="120" cy="190" r="3"/>
  <circle cx="370" cy="200" r="3.5"/>
  <circle cx="410" cy="290" r="3"/>
  <circle cx="105" cy="280" r="3"/>
</g>
</svg>'''
    (OUT / "akhtar-wordmark.svg").write_text(svg, encoding="utf-8")
    print("wrote", (OUT / "akhtar-wordmark.svg").relative_to(ROOT))


def main():
    # ایکون‌های PWA
    for sz in (192, 512):
        img = build_icon(sz, maskable=False)
        path = OUT / f"akhtar-{sz}.png"
        img.save(path, "PNG", optimize=True)
        print("wrote", path.relative_to(ROOT))
    # maskable (با safe-zone رعایت‌شده + radius کمتر)
    img = build_icon(512, maskable=True)
    path = OUT / "akhtar-maskable-512.png"
    img.save(path, "PNG", optimize=True)
    print("wrote", path.relative_to(ROOT))
    # apple-touch-icon (iOS ایکون مربع بدون radius اضافه می‌خواهد؛
    # خود iOS mask می‌کند. سایز 180 طبق spec)
    img = build_icon(180, maskable=False, corner_radius_ratio=0.18)
    path = OUT / "apple-touch-icon-180.png"
    img.save(path, "PNG", optimize=True)
    print("wrote", path.relative_to(ROOT))
    # wordmark SVG
    build_wordmark_svg()
    print("done.")


if __name__ == "__main__":
    main()
