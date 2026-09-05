"""app/services/yoga_steps_validator.py

اعتبارسنجی «دنباله‌ی گام‌ها» (JSON) که ادمین در فرم تمرین می‌نویسد — با همان
قالب خطاهای خط‌به‌خط XML تا فرم همان جعبه‌ی خطای دقیق را نشان دهد:

    {"detail": {"message": "...", "errors": [{"line", "column", "message", "source"}, ...]}}

- خطای JSON شکسته → خط/ستون واقعی از json.JSONDecodeError.
- خطای ساختاری هر گام (نوع نامعتبر، move/pose بدون name، loop خالی و…) → خطِ شروع همان
  گام در متن خام، با یک اسکنر سبک که عنصرهای سطح اولِ آرایه را به خط نگاشت می‌کند.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from fastapi import HTTPException

_ALLOWED_TYPES = {"move", "hold", "pose", "loop", "switchside", "tempo", "music", "difficulty"}
_ALLOWED_LEVELS = {"beginner", "intermediate", "expert"}


def _err(errors: list[dict], line: int, column: int, message: str, lines: list[str]) -> None:
    source = ""
    if lines and line and 1 <= line <= len(lines):
        source = lines[line - 1].rstrip()
    errors.append({"line": line, "column": column, "message": message, "source": source})


def _offset_to_line_col(offset: int, text: str) -> tuple[int, int]:
    """تبدیل آفست کاراکتری به (خط، ستون) — خط از ۱ شروع می‌شود."""
    line = text.count("\n", 0, offset) + 1
    last_nl = text.rfind("\n", 0, offset)
    return line, offset - last_nl


def _element_offsets(text: str) -> list[int]:
    """آفست شروع هر عنصرِ سطح اولِ آرایه (عنصرها شیء هستند و با { شروع می‌شوند)."""
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
            i += 1
            continue
        if ch in "[{":
            if depth == 1 and ch == "{":
                offsets.append(i)
            depth += 1
            i += 1
            continue
        if ch in "]}":
            depth = max(0, depth - 1)
            i += 1
            continue
        i += 1
    return offsets


def _position_for(index: int, text: str) -> tuple[int, int]:
    offsets = _element_offsets(text)
    if index < len(offsets):
        return _offset_to_line_col(offsets[index], text)
    # گام خارج از عنصرهای قابل تشخیص — پایان متن (بدون فاصله‌های آخر)
    tail = text.rstrip()
    return _offset_to_line_col(max(0, len(tail) - 1), text)


def _validate_steps(
    steps: Any,
    text: str,
    errors: list[dict],
    lines: list[str],
    *,
    top_level: bool,
    where: str = "",
) -> bool:
    """اعتبارسنجی فهرست گام‌ها؛ گام‌های سطح اول خط دقیق دارند، درون loop/difficulty خطِ والد."""
    if not isinstance(steps, list):
        if top_level:
            line, col = _position_for(0, text)
            _err(errors, line, col, "دنباله باید یک آرایه‌ی JSON از گام‌ها باشد (با [ شروع شود)", lines)
        else:
            _err(errors, 0, 0, f"{where}: steps باید آرایه باشد", lines)
        return False
    ok = True
    for i, step in enumerate(steps):
        if top_level:
            line, col = _position_for(i, text)
        else:
            line, col = 0, 0
        prefix = f"{where}گام {i + 1}"
        if not isinstance(step, dict):
            _err(errors, line, col, f"{prefix} باید یک شیء باشد", lines)
            ok = False
            continue
        typ = step.get("type")
        if typ not in _ALLOWED_TYPES:
            allowed = "، ".join(sorted(_ALLOWED_TYPES))
            _err(errors, line, col, f"{prefix}: نوع «{typ}» نامعتبر است — مجازها: {allowed}", lines)
            ok = False
            continue
        if typ in ("move", "pose") and not str(step.get("name") or "").strip():
            _err(errors, line, col, f"{prefix} (<{typ}>): فیلد name لازم است", lines)
            ok = False
        elif typ == "hold":
            raw = step.get("count")
            if raw is None or raw == "":
                _err(errors, line, col, f"{prefix} (<hold>): فیلد count لازم است", lines)
                ok = False
            elif not isinstance(raw, (int, float)) and str(raw).strip() != "variable" and not str(raw).strip().isdigit():
                _err(errors, line, col, f"{prefix} (<hold>): count باید عدد باشد (فعلاً «{raw}»)", lines)
                ok = False
        elif typ == "loop":
            inner = step.get("steps")
            if not isinstance(inner, list) or not inner:
                _err(errors, line, col, f"{prefix} (<loop>): فیلد steps باید آرایه‌ی غیرخالی باشد", lines)
                ok = False
            if step.get("count") is None:
                _err(errors, line, col, f"{prefix} (<loop>): فیلد count لازم است", lines)
                ok = False
            if isinstance(inner, list):
                ok = _validate_steps(inner, text, errors, lines, top_level=False, where=f"داخل <loop> {prefix} ") and ok
        elif typ == "difficulty":
            lvls = step.get("levels")
            if not isinstance(lvls, dict) or not lvls:
                _err(errors, line, col, f"{prefix} (<difficulty>): فیلد levels باید شامل سطح‌ها باشد", lines)
                ok = False
            elif any(k not in _ALLOWED_LEVELS for k in lvls):
                _err(errors, line, col, f"{prefix} (<difficulty>): سطح‌های مجاز beginner، intermediate، expert هستند", lines)
                ok = False
    return ok


def validate_steps_text(text: str) -> dict:
    """اعتبارسنجی رشته‌ی خام JSON گام‌ها؛ در صورت خطا HTTPException 400 با جزئیات خط‌به‌خط."""
    lines = text.splitlines()
    errors: list[dict] = []
    if not text or not text.strip():
        _err(errors, 0, 0, "محتوی JSON خالی است", lines)
        _raise_http(errors)
    try:
        steps = json.loads(text)
    except json.JSONDecodeError as exc:
        _err(errors, exc.lineno, exc.colno, f"JSON نامعتبر است: {exc.msg}", lines)
        _raise_http(errors)
    if not _validate_steps(steps, text, errors, lines, top_level=True):
        _raise_http(errors)
    return {"steps": steps}


def _raise_http(errors: list[dict]) -> None:
    if len(errors) == 1:
        message = errors[0]["message"]
    else:
        message = f"JSON گام‌ها مشکل دارد — {len(errors)} خطا پیدا شد"
    raise HTTPException(status_code=400, detail={"message": message, "errors": errors})
