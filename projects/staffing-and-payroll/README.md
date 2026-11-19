# Staffing, Payroll & Month 24 Financial Close (Dept 7 Business Operations)

## Overview
This module implements synthetic shift attendance tracking, shift-linked meal allowances (BDT 120/shift), multi-tier payroll approval workflows (Supervisor -> HR -> Finance -> Owner), factory vs office labor cost segregation, Month 24 cumulative financial close, and the critical distinction between accrual accounting profit and realized bank cash flow for the PanchaRupa Virtual Tea Factory.

## File Structure
- `ADVANCE-PLAN.md`: Subproject roadmap and contract specification.
- `fixtures/payroll_scenarios.json`: Test fixtures for Month 24 standard close and early two-worker shift models.
- `docs/payroll-and-accounting-rules.md`: Wage formulas, meal policies, and cash reconciliation rules.
- `js/payroll-engine.js`: Deterministic payroll and accounting engine.
- `tests/payroll.test.js`: Native unit tests verifying the BDT 6,240 meal benchmark, approval stages, and profit vs cash reconciliation.

## Testing & Demo
Run unit tests:
```bash
node --test projects/staffing-and-payroll/tests/payroll.test.js
```
Run browser demo:
```bash
python serve.py
# Open http://localhost:8000/demos/staffing-and-payroll/
```
