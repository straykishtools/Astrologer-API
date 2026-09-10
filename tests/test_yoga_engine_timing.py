"""Pins the practice-session timing acceptance criteria against the REAL
engine.js (run under Node via tests/_yoga_harness.js).

Spec acceptance (static/yoga-data is the source of truth):
  30 min → final pose starts at 27:00 (1620s), final rest 180s
  45 min → final pose starts at 41:00 (2460s), final rest 240s
  60 min → final pose starts at 55:00 (3300s), final rest 300s
i.e. finalPoseStart = totalDuration − restDuration, exactly.

These tests run the actual `resolveSession` from static/yoga-classic/engine.js
against the real .session XML files, so any regression in the timing engine
fails here.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
from _yoga_harness import run_yoga_harness  # noqa: E402

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node required for the JS harness")

MINUTES_PRACTICES = ["ocean", "desert", "mountain"]
# (targetMinutes, restSeconds, finalPoseStartClock)
DURATIONS = [
    (30, 180, "27:00"),
    (45, 240, "41:00"),
    (60, 300, "55:00"),
]


def _cool_target(minutes: int) -> int:
    return 300 if minutes >= 60 else 240 if minutes >= 45 else 180


def _run_cases(cases):
    results = run_yoga_harness("timing", cases)
    assert isinstance(results, list) and len(results) == len(cases), results
    return results


@pytest.fixture(scope="module")
def acceptance_results():
    """The 9 spec cases: 3 minute-based practices × 3 durations (beginner)."""
    cases = [
        {"practice": p, "level": 0, "durationIndex": i, "targetMinutes": minutes}
        for p in MINUTES_PRACTICES
        for i, (minutes, _rest, _clock) in enumerate(DURATIONS)
    ]
    return _run_cases(cases)


def test_nine_acceptance_cases_final_pose_boundary_exact(acceptance_results):
    """Final pose starts at exactly 27:00 / 41:00 / 55:00 for every practice."""
    for r in acceptance_results:
        cool = _cool_target(r["targetMinutes"])
        expected_boundary = r["targetMinutes"] * 60 - cool
        assert abs(r["mainSeconds"] - expected_boundary) < 1e-6, r


def test_nine_acceptance_cases_rest_duration_exact(acceptance_results):
    """Final rest section is exactly 3:00 / 4:00 / 5:00."""
    for r in acceptance_results:
        cool = _cool_target(r["targetMinutes"])
        assert abs(r["restSeconds"] - cool) < 1e-6, r


def test_nine_acceptance_cases_total_duration_exact(acceptance_results):
    """Whole practice totals exactly 30 / 45 / 60 minutes."""
    for r in acceptance_results:
        assert abs(r["totalSeconds"] - r["targetMinutes"] * 60) < 1e-6, r


def test_all_difficulty_levels_and_durations_exact():
    """The criteria hold at every difficulty level too (27 combinations)."""
    cases = [
        {"practice": p, "level": lvl, "durationIndex": i, "targetMinutes": minutes}
        for p in MINUTES_PRACTICES
        for lvl in range(3)
        for i, (minutes, _rest, _clock) in enumerate(DURATIONS)
    ]
    for r in _run_cases(cases):
        cool = _cool_target(r["targetMinutes"])
        assert abs(r["mainSeconds"] - (r["targetMinutes"] * 60 - cool)) < 1e-6, r
        assert abs(r["restSeconds"] - cool) < 1e-6, r
        assert abs(r["totalSeconds"] - r["targetMinutes"] * 60) < 1e-6, r


def test_repetition_based_sessions_are_not_stretched():
    """Sun salutations are repetition sessions — their XML *is* the session;
    the engine must not stretch their rest section to 3/4/5 minutes."""
    cases = [
        {"practice": n, "level": 0, "durationIndex": 0, "targetMinutes": 30}
        for n in ("sun_salutation_a", "sun_salutation_b")
    ]
    for r in _run_cases(cases):
        assert r["totalSeconds"] not in (1800, 2700, 3600), r
        assert r["restSeconds"] not in (180, 240, 300), r