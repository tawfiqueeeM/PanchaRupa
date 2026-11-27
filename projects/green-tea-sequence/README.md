# Green Tea Processing Sequence (Project 02)

## Overview
Standalone interactive industrial automation demo and sequence progression engine for the PanchaRupa virtual tea factory green tea processing line.

- **Lead Department:** Dept 2 Capacity & Operations (with Dept 1 Production Engineering & Dept 3 Controls)
- **Target Roles:** Process Operations, Industrial Automation, Plant Capacity Planning
- **Demo Route:** `demos/green-tea-sequence/index.html`
- **Direct GitHub Branch:** `subproject/02-green-tea-processing`

## Key Capabilities
- Sequential machine progression: Heated Drum (Fixation) → Shared Roller (Shaping) → Shared Final Dryer (Drying).
- Dynamic recipe selector (`GT-STD-01`, `GT-DEL-02`, `GT-ROAST-03`) with distinct cycle times, temperatures, and yield factors.
- Resource contention interlocks: When Shared Roller or Shared Dryer are unavailable, active batch is held with retained ID `B-G01`, incoming mass, and explicit waiting reason.
- Strict mass and completion accounting: Finished factory stock increments only after final dryer discharge completes.
- Mobile viewport responsive layout (tested at 390px width without horizontal document overflow).

## Running Locally
```bash
# Start zero-dependency static server
python shared/serve.py 8080

# Navigate in browser to
http://localhost:8080/demos/green-tea-sequence/
```

## Running Tests
```bash
node --test projects/green-tea-sequence/tests/green-tea.test.js
```
