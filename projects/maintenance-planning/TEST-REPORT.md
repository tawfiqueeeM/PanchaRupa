# Test Report — Maintenance Planning & Outage Impact (Depts 7 & 2)

## Test Execution Summary
- **Test Suite:** `projects/maintenance-planning/tests/maintenance.test.js`
- **Execution Command:** `node --test projects/maintenance-planning/tests/maintenance.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (4/4 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Planned PM Zero-Impact Execution
- **Objective:** Verify that pre-shift planned maintenance window results in zero dispatch delay and zero queued batches.
- **Verification:**
  - Planned downtime = 120 min.
  - Unplanned downtime = 0 min.
  - Dispatch delay = 0 min.
  - Queued batches = 0.
- **Result:** PASS

### 2. Unplanned Breakdown Schedule Impact
- **Objective:** Verify that mid-shift breakdown trips asset into `TRIPPED_OUTAGE`, triggers dispatch delay, and identifies queued WIP batches.
- **Verification:**
  - `AST-DRY-01` status updates to `TRIPPED_OUTAGE`.
  - Unplanned downtime = 120 min.
  - Dispatch delay = 120 min.
  - Queued batches identifies both `B-G01` and `B-GL01`.
- **Result:** PASS

### 3. Dynamic Work Order Creation & Linkage
- **Objective:** Verify that creating a work order links to asset and propagates schedule impacts.
- **Verification:**
  - Work order creation succeeds with linked asset.
  - Corrective WO updates asset status and calculates dispatch delay.
- **Result:** PASS

### 4. Work Order Completion & Overhaul Reset
- **Objective:** Verify that completing work order restores asset to `OPERATIONAL` and resets cumulative runtime hours.
- **Verification:**
  - Work order marked `COMPLETED`.
  - Target asset status restored to `OPERATIONAL`.
  - Runtime hours reset to 0.0.
- **Result:** PASS
