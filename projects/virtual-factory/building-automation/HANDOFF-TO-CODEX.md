# Handoff to Codex — Building Automation System (BMS / SD-Anlegg)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Building Automation System (BMS / SD-Anlegg) & Factory Expansion
- **Git Branch:** `subproject/factory-and-bms`
- **Assigned Directories:**
  - `projects/factory-and-bms/`
  - `projects/virtual-factory/building-automation/`
  - `demos/building-automation/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/factory-and-bms/ADVANCE-PLAN.md` and `projects/virtual-factory/building-automation/ADVANCE-PLAN.md`)
- [x] Facility expansion strategy (`projects/factory-and-bms/docs/expansion-plan.md`)
- [x] Point schedule & alarm list (`projects/virtual-factory/building-automation/docs/points-and-alarms.md`)
- [x] Deterministic domain engine (`projects/virtual-factory/building-automation/js/bms-engine.js`)
- [x] Scenario fixtures (`projects/virtual-factory/building-automation/fixtures/bms_scenarios.json`)
- [x] Unit test suite (`projects/virtual-factory/building-automation/tests/bms.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/building-automation/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/virtual-factory/building-automation/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/virtual-factory/building-automation/TEST-REPORT.md`)
- [x] Readme files (`projects/virtual-factory/building-automation/README.md`, `projects/factory-and-bms/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/virtual-factory/building-automation/tests/bms.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/building-automation/
```
