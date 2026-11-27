# Production Scheduling & Machine Calendar (Dept 2 Operations)

## Overview
This module implements multi-product batch production scheduling, shared asset mutual exclusion constraints (Tea Roller, Fluid Bed Dryer), sanitization changeover modeling, machine outage rescheduling, and Before vs After analytics for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/schedule_scenarios.json`: Test fixtures for DAY-40 nominal, unplanned dryer outage, and over-capacity infeasibility.
- `docs/scheduling-rules.md`: Workstation specifications, shift boundaries, and mathematical constraints.
- `js/scheduling-engine.js`: Deterministic scheduling and constraint evaluation engine.
- `tests/scheduling.test.js`: Native unit tests verifying non-overlapping reservations and delay calculations.

## Testing & Demo
Run unit tests:
```bash
node --test projects/production-scheduling/tests/scheduling.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/production-scheduling/
```
