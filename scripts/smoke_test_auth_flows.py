"""Smoke test: password reset + login throttling (auth rate limit)."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

_env = Path(__file__).parent.parent / ".env"
if _env.exists():
    for _line in _env.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _v = _line.split("=", 1)
        os.environ.setdefault(_k.strip(), _v.strip())

# production env for throttling test (rate-limit bypasses under test)
os.environ["ENV_TYPE"] = "production"

from fastapi.testclient import TestClient
from app.main import app
from app.services.email_service import get_inbox
from app.middleware import rate_limit_middleware as rlm


def reset_inbox() -> None:
    """dev mailbox is module-level; clear it via the deque attribute."""
    from app.services import email_service
    email_service._mailbox.clear()


print("=" * 60)
print("TEST 1: password reset email")
print("=" * 60)
reset_inbox()
with TestClient(app) as c:
    r = c.post(
        "/api/v5/auth/forgot-password",
        json={"email": "smoke_test_user@example.com"},
    )
    print(f"forgot-password status: {r.status_code}")
    print(f"body: {r.text[:200]}")
    inbox = get_inbox()
    print(f"inbox count: {len(inbox)}")
    for m in inbox[:3]:
        print(f"  -> to={m['to']!r}  subject={m['subject']!r}  sent={m['sent']}")

print()
print("=" * 60)
print("TEST 2: login throttling (10 wrong attempts → 429)")
print("=" * 60)
# ریست throttle store تا شروع تمیز باشه
import sqlite3
from app.middleware.rate_limit_middleware import _throttle_table_ready
db_path = rlm.DEFAULT_DB_PATH
try:
    with sqlite3.connect(str(db_path)) as conn:
        conn.execute("DELETE FROM login_throttle WHERE ip = ?", ("203.0.113.99",))
        conn.commit()
except Exception as exc:
    print(f"(throttle cleanup skipped: {exc})")

# 10 بار پسورد اشتباه بزن از یه IP
ip = "203.0.113.99"
with TestClient(app) as c:
    for attempt in range(1, rlm.LOGIN_FAILURE_LIMIT + 2):
        r = c.post(
            "/api/v5/auth/login",
            json={"email": "smoke_test_user@example.com", "password": "wrongpw"},
            headers={"X-Forwarded-For": ip},
        )
        if r.status_code == 429:
            print(f"  attempt {attempt:2d}: 429 ✅ (locked)")
            print(f"           body: {r.text[:120]}")
            break
        print(f"  attempt {attempt:2d}: {r.status_code}")
    else:
        print(f"❌ never got 429 after {rlm.LOGIN_FAILURE_LIMIT} attempts")
