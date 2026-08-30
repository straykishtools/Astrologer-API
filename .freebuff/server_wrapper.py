"""
Server wrapper: patches sys.modules['swisseph'] with libephemeris before importing app.main.
This is required because kerykeion imports swisseph directly.
"""
import os
import sys
import types

# Set working directory to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)
sys.path.insert(0, PROJECT_ROOT)

# Set required env vars
os.environ["KERYKEION_EPHEMERIS_BACKEND"] = "libephemeris"
os.environ.setdefault("ENV_TYPE", "dev")

# Patch swisseph
try:
    import libephemeris
    swisseph = types.ModuleType("swisseph")
    swisseph.__version__ = getattr(libephemeris, "__version__", "2.10.3.2")
    for attr in dir(libephemeris):
        if not attr.startswith("_"):
            setattr(swisseph, attr, getattr(libephemeris, attr))
    sys.modules["swisseph"] = swisseph
except ImportError:
    # If libephemeris is not available, create a dummy
    swisseph = types.ModuleType("swisseph")
    swisseph.__version__ = "2.10.3.2"
    swisseph.set_ephe_path = lambda *a, **kw: None
    sys.modules["swisseph"] = swisseph

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8003,
        reload=False,
        log_level="info",
    )
