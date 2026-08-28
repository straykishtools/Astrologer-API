"""Server wrapper: patches swisseph -> libephemeris, then starts uvicorn."""
import sys
import os

# Ensure project root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Patch swisseph with libephemeris before any kerykeion import
import libephemeris as swe
sys.modules['swisseph'] = swe
print("[OK] Ephemeris patched: swisseph -> libephemeris")

# Now start uvicorn
import uvicorn
uvicorn.run(
    "app.main:app",
    host="127.0.0.1",
    port=8003,
    log_level="info",
)
