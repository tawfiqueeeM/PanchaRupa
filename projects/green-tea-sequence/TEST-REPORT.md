# Test Report — Green Tea Sequence (Project 02)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-21
- **Command:** `node --test projects/green-tea-sequence/tests/green-tea.test.js`
- **Runner:** Node.js native test runner (`node:test`)
- **Total Test Cases:** 5
- **Passed:** 5
- **Failed:** 0
- **Duration:** ~110 ms
- **Status:** PASS

---

## 2. Test Case Breakdown

### 1. Nominal progression: Drum -> Roller -> Dryer -> Output Increment
- **Objective:** Verify multi-station sequence and deferred stock increment until complete discharge.
- **Result:** PASS (120 kg green leaf @ 0.25 yield produces 30.0 kg finished made tea at COMPLETED state).

### 2. Roller contention retains batch ID and records waiting reason
- **Objective:** Verify machine contention hold when roller is busy with Golden Tea.
- **Result:** PASS (Enters WAITING_FOR_ROLLER, preserves batch ID B-G01, waiting reason recorded, zero output increment).

### 3. Dryer contention retains batch ID and records waiting reason
- **Objective:** Verify machine contention hold when shared dryer is busy with Golden Tea.
- **Result:** PASS (Enters WAITING_FOR_DRYER, preserves batch ID, resumes on dryer unlock).

### 4. Recipe selection modifies duration, temps and expected yield
- **Objective:** Verify parameter updates across drum temp, dryer temp, and expected output.
- **Result:** PASS (Spring Delicate Flush updates drum to 210°C, dryer to 90°C, expected output to 31.2 kg).

### 5. Regression: Completed batch cannot be restarted with duplicate ID
- **Objective:** Verify that `startBatch()` prohibits restarting completed batch B-G01 without a distinct ID or reset.
- **Result:** PASS (Duplicate start rejected, total finished mass strictly conserved).

---

## 3. Browser & Mobile Viewport Verification
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1416px (zero overflow).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (zero document-level overflow, pipeline flow scrolls within its card).
