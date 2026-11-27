# Handoff to Codex — Costing, Overhead Allocation & Margin Analysis (Dept 7)

## Metadata & Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Contributing Departments:** Dept 1 Production Engineering, Dept 2 Capacity & Operations, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/12-costing-and-finance`
- **Source Paths:**
  - Logic & Specification: `projects/costing-and-margin/`
  - Interactive Demo: `demos/costing-and-margin/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Scope & Deferred Capability Statement (R25)
- **Delivered Capability:** Full absorption manufacturing cost bridge ($BDT\ 181.63/\text{kg}$ baseline), segregation of outbound shipping freight from unit manufacturing cost, zero-output unabsorbed period variance calculation ($BDT\ 71,833.33$), channel margin mix modeling, and deterministic break-even analytics.
- **Explicitly Deferred / Pending:** Dynamic activity-based costing (ABC) overhead cost-driver controls, multi-year DCF / IRR / NPV capital investment appraisals, and enterprise general ledger integration. These features are deferred to future enterprise ERP finance integration.

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R25 (Deferred Scope Statement & Variance Verification):** Documented deferred investment appraisal and activity-based cost driver controls in handoff. Verified absorption cost bridge and zero-output unabsorbed period variance calculations ($BDT\ 71,833.33$).
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Added `Demo 12` identity badge in HMI header and aligned with Dept 7 Business Operations.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `ef30b21` (pushed commit on `subproject/12-costing-and-finance`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Full absorption costing bridge: Fresh Leaf + Packaging + Direct Overheads + Straight-line Depreciation.
  - Segregation of outbound freight: freight deducted from net income without distorting factory unit manufacturing cost.
  - Zero-output dormancy handling: returns `null` unit cost with `"N/A (Zero Output)"` and recognizes fixed costs as unabsorbed period variance loss.
  - Interactive browser HMI with financial cards, volume/yield sliders, channel split controls, and CSV/JSON export.
  - 4 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Standard cost coefficients and monthly operational presets.
- **Missing / Deferred to Codex:**
  - Dynamic multi-year DCF investment appraisal models and enterprise SAP/Oracle financial ledger integration.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/costing-and-margin/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/costing-and-margin/tests/costing.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/costing-and-margin/js/costing-engine.js`
- **Class:** `CostingEngine`
- **State Fields:**
  ```typescript
  interface CostingEngineState {
    volumeKg: number;
    leafPricePerKg: number;
    netYieldPct: number;
    bulkSharePct: number;
    retailSharePct: number;
    costing: CostingResult;
  }
  ```
- **Replacement Hook:** Replace `computeCosting` in `projects/costing-and-margin/js/costing-engine.js` with your validated enterprise cost accounting system.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 15**: `subproject/13-maintenance` (`projects/maintenance-management/`).
