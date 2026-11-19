# Test Report — Golden Tea Processing Sequence (Project 05 / Order 4)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/05-golden-tea-processing`
- **Lead Department:** Dept 1 Production Engineering
- **Test Command:** `node --test projects/golden-tea-sequence/tests/golden-tea.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Leaf Eligibility Quality Gate | Attempt to start batch with `isLeafEligible: false` | Start command inhibited; returns `LEAF_INELIGIBLE`; stage remains `IDLE` | Start inhibited; error returned; stage stayed `IDLE` | PASS |
| Nominal 4-Stage Progression | Eligible batch `B-O01` (40 kg fresh leaf) | Withering (120m) -> Roller (30m) -> Oxidation (90m) -> Dryer (60m) -> Output: 10.0 kg | All 4 stages executed in sequence; final output: 10.0 kg | PASS |
| Output Timing Verification | Batch in Withering, Roller, or Oxidation stages | Factory released golden tea output must remain 0.00 kg | `totalFinishedGoldenKg` stayed 0.00 kg until final dryer completion | PASS |
| Shared Dryer Mutual Exclusion | Dryer locked by Green batch `B-G01` when Oxidation completes | Batch `B-O01` held in `WAITING_FOR_DRYER`; both batches never own dryer concurrently | State: `WAITING_FOR_DRYER`; owner remained `B-G01`; no dual ownership | PASS |
| Dryer Release & Recovery | Shared dryer freed (`setDryerExternalLock(false)`) | Golden batch advances into Dryer; dryer owner becomes `B-O01` | Advanced to `DRYER`; owner switched to `B-O01`; drying completed | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/golden-tea-sequence/index.html` loads directly without error.
- **Header Controls:** "View Project Source" links directly to `subproject/05-golden-tea-processing/projects/golden-tea-sequence/`; "View Test Evidence" links to test report; "Reset Demo" restores nominal state.
- **Eligibility Toggle:** Toggling leaf eligibility dynamically activates/deactivates error banner and updates permissive status badge.
- **Dryer Contention Panel:** Interactively locks dryer with Green B-G01, triggering immediate visual contention hold and reason alert.
- **Exports:** CSV and JSON download buttons export completed batches and state snapshots.
- **Responsiveness & Keyboard:** Clean layout on 360px screen; all buttons and selectors accessible via keyboard.
- **Console Errors:** 0 unhandled exceptions.
