# Handoff to Codex — Factory Sustainability & Waste Control (Row 19)

## Status: READY FOR CODEX RE-REVIEW

### 1. Subproject Identity
- **Subproject Name:** Factory Sustainability & Waste Control
- **Project / Demo Number:** Demo 17
- **Row:** 19
- **Lead Departments:** Dept 4 (Quality & Traceability) and Dept 7 (Business Operations & Costing)
- **Git Branch:** `subproject/17-sustainability-and-waste`
- **Assigned Directories:**
  - `projects/sustainability/`
  - `demos/sustainability/`

### 2. Audit Corrections Applied (2026-11-21)
- **R18 (Mass Balance Reconciliation & Input Rejection):**
  - Reconciled the 200 kg dryer outage scenario strictly on a consistent wet-mass basis: 50.0 kg wet spoiled discard + 112.5 kg moisture evaporated + 33.5 kg downgraded commercial tea + 4.0 kg recoverable tea = 200.0 kg (0.0 kg unreconciled mass).
  - Explicitly separated `dryDiscardEquivalentKg` (12.5 kg dry made tea equivalent) from `nonRecoverableDiscardKg` (50.0 kg wet spoiled leaf discard).
  - Added strict mass conservation assertions across every supported scenario fixture.
  - Added strict input validation rejecting arbitrary/unsupported input masses (engine is calibrated specifically for standard 200.0 kg batch fixtures).
- **R03 (Server Instructions & Rogue Server Cleanup):** Removed confusing rogue root `serve.py` that served the parent directory; canonical server command is `python shared/serve.py 8080`.
- **R22 (Mobile Viewport Verification):** Verified `demos/sustainability/` renders cleanly at 390px mobile viewport (`scrollWidth: 390px`, zero horizontal overflow).
- **R24 (Header & Department Metadata):** Subproject branch is `subproject/17-sustainability-and-waste`, Demo 17, owned by Depts 4 & 7. Added `Demo 17` badge.

### 3. Deliverables Checklist
- [x] Advance planning document (`projects/sustainability/ADVANCE-PLAN.md`)
- [x] Waste classification & routing rules document (`projects/sustainability/docs/waste-classification-rules.md`)
- [x] Deterministic mass balance and incident attribution engine (`projects/sustainability/js/sustainability-engine.js`)
- [x] Paired scenario fixtures (`projects/sustainability/fixtures/sustainability_scenarios.json`)
- [x] Native unit test suite (`projects/sustainability/tests/sustainability.test.js` - 6/6 passing, including R18 regressions)
- [x] Interactive browser demo (`demos/sustainability/index.html`, `demos/sustainability/style.css`, `demos/sustainability/app.js`)
- [x] Department work note (`projects/sustainability/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/sustainability/TEST-REPORT.md`)
- [x] Module readme (`projects/sustainability/README.md`)

### 4. Verification Instructions
Run automated test suite:
```bash
node --test projects/sustainability/tests/sustainability.test.js
```
Interactive browser demo:
```bash
python shared/serve.py 8080
# Navigate to http://localhost:8080/demos/sustainability/
```

### 4. Key Architectural Highlights
- **Thermodynamic Rigor:** Strictly isolates natural moisture evaporation (~77% mass reduction) from physical defect scrap.
- **Root-Cause Attribution:** Contrasts upstream supplier intake failure (Procurement owner, 0.8 kWh wasted) with in-process equipment stoppage (Maintenance owner, 42.0 kWh wasted from prior thermal/mechanical steps).
- **Governance:** Quality Control Department maintains exclusive authority over final disposition (`RELEASE`, `DOWNGRADE`, `SCRAP`, `HOLD`).
