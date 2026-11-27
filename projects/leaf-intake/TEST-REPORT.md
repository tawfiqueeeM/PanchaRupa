# Test Report — Leaf Intake & Buffer Interlock (Project 01)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-21
- **Command:** `node --test projects/leaf-intake/tests/leaf-intake.test.js`
- **Runner:** Node.js native test runner (`node:test`)
- **Total Test Cases:** 6
- **Passed:** 6
- **Failed:** 0
- **Duration:** ~160 ms
- **Status:** PASS

---

## 2. Test Case Breakdown

### 1. LeafIntakeEngine - Nominal scale computation and lot acceptance
- **Objective:** Verify gross minus tare computation and acceptance state transition.
- **Result:** PASS (Net = 120.0 kg, Disposition = ACCEPTED, Destination = DRUM_INFEED_HOPPER).

### 2. LeafIntakeEngine - Validation error on gross <= tare or negative tare
- **Objective:** Verify boundary failure when gross <= tare.
- **Result:** PASS (Errors raised, net = 0).

### 3. LeafIntakeEngine - Downstream buffer interlock drop and recovery
- **Objective:** Simulate downstream hopper full (%I0.3 = FALSE) during transfer.
- **Result:** PASS (Motor contactor dropped immediately, batch retained in hopper, restored on clear).

### 4. LeafIntakeEngine - Quality rejection diverted to quarantine
- **Objective:** Verify leaf failing quality check is quarantined.
- **Result:** PASS (Transfer blocked, reason logged, diverted to quarantine).

### 5. LeafIntakeEngine - Regression R04: Completed transfer is idempotent
- **Objective:** Verify accepting 120 kg lot L-001 and performing 4 jogs (100% completion) followed by 5 additional jogs does NOT duplicate dispatches.
- **Result:** PASS (Extra jogs return `LOT_ALREADY_COMPLETED`, dispatched history length strictly 1, total delivered strictly 120 kg).

### 6. LeafIntakeEngine - Regression R05: Weight mutation after acceptance invalidates approval and negative tare is blocked
- **Objective:** Verify modifying tare weight to -100 kg after acceptance revokes approval back to PENDING, and subsequent transfer is rejected with zero material dispatched.
- **Result:** PASS (Disposition revoked to PENDING, transfer blocked, zero records in history).

---

## 3. Browser & HMI Verification
- **Desktop (1440x1000):** Initial layout verified (scrollWidth: 1401px <= innerWidth: 1416px).
- **Mobile (390x844):** Verified viewport responsiveness (scrollWidth: 390px === innerWidth: 390px, 0px horizontal overflow).
- **Browser Action Replay:**
  - 5-jog click sequence: Completed transfer correctly disabled jog button (`disabled: true`), history table contains exactly 1 row (`120.00 kg`).
  - Negative tare sequence (`tare = -100`): Displayed validation banner, disabled jog button, prevented dispatch.
