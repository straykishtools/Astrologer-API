# Run Doc — Astrologer API (Freebuff Preview)

## How to reproduce the uncommitted artifacts

1. The Python venv is already present at `venv/Scripts/python.exe`.
2. No `.env.local` needed — env vars are set inline in the startup script.
3. The `app/engines/` directory must exist with `__init__.py` and `abjad.py`.

## How to run the server

Default port is 8000. If that's held by another thread, pick a free port (check with `netstat`). Current free ports: try 8030, 8040, etc.

```powershell
# Port 8003 (if 8000 is busy)
$env:KERYKEION_EPHEMERIS_BACKEND = "libephemris"
$env:PYTHONIOENCODING = "utf-8"
$env:ENV_TYPE = "dev"
& "venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8003
```

Or via the startup script (defaults to 8000):
```
powershell -NoProfile -ExecutionPolicy Bypass -File .freebuff/start-server.ps1
```

## Route structure

- `GET /` → `index.html` (served by StaticFiles with `html=True`)
- `GET /api/status` → JSON status (moved from `/` in misc.py)
- `GET /health` → JSON health check (unchanged)

## Chart endpoints (frontend tabs)

| Tab | API Endpoint | Input |
|-----|-------------|-------|
| چارت تولد | `POST /api/v5/chart-data/birth-chart` | 1 subject |
| سیناستری | `POST /api/v5/chart-data/synastry` | 2 subjects |
| کامپوزیت | `POST /api/v5/chart-data/composite` | 2 subjects |
| ترانزیت | `POST /api/v5/chart-data/transit` | natal + transit date |
| بازگشت خورشیدی | `POST /api/v5/chart-data/solar-return` | subject + year |
| بازگشت ماهانه | `POST /api/v5/chart-data/lunar-return` | subject + year/month |

## Mizaj endpoints

| Endpoint | Input | Description |
|----------|-------|-------------|
| `POST /api/v5/mizaj` | `{questionnaire_type: "mmq"|"smq", answers: {q1..q10 or q1..q20}}` | Calculate temperament |

- MMQ (10Q Mojahedi): Q1-Q8 hot/cold (1-3), Q9-Q10 wet/dry (1-3)
- SMQ (20Q Salmannezhad): Q1-Q15 hot/cold (1-5), Q16-Q20 wet/dry (1-5)

## Abjad endpoints

| Endpoint | Input | Description |
|----------|-------|-------------|
| `POST /api/v5/abjad` | `{text: "string", method: "kabir"|"saghir"}` | Abjad numerology calculation |
| `POST /api/v5/abjad/compare` | `{name1: "string", name2: "string", method: "kabir"|"saghir"}` | Compare two names by abjad |

### Abjad engine location
- `app/engines/abjad.py` — calculation logic
- `app/routers/abjad_router.py` — FastAPI router
- Registered in `app/main.py` as `abjad_router`

## Tarot endpoints

| Endpoint | Input | Description |
|----------|-------|-------------|
| `GET /api/v5/tarot/cards` | — | All 78 cards (glossary) |
| `GET /api/v5/tarot/daily` | — | Daily card (date-seeded, same card all day) |
| `POST /api/v5/tarot/draw` | `{count: 1-78, with_reversed: true}` | Random card draw |
| `GET /api/v5/tarot/spread/three` | — | Past/Present/Future 3-card spread |
| `GET /api/v5/tarot/spread/celtic` | — | 10-card Celtic Cross spread |

### Tarot engine location
- `app/engines/tarot.py` — TarotEngine class
- `app/routers/tarot_router.py` — FastAPI router
- Registered in `app/main.py` as `tarot_router`
- Card data: `app/cards.json` (78 Persian-translated tarot cards)

## Known issues

- Port 8080 is held by other processes; 8030 was previously used by this thread

- All OpenRouter free models share a daily rate limit (429 when exhausted)
- `/api/v5/deepseek-analysis` needs a paid API key for reliable analysis
- Vedic bhava filename mismatch was fixed (files renamed + unwrapping added)
- All emoji in print() statements replaced with ASCII equivalents for Windows cp1252 compat
- Port 8002 may be held by stale processes; use 8003 if needed
