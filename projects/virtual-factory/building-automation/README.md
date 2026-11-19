# Building Automation System (BMS / SD-Anlegg)

## Overview
This module provides supervisory monitoring, environmental climate regulation, and electrical metering for the PanchaRupa Virtual Tea Factory. It emulates standard building management protocols (BACnet IP, Modbus RTU, Siemens Desigo CC concepts).

## Components
- `js/bms-engine.js`: Deterministic BMS engine managing ventilation differential pressure proof interlocks, finished tea storage humidity monitoring, Modbus meter polling watchdog, and specific energy consumption KPIs.
- `fixtures/bms_scenarios.json`: Test and simulation scenarios covering nominal operations, ventilation proof loss, warehouse humidity excursion, and communication timeouts.
- `tests/bms.test.js`: Native unit tests verifying all interlocks and calculations.
- `docs/points-and-alarms.md`: Comprehensive I/O point schedule, Modbus register map, and alarm matrix.

## Testing & Execution
Run unit tests:
```bash
node --test projects/virtual-factory/building-automation/tests/bms.test.js
```
Interactive UI:
Open `demos/building-automation/index.html` via local web server (`python serve.py`).
