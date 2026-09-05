"""
Info endpoints: public metadata about the API itself.

Currently exposes the rate-limit / plan documentation used by clients
to discover their daily quotas. Nothing here requires authentication.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/v5/rate-limits", tags=["Info"])
async def rate_limits_info():
    """اطلاعات محدودیت‌های نرخ درخواست (Rate Limits)

    این endpoint اطلاعات محدودیت‌های روزانه برای انواع کاربران را برمی‌گرداند.
    محدودیت‌ها بر اساس پلن کاربر یا آدرس IP (برای مهمان‌ها) اعمال می‌شوند.
    """
    return {
        "rate_limits": {
            "guest": {
                "description": "Unauthenticated users (tracked by IP)",
                "daily_limit": 5,
                "scope": "per IP address",
                "reset": "daily at midnight UTC",
                "tracked_by": "X-Forwarded-For header or client IP",
            },
            "free": {
                "description": "Free plan users",
                "daily_limit": 15,
                "scope": "per user account",
                "reset": "daily",
            },
            "gold": {
                "description": "Gold plan users",
                "daily_limit": 200,
                "scope": "per user account",
                "reset": "daily",
            },
            "diamond": {
                "description": "Diamond plan users",
                "daily_limit": 9999,
                "scope": "per user account",
                "reset": "daily",
            },
            "admin": {
                "description": "Admin users (is_admin=true)",
                "daily_limit": "unlimited",
                "scope": "none",
            },
        },
        "premium_gating": {
            "description": "Some chart types are restricted to paid plans. Check the plan's premium_paths field.",
            "default_blocked_for_free": ["composite", "solar-return", "lunar-return"],
        },
        "notes": [
            "Rate limits apply to chart calculation endpoints: /api/v5/chart-data/* and /api/v5/chart/*",
            "Auth endpoints (/api/v5/auth/*) are not rate-limited",
            "Static files and health checks are not rate-limited",
            "Guest limits reset daily; authenticated user limits reset on daily_charts_reset_at",
        ],
    }