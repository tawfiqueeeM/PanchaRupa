# Tea Dryer Controls & Safety Interlocks (Project 02 / Order 8)

## Overview
Interactive process control, thermal regulation, and safety interlock simulation for the tea factory final drying chamber.

- **Lead Department:** Dept 3 Controls & Electrical
- **Target Roles:** PLC Systems, Process Control, Electrical Commissioning
- **Demo Route:** `demos/dryer-control/index.html`
- **Direct GitHub Branch:** `subproject/03-dryer-controls`

## Key Capabilities
- Process temperature regulation: adjustable setpoint (70–120°C, nominal 95°C) with real-time modulated heat duty cycle output.
- Hard safety interlock: circulating fan differential pressure switch (`DI_FAN_PROOF`, `%I3.0`) forces heat command to 0.0% immediately upon lost airflow to prevent element blowout or chamber fire.
- Strict 3-phase reset protocol:
  1. Acknowledge (%I3.1) silences alarm siren, but CANNOT re-energize heat command.
  2. Fan physical proof must be re-established.
  3. Operator must deliberately press the Restart pushbutton (%I3.2) to re-arm burner.
- Real-time thermal telemetry cockpit with dynamic heat meter, time-series trend log, and CSV/JSON data export.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/dryer-control/
```

## Running Tests
```bash
node --test projects/dryer-control/tests/dryer.test.js
```
