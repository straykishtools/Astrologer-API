#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Salvage loader for static/yoga.txt.

yoga.txt is a concatenation of several overlapping JSON array exports, some
fenced with ```json markers, one truncated mid-pose. This loader scans the
raw text for complete top-level JSON objects and returns a deduplicated,
canonical pose list (richest object wins per pose name).

Usage:
    from yoga_salvage import load_canonical_poses
    poses = load_canonical_poses()
"""
import json
import os
import re

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSES_FILE = os.path.join(_ROOT, 'static', 'yoga.txt')


def _scan_objects(text):
    """Yield every top-level JSON object dict found in text (salvage scan)."""
    dec = json.JSONDecoder()
    i = 0
    n = len(text)
    while i < n:
        # find next '{' that isn't inside a string
        if text[i] == '{':
            try:
                obj, end = dec.raw_decode(text, i)
                if isinstance(obj, dict):
                    yield obj
                i = end
                continue
            except ValueError:
                pass  # damaged object — fall through to fine-grained scan
            # Salvage inside damaged region: try decoding from every nested '{'
            j = i
            best = None
            while j < n and j < i + 200000:
                k = text.find('{', j + 1)
                if k < 0:
                    break
                try:
                    obj, end = dec.raw_decode(text, k)
                    if isinstance(obj, dict) and 'name' in obj:
                        best = (obj, end)
                        break
                except ValueError:
                    pass
                j = k
            if best:
                yield best[0]
                i = best[1]
                continue
            i += 1
        else:
            i += 1


def _score(pose):
    """Richer object (more useful keys / longer text) wins on name conflict."""
    score = 0
    for k, v in pose.items():
        if v:
            score += 1
            if isinstance(v, (str, list)):
                score += min(len(v) // 10, 5)
    return score


def load_raw_poses():
    """Return list of all complete pose dicts found in the file."""
    with open(POSES_FILE, encoding='utf-8') as f:
        text = f.read()
    out = []
    for obj in _scan_objects(text):
        if isinstance(obj, dict) and obj.get('name'):
            out.append(obj)
    return out


def load_canonical_poses():
    """Deduplicated canonical pose list; richest variant wins per name."""
    best = {}
    for po in load_raw_poses():
        name = po['name']
        if name not in best or _score(po) > _score(best[name]):
            best[name] = po
    return list(best.values())


if __name__ == '__main__':
    poses = load_canonical_poses()
    print('Canonical poses:', len(poses))
