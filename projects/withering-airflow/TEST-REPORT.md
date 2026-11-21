# Test Report — Withering Airflow & Moisture Dynamics (Project 04)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-21
- **Command:** `node --test projects/withering-airflow/tests/withering.test.js`
- **Runner:** Node.js native test runner (`node:test`)
- **Total Test Cases:** 4
- **Passed:** 4
- **Failed:** 0
- **Duration:** ~190 ms
- **Status:** PASS

---

## 2. Test Case Breakdown

### 1. Fan speed comparison on identical batch
- **Objective:** Verify higher airflow increases drying rate while energy follows cubic power law.
- **Result:** PASS (85% fan yields lower moisture at 6h than 40% fan; energy scales non-linearly).

### 2. Ambient humidity scenario sensitivity
- **Objective:** Verify high relative humidity (monsoon) slows moisture evaporation.
- **Result:** PASS (Spring nominal reaches lower moisture at 8h than Monsoon humid).

### 3. Sensor fault injection and invalid reading detection
- **Objective:** Verify open-circuit sensor probe fault triggers invalid flag and -99.9% reading.
- **Result:** PASS (Fault flag set, invalid reading detected, restored upon clearance).

### 4. Regression R08: Initially satisfied moisture target is recognized without upward jump
- **Objective:** Verify setting initial moisture (50%) below target (65%) immediately sets `targetReached = true`, prevents rehydration jump, and consumes zero fan energy.
- **Result:** PASS (Initial moisture stays 50.0%, targetReached is true, cumulativeFanKwh is 0.0).

---

## 3. Browser & Mobile Viewport Verification
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1416px (0px document overflow).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (0px document overflow).
