"""Smoke test: register a user and check the email was actually sent via SMTP."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# بار کردن .env
_env = Path(__file__).parent.parent / ".env"
if _env.exists():
    for _line in _env.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _v = _line.split("=", 1)
        os.environ.setdefault(_k.strip(), _v.strip())

from fastapi.testclient import TestClient
from app.main import app
from app.services.email_service import get_inbox, smtp_configured

print(f"SMTP configured: {smtp_configured()}")
print(f"SMTP_HOST: {os.getenv('SMTP_HOST', '(unset)')}")
print()

with TestClient(app) as c:
    r = c.post(
        "/api/v5/auth/register",
        json={
            "email": "smoke_test_user@example.com",
            "password": "TestPass123!",
            "display_name": "Smoke Test",
        },
    )
    print(f"register status: {r.status_code}")
    print(f"register body:   {r.text[:300]}")
    print()

    inbox = get_inbox()
    print(f"inbox count: {len(inbox)}")
    for m in inbox[:5]:
        print(f"  -> to={m['to']!r}  subject={m['subject']!r}  sent={m['sent']}")
