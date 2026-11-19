# Inventory Reservation & Order Fulfillment (Dept 7 Business Operations)

## Overview
This module implements warehouse inventory reservation, DAY-40 pack split allocations (36 kg bulk auction vs 4 kg retail bottles), quality disposition gating (`RELEASED` vs `ON_HOLD`), over-allocation prevention, and three-stage lifecycle progression (`RESERVED` -> `DISPATCHED` -> `SETTLED`) for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/inventory_scenarios.json`: Test fixtures for DAY-40 allocation baseline, held lot quarantine gate, and settlement delay simulation.
- `docs/fulfillment-rules.md`: Fulfillment channels, formats, and operational invariants.
- `js/inventory-engine.js`: Deterministic inventory and lifecycle engine.
- `tests/inventory.test.js`: Native unit tests verifying pack splits, over-allocation rejections, and lifecycle transitions.

## Testing & Demo
Run unit tests:
```bash
node --test projects/inventory-and-fulfillment/tests/inventory.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/inventory-and-fulfillment/
```
