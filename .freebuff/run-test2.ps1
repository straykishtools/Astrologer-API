$env:PYTHONIOENCODING = "utf-8"
$env:KERYKEION_EPHEMERIS_BACKEND = "libephemeris"
Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
& "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -c "import sys; sys.path.insert(0,'.'); sys.stdout.reconfigure(encoding='utf-8'); from app.engines.biorhythm import BiorhythmEngine; print('Biorhythm OK'); from app.engines.chinese_zodiac import ChineseZodiacEngine; print('Zodiac OK')"
