# Leaf Intake & Buffer Interlock (Project 01)

## Overview
Standalone interactive industrial automation demo and PLC interlock model for the PanchaRupa virtual tea factory leaf intake station.

- **Lead Department:** Dept 1 Production Engineering
- **Target Roles:** Industrial Automation, PLC Engineering, Material Handling
- **Demo Route:** `demos/leaf-intake/index.html`
- **Direct GitHub Branch:** `subproject/01-leaf-intake`

## Key Capabilities
- Digital load-cell gross and tare acquisition with real-time net weight calculation.
- Rigorous intake validation (gross > tare, tare > 0, hopper max limit 250 kg).
- Quality gate inspection: accept lot or reject with mandatory defect classification (`HIGH_MOISTURE`, `COARSE_STALK`, `FOREIGN_MATTER`, `FERMENTED_HEAT`).
- Downstream destination routing (Green Grade to Drum Infeed Hopper, Golden Eligible to Withering Trays).
- Hardware interlock protection: Destination buffer sensor (`%I0.3`) monitoring. Immediate motor run command (`%Q0.0`) drop upon buffer blockage.
- Batch identity and mass retention: Interrupted transfers preserve assigned lot state and unissued mass; clearing downstream buffer restores transfer eligibility without duplicate issues.
- Emulated PLC I/O memory table and event ledger with dynamic CSV and JSON exports.

## Running Locally
```bash
# Start zero-dependency static server
python shared/serve.py 8080

# Navigate in browser to
http://localhost:8080/demos/leaf-intake/
```

## Running Tests
```bash
node --test projects/leaf-intake/tests/leaf-intake.test.js
```
