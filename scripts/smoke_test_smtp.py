"""
Smoke test for SMTP config — connects & authenticates without sending anything.

Use after filling SMTP_* in .env to confirm Gmail/Yandex/etc credentials are valid
before triggering real user-facing flows (register, password reset).

Run: python scripts/smoke_test_smtp.py
"""
import os
import smtplib
import sys
from pathlib import Path

# .env ساده — هر خط «KEY=value» (بدون نقل‌قول لازم)
_env = Path(__file__).parent.parent / ".env"
if _env.exists():
    for _line in _env.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _v = _line.split("=", 1)
        os.environ.setdefault(_k.strip(), _v.strip())

host = os.getenv("SMTP_HOST", "").strip()
port = int(os.getenv("SMTP_PORT", "587"))
user = os.getenv("SMTP_USER", "").strip()
password = os.getenv("SMTP_PASSWORD", "").strip()

if not host:
    print("❌ SMTP_HOST not set. Fill SMTP_* in .env first.")
    sys.exit(1)
if not user or not password or "your.email" in user or "abcd efgh" in password:
    print("❌ SMTP_USER / SMTP_PASSWORD still have placeholder values.")
    print("   Generate an app password:")
    print("   - Gmail: myaccount.google.com → Security → 2-Step Verification → App passwords")
    print("   - Yandex: passport.yandex.com → Security → App passwords")
    sys.exit(1)

print(f"Connecting to {host}:{port} as {user}...")
try:
    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(user, password)
    print("✅ Auth OK. SMTP credentials work.")
except smtplib.SMTPAuthenticationError as exc:
    print(f"❌ Auth failed: {exc.smtp_code} {exc.smtp_error.decode() if isinstance(exc.smtp_error, bytes) else exc.smtp_error}")
    print("   Common causes:")
    print("   - App password typo or unused")
    print("   - 2FA not enabled on the account")
    print("   - 'Less secure app access' no longer supported — must use app password")
    sys.exit(2)
except Exception as exc:
    print(f"❌ Connection failed: {exc}")
    sys.exit(3)
