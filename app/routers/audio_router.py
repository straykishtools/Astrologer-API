# app/routers/audio_router.py
"""Audio system endpoints: track metadata, default playlist and file streaming.

The frontend music engine (static/audio-manager.js) synthesizes all tracks
procedurally via WebAudio, so these endpoints mainly serve metadata and any
real audio files the operator drops into ``static/audio/bgm/``.
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/v5/audio", tags=["Audio"])

_AUDIO_DIR = Path(__file__).resolve().parents[2] / "static" / "audio"

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


@router.get("/playlist/default")
async def get_default_playlist():
    """The default relaxation playlist (track ids, in play order)."""
    return {"status": "success", "playlist": DEFAULT_PLAYLIST}
