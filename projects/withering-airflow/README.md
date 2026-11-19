# Withering Airflow & Moisture Dynamics (Project 03 / Order 3)

## Overview
Interactive process control, instrumentation, and drying kinetics model for the PanchaRupa virtual tea factory withering trays.

- **Lead Department:** Dept 1 Production Engineering
- **Target Roles:** Process Control, Instrumentation Engineering, Energy Efficiency
- **Demo Route:** `demos/withering-airflow/index.html`
- **Direct GitHub Branch:** `subproject/04-withering`

## Key Capabilities
- Thin-layer moisture reduction dynamics driven by VFD fan airflow command (`AO_FAN_SPEED`).
- Ambient climate scenarios: Spring Nominal (25°C, 65% RH), Monsoon Humid (28°C, 88% RH), Autumn Dry (22°C, 50% RH).
- Comparison trends: Compare gentle airflow (40%) vs high airflow (85%) on identical batches to evaluate drying hours vs energy consumption.
- Instrument fault detection: Out-of-bounds sensor fault injection (%IW70 reading -99.9%) triggering interlock warnings and inhibiting false completion signals.
- Live chamber telemetry display with animated VFD fan speed, digital gauges, event ledger, and CSV/JSON data export.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/withering-airflow/
```

## Running Tests
```bash
node --test projects/withering-airflow/tests/withering.test.js
```
