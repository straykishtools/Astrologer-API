import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== Testing engine imports ===")
try:
    from app.engines.biorhythm import BiorhythmEngine
    e = BiorhythmEngine()
    r = e.calculate('1990-01-01','2026-08-27')
    print(f"Biorhythm OK: physical={r['physical']}, emotional={r['emotional']}")
except Exception as ex:
    print(f"Biorhythm FAILED: {ex}")

try:
    from app.engines.chinese_zodiac import ChineseZodiacEngine
    e = ChineseZodiacEngine()
    r = e.calculate(1990)
    print(f"Zodiac OK: animal={r['animal']}, element={r['element']}")
except Exception as ex:
    print(f"Zodiac FAILED: {ex}")

print("\n=== Testing router imports ===")
try:
    from app.routers.biorhythm_router import router as r1
    print(f"Biorhythm router: {len(r1.routes)} routes")
except Exception as ex:
    print(f"Biorhythm router FAILED: {ex}")

try:
    from app.routers.chinese_zodiac_router import router as r2
    print(f"Zodiac router: {len(r2.routes)} routes")
except Exception as ex:
    print(f"Zodiac router FAILED: {ex}")

print("\n=== Testing full app import ===")
try:
    from app.main import app
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    bio_routes = [r for r in routes if 'biorhythm' in r]
    zodiac_routes = [r for r in routes if 'chinese-zodiac' in r]
    print(f"Biorhythm routes in app: {bio_routes}")
    print(f"Zodiac routes in app: {zodiac_routes}")
except Exception as ex:
    print(f"App import FAILED: {ex}")
