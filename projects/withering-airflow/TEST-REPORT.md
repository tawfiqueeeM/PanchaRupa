# Test Report — Withering Airflow & Moisture Control (Project 03 / Order 3)

## Environment & Execution
- **Date:** 2026-11-19
- **Platform:** Windows (PowerShell / Node.js v20.18.0)
- **Git Branch:** `subproject/04-withering`
- **Lead Department:** Dept 1 Production Engineering
- **Test Command:** `node --test projects/withering-airflow/tests/withering.test.js`

## Test Execution Matrix

| Test Suite / Assertion | Scenario / Condition | Expected Result | Observed Result | Status |
|---|---|---|---|---|
| Airflow Rate Trajectory Comparison | Identical batch (40 kg, 78% moisture): Run A (40% fan) vs Run B (85% fan) | Run B reaches lower moisture at hour 6 than Run A; Run B consumes more fan kWh | Moisture at 6h: Run B < Run A; Energy: Run B > Run A | PASS |
| Ambient Humidity Sensitivity | Spring Nominal (65% RH) vs Monsoon Humid (88% RH) at 60% fan | Moisture reduction significantly slower in Monsoon due to suppressed vapor gradient | Hour 8 moisture: Spring (65.2%) < Monsoon (71.1%) | PASS |
| Sensor Fault Detection | Open-loop disconnect injected (%IW70 reading -99.9%) | Sensor marked invalid (`sensorValid: false`), alarm logged, auto cutoff inhibited | `sensorValid: false`, `sensorFault: true`, alarm banner displayed | PASS |
| Sensor Restoration | Sensor fault cleared | Sensor returns to valid state (`sensorValid: true`), live reading resumed | Reading restored to live moisture value, fault cleared | PASS |

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/withering-airflow/index.html` loads directly without dependency on other routes.
- **Header Controls:** "View Project Source" links directly to `subproject/04-withering/projects/withering-airflow/`; "View Test Evidence" links to test report; "Reset Demo" restores baseline.
- **Scenario Presets:** Spring Nominal, Monsoon Humid, Sensor Fault, and Compare Runs switch seamlessly.
- **Dynamic Gauges:** Real-time calculation of fan RPM, electric power (kW), and elapsed fan energy (kWh).
- **Export Functionality:** CSV and JSON download buttons export recorded trajectory points.
- **Screen & Keyboard:** Clean layout on narrow 360px viewport; all controls accessible via keyboard.
- **Console Errors:** 0 unhandled exceptions.
