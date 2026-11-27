# Factory Sustainability & Waste Control

## Overview
The Factory Sustainability and Waste Control module provides mass balance calculations, material stream classification, and root-cause accountability for PanchaRupa Virtual Tea Factory. It distinguishes natural thermodynamic moisture loss during processing from avoidable operational defects, and evaluates the divergent impacts of incoming raw leaf quality failures versus in-process equipment outages.

## Key Features
- **Thermodynamic Mass Balance:** Separates natural water evaporation from saleable made tea, secondary salvage, non-recoverable discard, and packaging scrap.
- **Incident Attribution & Routing:** Attributes root causes to Procurement, Maintenance, Scheduling, or Building Controls, while preserving Quality's exclusive disposition authority.
- **Paired Replay Engine:** Analyzes identical 200 kg green leaf batches subjected to upstream defect rejection versus in-process dryer breakdown stewing.
- **Energy & Financial Accounting:** Computes net financial impact including salvage credits and specific energy consumption (SEC) inflation.

## Directory Structure
- `ADVANCE-PLAN.md`: Implementation design and specification.
- `docs/waste-classification-rules.md`: Mathematical formulas and routing matrices.
- `fixtures/sustainability_scenarios.json`: Paired scenario datasets.
- `js/sustainability-engine.js`: Pure ES module calculation engine.
- `tests/sustainability.test.js`: Native Node.js test suite.
- `../../demos/sustainability/`: Interactive HMI browser demo with paired comparison visualizer.

## Verification
```bash
node --test projects/sustainability/tests/sustainability.test.js
```
