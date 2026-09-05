"""app/services/yoga_session_parser.py

پارس‌کننده‌ی اسکریپت تمرین (XML session) در سمت سرور — هماهنگ با yoga_importer.py
تا ادمین بتواند فایل XML را آپلود کند و مستقیم تمرین بسازد.

فرمت ورودی، همان فرمت فایل‌های static/*.session است:
    <session version="2">
        <head><name>…</name><description>…</description><style>…</style>
              <durations><duration value="30"/>…</durations>
              <difficulties><difficulty value="0"/>…</difficulties>
              <pose name="…" side="left"/></head>
        <body preferredBackgroundName="Home">
            <tempo duration="4.0f"/> <music type="builtin" id="0"/>
            <move name="…"/> <hold count="8" phrase="none" audibleCount="false"/>
            <pose name="…" side="left"/> <switchside/>
            <loop count="2,4,4" switchside="true">…</loop>
            <difficulty><expert>…</expert><beginner>…</beginner></difficulty>
            <dynamicstate state="silent"/>   ← مجاز و نادیده گرفته می‌شود
        </body>
    </session>

خطاها با شماره خط و ستون دقیق (و متن همان خط از فایل) گزارش می‌شوند تا ادمین
بتواند فایل معیوب را سریع پیدا کند. همه‌ی خطاها یکجا جمع می‌شوند — نه فقط اولین.
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
import xml.parsers.expat as expat
from typing import Any

from fastapi import HTTPException

# برچسب‌های مجاز در بدنه‌ی تمرین (dynamicstate در فایل‌های اصلی وجود دارد و نادیده گرفته می‌شود)
_VALID_BODY_TAGS = {"tempo", "music", "move", "hold", "pose", "loop", "switchside", "difficulty", "dynamicstate"}
_VALID_DIFFICULTY_LEVELS = {"beginner", "intermediate", "expert"}


class _XmlErrors(Exception):
    """مجموعه‌ای از خطاهای XML با شماره خط — توسط parse_session_xml به HTTPException تبدیل می‌شود."""

    def __init__(self, errors: list[dict]):
        super().__init__("; ".join(e["message"] for e in errors))
        self.errors = errors


class _PosBuilder:
    """ساخت درخت XML با ثبت موقعیت (خط، ستون) شروع هر عنصر — بر پایه expat."""

    def __init__(self):
        self.stack: list[ET.Element] = []
        self.root: Any = None
        self.positions: dict[int, tuple[int, int]] = {}
        p = expat.ParserCreate()
        p.StartElementHandler = self._start
        p.EndElementHandler = self._end
        p.CharacterDataHandler = self._data
        self.parser = p

    def _start(self, tag, attrs):
        el = ET.Element(tag, attrs)
        self.positions[id(el)] = (self.parser.CurrentLineNumber, self.parser.CurrentColumnNumber)
        if self.stack:
            self.stack[-1].append(el)
        else:
            self.root = el
        self.stack.append(el)

    def _end(self, tag):
        if self.stack:
            self.stack.pop()

    def _data(self, data):
        if not self.stack:
            return
        cur = self.stack[-1]
        if cur.text is None:
            cur.text = data
        else:
            cur.text += data

    def parse(self, xml_text: str) -> Any:
        try:
            self.parser.Parse(xml_text, True)
        except expat.ExpatError as exc:
            line, col = _exc_position(exc)
            msg = re.sub(r": line \d+, column \d+$", "", str(exc))  # موقعیت جداگانه گزارش می‌شود
            errors: list[dict] = []
            _err(errors, line, col, f"XML نامعتبر است: {msg}", xml_text.splitlines())
            raise _XmlErrors(errors)
        return self.root


def _exc_position(exc: expat.ExpatError) -> tuple[int, int]:
    """استخراج خط/ستون از ExpatError — نسخه‌های مختلف پایتون جای متفاوتی نگه می‌دارند."""
    pos = getattr(exc, "position", None)
    if pos and pos != (0, 0):
        return pos
    line = getattr(exc, "line", None)
    col = getattr(exc, "column", None)
    if line and col:
        return line, col
    m = re.search(r"line (\d+), column (\d+)", str(exc))
    if m:
        return int(m.group(1)), int(m.group(2))
    return 0, 0


def _err(errors: list[dict], line: int, column: int, message: str, lines: list[str]) -> None:
    """ساخت خطا با شماره خط و متن همان خط از فایل (برای نمایش دقیق در فرم ادمین).

    فاصله‌های ابتدای خط حفظ می‌شود تا نشانگر ^ دقیقاً زیر برچسب خطاکار بنشیند.
    """
    source = ""
    if lines and line and 1 <= line <= len(lines):
        source = lines[line - 1].rstrip()
    errors.append(
        {
            "line": line,
            "column": column,
            "message": message,
            "source": source,
        }
    )


def _parse_tree(xml_text: str, lines: list[str]) -> tuple[Any, dict[int, tuple[int, int]]]:
    """پارس XML با ثبت موقعیت خط/ستون؛ خطای ParseError با جزئیات خط گزارش می‌شود."""
    builder = _PosBuilder()
    root = builder.parse(xml_text)
    return root, builder.positions


def _to_bool(value, default=False) -> bool:
    if value is None or value == "":
        return default
    return str(value).strip().lower() in ("true", "1", "yes")


def _to_int_list(value) -> list[int]:
    if not value:
        return []
    out = []
    for p in str(value).split(","):
        p = p.strip()
        if not p:
            continue
        try:
            out.append(int(float(p)))
        except ValueError:
            out.append(0)
    return out


def _clean_text(el, tag, default="") -> str:
    node = el.find(tag)
    if node is not None and node.text:
        return " ".join(node.text.split())
    return default


def _validate_head(head_el, errors: list[dict], lines: list[str], positions: dict) -> None:
    """اعتبارسنجی <head>: وجود <name> و مقدارهای عددی durations/difficulties."""
    name_el = head_el.find("name")
    if name_el is None or not (name_el.text or "").strip():
        line, col = positions.get(id(head_el), (0, 0))
        _err(errors, line, col, "<head> باید شامل <name> (نام تمرین) باشد", lines)

    for node in head_el.findall("durations/duration"):
        raw = node.get("value", "")
        if not raw.strip() or not raw.strip().isdigit():
            line, col = positions.get(id(node), (0, 0))
            _err(errors, line, col, f"<duration> باید مقدار عددی داشته باشد (فعلاً «{raw}»)", lines)
    for node in head_el.findall("difficulties/difficulty"):
        raw = node.get("value", "")
        if not raw.strip() or not raw.strip().isdigit():
            line, col = positions.get(id(node), (0, 0))
            _err(errors, line, col, f"<difficulty> باید مقدار 0، 1 یا 2 داشته باشد (فعلاً «{raw}»)", lines)


def _parse_steps(container, errors: list[dict], lines: list[str], positions: dict) -> list[dict]:
    """تبدیل بدنه‌ی تمرین (یا بلوک‌های تو در تو) به دنباله‌ی JSON — مانند importer.

    همزمان اعتبارسنجی می‌کند: برچسب ناشناخته، move/pose بدون name، loop خالی،
    و سطح‌های نامعتبر داخل <difficulty> — همه با شماره خط.
    """
    steps: list[dict] = []
    for el in container:
        tag = el.tag
        line, col = positions.get(id(el), (0, 0))
        if tag not in _VALID_BODY_TAGS:
            allowed = "، ".join(sorted(_VALID_BODY_TAGS))
            _err(errors, line, col, f"برچسب ناشناخته <{tag}> — مجازها: {allowed}", lines)
            continue
        if tag == "tempo":
            dur = el.get("duration", "4.0")
            try:
                duration = float(re.sub(r"[fF]$", "", dur))
            except ValueError:
                duration = 4.0
            steps.append({"type": "tempo", "duration": duration})
        elif tag == "music":
            steps.append({"type": "music", "kind": el.get("type", "builtin"), "id": el.get("id", "0")})
        elif tag == "move":
            name = el.get("name", "")
            if not name.strip():
                _err(errors, line, col, "<move> باید ویژگی name داشته باشد (نام انتقال)", lines)
            steps.append({"type": "move", "name": name})
        elif tag == "hold":
            raw = el.get("count", "5") or "5"
            try:
                count = int(float(raw))
            except ValueError:
                count = 5  # مقادیر غیرعددی مثل variable -> ۵ نفس پیش‌فرض
            steps.append(
                {
                    "type": "hold",
                    "count": count,
                    "phrase": el.get("phrase", "none"),
                    "audibleCount": _to_bool(el.get("audibleCount")),
                }
            )
        elif tag == "pose":
            step: dict[str, Any] = {"type": "pose", "name": el.get("name", "")}
            if not step["name"].strip():
                _err(errors, line, col, "<pose> باید ویژگی name داشته باشد", lines)
            if el.get("side"):
                step["side"] = el.get("side")
            steps.append(step)
        elif tag == "loop":
            raw_count = el.get("count", "")
            if not raw_count.strip():
                _err(errors, line, col, "<loop> باید ویژگی count داشته باشد (مثل count=\"2,4,4\")", lines)
            else:
                for part in raw_count.split(","):
                    if not part.strip().isdigit():
                        _err(errors, line, col, f"<loop count> باید اعداد جدا با ویرگول باشد (فعلاً «{raw_count}»)", lines)
                        break
            inner = _parse_steps(el, errors, lines, positions)
            if not inner:
                _err(errors, line, col, "<loop> باید حداقل یک گام داخل خودش داشته باشد", lines)
            steps.append(
                {
                    "type": "loop",
                    "count": _to_int_list(raw_count) or [1],
                    "switchside": _to_bool(el.get("switchside")),
                    "steps": inner,
                }
            )
        elif tag == "switchside":
            steps.append({"type": "switchside"})
        elif tag == "difficulty":
            levels = {}
            for lvl in el:
                if lvl.tag not in _VALID_DIFFICULTY_LEVELS:
                    l_line, l_col = positions.get(id(lvl), (0, 0))
                    _err(errors, l_line, l_col, f"سطح نامعتبر <{lvl.tag}> داخل <difficulty> — مجازها: beginner، intermediate، expert", lines)
                    continue
                levels[lvl.tag] = _parse_steps(lvl, errors, lines, positions)
            if not levels:
                _err(errors, line, col, "<difficulty> باید حداقل یک سطح (beginner/intermediate/expert) داشته باشد", lines)
            steps.append({"type": "difficulty", "levels": levels})
    return steps


def _raise_http(errors: list[dict]) -> None:
    """تبدیل لیست خطاها به پاسخ 400 با جزئیات خط به خط."""
    if len(errors) == 1:
        message = errors[0]["message"]
    else:
        message = f"فایل XML مشکل دارد — {len(errors)} خطا پیدا شد"
    raise HTTPException(
        status_code=400,
        detail={"message": message, "errors": errors},
    )


def parse_session_xml(xml_text: str) -> dict:
    """پارس فایل XML تمرین و برگرداندن dict با head/body/steps — یا خطاهای خط‌به‌خط.

    در صورت نامعتبر بودن، HTTPException با body زیر پرتاب می‌شود:
        {"detail": {"message": "...", "errors": [{"line", "column", "message", "source"}, ...]}}
    """
    if not xml_text or not xml_text.strip():
        _raise_http([{"line": 0, "column": 0, "message": "محتوای XML خالی است", "source": ""}])
    lines = xml_text.splitlines()
    try:
        root, positions = _parse_tree(xml_text, lines)
    except _XmlErrors as exc:
        _raise_http(exc.errors)

    errors: list[dict] = []
    root_line, root_col = positions.get(id(root), (0, 0))
    if root.tag != "session":
        _err(errors, root_line, root_col, f"ریشه‌ی سند باید <session> باشد (فعلاً <{root.tag}>)", lines)

    head_el = root.find("head")
    body_el = root.find("body")
    if head_el is None:
        _err(errors, root_line, root_col, "<head> یافت نشد — ساختار تمرین باید شامل <head> و <body> باشد", lines)
    if body_el is None:
        _err(errors, root_line, root_col, "<body> یافت نشد — ساختار تمرین باید شامل <head> و <body> باشد", lines)

    if head_el is not None:
        _validate_head(head_el, errors, lines, positions)
    if body_el is None:
        if errors:
            _raise_http(errors)
        raise HTTPException(status_code=400, detail={"message": "بدنه‌ی تمرین پیدا نشد", "errors": []})

    steps = _parse_steps(body_el, errors, lines, positions)
    if not steps:
        b_line, b_col = positions.get(id(body_el), (0, 0))
        _err(errors, b_line, b_col, "بدنه‌ی تمرین هیچ گامی ندارد", lines)
    if errors:
        _raise_http(errors)

    head: dict[str, Any] = {
        "name": _clean_text(head_el, "name") or "بدون نام",
        "description": _clean_text(head_el, "description"),
        "style": _clean_text(head_el, "style", "hatha"),
        "durations": [int(d.get("value", "0")) for d in head_el.findall("durations/duration") if d.get("value", "").isdigit()],
        "difficulties": [int(d.get("value", "0")) for d in head_el.findall("difficulties/difficulty") if d.get("value", "").isdigit()],
    }
    pose_el = head_el.find("pose")
    if pose_el is not None:
        head["pose"] = {"name": pose_el.get("name", ""), "side": pose_el.get("side", "left")}

    body = {
        "preferredBackgroundName": body_el.get("preferredBackgroundName", "Home"),
        "steps": steps,
    }
    return {"head": head, "body": body}


def _count_steps(steps: list[dict]) -> int:
    total = 0
    for s in steps:
        if s["type"] in ("loop", "difficulty"):
            children = s.get("steps", []) or []
            if s["type"] == "difficulty":
                children = [c for lvl in s.get("levels", {}).values() for c in lvl]
            total += _count_steps(children)
        else:
            total += 1
    return total


def session_slug(name: str) -> str:
    """ساخت شناسه‌ی انگلیسی یکتا از نام تمرین (مثل 'Desert' -> desert)."""
    return re.sub(r"[^a-z0-9_]+", "_", name.strip().lower()).strip("_") or "practice"


# نسخه‌های پشتیبانی‌شده‌ی سند session (فایل‌های اصلی همه version="2" دارند)
_SUPPORTED_SESSION_FORMATS = {"2"}


def session_format(xml_text: str) -> dict:
    """بررسی ویژگی version ریشه‌ی <session> — برای هشدار به ادمین درباره فایل قدیمی/ناشناخته.

    بدون پرتاب خطا برمی‌گردد: حتی اگر XML مشکل داشته باشد فقط نسخه گزارش می‌شود.
    خروجی: {"version", "line", "column", "known", "supported", "warning"}
    """
    info = {"version": None, "line": 0, "column": 0, "known": False, "supported": False, "warning": ""}
    if not xml_text or not xml_text.strip():
        return info
    lines = xml_text.splitlines()
    try:
        root, positions = _parse_tree(xml_text, lines)
    except _XmlErrors:
        return info
    if root.tag != "session":
        return info
    ver = (root.get("version") or "").strip()
    line, col = positions.get(id(root), (0, 0))
    info.update({"version": ver or None, "line": line, "column": col})
    if not ver:
        info["warning"] = "ویژگی version روی <session> نیست — نسخه‌ی 2 فرض شد"
        return info
    if ver not in _SUPPORTED_SESSION_FORMATS:
        info["known"] = False
        info["warning"] = (
            f"نسخه‌ی سند «{ver}» پشتیبانی نمی‌شود (پشتیبانی‌شده: 2) — "
            "بعضی عناصر ممکن است نادیده گرفته شوند"
        )
        return info
    info["known"] = True
    info["supported"] = True
    return info