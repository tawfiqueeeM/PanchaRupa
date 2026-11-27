# Advance Plan — Inventory & Fulfillment Management (Project 11)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Branch:** `subproject/11-inventory-and-fulfilment`
- **Target Paths:**
  - `projects/inventory-and-fulfillment/`
  - `demos/inventory-and-fulfillment/`
- **Key Objectives:**
  1. Multi-format inventory management: Bulk auction paper sacks (25 kg / 36 kg lot split) vs Retail glass bottles (50g and 100g bottles).
  2. DAY-40 baseline fulfillment allocation: Exactly 40 kg released finished tea allocated into 36 kg bulk auction and 4 kg retail (40 × 50g bottles + 20 × 100g bottles).
  3. Quality disposition gating: Only lots marked `RELEASED` can be reserved or dispatched; lots in `ON_HOLD` or `REJECTED` status are locked.
  4. Over-allocation prevention: Attempting to reserve more mass than available unreserved released inventory is rejected with explicit errors.
  5. Distinct three-stage operational lifecycle:
     - `RESERVED`: Allocated from physical inventory to a sales order.
     - `DISPATCHED`: Physically loaded on transport with dispatch manifest.
     - `SETTLED`: Payment cleared from auction broker or retail customer (supports settlement delay simulation).
  6. Winter stock drawdown: Fulfilling orders from stored inventory during January–February without active factory production.
  7. Interactive UI with allocation sliders, dispatch progression, settlement simulation, and CSV/JSON export.

## 2. Permitted Files & Directory Map
```
projects/inventory-and-fulfillment/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── inventory_scenarios.json
├── docs/
│   └── fulfillment-rules.md
├── js/
│   └── inventory-engine.js
├── tests/
│   └── inventory.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/inventory-and-fulfillment/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Lot Object:**
  - `lotId`: Unique finished tea lot (e.g. `LOT-G01-REL`, `LOT-GL01-REL`, `LOT-QA-HOLD`).
  - `product`: `GREEN_TEA` or `GOLDEN_TEA`.
  - `totalKg`: Initial physical mass.
  - `reservedKg`: Committed mass.
  - `dispatchedKg`: Shipped mass.
  - `availableKg`: $\max(0, \text{totalKg} - \text{reservedKg} - \text{dispatchedKg})$.
  - `disposition`: `RELEASED`, `ON_HOLD`, or `REJECTED`.
- **Fulfillment Order Object:**
  - `orderId`: Unique order ID (`ORD-BULK-01`, `ORD-RET-01`).
  - `channel`: `AUCTION_BULK` or `RETAIL_BOTTLES`.
  - `lotId`: Source lot.
  - `allocatedKg`: Mass reserved.
  - `formatBreakdown`: Description (e.g. "36 kg bulk sack", "40x50g + 20x100g bottles").
  - `lifecycleState`: `RESERVED` -> `DISPATCHED` -> `SETTLED`.
  - `settlementDays`: Days to financial receipt.
  - `settlementStatus`: `PENDING`, `SETTLED`, or `OVERDUE_DELAYED`.

## 4. Verification Plan
- Unit tests: `node --test projects/inventory-and-fulfillment/tests/inventory.test.js`
- Test cases:
  1. Nominal DAY-40 allocation: 36 kg bulk and 4 kg retail from 40 kg released inventory.
  2. Over-allocation prevention: Rejecting reservation exceeding unreserved mass.
  3. Quality gate: Blocking reservation and dispatch of held lots (`ON_HOLD`).
  4. Distinct event lifecycle: Progression from `RESERVED` -> `DISPATCHED` -> `SETTLED`.
  5. Settlement delay tracking.
