cd C:\Users\Lucid\Documents\GitHub\Astrologer-API
venv\Scripts\activate
$env:KERYKEION_EPHEMERIS_BACKEND="libephemeris"
python -m uvicorn app.main:app --reload --env-file .env