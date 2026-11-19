# Test Report — Production Scheduling & Machine Calendar (Dept 2)

## Test Execution Summary
- **Test Suite:** `projects/production-scheduling/tests/scheduling.test.js`
- **Execution Command:** `node --test projects/production-scheduling/tests/scheduling.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (4/4 tests passed, 0 failures, 0 regressions)

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
