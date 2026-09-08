# app/middleware/static_cache_buster_middleware.py
"""
پایان دادن به «فیکس اعمال شده ولی کاربر هنوز نسخه‌ی خراب کش‌شده را می‌بیند».

مشکل: فایل‌های استاتیک بدون Cache-Control به‌صورت heuristically کش می‌شوند؛
بعد از یک فیکس JS، مرورگر کاربر (و پنجره‌ی پیش‌نمایش dev) تا مدت‌ها نسخه‌ی
خراب را اجرا می‌کند مگر اینکه دستی ?v=N در HTML بالا برود — همان ریشه‌ی
باگ ماندگار auth-panel.

راه‌حل (بدون تغییر HTML): هر پاسخ /static/* برای اسکریپت‌ها، استایل‌ها و
تصاویر (png/jpg/jpeg/gif/webp/avif/svg/ico) با
`Cache-Control: no-cache` برمی‌گردد. یعنی مرورگر همیشه قبل از استفاده
revalidate می‌کند: فایل تغییر نکرده → 304 سبک با Last-Modified/ETag؛
فایل تغییر کرده → بایت‌های تازه. نتیجه: فیکس‌ها بلافاصله می‌رسند و هیچ
bump دستی ?v= لازم نیست. پارامترهای ?v=N موجود در HTML بی‌ضرر می‌شوند
(فقط کلید کش اضافی‌اند).

هش mtime (bust_static_url) برای جاهایی که سرور URL استاتیک می‌سازد نگه
داشته شده؛ اگر بعداً HTML از طریق template رندر شود می‌توان نسخه‌ی خودکار
را همان‌جا تزریق کرد.

خاموش‌کردن: STATIC_CACHE_BUSTER=0
"""
from starlette.types import ASGIApp, Receive, Scope, Send

import hashlib
import os
import threading

_ENABLED = os.getenv("STATIC_CACHE_BUSTER", "1") != "0"
_lock = threading.Lock()
_version = {}  # {rel_path: 8-char mtime+size hash}


def _version_for(rel_path: str) -> str:
    """8-char hash of the file's mtime+size; changes iff the file changes on disk."""
    try:
        st = os.stat(os.path.join("static", rel_path))
        key = f"{st.st_mtime_ns}:{st.st_size}"
    except OSError:
        key = "missing"
    with _lock:
        cached = _version.get(rel_path)
        if cached and cached[0] == key:
            return cached[1]
        v = hashlib.sha1(key.encode()).hexdigest()[:8]
        _version[rel_path] = (key, v)
        return v


def bust_static_url(rel_path: str) -> str:
    """For code that builds static URLs server-side: returns 'x.js?v=<mtime-hash>'."""
    return f"{rel_path}?v={_version_for(rel_path)}"


# پسوندهایی که نباید heuristically کش شوند: اسکریپت‌ها، استایل‌ها و تصاویر
# (تصاویر هم بازتولید می‌شوند — مثلاً تامبنیل‌های یوگا — و نسخه‌ی کهنه‌ی کش‌شده
# گمراه‌کننده است؛ revalidate ارزان است: فایل تغییری نکرده → 304 بدون بدنه).
_BUSTED_SUFFIXES = (
    ".js", ".css",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
)


class StaticCacheBusterMiddleware:
    """Pins Cache-Control: no-cache on static script, style and image responses."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not _ENABLED:
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        # /favicon.ico در ریشه سرو می‌شود (نه زیر /static/) و به‌طرز افسانه‌ای
        # در کش می‌مانَد — آن هم revalidate شود.
        if (path.startswith("/static/") or path == "/favicon.ico") and path.lower().endswith(_BUSTED_SUFFIXES):
            async def send_with_cache_headers(message):
                if message["type"] == "http.response.start":
                    headers = list(message.get("headers", []))
                    if not any(k.lower() == b"cache-control" for k, _ in headers):
                        headers.append((b"cache-control", b"no-cache"))
                    message = dict(message)
                    message["headers"] = headers
                await send(message)

            await self.app(scope, receive, send_with_cache_headers)
            return

        await self.app(scope, receive, send)
