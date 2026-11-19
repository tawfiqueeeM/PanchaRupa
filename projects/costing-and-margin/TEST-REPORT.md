# Test Report — Costing, Overhead Allocation & Margin Analysis (Dept 7)

## Test Execution Summary
- **Test Suite:** `projects/costing-and-margin/tests/costing.test.js`
- **Execution Command:** `node --test projects/costing-and-margin/tests/costing.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (4/4 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. 1,000 kg Design Month Acceptance Check
- **Objective:** Verify acceptance scenario: 1,000 kg design month matches exactly BDT 181.63 / released kg.
- **Verification:**
  - Fresh leaf cost = BDT 100,000.00.
  - Packaging cost = BDT 9,800.00.
  - Overhead cash = BDT 61,000.00.
  - Depreciation = BDT 10,833.33.
  - Total manufacturing cost = BDT 181,633.33.
  - Unit manufacturing cost equals BDT 181.63 / kg.
- **Result:** PASS

### 2. Outbound Freight Segregation
- **Objective:** Verify that BDT 9,000 outbound freight is excluded from manufacturing unit cost and tracked under selling expenses.
- **Verification:**
  - Unit manufacturing cost remains strictly BDT 181.63 (not BDT 190.63).
  - Net operating income correctly deducts freight.
- **Result:** PASS

### 3. Zero-Output Period Variance Handling
- **Objective:** Verify that 0 kg output produces no `NaN` or `Infinity` errors and recognizes fixed overhead as period variance.
- **Verification:**
  - `isZeroOutput` evaluates to `true`.
  - `unitManufacturingCostBdt` is `null` with formatted string `N/A (Zero Output)`.
  - Unabsorbed period variance equals BDT 71,833.33.
- **Result:** PASS

### 4. Break-Even Volume Analysis
- **Objective:** Verify positive and feasible break-even production volume against plant capacity.
- **Verification:**
  - Calculated break-even volume is 542 kg (below 1,000 kg design capacity).
- **Result:** PASS
