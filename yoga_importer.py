#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""yoga_importer.py — تبدیل داده‌های XML یوگا به JSON برای Cosmic Oracle.

منبع:       static/poses.xml, moves.xml, backgrounds.xml, practices.xml, *.session
خروجی:      static/yoga-data/{poses,moves,backgrounds,practices,<practice>}.json

اجرا:        python yoga_importer.py
وابستگی:     فقط کتابخانه استاندارد (xml.etree.ElementTree)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "static"
OUT = ROOT / "static" / "yoga-data"

PRACTICE_FILES = [
    "desert",
    "mountain",
    "ocean",
    "sun_salutation_a",
    "sun_salutation_b",
]


def parse_xml(path: Path):
    import xml.etree.ElementTree as ET

    return ET.parse(path).getroot()


def text(elem, tag, default=""):
    el = elem.find(tag)
    return el.text.strip() if el is not None and el.text else default


def to_bool(value, default=False):
    if value is None or value == "":
        return default
    return str(value).strip().lower() in ("true", "1", "yes")


def to_int_list(value):
    """'2,4,4' -> [2, 4, 4]  (تعداد تکرار بر اساس سطح دشواری)"""
    if not value:
        return []
    parts = [p.strip() for p in str(value).split(",") if p.strip()]
    out = []
    for p in parts:
        try:
            out.append(int(float(p)))
        except ValueError:
            out.append(0)
    return out


def parse_poses(root) -> list[dict]:
    poses = []
    for idx, pose in enumerate(root.findall("pose"), start=1):
        item = {
            "id": idx,
            "name": pose.get("name", ""),
            "baseName": text(pose, "baseName"),
            "sanskritName": text(pose, "sanskritName"),
            "difficulty": text(pose, "difficulty", "beginner"),
            "category": text(pose, "category", "standing"),
            "subcategory": text(pose, "subcategory", "neutral"),
            "twosided": to_bool(pose.get("twosided")),
            "preferredside": pose.get("preferredside", ""),
            "offset": pose.get("offset"),
            "hasmissingaudio": to_bool(pose.get("hasmissingaudio")),
        }
        if item["offset"] is not None:
            try:
                item["offset"] = int(float(item["offset"]))
            except ValueError:
                item["offset"] = None
        poses.append(item)
    return poses


def parse_moves(root) -> list[dict]:
    moves = []
    for move in root.findall("move"):
        sound = move.find("soundName")
        item = {
            "name": move.get("name", ""),
            "fromPose": move.get("fromPose", ""),
            "toPose": move.get("toPose", ""),
            "breath": move.get("breath", "none"),
        }
        if sound is not None:
            item["soundName"] = sound.text.strip() if sound.text else ""
            if sound.get("twosided"):
                item["soundTwosided"] = to_bool(sound.get("twosided"))
        moves.append(item)
    return moves


def parse_backgrounds(root) -> list[dict]:
    return [
        {
            "name": b.get("name", ""),
            "backgroundname": b.get("backgroundname", ""),
            "color": b.get("color", "#000000"),
            "cost": int(b.get("cost", "0") or 0),
            "locked": to_bool(b.get("locked")),
        }
        for b in root.findall("background")
    ]


def parse_session_steps(container) -> list[dict]:
    """تبدیل بدنه‌ی تمرین (body یا بلوک‌های تو در تو) به دنباله‌ی JSON."""
    steps = []
    for el in container:
        tag = el.tag
        if tag == "tempo":
            dur = el.get("duration", "4.0")
            steps.append({"type": "tempo", "duration": float(re.sub(r"[fF]$", "", dur))})
        elif tag == "music":
            steps.append({"type": "music", "kind": el.get("type", "builtin"), "id": el.get("id", "0")})
        elif tag == "move":
            steps.append({"type": "move", "name": el.get("name", "")})
        elif tag == "hold":
            raw_count = el.get("count", "5") or "5"
            try:
                hold_count = int(float(raw_count))
            except ValueError:
                hold_count = 5  # مقادیر غیرعددی مثل 'variable' -> پیش‌فرض ۵ نفس
            steps.append(
                {
                    "type": "hold",
                    "count": hold_count,
                    "phrase": el.get("phrase", "none"),
                    "audibleCount": to_bool(el.get("audibleCount")),
                }
            )
        elif tag == "pose":
            step = {"type": "pose", "name": el.get("name", "")}
            if el.get("side"):
                step["side"] = el.get("side")
            steps.append(step)
        elif tag == "loop":
            steps.append(
                {
                    "type": "loop",
                    "count": to_int_list(el.get("count", "1")),
                    "switchside": to_bool(el.get("switchside")),
                    "steps": parse_session_steps(el),
                }
            )
        elif tag == "switchside":
            steps.append({"type": "switchside"})
        elif tag == "difficulty":
            levels = {}
            for lvl in el:
                levels[lvl.tag] = parse_session_steps(lvl)
            steps.append({"type": "difficulty", "levels": levels})
        # برچسب‌های ناشناخته نادیده گرفته می‌شوند
    return steps


def parse_session(path: Path) -> dict:
    root = parse_xml(path)
    head = root.find("head")
    body = root.find("body")
    practice = {
        "file": path.stem,
        "head": {
            "name": text(head, "name", path.stem),
            "description": text(head, "description"),
            "style": text(head, "style", "hatha"),
            "durations": [int(d.get("value", "0")) for d in head.findall("durations/duration")],
            "difficulties": [int(d.get("value", "0")) for d in head.findall("difficulties/difficulty")],
        },
    }
    pose = head.find("pose")
    if pose is not None:
        practice["head"]["pose"] = {"name": pose.get("name", ""), "side": pose.get("side", "left")}
    practice["body"] = {
        "preferredBackgroundName": body.get("preferredBackgroundName", "Home"),
        "steps": parse_session_steps(body),
    }
    return practice


def main() -> int:
    # ویندوز: خروجی کنسول را UTF-8 کن تا ایموجی‌ها و فارسی چاپ شوند
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    OUT.mkdir(parents=True, exist_ok=True)

    poses = parse_poses(parse_xml(SRC / "poses.xml"))
    moves = parse_moves(parse_xml(SRC / "moves.xml"))
    backgrounds = parse_backgrounds(parse_xml(SRC / "backgrounds.xml"))

    # فهرست تمرین‌ها از practices.xml + اطلاعات سربرگ هر session
    practice_meta = []
    for p in parse_xml(SRC / "practices.xml").findall("practice"):
        name = p.get("name", "")
        meta = {
            "name": name,
            "locked": to_bool(p.get("locked")),
            "downloaded": to_bool(p.get("downloaded")),
        }
        sess = parse_session(SRC / f"{name}.session") if (SRC / f"{name}.session").exists() else None
        if sess is None and (SRC / f"{name}.txt").exists():
            sess = parse_session(SRC / f"{name}.txt")
        if sess:
            meta.update(
                {
                    "displayName": sess["head"]["name"],
                    "description": sess["head"]["description"],
                    "style": sess["head"]["style"],
                    "durations": sess["head"]["durations"],
                    "difficulties": sess["head"]["difficulties"],
                    "poseCount": _count_steps(sess["body"]["steps"]),
                }
            )
        practice_meta.append(meta)

    writes = {
        "poses.json": poses,
        "moves.json": moves,
        "backgrounds.json": backgrounds,
        "practices.json": practice_meta,
    }
    for name, data in writes.items():
        (OUT / name).write_text(
            json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"✓ static/yoga-data/{name}  ({len(data)} آیتم)")

    for pf in PRACTICE_FILES:
        src = SRC / f"{pf}.session"
        if not src.exists():
            src = SRC / f"{pf}.txt"
        if not src.exists():
            print(f"✗ {pf}: فایل session پیدا نشد")
            continue
        practice = parse_session(src)
        (OUT / f"{pf}.json").write_text(
            json.dumps(practice, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        n = len(practice["body"]["steps"])
        print(f"✓ static/yoga-data/{pf}.json  ({n} گام ابتدایی)")

    print("تمام شد ✓")
    return 0


def _count_steps(steps) -> int:
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


if __name__ == "__main__":
    sys.exit(main())