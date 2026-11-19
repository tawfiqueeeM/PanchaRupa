# Handoff to Codex — Factory Sustainability & Waste Control (Row 19)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Factory Sustainability & Waste Control
- **Row:** 19
- **Lead Departments:** Dept 4 (Quality & Traceability) and Dept 7 (Business Operations & Costing)
- **Git Branch:** `subproject/17-sustainability-and-waste`
- **Assigned Directories:**
  - `projects/sustainability/`
  - `demos/sustainability/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/sustainability/ADVANCE-PLAN.md`)
- [x] Waste classification & routing rules document (`projects/sustainability/docs/waste-classification-rules.md`)
- [x] Deterministic mass balance and incident attribution engine (`projects/sustainability/js/sustainability-engine.js`)
- [x] Paired scenario fixtures (`projects/sustainability/fixtures/sustainability_scenarios.json`)
- [x] Native unit test suite (`projects/sustainability/tests/sustainability.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/sustainability/index.html`, `demos/sustainability/style.css`, `demos/sustainability/app.js`)
- [x] Department work note (`projects/sustainability/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/sustainability/TEST-REPORT.md`)
- [x] Module readme (`projects/sustainability/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/sustainability/tests/sustainability.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/sustainability/
```

### 4. Key Architectural Highlights
- **Thermodynamic Rigor:** Strictly isolates natural moisture evaporation (~77% mass reduction) from physical defect scrap.
- **Root-Cause Attribution:** Contrasts upstream supplier intake failure (Procurement owner, 0.8 kWh wasted) with in-process equipment stoppage (Maintenance owner, 42.0 kWh wasted from prior thermal/mechanical steps).
- **Governance:** Quality Control Department maintains exclusive authority over final disposition (`RELEASE`, `DOWNGRADE`, `SCRAP`, `HOLD`).
