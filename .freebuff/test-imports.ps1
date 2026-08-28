$env:PYTHONIOENCODING = "utf-8"
Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
$python = "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe"

Write-Output "=== Testing biorhythm import ==="
& $python -c "from app.engines.biorhythm import BiorhythmEngine; e = BiorhythmEngine(); r = e.calculate('1990-01-01','2026-08-27'); Write-Output ('Biorhythm OK: ' + [string]$r.physical)" 2>&1

Write-Output "=== Testing chinese_zodiac import ==="
& $python -c "from app.engines.chinese_zodiac import ChineseZodiacEngine; e = ChineseZodiacEngine(); r = e.calculate(1990); Write-Output ('Zodiac OK: ' + r.animal)" 2>&1

Write-Output "=== Testing router imports ==="
& $python -c "from app.routers.biorhythm_router import router; Write-Output ('Biorhythm routes: ' + [string]$router.routes.Count)" 2>&1
& $python -c "from app.routers.chinese_zodiac_router import router; Write-Output ('Zodiac routes: ' + [string]$router.routes.Count)" 2>&1
