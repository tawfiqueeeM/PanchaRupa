# Test Report — Production Scheduling & Machine Calendar (Dept 2)

## Test Execution Summary
- **Date:** 2026-11-21
- **Test Suite:** `projects/production-scheduling/tests/scheduling.test.js`
- **Execution Command:** `node --test projects/production-scheduling/tests/scheduling.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (7/7 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Nominal DAY-40 Schedule Feasibility
- **Objective:** Verify that baseline DAY-40 orders (30 kg Green Tea + 10 kg Golden Tea) schedule within standard 9-hour operational shift (08:00 to 17:00 / 540 min).
- **Verification:**
  - `isFeasible` evaluates to `true`.
  - Zero infeasibility exceptions reported.
  - Final makespan completes at 15:45 (465 min), well within 540 min threshold.
- **Result:** PASS

### 2. Mutual Exclusion on Shared Roller & Shared Dryer
- **Objective:** Verify that conflicting reservations on shared assets do not overlap in time.
- **Verification:**
  - Tasks on `SHARED_ROLLER` satisfy non-overlapping time boundaries.
  - Tasks on `SHARED_DRYER` satisfy non-overlapping time boundaries.
- **Result:** PASS

### 3. Unplanned Dryer Outage Rescheduling & Before vs After Diff
- **Objective:** Verify that injecting a 120-minute outage on `SHARED_DRYER` (11:30 - 13:30) correctly pushes tasks past outage interval and computes accurate Before vs After delay metrics.
- **Verification:**
  - No dryer task starts or finishes inside `[210, 330]` min window.
  - Before vs After comparison shows positive makespan delay.
- **Result:** PASS

### 4. Excess Demand Infeasibility Trigger
- **Objective:** Verify that overload volumes (70 kg Green + 35 kg Golden) exceeding shift limits visibly trigger infeasibility with specific reasons.
- **Verification:**
  - `isFeasible` evaluates to `false`.
  - Makespan exceeds 540 min.
  - Infeasibility record details specific shift cutoff breach reason.
- **Result:** PASS

### 5. Regression R12: Exact Quantity Rescaling Toggle
- **Objective:** Verify that quantity adjustment calculations reference immutable base durations and quantities without cumulative rounding drift.
- **Verification:**
  - Toggled batch quantity from 10 kg -> 5 kg -> 10 kg.
  - Verified that restored makespan (465 min) and every individual step duration match the baseline exactly.
- **Result:** PASS

### 6. Regression R13: Machine Changeover Cleanup Reservation
- **Objective:** Verify that changeover cleanup intervals between incompatible tea varieties are explicitly reserved on the machine calendar as non-overlapping slots.
- **Verification:**
  - Asserted presence of `CLEANUP` slot (15 min) on `SHARED_ROLLER` calendar between Green Tea and Golden Tea.
  - Verified that subsequent tasks cannot schedule or start during cleanup intervals.
- **Result:** PASS

### 7. Regression R14: Individual Target Due Time Feasibility Check
- **Objective:** Verify that orders with target due times earlier than shift cutoff (e.g. 10:00) are evaluated against their own due time, not merely the 17:00 cutoff.
- **Verification:**
  - Injected order finishing at 10:30 (150 min) with target time 10:00 (120 min).
  - Verified `isLate: true`, `delayMin: 30`, and schedule flagged infeasible despite completing well before 17:00.
- **Result:** PASS

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/production-scheduling/` loads cleanly without error.
- **Header Badge & Identity (R24):** Header badge correctly reflects `Demo 09`, Dept 2 Operations.
- **Responsive Viewport Verification (R22):** Verified via Edge CDP: Desktop (1440px) `scrollWidth: 1401px`, Mobile (390px) `scrollWidth: 390px` with zero horizontal overflow.
- **Console Errors:** 0 unhandled exceptions.
