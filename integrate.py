#!/usr/bin/env python3
"""Cross-layer integration runner for PanchaRupa Virtual Tea Factory.

Executes:
1. python db/verify.py
2. python plc/plc_verify.py
3. python sim/policies.py --seed 42 --replications 1000

Aggregates their verified outputs into shared/data/factory-snapshot.json
and exits 0 only if every check succeeds.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import time
from typing import Any, Dict, List


REPO_ROOT = Path(__file__).resolve().parent
SNAPSHOT_PATH = REPO_ROOT / "shared" / "data" / "factory-snapshot.json"


def _run_step(name: str, args: List[str]) -> Dict[str, Any]:
    """Execute a verification or simulation command and capture its outcome."""
    cmd = [sys.executable, *args]
    start = time.monotonic()
    proc = subprocess.run(
        cmd,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    elapsed = round(time.monotonic() - start, 3)
    return {
        "name": name,
        "command": f"python {' '.join(args)}",
        "exitCode": proc.returncode,
        "passed": proc.returncode == 0,
        "durationSeconds": elapsed,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
    }


def main() -> int:
    db_result = _run_step("db_verify", ["db/verify.py"])
    plc_result = _run_step("plc_verify", ["plc/plc_verify.py"])
    sim_result = _run_step(
        "sim_policies",
        ["sim/policies.py", "--seed", "42", "--replications", "1000"],
    )

    simulation_payload: Dict[str, Any] | None = None
    sim_parse_error: str | None = None
    if sim_result["passed"]:
        try:
            simulation_payload = json.loads(sim_result["stdout"])
        except json.JSONDecodeError as exc:
            sim_result["passed"] = False
            sim_parse_error = f"Failed to parse sim/policies.py JSON output: {exc}"

    all_passed = (
        db_result["passed"]
        and plc_result["passed"]
        and sim_result["passed"]
        and simulation_payload is not None
    )

    snapshot: Dict[str, Any] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "overallStatus": "PASS" if all_passed else "FAIL",
        "checks": {
            "db": {
                "command": db_result["command"],
                "exitCode": db_result["exitCode"],
                "passed": db_result["passed"],
                "durationSeconds": db_result["durationSeconds"],
                "output": db_result["stdout"].splitlines(),
                **({"stderr": db_result["stderr"]} if db_result["stderr"] else {}),
            },
            "plc": {
                "command": plc_result["command"],
                "exitCode": plc_result["exitCode"],
                "passed": plc_result["passed"],
                "durationSeconds": plc_result["durationSeconds"],
                "output": plc_result["stdout"].splitlines(),
                **({"stderr": plc_result["stderr"]} if plc_result["stderr"] else {}),
            },
            "sim": {
                "command": sim_result["command"],
                "exitCode": sim_result["exitCode"],
                "passed": sim_result["passed"],
                "durationSeconds": sim_result["durationSeconds"],
                **({"parseError": sim_parse_error} if sim_parse_error else {}),
                **({"stderr": sim_result["stderr"]} if sim_result["stderr"] else {}),
            },
        },
        "simulation": simulation_payload,
    }

    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")

    for label, res in (("db/verify.py", db_result), ("plc/plc_verify.py", plc_result), ("sim/policies.py", sim_result)):
        status = "PASS" if res["passed"] else "FAIL"
        print(f"[{status}] {label} ({res['durationSeconds']}s, exit={res['exitCode']})")
        if not res["passed"] and res["stderr"]:
            print(res["stderr"], file=sys.stderr)
    if sim_parse_error:
        print(sim_parse_error, file=sys.stderr)

    print(f"Snapshot written to {SNAPSHOT_PATH.relative_to(REPO_ROOT).as_posix()} (overallStatus={snapshot['overallStatus']})")
    return 0 if all_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
