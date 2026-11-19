# Quality Grading & Destination Routing (Project 06 / Order 7)

## Overview
Interactive quality engineering, lot disposition gating, and automated storage routing model for finished tea lots.

- **Lead Department:** Dept 4 Quality & Traceability
- **Target Roles:** Quality Engineering, Traceability Systems, PLC Routing
- **Demo Route:** `demos/grading-and-routing/index.html`
- **Direct GitHub Branch:** `subproject/06-grading-and-routing`

## Key Capabilities
- Quality grading and disposition gate: Material must be explicitly `RELEASED` by quality inspection before transfer is permitted. `ON_HOLD` or `REJECTED` lots are locked from bulk routing.
- Mandatory decision reason logging for quality compliance and recall auditability.
- Destination bin capacity management: Real-time tracking of Bin 1 (Grade A), Bin 2 (Grade B), and Bin 3 (Grade C).
- Full-bin interlock protection: If a destination bin is full or locked, the routing conveyor stops immediately (`%Q6.0 = FALSE`), retaining source lot ID (`F-G01`) and mass in the surge hopper.
- Upstream-to-downstream genealogy: Complete forward and backward lineage linking vendor deliveries, processing batches, finished lots, and storage bins with strict quantity conservation.
- Real-time visual HMI with interactive bin fill monitors, fault alert banners, and CSV/JSON data export.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/grading-and-routing/
```

## Running Tests
```bash
node --test projects/grading-and-routing/tests/grading.test.js
```
