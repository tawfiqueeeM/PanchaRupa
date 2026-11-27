# Withering Airflow & Moisture Dynamics (Project 04)

## Overview
Standalone interactive industrial automation demo and thin-layer moisture evaporation model for the PanchaRupa virtual tea factory withering troughs.

- **Lead Department:** Dept 3 Controls & Electrical (with Dept 1 Production Engineering)
- **Target Roles:** Process Instrumentation, Controls Engineering, Environmental Simulation
- **Demo Route:** `demos/withering-airflow/index.html`
- **Direct GitHub Branch:** `subproject/04-withering`

## Key Capabilities
- Continuous thin-layer moisture evaporation model driven by VFD fan airflow and ambient vapor pressure deficit.
- Multi-run comparison calculating side-by-side moisture trajectories, elapsed hours to target, and cumulative fan energy (kWh).
- Ambient environmental scenarios (Spring Nominal, Monsoon Humid, Autumn Dry).
- Out-of-bounds sensor fault injection with alarm latching and automatic shut-off inhibit.
- Initial target satisfaction: recognizes pre-withered leaf without artificial moisture jumps.
- Mobile viewport responsive layout (tested at 390px width without horizontal document overflow).

## Running Locally
```bash
# Start zero-dependency static server
python shared/serve.py 8080

# Navigate in browser to
http://localhost:8080/demos/withering-airflow/
```

## Running Tests
```bash
node --test projects/withering-airflow/tests/withering.test.js
```
