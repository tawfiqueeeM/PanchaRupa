# Advance Plan — Tea Auction Planning & Venue Optimization (Project 17)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Branch:** `subproject/tea-auction-planning`
- **Target Paths:**
  - `projects/tea-auction-planning/`
  - `demos/tea-auction-planning/`
- **Key Objectives:**
  1. Three-centre tea auction comparison: Panchagarh (local), Sreemangal (regional specialty hub), and Chattogram (national primary auction).
  2. Complete transaction cost bridge: Haulage/courier freight, broker commission percentage, receiving warehouse handling, cataloguing fees, and sampling allowances.
  3. Net Realization & Freight Break-even calculation: Computing the net BDT/kg realized per venue and the exact price premium required for a distant venue to justify extra freight and transit risk.
  4. Reserve price decision engine: Bid vs Reserve Price evaluation with Hold, Relist, or Settle decision rules.
  5. Settlement timeline modeling: 7 days (Panchagarh), 14 days (Sreemangal), and 21 days (Chattogram) cash realization cycles.
  6. Synthetic data governance: Grounded in Bangladesh Tea Board / TTAB market structure without claiming unverifiable forecasting accuracy.
  7. Interactive UI with venue comparison matrix, reserve price threshold sliders, break-even visualizer, and CSV/JSON export.

## 2. Permitted Files & Directory Map
```
projects/tea-auction-planning/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── auction_scenarios.json
├── docs/
│   └── auction-rules.md
├── js/
│   └── auction-engine.js
├── tests/
│   └── auction.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/tea-auction-planning/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Auction Venue Contract:**
  - `venueId`: `PANCHAGARH`, `SREEMANGAL`, or `CHATTOGRAM`.
  - `freightPerKg`: Transport cost from factory in Panchagarh.
  - `transitDays`: Days in logistics transit.
  - `brokerCommissionPct`: Registered tea broker percentage fee.
  - `warehouseFeePerKg`: Handling & storage fee.
  - `settlementDays`: Days from auction hammer to bank cash clearance.
- **Auction Lot Sale Contract:**
  - `lotId`: Unique catalogued lot (e.g. `LOT-AUC-G01`).
  - `product`: `GREEN_TEA` or `GOLDEN_TEA`.
  - `quantityKg`: Mass catalogued (e.g. 500 kg or 1,000 kg).
  - `reservePriceBdt`: Minimum acceptable net price.
  - `expectedHammerPriceBdt`: Highest broker valuation.
  - `netRealizationBdt`: $\text{Hammer} - \text{Freight} - (\text{Hammer} \times \text{Commission}) - \text{WarehouseFee}$.
  - `decision`: `SOLD_SETTLE`, `RELIST`, or `WITHDRAW_HOLD`.

## 4. Verification Plan
- Unit tests: `node --test projects/tea-auction-planning/tests/auction.test.js`
- Test cases:
  1. Three-centre net realization comparison: verifies exact freight and fee deductions for Panchagarh, Sreemangal, and Chattogram.
  2. Freight break-even calculation: determines required hammer price premium for distant venues.
  3. Reserve price threshold rejection: bids below reserve trigger `RELIST` or `WITHDRAW_HOLD`.
  4. Settlement cycle timeline tracking (7 vs 14 vs 21 days).
