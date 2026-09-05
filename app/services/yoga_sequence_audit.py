"""app/services/yoga_sequence_audit.py

بررسی «کیفیت» یک دنباله‌ی گام (steps) که قبلاً به‌صورت ساختاری معتبر بوده —
برای ستون هشدارها در فهرست تمرین‌ها و هشدارهای غیرمسدودکننده‌ی اعتبارسنجی JSON:

- انتقال با نام ناشناخته (در کاتالوگ moves نیست)
- انتقالِ ناپیوسته: ازPose با وضعیت فعلی دنباله جور نیست (برای هر سطح جدا)
- گام تکراری پشت‌سرهم (move همنام دوبار، یا دو switchside پشت‌سرهم)
- hold با count صفر

خروجی: فهرستی از رشته‌های فارسی. برای نسخه‌ی دارای شماره خط از همتای
``audit_with_lines`` استفاده می‌شود که برای validator سطر/ستون هم می‌دهد.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

_YOGA_DATA_DIR = Path(__file__).resolve().parents[2] / "static" / "yoga-data"


def _load_catalog(name: str) -> list:
    try:
        data = json.loads((_YOGA_DATA_DIR / f"{name}.json").read_text(encoding="utf-8"))
    except Exception:
        return []
    if isinstance(data, list):
        return data
    return data.get(name) or data.get("items") or []


def _pose_names() -> set[str]:
    """نام‌های وضعیت با نرمال‌سازی (بی‌فاصله/بی‌خط‌تیره) + نام‌های فارسی/انگلیسی."""
    out: set[str] = set()
    for p in _load_catalog("poses"):
        raw = [p.get("name"), p.get("displayName"), p.get("display_name"), p.get("baseName"), p.get("name_fa")]
        for r in raw:
            if r:
                out.add(_norm(r))
                out.add(_norm(_camel(r)))
    # background / اصطلاح‌های خاص session
    for extra in ("Home", "Corpse", "Savasana"):
        out.add(_norm(extra))
        out.add(_norm(_camel(extra)))
    return out


def _norm(s: Any) -> str:
    return "".join(ch for ch in str(s or "").lower() if ch.isalnum())


def _camel(s: Any) -> str:
    return "".join(w.capitalize() for w in str(s or "").replace("-", " ").replace("_", " ").split())


def _moves_by_name() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for m in _load_catalog("moves"):
        if m.get("name"):
            out[m["name"]] = m
    return out


# ─── تحلیل ساده (بدون شماره خط) برای ستون هشدار فهرست ───

def _walk(steps: Any, fn) -> None:
    """پیمایش بازگشتی همه‌ی گام‌ها (داخل loop و difficulty)."""
    if not isinstance(steps, list):
        return
    for s in steps:
        fn(s)
        if isinstance(s, dict):
            inner = s.get("steps")
            if isinstance(inner, list):
                _walk(inner, fn)
            lvls = s.get("levels")
            if isinstance(lvls, dict):
                for sub in lvls.values():
                    if isinstance(sub, list):
                        _walk(sub, fn)


def audit_steps(steps: Any) -> list[str]:
    """هشدارهای ساختاری/ارتباطی — بدون شماره خط (برای فهرست)."""
    if not isinstance(steps, list) or not steps:
        return []
    moves = _moves_by_name()
    poses = _pose_names()
    warnings: list[str] = []
    seen: set[tuple[str, str]] = set()

    def note(key: str, msg: str) -> None:
        if (key, msg) not in seen:
            seen.add((key, msg))
            warnings.append(msg)

    def walk_moves(seq: list, ctx: dict) -> None:
        prev = None  # آخرین گام غیرکنترلی برای تشخیص تکرار پشت‌سرهم
        for s in seq:
            t = s.get("type")
            if t in ("tempo", "music"):
                continue
            if t == "move":
                name = s.get("name")
                m = moves.get(name)
                if not m:
                    note("unkmove:" + str(name), f"انتقال «{name}» در کاتالوگ انتقال‌ها نیست")
                else:
                    frm, to = m.get("fromPose"), m.get("toPose")
                    if ctx["pose"] and frm and ctx["pose"] != frm:
                        note("disc:" + str(name), f"انتقال «{name}» از «{frm}» شروع می‌شود ولی وضعیت قبلی «{ctx['pose']}» است")
                    if to:
                        ctx["pose"] = to
                if prev == "move":
                    note("dupmove:" + str(name), f"دو انتقال پشت‌سرهم («{prev_move}» سپس «{name}») — احتمالاً یک hold جا افتاده")
                prev = "move"
                prev_move = name
            elif t == "pose":
                nm = s.get("name")
                if nm and _norm(nm) not in poses:
                    note("unkpose:" + str(nm), f"وضعیت «{nm}» در کاتالوگ حرکات نیست (نام دقیق نیست)")
                ctx["pose"] = nm or ctx["pose"]
                prev = "pose"
            elif t == "hold":
                raw = s.get("count")
                try:
                    if raw is not None and float(raw) == 0:
                        note("hold0", "گامی با count صفر (بدون نگه‌داشتن) دیده می‌شود")
                except (TypeError, ValueError):
                    pass
                prev = "hold"
            elif t == "switchside":
                if prev == "switchside":
                    note("dupside", "دو switchside پشت‌سرهم — سمت دوبار عوض می‌شود")
                prev = "switchside"
            elif t == "loop":
                inner = s.get("steps") or []
                # پیمایش یک دور برای بررسی اتصال — حلقه‌ها در تمرین واقعی تکرار می‌شوند
                walk_moves(inner, ctx)
            elif t == "difficulty":
                for lv in (s.get("levels") or {}).values():
                    walk_moves(lv if isinstance(lv, list) else [], dict(ctx))
            elif t == "hold_inner":
                prev = "hold"
            else:
                prev = t

    ctx: dict = {"pose": None}
    # برای difficulty هر سطح از ctx مستقل شروع می‌شود تا نویز ایجاد نشود.
    top: list = []
    for s in steps:
        if s.get("type") == "difficulty":
            for lv in (s.get("levels") or {}).values():
                walk_moves(lv if isinstance(lv, list) else [], dict(ctx))
        else:
            top.append(s)
    walk_moves(top, ctx)
    return warnings


# ─── تحلیل با شماره خط (برای پاسخ validator و ویرایشگر JSON) ───

def audit_steps_with_lines(text: str) -> dict:
    """اعتبارسنجی سبک + هشدار با شماره خط برای JSON خام گام‌ها.

    Return: {"ok": bool, "warnings": [{line, column, message, source}], "errors": [...]}
    برای متن‌های ناقص (JSON شکسته) صرفاً ok=False برمی‌گرداند؛ خطاهای اصلی را validator
    ساختاری گزارش می‌دهد.
    """
    try:
        steps = json.loads(text)
    except Exception:
        return {"ok": False, "warnings": [], "errors": []}
    if not isinstance(steps, list):
        return {"ok": False, "warnings": [], "errors": []}
    lines = text.splitlines()
    moves = _moves_by_name()
    poses = _pose_names()
    warnings: list[dict] = []

    def offset_line_col(offset: int) -> tuple[int, int]:
        line = text.count("\n", 0, offset) + 1
        last_nl = text.rfind("\n", 0, offset)
        return line, offset - last_nl

    def element_offsets() -> list[int]:
        offsets: list[int] = []
        depth = 0
        in_str = False
        esc = False
        i, n = 0, len(text)
        while i < n:
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
                i += 1
                continue
            if ch == '"':
                in_str = True
            elif ch in "[{":
                if depth == 1 and ch == "{":
                    offsets.append(i)
                depth += 1
            elif ch in "]}":
                depth = max(0, depth - 1)
            i += 1
        return offsets

    def pos(index: int) -> tuple[int, int]:
        off = element_offsets()
        if index < len(off):
            return offset_line_col(off[index])
        tail = text.rstrip()
        return offset_line_col(max(0, len(tail) - 1))

    def warn(i: int, message: str, source: str = "") -> None:
        line, col = pos(i)
        src = ""
        if source:
            src = source
        elif lines and 1 <= line <= len(lines):
            src = lines[line - 1].rstrip()
        warnings.append({"line": line, "column": col, "message": message, "source": src})

    ctx: dict = {"pose": None}

    def walk(seq: list, cctx: dict) -> None:
        prev = None
        prev_move = None
        for s in seq:
            t = s.get("type")
            if t in ("tempo", "music"):
                continue
            if t == "move":
                name = s.get("name")
                m = moves.get(name)
                if not m:
                    warn(steps.index(s), f"انتقال «{name}» در کاتالوگ انتقال‌ها نیست")
                else:
                    frm, to = m.get("fromPose"), m.get("toPose")
                    if cctx["pose"] and frm and cctx["pose"] != frm:
                        warn(steps.index(s), f"انتقال «{name}» ناپیوسته است — از «{frm}» شروع می‌شود ولی وضعیت قبلی «{cctx['pose']}» است")
                    if to:
                        cctx["pose"] = to
                if prev == "move":
                    warn(steps.index(s), f"دو انتقال پشت‌سرهم («{prev_move}» سپس «{name}») — احتمالاً یک hold جا افتاده")
                prev = "move"
                prev_move = name
            elif t == "pose":
                nm = s.get("name")
                if nm and _norm(nm) not in poses:
                    warn(steps.index(s), f"وضعیت «{nm}» در کاتالوگ حرکات نیست (نام دقیق نیست)")
                cctx["pose"] = nm or cctx["pose"]
                prev = "pose"
            elif t == "hold":
                raw = s.get("count")
                try:
                    if raw is not None and float(raw) == 0:
                        warn(steps.index(s), "گامی با count صفر (بدون نگه‌داشتن)")
                except (TypeError, ValueError):
                    pass
                prev = "hold"
            elif t == "switchside":
                if prev == "switchside":
                    warn(steps.index(s), "دو switchside پشت‌سرهم")
                prev = "switchside"
            elif t == "loop":
                walk(s.get("steps") or [], cctx)
            elif t == "difficulty":
                for lv in (s.get("levels") or {}).values():
                    walk(lv if isinstance(lv, list) else [], dict(cctx))
            else:
                prev = t

    top: list = []
    for s in steps:
        if s.get("type") == "difficulty":
            for lv in (s.get("levels") or {}).values():
                walk(lv if isinstance(lv, list) else [], dict(ctx))
        else:
            top.append(s)
    walk(top, ctx)
    return {"ok": True, "warnings": warnings, "errors": []}
