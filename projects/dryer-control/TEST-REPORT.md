# Test Report — Tea Dryer Control & Fan Interlock (Project 02 / Order 8)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/03-dryer-controls`
- **Lead Department:** Dept 3 Controls and Electrical
- **Test Command:** `node --test projects/dryer-control/tests/dryer.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Nominal Thermal Ramp | 95°C SP, continuous healthy fan proof | Measured temp rises steadily toward 95°C; heat command modulates | Temp increased from 25°C to setpoint; heat modulated | PASS |
| Immediate Cutoff on Lost Proof | `DI_FAN_PROOF` drops FALSE during active heating | Heat command `%QW60` forced to 0.0% immediately; alarm latches | Heat command dropped to 0.0%; `alarmLatched: true` | PASS |
| Acknowledge Isolation Gate | Operator presses Acknowledge (%I3.1) | Horn silenced, but heat command remains locked at 0.0%; cannot heat | Heat command stayed 0.0%; `alarmAcked: true`, `heatEnabled: false` | PASS |
| Premature Restart Inhibit | Attempting Restart while fan proof remains FALSE | Restart rejected; heating remains locked at 0.0% | Restart failed; reason logged; heat remained 0.0% | PASS |
| Full 3-Phase Reset Verification | Fan proof restored (%I3.0=TRUE) + Deliberate Restart pushed (%I3.2) | Burner safety loop re-arms; heat command resumes modulation | Alarm unlatched; heat command resumed; temp ramped to setpoint | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/dryer-control/index.html` loads directly without error.
- **Header Controls:** "View Project Source" links directly to `subproject/03-dryer-controls/projects/dryer-control/`; "View Test Evidence" links to test report; "Reset Demo" restores baseline.
- **Dynamic Cockpit:** Hero temperature readouts and gradient heat command fill bar animate smoothly with thermal response.
- **Fault Simulation:** "Trip Fan Proof" immediately turns temperature readout red, drops heat meter to 0%, and displays the safety interlock warning box.
- **Safety Protocol Buttons:** Clear step 1 (Acknowledge) and step 2 (Deliberate Restart) buttons allow testing the strict reset rules.
- **Exports:** CSV and JSON download buttons export recorded time-series trend points.
- **Screen & Keyboard:** Clean layout on narrow 360px viewport; all controls accessible via keyboard.
- **Console Errors:** 0 unhandled exceptions.
