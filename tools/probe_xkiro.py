"""
probe_xkiro.py — بررسی اینکه xkiro چه نام مدلی قبول می‌کند.
هر سه حالت را امتحان می‌کند:
  1) qwen/qwen3.7-flash:free   (رایج، بدون prefix)
  2) xkiro/qwen/qwen3.7-flash:free   (با prefix — شاید در dashboard نمایش داده می‌شود)
  3) qwen3.7-flash   (ساده‌ترین)
اجرا:  python tools/probe_xkiro.py
"""
import os
import sys
import json
import urllib.request
import urllib.error

# لود .env اگر dotenv نصب باشد
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    load_dotenv(env_path)
except Exception:
    pass

KEY = os.environ.get("AI_API_KEY")
if not KEY:
    print("ERROR: AI_API_KEY در env تنظیم نشده. setx AI_API_KEY=sk-... یا در .env بگذار.", file=sys.stderr)
    sys.exit(1)
URL = "https://api.xkiro.com/v1/chat/completions"

CANDIDATES = [
    "qwen/qwen3.7-flash:free",
    "xkiro/qwen/qwen3.7-flash:free",
    "qwen3.7-flash",
    "qwen/qwen3.7-plus:free",
]


def probe(model: str) -> tuple[int, str]:
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 16,
    }).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=body,
        headers={
            "Authorization": "Bearer " + KEY,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read().decode("utf-8", errors="replace")[:300]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")[:300]
    except Exception as e:
        return -1, f"{type(e).__name__}: {e}"


for m in CANDIDATES:
    code, body = probe(m)
    print(f"--- {m} ---  HTTP {code}")
    print(body)
    print()
