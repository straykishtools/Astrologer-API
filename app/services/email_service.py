"""
Email delivery service.

Sends via SMTP when configured (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD /
EMAIL_FROM). When SMTP is unset — typical for development — the message is
written to the application log/console so flows are fully testable without a
mail server.
"""
import logging
import os
import smtplib
import time
from collections import deque
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

# In-memory mailbox of recently sent emails (dev tooling only). Ring buffer so
# memory stays bounded; exposed via a dev-only endpoint instead of scraping logs.
_MAILBOX_MAX = 50
_mailbox: deque[dict] = deque(maxlen=_MAILBOX_MAX)


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST"))


def send_email(to: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Deliver an email. Returns True when actually sent, False when only logged."""
    body = html_body or text_body or ""
    sent = False
    if not smtp_configured():
        # Dev mode: surface the message where the developer can see it.
        logger.info("📧 [dev email — SMTP not configured] to=%s subject=%s\n%s", to, subject, body)
        print(f"\n📧 [dev email to {to}] {subject}\n{body}\n")
        _record(to, subject, body, sent=False)
        return False

    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("EMAIL_FROM", user or "noreply@cosmic-oracle.local")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to
    msg.attach(MIMEText(text_body or "Please view this email in an HTML client.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            if user:
                server.login(user, password)
            server.sendmail(from_addr, [to], msg.as_string())
        sent = True
        _record(to, subject, body, sent=True)
        return True
    except Exception:
        logger.exception("SMTP send failed; falling back to console output")
        logger.info("📧 [SMTP failed, console fallback] to=%s subject=%s\n%s", to, subject, body)
        print(f"\n📧 [email to {to}] {subject}\n{body}\n")
        _record(to, subject, body, sent=False)
        return False


def send_verification_email(to: str, token: str) -> bool:
    """Dev-mode friendly verification email; the link contains only the token."""
    verify_url = f"{_app_base_url()}/#/verify-email?token={token}"
    return send_email(
        to,
        "تأیید ایمیل — Cosmic Oracle",
        f"<p>سلام،</p><p>برای تأیید ایمیل خود روی لینک زیر کلیک کنید:</p>"
        f'<p><a href="{verify_url}">{verify_url}</a></p>'
        f"<p>این لینک تا ۲۴ ساعت معتبر است.</p>",
        f"Verify your email: {verify_url}",
    )


def send_password_reset_email(to: str, token: str) -> bool:
    reset_url = f"{_app_base_url()}/#/reset-password?token={token}"
    return send_email(
        to,
        "بازیابی رمز عبور — Cosmic Oracle",
        f"<p>سلام،</p><p>برای تعیین رمز عبور جدید روی لینک زیر کلیک کنید:</p>"
        f'<p><a href="{reset_url}">{reset_url}</a></p>'
        f"<p>این لینک تا ۲۴ ساعت معتبر است. اگر این درخواست را شما نکرده‌اید، این ایمیل را نادیده بگیرید.</p>",
        f"Reset your password: {reset_url}",
    )


def _app_base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:8000")


# ─── In-memory dev mailbox ───


def _record(to: str, subject: str, body: str, sent: bool) -> None:
    _mailbox.append(
        {
            "id": len(_mailbox) + 1,
            "ts": time.strftime("%Y-%m-%d %H:%M:%S"),
            "to": to,
            "subject": subject,
            "body": body,
            "sent": sent,
        }
    )


def get_inbox() -> list[dict]:
    """Recently recorded emails, newest first."""
    return list(reversed(_mailbox))