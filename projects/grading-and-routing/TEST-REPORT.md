# Test Report — Quality Grading & Routing Interlock (Project 06 / Order 7)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/06-grading-and-routing`
- **Lead Department:** Dept 4 Quality & Traceability
- **Test Command:** `node --test projects/grading-and-routing/tests/grading.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Route Only Released Material | Attempt routing while lot disposition is `PENDING` or `ON_HOLD` | Routing inhibited with reason `LOT_NOT_RELEASED`; diverter remains locked | Routing failed; state remained `HOLD_LOCKED`; reason logged | PASS |
| Quality Release Permissive | Quality Lead signs off with disposition `RELEASED` | Routing permissive enabled; transfer executes into selected bin | Status `ROUTED`; 30.0 kg transferred to Bin 1 | PASS |
| Full Bin Interlock Trip | Destination Bin 1 occupied to capacity (50 kg) | Conveyor drops (`%Q6.0 = FALSE`); fault latches; unrouted mass retained in hopper | Interlock tripped; `faultLATCH: true`; unrouted mass retained at 30.0 kg | PASS |
| Source Lot ID Preservation | Material held in surge hopper during full bin trip | Finished Lot ID `F-G01` and batch ID `B-G01` strictly preserved | Lot ID remained `F-G01`; unrouted mass preserved without loss | PASS |
| Acknowledge & Reroute | Operator acknowledges fault and selects alternate Bin 2 (50 kg) | Permissive restored; material routed into Bin 2; occupancy updated | Acknowledged; Bin 2 received 30.0 kg; state became `ROUTED` | PASS |
| Genealogy Quantity Conservation | Upstream-to-downstream audit | Delivered mass (30.0 kg) exactly equals routed mass in destination bin | Input mass = Routed mass = 30.0 kg; vendor and batch keys linked | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/grading-and-routing/index.html` loads directly without error.
- **Header Controls:** "View Project Source" links directly to `subproject/06-grading-and-routing/projects/grading-and-routing/`; "View Test Evidence" links to test report; "Reset Demo" restores baseline.
- **Traceability Breadcrumbs:** End-to-end genealogy chain (Delivery → Processing → Finished Lot → Storage Bin) displayed with real-time keys.
- **Bin Cards:** Dynamic fill bars update in real time; "Fill/Empty" buttons enable immediate testing of full-bin interlocks.
- **Fault Management:** Red alarm banner displays specific trip reasons and clear instructions for operator acknowledgement.
- **Exports:** CSV and JSON download buttons export complete lot genealogy records.
- **Screen & Keyboard:** Clean layout on narrow 360px viewport; all controls accessible via keyboard.
- **Console Errors:** 0 unhandled exceptions.
