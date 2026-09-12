# app/routers/audio_router.py
"""Audio system endpoints: track metadata, default playlist, file streaming
and admin upload/replacement of real audio files.

The frontend music engine (static/audio-manager.js) can either synthesize a
track procedurally via WebAudio or play a real audio file placed in
``static/audio/bgm/``. Admins upload files through ``/upload`` (base64 in a
JSON body — avoids a multipart dependency); files are served back through the
existing ``/static`` mount.
"""
import base64
import binascii
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.routers.auth_router import get_admin_user

router = APIRouter(prefix="/api/v5/audio", tags=["Audio"])

_AUDIO_DIR = Path(__file__).resolve().parents[2] / "static" / "audio"
_BGM_DIR = _AUDIO_DIR / "bgm"

# Mirrors TRACKS in static/audio-manager.js (single source for the player UI).
TRACKS = [
    {"id": "cosmic-drone", "name": "دران کیهانی", "icon": "🌌", "category": "ambient", "duration": 180},
    {"id": "rain-forest", "name": "باران جنگل", "icon": "🌧️", "category": "nature", "duration": 120},
    {"id": "ocean-waves", "name": "امواج اقیانوس", "icon": "🌊", "category": "nature", "duration": 150},
    {"id": "tibetan-bowl", "name": "کاسه تبتی", "icon": "🔔", "category": "ambient", "duration": 120},
    {"id": "deep-space", "name": "فضای عمیق", "icon": "✨", "category": "space", "duration": 200},
    {"id": "wind-chimes", "name": "ناقوس باد", "icon": "🎐", "category": "ambient", "duration": 100},
    {"id": "forest-birds", "name": "پرندگان جنگل", "icon": "🐦", "category": "nature", "duration": 130},
    {"id": "singing-bowl", "name": "آواز کاسه", "icon": "🥣", "category": "meditation", "duration": 160},
]

DEFAULT_PLAYLIST = ["cosmic-drone", "tibetan-bowl", "singing-bowl", "deep-space"]

# Where real audio files would live, if the operator provides them.
_FILE_EXTENSIONS = {".mp3", ".ogg", ".wav", ".m4a"}

# سقف حجم فایل آپلودی (بایت) — mp3 باکیفیت ~۵دقیقه زیر این حد است
_MAX_BYTES = 20 * 1024 * 1024

# شناسه‌ی ایمن: فقط حروف/عدد/خط‌تیره/زیرخط (ضد پیمایش مسیر)
_SAFE_ID = re.compile(r"^[A-Za-z0-9_-]{1,80}$")


def _safe_id(track_id: str) -> str:
    tid = str(track_id or "").strip()
    if not _SAFE_ID.match(tid):
        raise HTTPException(status_code=400, detail="شناسه‌ی ترک نامعتبر است")
    return tid


def _find_file(track_id: str) -> Path | None:
    """Locate a real audio file for a track id, if any was provided."""
    if not _AUDIO_DIR.exists():
        return None
    for sub in ("bgm", ""):
        folder = _AUDIO_DIR / sub if sub else _AUDIO_DIR
        if not folder.exists():
            continue
        for ext in _FILE_EXTENSIONS:
            candidate = folder / f"{track_id}{ext}"
            if candidate.is_file():
                return candidate
    return None


def _existing_files(track_id: str) -> list[Path]:
    out = []
    if _BGM_DIR.exists():
        for ext in _FILE_EXTENSIONS:
            p = _BGM_DIR / f"{track_id}{ext}"
            if p.is_file():
                out.append(p)
    return out


@router.get("/tracks")
async def get_audio_tracks():
    """List all available tracks (procedural + any real files found)."""
    tracks = []
    for t in TRACKS:
        item = dict(t)
        f = _find_file(t["id"])
        item["file_available"] = f is not None
        item["path"] = f"/api/v5/audio/track/{t['id']}" if f else None
        tracks.append(item)
    return {"status": "success", "tracks": tracks}


@router.get("/track/{track_id}")
async def stream_track(track_id: str):
    """Stream a real audio file for a track (404 for procedural-only tracks)."""
    f = _find_file(track_id)
    if f is None:
        raise HTTPException(status_code=404, detail="فایل صوتی موجود نیست (ترک به‌صورت زنده سنتز می‌شود)")
    return FileResponse(f, media_type=f"audio/{f.suffix.lstrip('.')}")


@router.get("/files")
async def list_audio_files(_admin=Depends(get_admin_user)):
    """هر فایل صوتیِ موجود روی دیسک → {trackId: filename}. برای ادمین (نمایش وضعیت)."""
    result = {}
    if _BGM_DIR.exists():
        for p in _BGM_DIR.iterdir():
            if p.is_file() and p.suffix.lower() in _FILE_EXTENSIONS:
                result[p.stem] = f"/static/audio/bgm/{p.name}"
    return {"status": "success", "files": result}


@router.post("/upload")
async def upload_audio_file(body: dict, _admin=Depends(get_admin_user)):
    """آپلود/جایگزینی فایل صوتی یک ترک — فقط ادمین.

    بدنه: {"trackId": "...", "ext": "mp3", "data": "<base64>"}
    فایل در static/audio/bgm/{trackId}.{ext} نوشته می‌شود (فایل قدیمی با
    پسونج دیگر پاک می‌شود). بازگشت: {"status":"ok","url":"/static/audio/..."}
    """
    tid = _safe_id(body.get("track_id") or body.get("trackId") or "")
    ext = str(body.get("ext") or "").lower().lstrip(".")
    if ext not in {"mp3", "ogg", "wav", "m4a"}:
        raise HTTPException(status_code=400, detail="فرمت مجاز: mp3, ogg, wav, m4a")
    b64 = body.get("data") or ""
    # حذف پیشوند data URL اگر فرانت‌اند فرستاد
    if "," in b64 and b64.strip().lower().startswith("data:"):
        b64 = b64.split(",", 1)[1]
    try:
        raw = base64.b64decode(b64, validate=False)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="داده‌ی base64 معتبر نیست")
    if not raw:
        raise HTTPException(status_code=400, detail="فایل خالی است")
    if len(raw) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="حجم فایل بیش از ۲۰ مگابایت است")

    _BGM_DIR.mkdir(parents=True, exist_ok=True)
    # پاک‌سازی فایل‌های قبلیِ همین ترک (شاید پسونج عوض شده باشد)
    for old in _existing_files(tid):
        try:
            old.unlink()
        except OSError:
            pass

    target = _BGM_DIR / f"{tid}.{ext}"
    target.write_bytes(raw)
    return {"status": "ok", "trackId": tid, "url": f"/static/audio/bgm/{tid}.{ext}", "size": len(raw)}


@router.delete("/file/{track_id}")
async def delete_audio_file(track_id: str, _admin=Depends(get_admin_user)):
    """حذف فایل صوتی یک ترک (برگشت به سنتز) — فقط ادمین."""
    tid = _safe_id(track_id)
    removed = 0
    for p in _existing_files(tid):
        try:
            p.unlink()
            removed += 1
        except OSError:
            pass
    return {"status": "ok", "trackId": tid, "removed": removed}


@router.get("/playlist/default")
async def get_default_playlist():
    """The default relaxation playlist (track ids, in play order)."""
    return {"status": "success", "playlist": DEFAULT_PLAYLIST}
