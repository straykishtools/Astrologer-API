# app/patch_ephemeris.py
import sys
try:
    import libephemeris as swe
    sys.modules['swisseph'] = swe
    print("[OK] Ephemeris patched successfully")
except ImportError:
    print("[WARN] libephemeris not found!")
