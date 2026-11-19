# Test Report — Tea Auction Planning & Venue Optimization (Dept 7)

## Test Execution Summary
- **Test Suite:** `projects/tea-auction-planning/tests/auction.test.js`
- **Execution Command:** `node --test projects/tea-auction-planning/tests/auction.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (4/4 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Three-Centre Net Realization Comparison
- **Objective:** Verify accurate deduction of freight, broker commission, and warehouse fees across all three centres.
- **Verification:**
  - Panchagarh @ BDT 215 hammer bid yields BDT 210.31 net realization.
  - Chattogram @ BDT 255 hammer bid yields BDT 239.04 net realization.
  - Chattogram is correctly evaluated as recommended venue.
- **Result:** PASS

### 2. Freight Break-Even Premium Calculation
- **Objective:** Verify calculation of required hammer price for distant sale to match local Panchagarh net returns.
- **Verification:**
  - Chattogram break-even hammer price calculated as BDT 225.76.
  - Required premium over Panchagarh equals +BDT 10.76/kg.
- **Result:** PASS

### 3. Reserve Price Deficit Relist Gate
- **Objective:** Verify that bids falling slightly below reserve price (deficit $\le$ BDT 10/kg) trigger `RELIST` decision.
- **Verification:**
  - Evaluates deficit of BDT 8.56/kg against BDT 225 reserve.
  - Decision evaluates to `RELIST`.
  - Reason details re-entering next sale catalog.
- **Result:** PASS

### 4. Settlement Timeline Realization
- **Objective:** Verify distinct settlement cycles (7 days for Panchagarh, 14 days for Sreemangal, 21 days for Chattogram).
- **Verification:**
  - Verified settlement day mappings for each venue.
- **Result:** PASS
