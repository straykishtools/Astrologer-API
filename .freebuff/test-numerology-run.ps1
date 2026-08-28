$env:KERYKEION_EPHEMERIS_BACKEND = "libephemris"
$env:ENV_TYPE = "dev"
Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
& "venv\Scripts\python.exe" .freebuff/test-numerology.py
