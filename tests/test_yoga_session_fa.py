"""Guards Persian FA coverage for the practice data.

Uses the REAL data.js FA matcher (run under Node via tests/_yoga_harness.js)
to verify that:
  • every pose in poses.xml resolves to a yoga.txt record with Persian names,
  • every pose referenced by the five practice sessions resolves too,
  • every move target in moves.xml resolves too.

If someone adds a pose to the session/poses data without the matching
yoga.txt record, the FA layer would silently show an English name in the
player — this test makes that regression fail instead.
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
def coverage():
    return run_yoga_harness("coverage")


def test_poses_xml_fully_covered(coverage):
    """Every poses.xml pose must resolve to a Persian record."""
    assert coverage["posesMissing"] == []


def test_session_pose_references_resolve(coverage):
    """Every pose referenced by the practice sessions must resolve."""
    assert coverage["badSessionRefs"] == {}, coverage["badSessionRefs"]


def test_move_targets_resolve(coverage):
    """Every move transition target in moves.xml must resolve."""
    assert coverage["badMoveTargets"] == [], coverage["badMoveTargets"]


def test_refs_were_actually_collected(coverage):
    """Sanity: the harness really walked the sessions (guards a hollow pass)."""
    assert coverage["posesTotal"] >= 200
    assert "ocean" in coverage["sessionRefs"]
    assert "sun_salutation_a" in coverage["sessionRefs"]
    assert len(coverage["sessionRefs"]["ocean"]) > 10
    assert "Child Wide Start" in coverage["sessionRefs"]["ocean"]
    assert "Downward Dog" in coverage["sessionRefs"]["ocean"]
    assert "Forward Bend" in coverage["sessionRefs"]["ocean"]