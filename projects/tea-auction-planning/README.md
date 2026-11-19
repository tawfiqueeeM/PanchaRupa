# Tea Auction Planning & Venue Optimization (Dept 7 Business Operations)

## Overview
This module implements three-centre tea auction venue comparison (Panchagarh, Sreemangal, Chattogram), full deduction transaction bridges (freight, broker commission, warehouse fees), net realization per kg, freight break-even price premiums, reserve price decision gating (Settle vs Relist vs Withdraw), and cash settlement realization cycles for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/auction_scenarios.json`: Test fixtures for three-centre baseline and reserve price deficit relist gate.
- `docs/auction-rules.md`: Venue parameter profiles, break-even formulas, and decision rules.
- `js/auction-engine.js`: Deterministic auction optimization engine.
- `tests/auction.test.js`: Native unit tests verifying deductions, break-even premiums, and settlement cycles.

## Testing & Demo
Run unit tests:
```bash
node --test projects/tea-auction-planning/tests/auction.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/tea-auction-planning/
```
