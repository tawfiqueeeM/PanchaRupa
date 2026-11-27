# Test Report — Costing, Overhead Allocation & Margin Analysis (Dept 7)

## Test Execution Summary
- **Date:** 2026-11-21
- **Test Suite:** `projects/costing-and-margin/tests/costing.test.js`
- **Execution Command:** `node --test projects/costing-and-margin/tests/costing.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (4/4 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Nominal 1,000 kg Design Month Absorption Cost Bridge
- **Objective:** Verify acceptance scenario: 1,000 kg monthly output produces exactly BDT 181.63 per released kg unit manufacturing cost.
- **Verification:**
  - Fresh leaf cost: 4,000 kg @ BDT 25 = BDT 100,000.
  - Packaging cost: 900 kg bulk @ BDT 2 + 100 kg retail @ BDT 80 = BDT 9,800.
  - Fixed recurring cash overhead: BDT 61,000.
  - Straight-line depreciation: BDT 10,833.33.
  - Total manufacturing cost = BDT 181,633.33.
  - Unit manufacturing cost = BDT 181.63 / kg.
- **Result:** PASS

### 2. Outbound Freight Segregation
- **Objective:** Verify that outbound logistics freight (BDT 9,000) is segregated from factory unit manufacturing cost and correctly deducted from operating income.
- **Verification:**
  - Unit manufacturing cost remains strictly BDT 181.63 / kg (excluding freight).
  - Net operating income: Revenue (BDT 261,000) − Mfg Cost (BDT 181,633.33) − Freight (BDT 9,000) = BDT 70,366.67.
- **Result:** PASS

### 3. Zero-Output Dormancy & Period Variance Handling (R25)
- **Objective:** Verify that when factory production volume drops to 0 kg (e.g. winter dormancy), the engine prevents division by zero, sets unit cost to `null`, and charges fixed overhead (BDT 71,833.33) as unabsorbed period variance loss.
- **Verification:**
  - `isZeroOutput` evaluates to `true`.
  - `unitManufacturingCostBdt` evaluates to `null` with formatted readout `"N/A (Zero Output)"`.
  - `unabsorbedPeriodVarianceBdt` equals exactly BDT 71,833.33.
  - `netIncomeBdt` reflects negative period variance loss (-BDT 71,833.33).
- **Result:** PASS

### 4. Break-Even Volume Modeling
- **Objective:** Verify valid break-even volume calculation based on unit contribution margins and fixed costs.
- **Verification:**
  - Calculated break-even volume is positive and strictly below 1,000 kg installed capacity.
- **Result:** PASS

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/costing-and-margin/index.html` loads cleanly without errors.
- **Header Badge & Identity (R24):** Header badge reflects `Demo 12`, Dept 7 Business Operations.
- **Responsive Viewport Verification (R22):** Verified via Edge CDP: Desktop (1440px) `scrollWidth: 1416px`, Mobile (390px) `scrollWidth: 390px` with zero horizontal overflow.
- **Console Errors:** 0 unhandled exceptions.
