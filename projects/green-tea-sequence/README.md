# Green Tea Processing Sequence (Project 02)

## Overview
Standalone interactive industrial automation demo and PLC process sequence for the green tea processing line (Heated Drum → Shared Roller → Shared Final Dryer).

- **Lead Department:** Dept 1 Production Engineering
- **Target Roles:** PLC Sequencing, Process Automation, Equipment Commissioning
- **Demo Route:** `demos/green-tea-sequence/index.html`
- **Direct GitHub Branch:** `subproject/02-green-tea-processing`

## Key Capabilities
- Enforces strict sequential flow: Drum (Fixation) MUST precede Roller (Cell rupture), and Roller MUST precede Dryer (Moisture reduction).
- Recipe-driven operation: `GT-STD-01` (Standard), `GT-DEL-02` (Delicate Flush), `GT-ROAST-03` (High Roast) with dynamic temperatures and yields.
- Resource contention interlocks: Simulates shared equipment lockout (Roller or Dryer busy with Golden Tea). Retains batch ID `B-G01` and mass with explicit waiting reason until resource is released.
- Output conservation: Finished mass increments only after verified final dryer discharge handshake.
- Animated browser HMI with step-by-step and auto-run sequencing, live registers, event ledger, and CSV/JSON exports.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/green-tea-sequence/
```

## Running Tests
```bash
node --test projects/green-tea-sequence/tests/green-tea.test.js
```
