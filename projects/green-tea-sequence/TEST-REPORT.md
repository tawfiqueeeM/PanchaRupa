# Test Report — Green Tea Processing Sequence (Project 02)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/02-green-tea-processing`
- **Lead Department:** Dept 1 Production Engineering
- **Test Command:** `node --test projects/green-tea-sequence/tests/green-tea.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Nominal Line Progression | Batch `B-G01` (120 kg fresh) stepped through line | Drum (35m) -> Roller (30m) -> Dryer (60m) -> Output: 30.0 kg | Sequence completed in order; output incremented only at end | PASS |
| Premature Output Prevention | Batch during Drum or Roller stages | Total released factory output must remain 0.0 kg | `totalFinishedKg` remained 0.0 kg until final dryer completion | PASS |
| Roller Contention Interlock | Roller flagged unavailable (`%I1.0 = FALSE`) when Drum completes | Batch retained in drum hopper; state `WAITING_FOR_ROLLER`; reason displayed | State: `WAITING_FOR_ROLLER`, ID `B-G01` retained, reason logged | PASS |
| Roller Recovery & Handoff | Roller resource released (`%I1.0 = TRUE`) | Batch advances to Roller; waiting reason cleared; mass preserved | Advanced to `ROLLER`, reason cleared, no mass duplication | PASS |
| Dryer Contention Interlock | Dryer flagged unavailable (`%I2.0 = FALSE`) when Roller completes | Batch retained in roller tray; state `WAITING_FOR_DRYER`; reason displayed | State: `WAITING_FOR_DRYER`, ID `B-G01` retained, reason logged | PASS |
| Recipe Parameter Switching | Select `GT-DEL-02` (Spring Delicate Flush) | Drum 210°C, Dryer 90°C, Yield factor 0.26 (31.2 kg expected) | Parameters updated to 210°C, 90°C, 31.2 kg expected output | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/green-tea-sequence/index.html` loads directly without error.
- **Header Navigation:** "View Project Source" links directly to `subproject/02-green-tea-processing/projects/green-tea-sequence/`; "View Test Evidence" links to test report; "Reset Demo" restores nominal state.
- **Contention Simulation:** Interactive lock toggles for Roller (%I1.0) and Dryer (%I2.0) immediately trigger visual node pulse and waiting callout.
- **Export Functionality:** CSV and JSON download buttons generate dynamic exports from active batch ledger.
- **Keyboard & Screen Responsiveness:** Fully operable across 360px mobile viewports; focus rings on all interactive elements.
- **Console Errors:** 0 unhandled exceptions.
