# Test Report — Leaf Intake & Buffer Interlock (Project 01)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/01-leaf-intake`
- **Lead Department:** Dept 1 Production Engineering
- **Test Command:** `node --test projects/leaf-intake/tests/leaf-intake.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Nominal Scale Computation | Gross: 125.0 kg, Tare: 5.0 kg | Net: 120.00 kg, Valid lot accepted, assigned to `DRUM_INFEED_HOPPER` | Net: 120.00 kg, `disposition: ACCEPTED`, status `READY` | PASS |
| Scale Weight Validation | Gross: 10.0 kg, Tare: 15.0 kg (Gross <= Tare) | Acceptance rejected, validation error returned | `isValid: false`, error flagged: "Gross weight must be strictly greater than Tare weight." | PASS |
| Buffer Sensor Interlock Trip | Transfer running (`%Q0.0 = TRUE`), Destination sensor trips (`%I0.3 = FALSE`) | Transfer command `%Q0.0` immediately drops to FALSE; lot remains assigned; no mass issued | `%Q0.0` dropped to FALSE, `interlockTripped: true`, lot retained in hopper, history empty | PASS |
| Buffer Recovery & Mass Conservation | Destination sensor restored (`%I0.3 = TRUE`), transfer restarted | Eligibility restored, transfer completes, single 120.0 kg batch recorded without duplicate mass | `interlockTripped: false`, completed at 100%, exactly 1 dispatched record (120.0 kg) | PASS |
| Quality Rejection Gate | Gross: 60.0 kg, Tare: 5.0 kg, Reason: `HIGH_MOISTURE` | Marked `REJECTED`, diverted to quarantine, transfer inhibited | Status `QUARANTINED`, reason recorded, transfer attempt returned failure | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/leaf-intake/index.html` loads directly without dependency on other routes.
- **Header Controls:** "View Project Source" links directly to `subproject/01-leaf-intake/projects/leaf-intake/`; "View Test Evidence" links to test report; "Reset Demo" restores baseline.
- **Scenario Presets:** Seamless switching between Nominal Day-40 (V-01), Day-40 Golden (V-02), Buffer Blocked Fault, and Quality Rejection.
- **Export Functionality:** `leaf-intake-events-*.csv` exports active ledger; `leaf-intake-state-*.json` exports complete machine snapshot.
- **Responsiveness & Keyboard Accessibility:** Verified clean stacking on 360px viewport; all buttons focusable and triggerable via Enter/Space.
- **Console Errors:** 0 unhandled exceptions.
