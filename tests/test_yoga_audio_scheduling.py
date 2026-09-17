"""Pins the audio-cue queue (static/yoga-classic/audio.js) via the Node harness.

The queue must actually SCHEDULE cues for playback (reach AudioBufferSourceNode
.start) and must never drop a cue across a step transition. The critical
regression this guards: when a step's cue is still loading and the player
advances (newStep() + cueStep()), the stale load callback used to blindly
`queue.shift()` and eat the NEW step's first cue. The mock AudioContext in the
harness counts every cue that reaches src.start().
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
def sched():
    return run_yoga_harness("audio-sched")


def test_step_transition_does_not_drop_first_cue(sched):
    """newStep() mid-load must cancel the OLD cue but never eat the NEW one."""
    assert sched["raceStarts"] == 1, sched


def test_all_queued_cues_reach_start(sched):
    """Enqueuing several cues in one step — every one must actually play."""
    assert sched["sequentialStarts"] == 4, sched


def test_no_drops_across_sequential_steps(sched):
    """Three full step cycles (newStep + cue, waiting between) — all play."""
    assert sched["crossStepStarts"] == 3, sched


def test_mid_playback_cue_does_not_reschedule_the_sounding_cue(sched):
    """A cue that arrives while the previous cue is still audible must not
    re-schedule (duplicate) it, and the cues queued behind it must each play
    exactly once, in order.

    This is the 00:12 regression of every flow practice: the hold teaches
    Child Wide (a 7.56s instruction) and the hold's first breath cue arrives
    100ms later. Because the play lock was released in the load callback
    instead of at the end of the cue, the engine found the SOUNDING
    instruction at queue[0] and scheduled it a second time — the instruction
    was spoken twice and the breath cue slid in behind it.
    """
    assert sched["chainLog"] == ["long_a.ogg", "next_b.ogg", "next_c.ogg"], sched
    assert sched["chainStarts"] == 3, sched