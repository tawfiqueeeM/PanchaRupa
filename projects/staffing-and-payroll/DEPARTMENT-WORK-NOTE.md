# Department Work Note — Staffing, Payroll & Month 24 Financial Close (Dept 7)

## 1. Department Overview
- **Subproject:** 16 / Row 16 — Staffing and Payroll
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/staffing-and-payroll`
- **Scope:** Synthetic shift attendance tracking, shift-linked meal allowances (BDT 120/meal), four-stage payroll approval governance (Supervisor -> HR -> Finance -> Owner), factory vs office labor cost segregation, Month 24 cumulative financial close, and accrual profit vs realized bank cash reconciliation.

## 2. Implemented Capabilities
1. **Attendance-Linked Meal Allowances:**
   - Enforces invariant: Exactly one meal per worker per attended factory shift.
   - Cost: BDT 120.00 / meal.
   - 2 workers × 26 attended shifts × BDT 120 = exactly BDT 6,240.00 / month.
   - Tracked separately from taxable base wages and allocated to Factory Production Overhead.
2. **Four-Stage Payroll Approval Workflow:**
   - Multi-tier governance progression: `SUPERVISOR_REVIEW` -> `HR_VERIFICATION` -> `FINANCE_RECONCILIATION` -> `OWNER_AUTHORIZATION`.
3. **Factory vs Office Labor Segregation:**
   - Factory floor labor (Production Lead BDT 120k + Line Operator BDT 100k = BDT 220,000) allocated to Direct Labor / Production Cost.
   - Office administration payroll (Bookkeeper BDT 80,000) allocated to Operating Expenses.
   - Total Gross Payroll = BDT 300,000.00.
4. **Month 24 Cumulative Financial Close:**
   - Gross Revenue: BDT 2,400,000.00
   - Cost of Goods Sold (COGS): BDT 1,650,000.00
   - Gross Profit: BDT 750,000.00 (31.3% margin)
   - Operating Expenses: BDT 390,000.00
   - Operating Profit (EBIT): BDT 360,000.00
   - Interest Expense: BDT 60,000.00
   - Profit Before Tax (PBT): BDT 300,000.00.
5. **Profit vs Realized Bank Cash Distinction:**
   - Reconciles accounting profit (+BDT 300,000) with operating cash flow:
     - Depreciation add-back: +BDT 10,833.33
     - Less unpaid auction broker receivables: -BDT 280,000.00
     - Less working capital tied up in unsold inventory: -BDT 150,000.00
     - Net Operating Cash Flow: **-BDT 119,166.67 (Cash Deficit)**.
6. **Interactive UI & Exports:**
   - Dynamic shift input and meal allowance calculator.
   - Multi-stage approval stepper.
   - Full Month 24 financial statements and cash bridge.
   - Export to formatted JSON and CSV.
