# Advance Plan — Leaf Procurement & Material Requirements Planning (Project 08)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Branch:** `subproject/08-procurement`
- **Target Paths:**
  - `projects/leaf-procurement/`
  - `demos/leaf-procurement/`
- **Key Objectives:**
  1. Material Requirements Planning (MRP) engine: Net Demand = Gross Demand − Released Inventory.
  2. Conversion to fresh leaf: $\text{FreshLeafRequired} = \frac{\text{NetRequirement}}{\text{AssumedYield}}$ (e.g. 20 kg net at 25% yield = 80 kg fresh leaf).
  3. Product differentiation & quality eligibility: Golden Tea requires `GOLDEN_ELIGIBLE` tender two-leaves-and-a-bud raw shoots; standard green leaf is rejected for Golden orders.
  4. Seasonal calendar constraints: January–February winter dormancy (zero fresh leaf procurement; fulfillment fulfilled from released stock).
  5. Lead time & supplier delivery tracking: Models supplier lead times (e.g. 24–48 hours) and delivery slots. If delivery arrives after the scheduled production start, the shortage is visibly flagged with impacted orders.
  6. Recruiter controls: Editable gross demand, inventory stock, yield percentage, lead time, supplier selection, and exportable purchase orders (CSV/JSON).

## 2. Permitted Files & Directory Map
```
projects/leaf-procurement/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── procurement_scenarios.json
├── docs/
│   └── mrp-procurement-rules.md
├── js/
│   └── procurement-engine.js
├── tests/
│   └── procurement.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/leaf-procurement/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Product Requirement Contract:**
  - `productId`: `GREEN_TEA` or `GOLDEN_TEA`.
  - `grossDemandKg`: Finished tea required by customer orders.
  - `releasedStockKg`: Current unreserved inventory in finished warehouse.
  - `netDemandKg`: $\max(0, \text{grossDemandKg} - \text{releasedStockKg})$.
  - `assumedYieldPct`: Processing yield (e.g. 22% to 26%, default 25.0%).
  - `freshLeafNeededKg`: $\frac{\text{netDemandKg}}{\text{assumedYieldPct} / 100}$.
  - `leafGrade`: `STANDARD_GREEN` or `GOLDEN_TENDER_BUD`.
- **Supplier Order Contract:**
  - `orderId`: Unique PO ID (e.g. `PO-2026-081`).
  - `supplierId`: Synthetic tea estate (`TENTULIA_ESTATE`, `KAZI_ORGANIC`, `DAHAL_GARDENS`).
  - `leadTimeHours`: Delivery window.
  - `promisedDeliveryDate`: ISO date string or hour offset.
  - `productionSlotHour`: Scheduled factory start time.
  - `status`: `ON_TIME` or `SHORTAGE_DELAYED`.

## 4. Verification Plan
- Unit tests: `node --test projects/leaf-procurement/tests/procurement.test.js`
- Test cases:
  1. Exact yield MRP calculation: 20 kg net requirement at 25% yield yields exactly 80 kg fresh leaf.
  2. Inventory offset: Existing released inventory reduces fresh leaf purchase requirements.
  3. Quality eligibility gate: Golden tea rejects standard leaf suppliers.
  4. Lead time shortage: Delivery slot arriving after production slot triggers shortage alert.
  5. Winter dormancy handling: Zero fresh leaf purchase permitted during January–February.
