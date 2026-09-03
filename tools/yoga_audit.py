#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Development-time audit of yoga pose dataset vs image assets."""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSES_FILE = os.path.join(ROOT, 'static', 'yoga.txt')
FULL_DIR = os.path.join(ROOT, 'static', 'images', 'yoga')
PREVIEW_DIR = os.path.join(ROOT, 'static', 'images', 'yoga preview')

OUT = sys.stdout

def p(s=''):
    OUT.write(str(s) + '\n')

def load_poses():
    # yoga.txt is mangled: use the salvage loader
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from yoga_salvage import load_canonical_poses, load_raw_poses
    return load_canonical_poses()

def list_files(d):
    if not os.path.isdir(d):
        return []
    return [f for f in os.listdir(d) if f.lower().endswith('.png')]

def parse_full_name(fname):
    """Return (pose_stem, side or None, variant tag or None)."""
    base = fname[:-4]
    # -tnNN suffix thumbnails inside full folder
    m = re.search(r'-(tn\d+)$', base)
    variant = None
    if m:
        variant = m.group(1)
        base = base[:m.start()]
    side = None
    m2 = re.search(r'(_[LR])$', base)
    if m2:
        side = m2.group(1)[1:]
        base = base[:m2.start()]
    return base, side, variant

def main():
    poses = load_poses()
    p('=== YOGA POSE AUDIT ===')
    p('Poses in dataset: %d' % len(poses))

    # Field coverage
    fields = collections.Counter()
    rel_fields = ['previous_poses', 'next_poses', 'variations', 'sanskrit_names',
                  'aka', 'aka_fa', 'description_fa', 'description', 'benefits_fa',
                  'benefits', 'two_sided', 'preferred_side', 'visibility', 'category',
                  'subcategory', 'difficulty', 'display_name', 'display_name_fa', 'name_fa']
    for po in poses:
        for f in rel_fields:
            if po.get(f):
                fields[f] += 1
    p()
    p('--- Field coverage (poses having field) ---')
    for f in rel_fields:
        p('%-18s %d' % (f, fields[f]))

    vis = collections.Counter(po.get('visibility') or '(none)' for po in poses)
    diff = collections.Counter(po.get('difficulty') or '(none)' for po in poses)
    cat = collections.Counter(po.get('category') or '(none)' for po in poses)
    sub = collections.Counter(po.get('subcategory') or '(none)' for po in poses)
    p()
    p('--- visibility: %s' % dict(vis))
    p('--- difficulty: %s' % dict(diff))
    p('--- category:   %s' % dict(cat))
    p('--- subcategory:%s' % dict(sub))

    pose_by_name = {po['name']: po for po in poses}
    names = set(pose_by_name.keys())
    dup_names = len(names) != len(poses)
    p()
    p('Duplicate pose names: %s' % dup_names)

    # Relationship integrity
    broken = collections.Counter()
    rel_total = collections.Counter()
    for po in poses:
        for rel in ['previous_poses', 'next_poses', 'variations']:
            refs = po.get(rel) or []
            seen = set()
            for r in refs:
                if r in seen: 
                    broken['%s_duplicate_refs' % rel] += 1
                seen.add(r)
                rel_total[rel] += 1
                if r not in pose_by_name:
                    broken['%s_broken' % rel] += 1
    p()
    p('--- Relationship totals / broken ---')
    for rel in ['previous_poses', 'next_poses', 'variations']:
        p('%s total=%d broken=%d duplicate=%d' % (rel, rel_total[rel], broken[rel + '_broken'], broken[rel + '_duplicate_refs']))

    # Broken ref samples
    for po in poses:
        for rel in ['previous_poses', 'next_poses', 'variations']:
            for r in (po.get(rel) or []):
                if r not in pose_by_name:
                    p('  BROKEN %s: %s -> %s' % (rel, po['name'], r))

    # ===== Images =====
    full_files = list_files(FULL_DIR)
    prev_files = list_files(PREVIEW_DIR)
    p()
    p('=== IMAGES ===')
    p('Full-dir files: %d' % len(full_files))
    p('Preview-dir files: %d' % len(prev_files))

    # Classify full dir
    full_plain, full_L, full_R, full_tn_plain, full_tn_L, full_tn_R = [], [], [], [], [], []
    full_other = []
    for f in full_files:
        stem, side, variant = parse_full_name(f)
        if variant:
            if side == 'L': full_tn_L.append((stem, variant, f))
            elif side == 'R': full_tn_R.append((stem, variant, f))
            else: full_tn_plain.append((stem, variant, f))
        else:
            if side == 'L': full_L.append(stem)
            elif side == 'R': full_R.append(stem)
            else: full_plain.append(stem)
    p('Full-dir classification:')
    p('  plain full: %d, _L full: %d, _R full: %d, tn-thumbs(plain/L/R): %d/%d/%d, other: %d' % (
        len(full_plain), len(full_L), len(full_R), len(full_tn_plain), len(full_tn_L), len(full_tn_R), len(full_other)))
    tn_var = collections.Counter(v for _, v, _ in full_tn_plain + full_tn_L + full_tn_R)
    p('  tn variants in full dir: %s' % dict(tn_var))

    # Preview dir classification
    prev_plain, prev_L, prev_R = [], [], []
    prev_other = []
    for f in prev_files:
        m = re.match(r'^(.*?)(_L|_R)?(-tn\d+)?$', f[:-4])
        stem, side, var = m.group(1), m.group(2), m.group(3)
        if side == '_L': prev_L.append(stem)
        elif side == '_R': prev_R.append(stem)
        else: prev_plain.append(stem)
    p('Preview-dir classification:')
    p('  plain: %d, _L: %d, _R: %d' % (len(prev_plain), len(prev_L), len(prev_R)))

    # full image coverage (plain full, _L, _R) per pose
    p()
    p('=== COVERAGE (full-size images, ignoring tn thumbnails) ===')
    with_full = set(full_plain) | set(full_L) | set(full_R)
    two_sided_poses = [po for po in poses if po.get('two_sided')]
    one_sided_poses = [po for po in poses if not po.get('two_sided')]

    missing = [po['name'] for po in poses if po['name'] not in with_full]
    p('Poses with at least one full image: %d / %d' % (len(with_full & names), len(poses)))
    p('Poses missing ANY full image: %d' % len(missing))
    for n in missing:
        po = pose_by_name[n]
        p('  MISSING %-40s vis=%s two_sided=%s' % (n, po.get('visibility'), po.get('two_sided')))

    # two-sided completeness
    p()
    ts_complete, ts_incomplete, ts_noimg = [], [], []
    for po in two_sided_poses:
        n = po['name']
        hasL = n in full_L
        hasR = n in full_R
        if hasL and hasR: ts_complete.append(n)
        elif hasL or hasR: ts_incomplete.append((n, hasL, hasR))
        else: ts_noimg.append(n)
    p('Two-sided poses: %d' % len(two_sided_poses))
    p('  complete (L+R): %d' % len(ts_complete))
    p('  incomplete: %d' % len(ts_incomplete))
    for n, l, r in ts_incomplete:
        p('    %-40s L=%s R=%s' % (n, l, r))
    p('  no image at all: %d' % len(ts_noimg))
    for n in ts_noimg:
        p('    %s' % n)

    # one-sided poses with only side images / no plain
    p()
    os_with_only_side = [po['name'] for po in one_sided_poses if po['name'] not in full_plain and (po['name'] in full_L or po['name'] in full_R)]
    os_missing = [po['name'] for po in one_sided_poses if po['name'] not in with_full]
    p('One-sided poses: %d, missing image: %d' % (len(one_sided_poses), len(os_missing)))
    p('One-sided poses having only _L/_R files: %d' % len(os_with_only_side))

    # Orphan images (file for nonexistent pose)
    p()
    orphan = sorted(s for s in (set(full_plain) | set(full_L) | set(full_R) | set(prev_plain) | set(prev_L) | set(prev_R)) - names)
    p('Orphan full/preview stems (no pose in dataset): %d' % len(orphan))
    for s in orphan[:80]:
        p('  ORPHAN %s' % s)
    if len(orphan) > 80:
        p('  ... and %d more' % (len(orphan) - 80))

    # Does every pose with full_plain also exist as tn in preview? irrelevant

    # Save detailed mapping to tools dir for reference
    out_path = os.path.join(ROOT, 'tools', 'yoga_audit_report.txt')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('Yoga Pose Audit\n')
        f.write('Total poses: %d\n' % len(poses))
        f.write('Full-dir files: %d\n' % len(full_files))
        f.write('Preview-dir files: %d\n' % len(prev_files))
        f.write('Poses with full image: %d\n' % len(with_full & names))
        f.write('Poses missing full image: %d\n' % len(missing))
        f.write('Two-sided complete: %d\n' % len(ts_complete))
        f.write('Two-sided incomplete: %d\n' % len(ts_incomplete))
        f.write('Orphan stems: %d\n' % len(orphan))
        f.write('\n')
        for rel in ['previous_poses', 'next_poses', 'variations']:
            f.write('%s broken: %d\n' % (rel, broken[rel + '_broken']))
    p()
    p('Detailed report saved to tools/yoga_audit_report.txt')

if __name__ == '__main__':
    main()
