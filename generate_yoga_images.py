"""Regenerate static/yoga-images.json from the actual files in static/images/yoga.

Naming convention:
    <Base>.png            full-size (neutral)
    <Base>_L.png / _R.png full-size (side variant)
    <Base>-tn75.png       75px thumbnail
    <Base>-tn90.png       90px thumbnail
(thumbnails may also be side-specific: <Base>_L-tn90.png)

Run from the project root:  python generate_yoga_images.py
"""
import json
import os
import re

IMG_DIR = os.path.join("static", "images", "yoga")
OUT = os.path.join("static", "yoga-images.json")
POSES = os.path.join("static", "yoga.txt")

NAME_RE = re.compile(r"^(?P<base>.+?)(?:_(?P<side>[LR]))?(?:-tn(?P<size>75|90))?\.png$")
JUNK = {"facebook", "twitter", "chevron@2x"}


def scan():
    files = {}
    for fn in sorted(os.listdir(IMG_DIR)):
        m = NAME_RE.match(fn)
        if not m:
            continue
        base = m.group("base")
        if base in JUNK or re.search(r" \(\d+\)$", base):
            continue  # social icons / duplicate downloads
        side = m.group("side") or "N"
        size = m.group("size") or "full"
        files.setdefault(base, {}).setdefault(side, {})[size] = fn
    return files


def entry(b):
    sides = dict(b.get("N", {}))
    sides.setdefault("full", None)
    sides.setdefault("75", None)
    sides.setdefault("90", None)
    L = b.get("L", {})
    R = b.get("R", {})

    def url(fn):
        return "static/images/yoga/" + fn if fn else None

    # full: neutral full, else any side full
    full = sides["full"] or R.get("full") or L.get("full")
    # card: 90px thumb (neutral, then side), else fall back to full-size
    card = sides["90"] or R.get("90") or L.get("90") or full
    # thumb: 75px thumb, else the card tier
    thumb = sides["75"] or R.get("75") or L.get("75") or card
    e = {"full": url(full), "card": url(card), "thumb": url(thumb)}
    if L:
        e["L"] = url(L.get("full"))
        if L.get("90"): e["L90"] = url(L["90"])
        if L.get("75"): e["L75"] = url(L["75"])
    if R:
        e["R"] = url(R.get("full"))
        if R.get("90"): e["R90"] = url(R["90"])
        if R.get("75"): e["R75"] = url(R["75"])
    return e


def main():
    files = scan()
    manifest = {"version": 3, "poses": {name: entry(b) for name, b in files.items()}}

    # coverage report against the pose dataset
    pose_names = [p["name"] for p in json.load(open(POSES, encoding="utf-8"))]
    missing = [n for n in pose_names if n not in files]
    two_sided_incomplete = [
        p["name"] for p in json.load(open(POSES, encoding="utf-8"))
        if p.get("two_sided") and not (files.get(p["name"], {}).get("L") and files.get(p["name"], {}).get("R"))
    ]
    orphans = [n for n in files if n not in set(pose_names)]

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))

    print("image bases on disk:", len(files))
    print("poses:", len(pose_names))
    print("poses without images:", len(missing), missing[:15])
    print("two-sided poses missing one side:", len(two_sided_incomplete), two_sided_incomplete[:10])
    print("orphan image bases (no pose):", len(orphans), orphans[:10])


if __name__ == "__main__":
    main()
