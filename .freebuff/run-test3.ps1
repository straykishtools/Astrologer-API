$env:PYTHONIOENCODING = "utf-8"
$env:KERYKEION_EPHEMERIS_BACKEND = "libephemeris"
Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
& "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -c @"
import sys
sys.path.insert(0, '.')
sys.stdout.reconfigure(encoding='utf-8')
from app.main import app
routes = [r.path for r in app.routes if hasattr(r, 'path')]
bio = [r for r in routes if 'biorhythm' in r]
zod = [r for r in routes if 'chinese-zodiac' in r]
num = [r for r in routes if 'numerology' in r]
print(f'Biorhythm routes: {bio}')
print(f'Zodiac routes: {zod}')
print(f'Numerology routes: {num}')
"@
