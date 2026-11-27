# Packing & Reject Interlocks (Project 07 / Order 5)

## Overview
Interactive machine automation, instrumentation, and quality checkweighing model for the PanchaRupa virtual tea factory packaging station.

- **Lead Department:** Dept 1 Production Engineering
- **Target Roles:** Machine Automation, Instrumentation Engineering, Quality Inspection
- **Demo Route:** `demos/packing-and-reject/index.html`
- **Direct GitHub Branch:** `subproject/07-packing-and-dispatch`

## Key Capabilities
- Two-stage dosing simulation: coarse auger feed (%Q4.0) to ~85% followed by precision fine trickle feed (%Q4.1).
- Multi-format packaging: 50 g retail bottles, 100 g retail bottles, and 25 kg bulk auction bags with strict tolerance bounds.
- Dynamic checkweighing & reject pusher: Automatic pneumatic pusher (%Q4.2) diverts short/over filled containers into a quarantine bin.
- Single-dispatch gating: Valid packs enter the dispatch channel (`RETAIL` or `AUCTION`) exactly once; defective packs are strictly excluded from shipping manifests while retaining upstream source lot traceability.
- Closed mass reconciliation: Total dosed mass = Dispatched net mass + Quarantined reject mass.
- Real-time browser HMI with interactive scale deck, feeder indicators, dual manifests, and CSV/JSON data export.

## Running Locally
```bash
python shared/serve.py 8080
# Open: http://localhost:8080/demos/packing-and-reject/
```

## Running Tests
```bash
node --test projects/packing-and-reject/tests/packing.test.js
```
