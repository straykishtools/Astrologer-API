#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate static/yoga-images.json - canonical pose -> image manifest.

The manifest is built from the actual filesystem so the front-end image
resolver never emits broken URLs. Run from repo root:

    python tools/yoga_manifest.py
"""
import json
import os
import re
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'tools'))
from yoga_salvage import load_canonical_poses  # noqa: E402

MAIN_DIR = os.path.join(_ROOT, 'static', 'images', 'yoga')
PREVIEW_DIR = os.path.join(_ROOT, 'static', 'images', 'yoga preview')
OUT_FILE = os.path.join(_ROOT, 'static', 'yoga-images.json')

TN_SIZE = {'tn75': 150, 'tn90': 180, 'tn146': 146}


def parse(fname):
    """Return (stem, side or None, variant or None) for an image file."""
    base = fname[:-4] if fname.lower().endswith('.png') else fname
    variant = None
    m = re.search(r'-(tn\d+)$', base)
    if m:
        variant = m.group(1)
        base = base[:m.start()]
    side = None
    m2 = re.search(r'(_[LR])$', base)
    if m2:
        side = m2.group(1)[1:]
        base = base[:m2.start()]
    return base, side, variant


def index_dir(d):
    """Map stem -> {sideKey: [(variant, fname)...]} (sideKey 'R'/'L'/'N')."""
    out = {}
    if not os.path.isdir(d):
        return out
    for f in sorted(os.listdir(d)):
        if not f.lower().endswith('.png'):
            continue
        stem, side, variant = parse(f)
        key = side or 'N'
        out.setdefault(stem, {}).setdefault(key, []).append((variant, f))
    return out


def best_file(variants):
    """Pick the best file for display among [(variant, fname)].

    Full-size (variant None) always wins; otherwise the biggest square
    thumbnail (tn90 > tn75); the portrait tn146 previews come last.
    """
    if not variants:
        return None
    plain = [(v, f) for v, f in variants if not v]
    if plain:
        return plain[0][1]

    def key(item):
        v, _ = item
        return (1 if v == 'tn146' else 0, TN_SIZE.get(v, 0))
    return sorted(variants, key=key, reverse=True)[0][1]


def _find(main, prev, side_keys):
    """First available file across side keys, preferring main dir then preview."""
    for sk in side_keys:
        for idx, d in ((main, MAIN_DIR), (prev, PREVIEW_DIR)):
            lst = idx.get(sk, [])
            if lst:
                bf = best_file(lst)
                if bf:
                    return os.path.join(d, bf).replace('\\', '/')
    return None


def main():
    poses = load_canonical_poses()
    main = index_dir(MAIN_DIR)
    prev = index_dir(PREVIEW_DIR)

    manifest = {}
    no_image = []
    for po in poses:
        name = po['name']
        two_sided = bool(po.get('two_sided'))
        preferred = po.get('preferred_side') or 'right'
        pref = 'R' if str(preferred).lower().startswith('r') else 'L'
        other = 'L' if pref == 'R' else 'R'

        # Side presence (any file of that side anywhere)
        def has_side(s):
            return bool(main.get(name, {}).get(s, []) or prev.get(name, {}).get(s, []))

        pref = 'R' if str(preferred).lower().startswith('r') else 'L'
        other = 'L' if pref == 'R' else 'R'
        ok = [s for s in ('R', 'L', 'N') if has_side(s)]
        if not ok:
            no_image.append(name)
            manifest[name] = {'card': None, 'full': None, 'L': None, 'R': None}
            continue
        if not two_sided and 'N' in ok:
            order = ['N']
        else:
            order = [s for s in (pref, other) if s in ok]
            if 'N' in ok:
                order.append('N')
            if not order:
                order = ['N']

        card = _find(main.get(name, {}), prev.get(name, {}), order)
        full = card
        sides = {'R': None, 'L': None}
        sides['R'] = _find(main.get(name, {}), prev.get(name, {}), ['R'])
        sides['L'] = _find(main.get(name, {}), prev.get(name, {}), ['L'])

        manifest[name] = {
            'card': card,
            'full': full,
            'L': sides['L'],
            'R': sides['R'],
        }

    doc = {
        'version': 2,
        'poses': manifest,
        'no_image': no_image,
        'counts': {
            'poses': len(poses),
            'with_image': len(poses) - len(no_image),
            'no_image': len(no_image),
        },
    }
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False)
    print('Wrote %s' % OUT_FILE)
    print('poses=%d with_image=%d no_image=%d' % (
        doc['counts']['poses'], doc['counts']['with_image'], doc['counts']['no_image']))
    for n in no_image:
        print('  no image:', n)


if __name__ == '__main__':
    main()
