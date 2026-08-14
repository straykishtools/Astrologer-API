# app/patch_ephemeris.py
import sys
try:
    import libephemeris as swe
    sys.modules['swisseph'] = swe
    print("✅ Ephemeris patched successfully")
except ImportError:
    print("❌ libephemeris not found!")