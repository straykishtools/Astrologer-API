"""Guards the //Pose Reference// resolution invariant in yoga.txt.

Every //ref// inside description_fa must resolve to a yoga.txt record through
the REAL data.js matcher (faPoseRef). This pins the 455-ref fix: if someone
adds a free-form paraphrase ref, drops a record, or introduces a matcher
regression, the FA layer silently stops rendering links — this test fails.
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
def refs():
    return run_yoga_harness("refs")


def test_all_description_refs_resolve(refs):
    """Every //ref// in description_fa must resolve to a record."""
    assert refs["unresolvedRefs"] == 0, refs["unresolvedList"]


def test_refs_were_actually_scanned(refs):
    """Sanity: the scan must have seen the expected number of refs."""
    assert refs["totalRefs"] >= 400, refs