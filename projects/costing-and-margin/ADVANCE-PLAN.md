# Advance Plan — Costing, Overhead Allocation & Margin Analysis (Project 12)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Branch:** `subproject/12-costing-and-finance`
- **Target Paths:**
  - `projects/costing-and-margin/`
  - `demos/costing-and-margin/`
- **Key Objectives:**
  1. Full absorption costing bridge:
     - Fresh leaf material cost (e.g. 4,000 kg at BDT 25/kg = BDT 100,000).
     - Packaging materials: bulk bags (BDT 2/kg) and retail bottles (BDT 80/kg).
     - Departmental recurring factory cash budget (BDT 61,000 / month across 6 departments).
     - Illustrative straight-line equipment depreciation (BDT 10,833.33 / month).
     - Illustrative Manufacturing Total: BDT 181,633.33 -> **BDT 181.63 / released kg** at 1,000 kg output.
  2. Distinct commercial classification: Outbound freight (BDT 9,000) tracked strictly as a selling / distribution expense, excluded from manufacturing unit cost.
  3. Commercial revenue & margin modeling: Channel selling prices (e.g. BDT 240/kg bulk, BDT 450/kg retail), gross margin, and break-even analysis.
  4. Zero-output handling: Gracefully handles zero output (e.g. January winter dormancy or full outage) without division by zero (`NaN`), correctly recognizing recurring fixed overhead and depreciation as period variance (BDT 71,833.33).
  5. Interactive controls: Live sliders for volume (0 to 1,500 kg), leaf cost/kg, yield %, channel split (bulk vs retail), and export to CSV/JSON.

## 2. Permitted Files & Directory Map
```
projects/costing-and-margin/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── costing_scenarios.json
├── docs/
│   └── costing-model-rules.md
├── js/
│   └── costing-engine.js
├── tests/
│   └── costing.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/costing-and-margin/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Cost Bridge Structure:**
  - `releasedKg`: Finished production volume.
  - `leafCostBdt`: $\frac{\text{releasedKg}}{\eta} \times \text{leafPricePerKg}$.
  - `packagingCostBdt`: $\text{bulkKg} \times 2.00 + \text{retailKg} \times 80.00$.
  - `recurringCashBdt`: Fixed BDT 61,000 (Production 26k, Ops 8k, Controls 12k, Quality 6k, Testing 2k, Business 7k).
  - `depreciationBdt`: Fixed BDT 10,833.33.
  - `totalManufacturingCostBdt`: Sum of leaf, packaging, recurring cash, and depreciation.
  - `unitManufacturingCostBdt`: $\frac{\text{totalManufacturingCostBdt}}{\text{releasedKg}}$ (or `null` if `releasedKg === 0`).
  - `outboundFreightBdt`: BDT 9,000 (tracked as selling expense).
  - `grossRevenueBdt`: $\text{bulkKg} \times P_{\text{bulk}} + \text{retailKg} \times P_{\text{retail}}$.
  - `grossMarginBdt`: $\text{grossRevenueBdt} - \text{totalManufacturingCostBdt} - \text{outboundFreightBdt}$.
  - `grossMarginPct`: $\frac{\text{grossMarginBdt}}{\text{grossRevenueBdt}} \times 100$.

## 4. Verification Plan
- Unit tests: `node --test projects/costing-and-margin/tests/costing.test.js`
- Test cases:
  1. Acceptance check: 1,000 kg design month matches exactly BDT 181.63 / released kg.
  2. Zero output handling: 0 kg released produces no `NaN`/`Infinity`, recognizes BDT 71,833.33 period variance.
  3. Channel sensitivity: Changing bulk/retail mix alters packaging cost and unit margin.
  4. Outbound freight segregation: Confirms freight is segregated from manufacturing unit cost.
