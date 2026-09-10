"""Pins the per-practice audio-cue timing anchors.

The spoken guide anchors are part of the session design (the original
yoga-data XML is the source of truth):

  • the FIRST voiced instruction cue fires at 00:08 for every practice;
  • the "exhale + next pose" transition cue fires at 00:20 for the sun
    salutations and 00:44 for the flow practices (ocean/desert/mountain).

The harness 'anchors' mode walks the RESOLVED steps with the app's
cueStep semantics (voice on, level 0 = the app default, RAW_FILES from
the real inventory) and reports when the first two voiced move
instructions would fire. If the engine's warm-up timing ever drifts
(loop scaling, rest snap, loop-rounding), these anchors move and the
test fails.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
from _yoga_harness import run_yoga_harness  # noqa: E402

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node required for the JS harness")

FLOW_PRACTICES = {"ocean", "desert", "mountain"}
ALL_PRACTICES = FLOW_PRACTICES | {"sun_salutation_a", "sun_salutation_b"}


@pytest.fixture(scope="module")
def anchors():
    return run_yoga_harness("anchors")


def test_every_practice_was_probed(anchors):
    """All five practices must be present with all their duration slots."""
    names = {r["practice"] for r in anchors}
    assert ALL_PRACTICES <= names, names
    assert len(anchors) >= 25, len(anchors)   # 3 flow × 3 + 2 sun × 8


def test_first_audio_at_8s_everywhere(anchors):
    """First voiced instruction cue = 00:08 in every practice × duration."""
    bad = [(r["practice"], r["duration"], r["firstVoice"]) for r in anchors if r["firstVoice"] != 8]
    assert not bad, bad


def test_exhale_next_transition_anchor(anchors):
    """00:44 for flow practices, 00:20 for sun salutations — every duration."""
    bad = []
    for r in anchors:
        expected = 44 if r["practice"] in FLOW_PRACTICES else 20
        if r["secondVoice"] != expected:
            bad.append((r["practice"], r["duration"], r["secondVoice"], expected))
    assert not bad, bad


def test_anchors_do_not_drift_across_durations(anchors):
    """Each practice must show exactly the two anchor times (8 + 20/44) —
    a third distinct value means the warm-up timing drifted somewhere."""
    times = {}
    for r in anchors:
        times.setdefault(r["practice"], set()).update(
            v for v in (r["firstVoice"], r["secondVoice"]) if v is not None
        )
    drifting = {p: sorted(v) for p, v in times.items() if v != {8, 44} and v != {8, 20}}
    assert not drifting, drifting
