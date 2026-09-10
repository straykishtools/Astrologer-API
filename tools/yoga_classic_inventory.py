#!/usr/bin/env python3
"""Generates static/yoga-classic/inventory.json — the file lists the web
build uses the same way the APK manifest lists bundled resources:
  raw/*.ogg  (voice cues)   → RAW_FILES
  drawable-large-mdpi/pose_*.png → PNG_FILES
Run from the repo root:  python tools/yoga_classic_inventory.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'static', 'yoga-data', 'resources', 'res')

raw = []
raw_dir = os.path.join(RES, 'raw')
if os.path.isdir(raw_dir):
    raw = sorted(f for f in os.listdir(raw_dir) if f.endswith('.ogg'))

png = []
png_dir = os.path.join(RES, 'drawable-large-mdpi')
if os.path.isdir(png_dir):
    png = sorted(f for f in os.listdir(png_dir) if f.startswith('pose_') and f.endswith('.png'))

out = {'raw': raw, 'png': png}
dest = os.path.join(ROOT, 'static', 'yoga-classic', 'inventory.json')
os.makedirs(os.path.dirname(dest), exist_ok=True)
with open(dest, 'w', encoding='utf-8') as fh:
    json.dump(out, fh, separators=(',', ':'))
print('wrote', dest, '-', len(raw), 'raw ogg,', len(png), 'pose png')
