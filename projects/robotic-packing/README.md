# Robotic Packing Cell & Interrupted Recovery (Project 15 / Order 6)

## Overview
Interactive robotics, discrete PLC handshake, and emergency recovery model for the automated bottle casing cell.

- **Lead Departments:** Dept 1 Production Engineering & Dept 3 Controls and Electrical
- **Target Roles:** Robotics Automation, PLC Systems, Motion Control
- **Demo Route:** `demos/robotic-packing/index.html`
- **Direct GitHub Branch:** `subproject/15-robotic-packing`

## Key Capabilities
- Discrete PLC ↔ Robot Controller handshake simulation (`DI_ROBOT_READY`, `DO_CONVEYOR_RUN`, `DI_BOTTLE_AT_PICK`, `DO_TRIGGER_PICK`, `DI_GRIPPER_CLOSED`, `DO_PLACE_CARTON`, `DI_PLACE_COMPLETE`).
- Format changeover: 50 g retail bottles (12 bottles per case, 4x3 matrix) and 100 g retail bottles (6 bottles per case, 3x2 matrix).
- Vacuum loss fault injection: Arm freezes mid-trajectory in `INTERRUPTED_HOLD` without advancing the carton pocket index.
- Guided recovery: Purge & Home routine clears defective part to rework bin, re-calibrates arm to zero, and resumes packing with 100% case count accuracy.
- High-contrast visual HMI with dynamic matrix grid, live discrete register pins, event ledger, and CSV/JSON data export.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/robotic-packing/
```

## Running Tests
```bash
node --test projects/robotic-packing/tests/robotic-packing.test.js
```
