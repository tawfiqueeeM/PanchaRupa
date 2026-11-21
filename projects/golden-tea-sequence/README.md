# Golden Tea Processing Sequence (Project 05)

## Overview
Standalone interactive industrial automation demo and sequence progression engine for the PanchaRupa virtual tea factory specialty golden/black tea processing line.

- **Lead Department:** Dept 2 Capacity & Operations (with Dept 1 Production Engineering & Dept 4 Quality)
- **Target Roles:** Process Operations, Industrial Automation, Plant Capacity Planning
- **Demo Route:** `demos/golden-tea-sequence/index.html`
- **Direct GitHub Branch:** `subproject/05-golden-tea-processing`

## Key Capabilities
- Mandatory leaf eligibility validation gate (`GOLDEN_ELIGIBLE` qualification required).
- 4-stage sequential machine flow: Withering Trays → Shared Roller → Oxidation Racks → Shared Final Dryer.
- Profile-driven oxidation control (`OX-LIGHT-01`, `OX-MED-02`, `OX-DEEP-03`) with target humidity, temperatures, and liquor characteristics.
- Shared Final Dryer mutual exclusion arbitration preventing simultaneous ownership by Green and Golden batches.
- Output conservation: Finished golden tea increments only upon final dryer discharge.
- Mobile viewport responsive layout (tested at 390px width without horizontal document overflow).

## Running Locally
```bash
# Start zero-dependency static server
python shared/serve.py 8080

# Navigate in browser to
http://localhost:8080/demos/golden-tea-sequence/
```

## Running Tests
```bash
node --test projects/golden-tea-sequence/tests/golden-tea.test.js
```
