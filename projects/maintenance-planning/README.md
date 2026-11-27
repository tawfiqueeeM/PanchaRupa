# Maintenance Planning & Outage Impact (Depts 7 & 2)

## Overview
This module implements equipment asset registers, runtime hours and MTBF tracking, dual work order management (Planned PM vs Unplanned CM Breakdown), asset criticality hierarchies, and production schedule/dispatch impact analytics for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/maintenance_scenarios.json`: Test fixtures for planned morning PM and mid-shift SCR dryer breakdown.
- `docs/maintenance-rules.md`: Criticality classifications, work order workflows, and downtime formulas.
- `js/maintenance-engine.js`: Deterministic maintenance and outage engine.
- `tests/maintenance.test.js`: Native unit tests verifying PM zero-delay execution and unplanned outage dispatch delays.

## Testing & Demo
Run unit tests:
```bash
node --test projects/maintenance-planning/tests/maintenance.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/maintenance-planning/
```
