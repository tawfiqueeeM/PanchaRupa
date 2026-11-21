# Test Report — Leaf Procurement & Material Requirements Planning (Dept 7)

## Test Execution Summary
- **Date:** 2026-11-21
- **Test Suite:** `projects/leaf-procurement/tests/procurement.test.js`
- **Execution Command:** `node --test projects/leaf-procurement/tests/procurement.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (5/5 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Nominal DAY-40 MRP Conversion
- **Objective:** Verify acceptance scenario: 20 kg net requirement at 25% yield produces exactly 80 kg fresh leaf.
- **Verification:**
  - Net demand evaluated as $\max(0, 30.0 - 10.0) = 20.0\text{ kg}$.
  - Fresh leaf calculated as $\frac{20.0}{0.25} = 80.0\text{ kg}$.
  - Overall status evaluates to `FEASIBLE` with 0 shortages.
- **Result:** PASS

### 2. Inventory Buffer Offset
- **Objective:** Verify that increasing released stock buffer reduces net purchasing requirement.
- **Verification:**
  - Setting released stock to 30.0 kg for Green Tea offsets gross demand completely (net demand = 0.0 kg, fresh leaf required = 0.0 kg).
- **Result:** PASS

### 3. Logistics Arrival Slot Shortage Detection
- **Objective:** Verify that supplier arrival occurring after factory production slot triggers shortage exception.
- **Verification:**
  - Scheduled at 08:00, arrival estimated at 14:00 (6-hour delay).
  - Shortage record generated with reason noting production line starvation.
  - Overall feasibility evaluates to `false`.
- **Result:** PASS

### 4. Winter Harvest Dormancy Constraint
- **Objective:** Verify that winter season (January) enforces 0 kg fresh leaf intake and flags deficit if inventory buffer is insufficient.
- **Verification:**
  - `isWinterDormancy` evaluates to `true`.
  - Fresh leaf intake forced to $0.0\text{ kg}$.
  - Inadequate inventory buffer triggers `WINTER_BUFFER_DEFICIT` alert.
- **Result:** PASS

### 5. Regression R17: Zero Net Demand Non-Starvation Gating
- **Objective:** Verify that when existing released stock completely covers demand, late arrival times do not trigger false line starvation shortages.
- **Verification:**
  - Released stock set to 10 kg against 10 kg demand (net demand = 0 kg, fresh leaf needed = 0 kg).
  - Arrival hour set to 14:00 (late).
  - Asserted `isShortage: false` and shortages array contains no false exceptions.
- **Result:** PASS

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/leaf-procurement/index.html` loads cleanly without errors.
- **Runtime Bug Fix (R01):** Corrected `app.js:120` assignment to constant DOM reference `kpiNetDemandSub.textContent = ...`, preventing unhandled TypeErrors. Verified 0 console errors during initial render and scenario toggling.
- **Header Badge & Identity (R24):** Header badge correctly reflects `Demo 08`, Dept 7 Business Operations.
- **Responsive Viewport Verification (R22):** Verified via Edge CDP: Desktop (1440px) `scrollWidth: 1401px`, Mobile (390px) `scrollWidth: 390px` with zero horizontal overflow.
- **Console Errors:** 0 unhandled exceptions.
