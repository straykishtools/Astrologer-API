@echo off
set KERYKEION_EPHEMERIS_BACKEND=libephemris
set PYTHONIOENCODING=utf-8
set ENV_TYPE=dev
cd /d C:\Users\Lucid\Documents\GitHub\Astrologer-API
"C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8030 --reload
