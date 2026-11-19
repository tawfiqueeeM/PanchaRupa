# Leaf Procurement & Material Requirements Planning (Dept 7 Business Operations)

## Overview
This module implements material requirements planning (MRP) for raw fresh leaf procurement, dry-to-wet processing yield conversions, supplier plucking grade eligibility validation, winter bush dormancy gating, and logistics arrival synchronization for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/procurement_scenarios.json`: Test fixtures for DAY-40 baseline, supplier shortage, and winter dormancy.
- `docs/mrp-procurement-rules.md`: Mathematical formulations, supplier profiles, and quality grades.
- `js/procurement-engine.js`: Deterministic MRP computation engine.
- `tests/procurement.test.js`: Native unit tests verifying yield formulas, stock buffer offsets, and delivery slot shortages.

## Testing & Demo
Run unit tests:
```bash
node --test projects/leaf-procurement/tests/procurement.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/leaf-procurement/
```
