# Test Report — Golden Tea Sequence (Project 05)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-21
- **Command:** `node --test projects/golden-tea-sequence/tests/golden-tea.test.js`
- **Runner:** Node.js native test runner (`node:test`)
- **Total Test Cases:** 4
- **Passed:** 4
- **Failed:** 0
- **Duration:** ~170 ms
- **Status:** PASS

---

## 2. Test Case Breakdown

### 1. Leaf eligibility gate prevents ineligible leaf processing
- **Objective:** Verify tender shoot leaf qualification prevents starting coarse lots.
- **Result:** PASS (Ineligible leaf rejected at start gate; eligible leaf allowed).

### 2. Nominal 4-stage progression: Withering -> Rolling -> Oxidation -> Drying
- **Objective:** Verify 4-stage sequence and output conservation.
- **Result:** PASS (40 kg leaf yields 10.0 kg finished golden tea; dryer released upon completion).

### 3. Shared dryer mutual exclusion blocks second batch and avoids concurrent ownership
- **Objective:** Verify mutual exclusion on shared dryer when green tea occupies it.
- **Result:** PASS (Enters WAITING_FOR_DRYER, retains batch ID B-O01, transitions once dryer is free).

### 4. Regression: Dryer ownership cannot be stolen during active drying, completed batch restart guarded
- **Objective:** Verify active golden batch cannot have dryer stolen by external lock, and completed batch cannot restart without new ID.
- **Result:** PASS (Preemption rejected, restart guarded).

---

## 3. Browser & Mobile Viewport Verification
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1416px (0px document overflow).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (0px document overflow).
