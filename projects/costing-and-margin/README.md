# Costing, Overhead Allocation & Margin Analysis (Dept 7 Business Operations)

## Overview
This module implements full absorption manufacturing costing, departmental overhead allocation (6 cost pools), straight-line plant depreciation, bulk vs retail packaging cost differentiation, outbound freight segregation under selling expenses, and break-even analytics for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/costing_scenarios.json`: Test fixtures for 1,000 kg design month, zero-output dormancy, and high-retail premium mix.
- `docs/costing-model-rules.md`: Costing formulas, department budgets, and overhead drivers.
- `js/costing-engine.js`: Deterministic absorption costing computation engine.
- `tests/costing.test.js`: Native unit tests verifying the BDT 181.63/kg benchmark, zero-output handling, and freight segregation.

## Testing & Demo
Run unit tests:
```bash
node --test projects/costing-and-margin/tests/costing.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/costing-and-margin/
```
