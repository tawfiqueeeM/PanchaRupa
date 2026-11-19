# Advance Plan — Staffing, Attendance & Month 24 Financial Close (Project 16)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Branch:** `subproject/staffing-and-payroll`
- **Target Paths:**
  - `projects/staffing-and-payroll/`
  - `demos/staffing-and-payroll/`
- **Key Objectives:**
  1. Synthetic shift attendance and meal allowance linkage: Exactly 1 meal per attended shift per worker (BDT 120/meal, budgeted at 2 workers × 26 shifts × BDT 120 = BDT 6,240/mo), tracked separately from base wages and allocated to production overhead.
  2. Four-stage payroll approval workflow:
     - Stage 1: Supervisor confirms shift attendance and overtime hours.
     - Stage 2: HR verifies deductions and leave balances.
     - Stage 3: Finance reconciles gross/net payroll and bank registers.
     - Stage 4: Founder/Owner final approval release.
  3. Payroll cost segregation: Factory labor (allocated to Production Cost) vs Office/Admin payroll (allocated to Operating Expenses).
  4. Month 24 Cumulative Financial Close:
     - Sales: BDT 2,400,000
     - Cost of Goods Sold (COGS): BDT 1,650,000
     - Gross Profit: BDT 750,000
     - Operating Expenses: BDT 390,000
     - Operating Profit: BDT 360,000
     - Financing Interest: BDT 60,000
     - Profit Before Tax (PBT): BDT 300,000
     - Total Gross Payroll: BDT 300,000 (BDT 220,000 factory + BDT 80,000 office).
  5. Critical distinction between Accrual Accounting Profit vs Realized Bank Cash:
     - Direct cash flow bridge reconciling net profit with uncollected broker receivables, cash tied up in unsold inventory, non-cash depreciation add-backs, and cash reserved for upcoming leaf purchasing cycles.
  6. Interactive UI with attendance toggles, meal calculations, 4-stage approval stepper, Month 24 financial statements, profit vs cash reconciliation, and export (CSV/JSON).

## 2. Permitted Files & Directory Map
```
projects/staffing-and-payroll/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── payroll_scenarios.json
├── docs/
│   └── payroll-and-accounting-rules.md
├── js/
│   └── payroll-engine.js
├── tests/
│   └── payroll.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/staffing-and-payroll/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Employee Attendance & Meal Record:**
  - `empId`: Worker ID (`EMP-FAC-01`, `EMP-FAC-02`, `EMP-OFF-01`).
  - `name`: Role title (`Lead Machine Operator`, `Packing Specialist`, `Finance Officer`).
  - `dept`: `FACTORY` or `OFFICE`.
  - `attendedShifts`: Number of attended shifts.
  - `baseSalaryBdt`: Fixed monthly wage.
  - `overtimeHours`: Overtime worked.
  - `overtimeRateBdt`: Overtime rate/hr.
  - `mealsCount`: Matches `attendedShifts`.
  - `mealCostBdt`: `mealsCount * 120`.
  - `grossPayBdt`: `baseSalaryBdt + (overtimeHours * overtimeRateBdt)`.
- **Payroll Register State:**
  - `approvalStage`: `SUPERVISOR_SUBMITTED` -> `HR_VERIFIED` -> `FINANCE_RECONCILED` -> `OWNER_APPROVED`.
  - `isApproved`: Boolean.
- **Month 24 Cash Bridge:**
  - `accrualProfitBdt`: BDT 300,000.
  - `depreciationAddback`: +BDT 10,833.33.
  - `uncollectedReceivables`: -BDT 280,000.00.
  - `unsoldInventoryWorkingCapital`: -BDT 150,000.00.
  - `netOperatingCashFlow`: BDT 300k + BDT 10.8k - BDT 280k - BDT 150k = -BDT 119,166.67 (cash deficit warning!).

## 4. Verification Plan
- Unit tests: `node --test projects/staffing-and-payroll/tests/payroll.test.js`
- Test cases:
  1. Attendance and meal calculation: 2 workers × 26 shifts × BDT 120 = exactly BDT 6,240.
  2. Four-stage payroll approval lifecycle progression.
  3. Factory vs Office labor allocation.
  4. Month 24 Income Statement reconciliation (PBT = BDT 300,000).
  5. Accrual Profit vs Bank Cash variance reconciliation.
