# Test Report — Packing & Reject Interlock (Project 07 / Order 5)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/07-packing-and-dispatch`
- **Lead Department:** Dept 1 Production Engineering
- **Test Command:** `node --test projects/packing-and-reject/tests/packing.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Nominal Dosing Across Formats | 50g bottle (50.2g), 100g bottle (100.1g), 25kg bulk bag (25,010g) | All packs pass checkweigher; dispatched to respective channels | Status `PASSED`; 50g/100g into `RETAIL`, 25kg into `AUCTION` | PASS |
| Single Dispatch Rule | Attempting to dispatch valid pack | Pack enters manifest exactly once; total dispatched mass increments | Count = 1; mass updated; subsequent attempt returns `ALREADY_DISPATCHED` | PASS |
| Underfill Reject Interlock | Injected 42.0g on 50g bottle (min 48.5g) | Status `REJECTED_UNDERFILL`; reject pusher active; dispatch blocked | Reject pusher active; dispatch returned failure `CANNOT_DISPATCH_REJECTED` | PASS |
| Defect Quarantine & Traceability | Inspection of reject bin ledger | Underfilled container kept outside dispatch; source lot `F-G01` and mass preserved | Dispatched count = 0; Reject count = 1; source lot `F-G01` recorded | PASS |
| Mass Ledger Balance | Mixed run: 2 valid packs (50g, 51g) + 1 rejected (40g) | Total dosed (141g) = Dispatched (101g) + Quarantined (40g) | Total dosed = 141.0g; Dispatched = 101.0g; Rejected = 40.0g | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/packing-and-reject/index.html` loads directly without error.
- **Header Controls:** "View Project Source" links directly to `subproject/07-packing-and-dispatch/projects/packing-and-reject/`; "View Test Evidence" links to test report; "Reset Demo" restores baseline.
- **Dosing Flow:** Coarse dose fills to ~85%; fine dose trims to target net weight with live load-cell readout.
- **Underfill Injection:** "Inject Underfill" button triggers immediate checkweigher rejection and animated pusher pulse.
- **Dual Manifests:** Dispatched table and Reject table dynamically update and retain individual lot lineages.
- **Exports:** CSV and JSON download buttons export complete ledger records.
- **Screen & Keyboard:** Fully responsive down to 360px viewport; all controls accessible via keyboard.
- **Console Errors:** 0 unhandled exceptions.
