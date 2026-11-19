# Golden Tea Processing Sequence (Project 05 / Order 4)

## Overview
Interactive process automation, recipe control, and shared equipment arbitration model for the specialty Golden Tea production line (Withering → Rolling → Oxidation → Drying).

- **Lead Department:** Dept 1 Production Engineering
- **Target Roles:** Batch Automation, Process Commissioning, Resource Scheduling
- **Demo Route:** `demos/golden-tea-sequence/index.html`
- **Direct GitHub Branch:** `subproject/05-golden-tea-processing`

## Key Capabilities
- Leaf eligibility enforcement: Strictly requires tender young shoots (`GOLDEN_ELIGIBLE`); rejects coarse standard leaf at the intake gate.
- 4-stage sequential progression: Withering Trays (120 min) → Shared Roller (30 min) → Oxidation Racks (90 min) → Shared Final Dryer (60 min).
- Selectable oxidation profiles: `OX-LIGHT-01` (Light Flush), `OX-MED-02` (Classic Amber), `OX-DEEP-03` (Deep Muscatel) with distinct liquor colors and parameters.
- Shared Dryer mutual exclusion: Prevents cross-contamination by locking the shared final dryer. If occupied by Green Tea Batch `B-G01`, the Golden batch is held at oxidation discharge with retained batch ID and mass until the dryer is cleared.
- Animated browser HMI with step/auto-run controls, live station status cards, event ledger, and CSV/JSON data exports.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/golden-tea-sequence/
```

## Running Tests
```bash
node --test projects/golden-tea-sequence/tests/golden-tea.test.js
```
