"""Guards the shamsi→gregorian conversion used by the main app.

buildSubject() in static/script.js sends picked dates to the backend in
Gregorian CE. The wheel picker stores dates in the SELECTED calendar
(default shamsi), so a raw shamsi year like 1379 sent as-is would compute
a chart for year 1379 CE — a completely wrong sky (verified live:
shamsi 1379/10/11 = 2000-12-31 CE gives a Capricorn sun; raw 1379-10-11
gives Libra).

This test loads the real static/zodiac-display.js under Node (harness
mode `calconvert`) and pins the conversion cases, whose expected values
were verified against the authoritative `jdatetime` Python library.

If someone breaks zodiac-display.js's jalaliToGregorian or removes the
conversion call in buildSubject / the profile auto-save, this fails.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
HARNESS = HERE / "_yoga_harness.js"


def _run_calconvert() -> dict:
    proc = subprocess.run(
        ["node", str(HARNESS), "calconvert"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=str(HERE.parent),
        timeout=120,
    )
    if proc.returncode != 0:
        # Harness exits 1 when cases fail, 2 on harness error — surface both
        tail = "\n".join((proc.stdout or "").strip().splitlines()[-3:])
        err = "\n".join((proc.stderr or "").strip().splitlines()[-3:])
        raise AssertionError(
            f"calconvert harness failed (exit {proc.returncode}).\nstdout tail:\n{tail}\nstderr tail:\n{err}"
        )
    lines = [ln for ln in (proc.stdout or "").strip().splitlines() if ln.strip()]
    return json.loads(lines[-1])


def test_shamsi_to_gregorian_pinned_cases():
    """All pinned conversion cases pass (values from jdatetime.togregorian)."""
    data = _run_calconvert()
    assert data["failed"] == 0, f"conversion cases failed: {data['cases']}"
    assert data["total"] >= 7, f"expected at least 7 pinned cases, got {data['total']}"


def test_winter_shamsi_date_does_not_stay_raw():
    """The regression case: shamsi 1379/10/11 must become 2000-12-31 CE.

    If the raw shamsi numbers leaked through, the chart engine would see
    year 1379 CE. The pinned case explicitly proves the conversion ran.
    """
    data = _run_calconvert()
    case = next(
        (c for c in data["cases"] if c["in"] == [1379, 10, 11]), None
    )
    assert case is not None, "1379/10/11 case missing from harness output"
    assert case["out"] == [2000, 12, 31], (
        f"shamsi 1379/10/11 converted to {case['out']} — expected [2000, 12, 31]. "
        "The raw shamsi year is leaking to the chart engine."
    )


def test_gregorian_range_passthrough():
    """Dates outside the 1300–1600 shamsi window pass through unchanged."""
    data = _run_calconvert()
    for cin, cout in (
        ([2024, 8, 11], [2024, 8, 11]),
        ([1900, 5, 10], [1900, 5, 10]),
    ):
        case = next((c for c in data["cases"] if c["in"] == cin), None)
        assert case is not None, f"passthrough case {cin} missing"
        assert case["out"] == cout, f"{cin} should pass through as {cout}, got {case['out']}"
