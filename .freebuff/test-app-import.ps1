$env:PYTHONIOENCODING = "utf-8"
$env:KERYKEION_EPHEMERIS_BACKEND = "libephemeris"
Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
& "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -c @"
import sys, traceback
sys.path.insert(0, '.')
sys.stdout.reconfigure(encoding='utf-8')
try:
    from app.main import app
    schema = app.openapi()
    paths = list(schema.get('paths', {}).keys())
    bio = [p for p in paths if 'biorhythm' in p]
    zod = [p for p in paths if 'chinese-zodiac' in p]
    num = [p for p in paths if 'numerology' in p]
    tarot = [p for p in paths if 'tarot' in p]
    print(f'Biorhythm: {bio}')
    print(f'Zodiac: {zod}')
    print(f'Numerology: {num}')
    print(f'Tarot: {tarot}')
    print(f'Total paths: {len(paths)}')
except Exception as e:
    traceback.print_exc()
    print(f'FAILED: {e}')
"@
