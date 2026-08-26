$env:KERYKEION_EPHEMERIS_BACKEND = "libephemris"
$env:PYTHONIOENCODING = "utf-8"
$env:ENV_TYPE = "dev"
cd "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
& "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
