# Run Doc — Astrologer API (Freebuff Preview)

## How to reproduce the uncommitted artifacts

1. The Python venv is already present at `venv/Scripts/python.exe`.
2. `libephemeris` is installed in the venv — it substitutes for `swisseph`.
3. `.freebuff/server_wrapper.py` patches `sys.modules['swisseph']` with `libephemeris` before importing `app.main`. This is required because kerykeion directly imports `swisseph`.
4. No `.env.local` needed — env vars are set in the wrapper script.

## How to run the server

### Port: 8003 (default; port 8000 is held by other processes)

**Option A — Via PowerShell startup script (preferred for detached preview):**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .freebuff\start-preview.ps1
```
This starts the server detached via `Start-Process`, logging to `.freebuff\preview-*.log`.

**Option B — Direct invocation:**
```powershell
$env:KERYKEION_EPHEMERIS_BACKEND = "libephemeris"
$env:PYTHONIOENCODING = "utf-8"
$env:ENV_TYPE = "dev"
& "venv\Scripts\python.exe" .freebuff\server_wrapper.py
```

**Option C — Via start.bat (port 8000, with --reload):**
```
start.bat
```

## Route structure

- `GET /` → `index.html` (served as FileResponse)
- `GET /health` → `{"status": "OK"}`

## Frontend tabs

| Tab | API Endpoint | Input |
|-----|-------------|-------|
| چارت تولد | `POST /api/v5/chart-data/birth-chart` | 1 subject |
| سیناستری | `POST /api/v5/chart-data/synastry` | 2 subjects |
| کامپوزیت | `POST /api/v5/chart-data/composite` | 2 subjects |
| ترانزیت | `POST /api/v5/chart-data/transit` | natal + transit date |
| بازگشت خورشیدی | `POST /api/v5/chart-data/solar-return` | subject + year |
| بازگشت ماهانه | `POST /api/v5/chart-data/lunar-return` | subject + year/month |
| مزاج‌شناسی | `POST /api/v5/mizaj` | questionnaire answers |
| ابجد | `POST /api/v5/abjad` | text + method |
| تاروت | `GET /api/v5/tarot/daily`, `POST /api/v5/tarot/draw` | — / count |
| عددشناسی | `POST /api/v5/numerology/life-path` | year/month/day |
| بیوریتم | `POST /api/v5/biorhythm` | birth_date |
| سال حیوانی | `POST /api/v5/chinese-zodiac` | year |
| پرسش روزانه | `POST /api/v5/daily-question` | question/birth_date/birth_year |
| فال حافظ | `POST /api/v5/hafez` | optional question |

## Geo API Resolution (City → Coordinates)

The system uses a **Geo API → GeoNames fallback** strategy for resolving city coordinates:

1. **Primary**: `GeoService` (apidevelopers.ir/api/v1/geo) resolves city → lat/lng/tz
2. **Fallback**: If Geo API fails (timeout, 5xx, network error), falls back to GeoNames (kerykeion `online=True`)
3. **Offline**: If all coords are provided directly, no API call is made

Resolution is handled in `app/utils/router_utils.py` via:
- `try_geo_api_resolution(city, nation)` — tries Geo API, returns coords or None
- `resolve_location_for_subject(subject_request)` — fills in missing coords
- All `create_*_chart_data()` functions call the resolver before building subjects

## Known issues

- Port 8000 is held by other processes; 8003 is the current preview port
- `swisseph` is not installed — `libephemeris` is used via `server_wrapper.py` patch
- All OpenRouter free models share a daily rate limit (429 when exhausted)
- `/api/v5/deepseek-analysis` needs a paid API key for reliable analysis
