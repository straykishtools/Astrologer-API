"""Pins the first-minute audio-cue budget of every practice.

The session XML is the source of truth for what may be spoken in the first
minute (static/yoga-data/resources/assets/*.session):

  • every move            → ONE voice file, else its <breath> fallback
  • every hold            → ONE breath cue at its first beat (breath numbers
                            instead when audibleCount="true"; nothing when the
                            hold is timed) plus its phrase cue
  • first visit of a pose → ONE instruction (excludefromtimeline poses: none)

The regression these tests guard: the engine voiced a cue on EVERY breath of
a hold. ocean's warm-up is <hold count="8" audibleCount="false"/> — a
32-second hold — so 0:12 … 0:40 played «Inhale./Exhale.» eight times and the
first minute carried 17 cues instead of 9.

The numbers come from tests/_yoga_harness.js (cue-budget mode), which walks
the RESOLVED steps of the real session files. The source guard at the bottom
keeps the engine's own condition honest, since the walk mirrors it by hand.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
from _yoga_harness import run_yoga_harness  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[1]

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node required for the JS harness")

FLOW = {
    "moveVoice": 3, "moveBreath": 0, "holds": 3, "timedHolds": 0,
    "holdBreaths": 11, "breathCues": 3, "numberCues": 0, "phraseCues": 1,
    "instructions": 2, "total": 9,
}
SUN_A = {
    "moveVoice": 3, "moveBreath": 2, "holds": 5, "timedHolds": 0,
    "holdBreaths": 9, "breathCues": 5, "numberCues": 0, "phraseCues": 0,
    "instructions": 2, "total": 12,
}
SUN_B = dict(SUN_A, instructions=3, total=13)

# practice → what the first 60 seconds may schedule
EXPECTED = {
    "ocean": FLOW,
    "desert": FLOW,
    "mountain": FLOW,
    "sun_salutation_a": SUN_A,
    "sun_salutation_b": SUN_B,
}


@pytest.fixture(scope="module")
def budget():
    return {r["practice"]: r for r in run_yoga_harness("cue-budget")}


def test_every_practice_was_probed(budget):
    assert set(EXPECTED) <= set(budget), sorted(budget)


@pytest.mark.parametrize("name", sorted(EXPECTED))
def test_first_minute_cue_budget(budget, name):
    got = {k: budget[name][k] for k in EXPECTED[name]}
    assert got == EXPECTED[name], budget[name]


@pytest.mark.parametrize("name", sorted(EXPECTED))
def test_breath_cue_fires_once_per_hold_not_once_per_breath(budget, name):
    r = budget[name]
    assert r["breathCues"] == r["holds"] - r["timedHolds"], r
    # the old metronome voiced every counted breath of every hold
    assert r["breathCues"] < r["holdBreaths"], r


@pytest.mark.parametrize("name", sorted(EXPECTED))
def test_first_minute_total_equals_its_parts(budget, name):
    r = budget[name]
    assert r["total"] == (
        r["moveVoice"] + r["moveBreath"] + r["breathCues"]
        + r["numberCues"] + r["phraseCues"] + r["instructions"]
    ), r


def test_hold_breath_cue_is_guarded_to_the_first_beat():
    """Pin the guard in the real engine so the 4-second «دم/بازدم» metronome
    cannot come back silently: the breath cue must be limited to idx === 0."""
    src = (REPO_ROOT / "static" / "yoga-classic" / "app.js").read_text(encoding="utf-8")
    branch = [ln for ln in src.splitlines() if "!this.current.timed" in ln]
    assert branch, "hold breath-cue branch not found in app.js"
    assert all("idx === 0" in ln for ln in branch), branch
