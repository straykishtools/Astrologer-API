"""Shared runner for tests/_yoga_harness.js — executes the REAL yoga-classic
browser scripts (data.js + engine.js) under Node and parses their JSON output.

The harness prints one JSON document as its final stdout line; a few console
logs from the real data.js may precede it, so we parse the last non-empty line.
"""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
HARNESS = Path(__file__).resolve().parent / "_yoga_harness.js"


def run_yoga_harness(mode: str, payload: object | None = None) -> object:
    cmd = ["node", str(HARNESS), mode]
    if payload is not None:
        cmd.append(json.dumps(payload))
    # Force UTF-8 on both sides of the pipe: Windows defaults to cp1252,
    # which mojibakes the Persian keys in the JSON output.
    env = dict(os.environ, PYTHONIOENCODING="utf-8", NODE_OPTIONS=(os.environ.get("NODE_OPTIONS") or ""))
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", env=env, cwd=str(REPO_ROOT), timeout=120)
    if proc.returncode != 0:
        raise RuntimeError("yoga harness failed (%s):\n%s" % (mode, proc.stderr[-4000:]))
    lines = [ln for ln in proc.stdout.splitlines() if ln.strip()]
    if not lines:
        raise RuntimeError("yoga harness produced no output:\n%s" % proc.stderr[-4000:])
    return json.loads(lines[-1])