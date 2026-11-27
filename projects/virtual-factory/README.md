# Integrated Virtual Tea Factory Capstone Simulator

## Overview
The Integrated Virtual Tea Factory Capstone Simulator provides a multi-station evolutionary evaluation platform and portfolio navigation hub for PanchaRupa Virtual Tea Factory. It compares five distinct factory configurations—spanning cottage manual processing up to a fully coordinated modern facility—under identical monthly demand loads to isolate capacity constraints, bottleneck shifts, labor productivity gains, and unit manufacturing costs.

## Key Features
- **Five Evolutionary Configurations:**
  1. Manual Cottage Operation (120 kg/month)
  2. Heated Drum Mechanization (250 kg/month)
  3. Automated Final Drying (450 kg/month)
  4. Mechanized Rolling & Drying (750 kg/month)
  5. Proposed Coordinated Modern Factory (1,200 kg/month)
- **Founder-Reported vs Simulated Output Segregation:** Explicitly labels historical founder-reported numbers (100 kg pilot, 1,000 kg design capacity) separate from simulated model outputs.
- **Bottleneck Migration Analytics:** Traces throughput constraints from hand rolling fatigue through dryer thermal queues to coordinated line balance.
- **Portfolio Navigation Directory:** Unified portal linking all 20 independently tested engineering and operations modules.

## Directory Structure
- `ADVANCE-PLAN.md`: Capstone implementation design and specification.
- `docs/five-configurations-matrix.md`: Comparative engineering specifications and integration architecture.
- `fixtures/configurations_dataset.json`: Canonical configuration parameters and benchmark workloads.
- `js/integrated-factory-engine.js`: Pure ES module capstone simulation engine.
- `tests/integrated-factory.test.js`: Native Node.js test suite.
- `../../demos/virtual-factory/`: Interactive browser application with configuration selector, comparison matrix, and navigation directory.

## Verification
```bash
node --test projects/virtual-factory/tests/integrated-factory.test.js
```
