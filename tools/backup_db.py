"""بکاپ‌گیر cosmic.db — از SQLite Online Backup API استفاده می‌کند (بدون قفل).
اجرا از cron:  python tools/backup_db.py   → backups/cosmic-YYYYmmdd-HHMM.db
فایل‌های قدیمی‌تر از ۷ روز حذف می‌شوند."""
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cosmic.db"
DEST_DIR = ROOT / "backups"


def main() -> int:
    if not SRC.exists():
        print(f"not found: {SRC}", file=sys.stderr)
        return 1
    DEST_DIR.mkdir(exist_ok=True)
    dest = DEST_DIR / f"cosmic-{datetime.now():%Y%m%d-%H%M}.db"
    with sqlite3.connect(SRC) as src, sqlite3.connect(dest) as dst:
        src.backup(dst)  # online backup — با WAL و ترافیک همزمان سازگار است
    cutoff = datetime.now() - timedelta(days=7)
    for old in DEST_DIR.glob("cosmic-*.db"):
        if datetime.fromtimestamp(old.stat().st_mtime) < cutoff:
            old.unlink(missing_ok=True)
    print(f"backup ok: {dest.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
