# Worker Shift Planning & Skills Matrix (Dept 2 Operations)

## Overview
This module implements workforce scheduling, multi-skill competency mapping, fixed vs seasonal roster modeling, concurrency double-booking prevention, and uncovered workstation gap detection for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/shift_scenarios.json`: Test fixtures for nominal full crew, absent operator deficit, and double-booking conflict.
- `docs/skills-and-roster-rules.md`: Workstation specifications, staff profiles, and operational invariants.
- `js/shift-engine.js`: Deterministic shift evaluation and constraint verification engine.
- `tests/shift.test.js`: Native unit tests verifying coverage, absence handling, and concurrency limits.

## Testing & Demo
Run unit tests:
```bash
node --test projects/worker-shift-planning/tests/shift.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/worker-shift-planning/
```
