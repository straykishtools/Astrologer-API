# One-off generator for PWA icons (static/icons/icon-{72,192,512}.png).
# Deep indigo cosmic background, golden crescent + stars + orbit ring.
import math
import os

from PIL import Image, ImageDraw

BG_TOP = (7, 12, 31)      # #070c1f
BG_BOT = (26, 20, 52)
GOLD = (201, 162, 39)     # #c9a227
GOLD_LIGHT = (240, 217, 140)
GOLD_DIM = (140, 112, 30)
STAR = (232, 226, 244)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make_icon(size: int) -> Image.Image:
    s = size * 4  # supersample for smooth edges
    img = Image.new("RGB", (s, s), BG_TOP)
    d = ImageDraw.Draw(img)

    # vertical gradient background
    for y in range(s):
        d.line([(0, y), (s, y)], fill=lerp(BG_TOP, BG_BOT, y / s))

    cx = cy = s / 2

    # orbit ring (astrolabe)
    r_ring = s * 0.40
    d.ellipse([cx - r_ring, cy - r_ring, cx + r_ring, cy + r_ring],
              outline=GOLD_DIM, width=max(2, s // 60))

    # tilted inner ring
    r_inner = s * 0.30
    d.ellipse([cx - r_inner, cy - r_inner * 0.86, cx + r_inner, cy + r_inner * 0.86],
              outline=GOLD_DIM, width=max(1, s // 90))

    # crescent moon (draw light circle, cover with bg circle offset)
    r_moon = s * 0.22
    mx, my = cx - s * 0.02, cy - s * 0.04
    d.ellipse([mx - r_moon, my - r_moon, mx + r_moon, my + r_moon], fill=GOLD)
    cover_r = r_moon * 0.88
    d.ellipse([mx - cover_r + r_moon * 0.42, my - cover_r - r_moon * 0.10,
               mx + cover_r + r_moon * 0.42, my + cover_r - r_moon * 0.10],
              fill=lerp(BG_TOP, BG_BOT, 0.45))

    # planet dot on orbit
    ang = math.radians(-40)
    px = cx + r_ring * math.cos(ang)
    py = cy + r_ring * math.sin(ang)
    pr = s * 0.035
    d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=GOLD_LIGHT)

    # stars
    stars = [(-0.30, -0.34, 0.020), (0.26, -0.30, 0.014), (0.34, 0.18, 0.018),
             (-0.34, 0.22, 0.012), (0.05, -0.42, 0.011), (-0.12, 0.36, 0.014)]
    for sx, sy, sr in stars:
        r = s * sr
        x, y = cx + s * sx, cy + s * sy
        d.ellipse([x - r, y - r, x + r, y + r], fill=STAR)

    # 4-point sparkle star (top right)
    x, y, r = cx + s * 0.26, cy - s * 0.30, s * 0.055
    d.polygon([(x, y - r * 2), (x + r * 0.45, y - r * 0.45), (x + r * 2, y),
               (x + r * 0.45, y + r * 0.45), (x, y + r * 2), (x - r * 0.45, y + r * 0.45),
               (x - r * 2, y), (x - r * 0.45, y - r * 0.45)], fill=GOLD_LIGHT)

    return img.resize((size, size), Image.LANCZOS)


def main():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "icons")
    os.makedirs(out_dir, exist_ok=True)
    for size in (72, 192, 512):
        make_icon(size).save(os.path.join(out_dir, f"icon-{size}.png"), "PNG")
        print("wrote", f"icon-{size}.png")


if __name__ == "__main__":
    main()
