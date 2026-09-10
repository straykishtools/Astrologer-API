"""Guards static/yoga-core.js alias matching (the Library view).

Runs the REAL yoga-core.js under Node and verifies its name-first alias
resolution: every pose's own `name` resolves back to it (never to a variant
whose display_name shadows the base), the known collision families resolve to
the base pose, and the intentional renames keep working. Mirrors the
session-coverage guard used for yoga-classic's data.js.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
from _yoga_harness import run_yoga_harness  # noqa: E402

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node required for the JS harness")


@pytest.fixture(scope="module")
def core():
    return run_yoga_harness("yogacore")


def test_collision_families_resolve_to_base_pose(core):
    """A base pose's own name must beat a variant's display_name shadow."""
    expected = {
        "Cobra": "Cobra", "Tree": "Tree", "Mountain": "Mountain",
        "Pyramid": "Pyramid", "Triangle": "Triangle", "Fish": "Fish",
        "Frog": "Frog", "Garland": "Garland",
    }
    assert core["collision"] == expected, core["collision"]


def test_intentional_renames_still_work(core):
    """Legit display renames / start-states must keep resolving."""
    expected = {
        "Wind Removing": "Turtle",
        "Turtle": "Turtle",
        "Savasana": "Corpse",
        "Child Wide Start": "ChildWide",
        "Seated On Heels Prayer Closed Eyes": "SeatedOnHeelsPrayerClosedEyes",
    }
    assert core["renames"] == expected, core["renames"]


def test_every_pose_name_resolves_to_itself(core):
    """Name-first guarantee: get(p.name) must return that same record."""
    assert core["wrongName"] == 0, core["wrongNameList"]


def test_all_aliases_resolve(core):
    """No alias (name/display_name/name_fa/aka) may be lost — Persian name_fa
    aliases included (keyOf keeps the Persian script)."""
    assert core["unresolvedAlias"] == 0, core["unresolvedList"]


def test_persian_name_fa_aliases_resolve(core):
    """Persian names must resolve through the same alias map (کبری→Cobra…)."""
    expected = {"کبری": "Cobra", "درخت": "Tree", "سگ رو به پایین": "DownwardDog"}
    assert core["faSamples"] == expected, core["faSamples"]