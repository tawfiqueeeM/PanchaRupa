# Handoff to Codex — Building Automation System (BMS / SD-Anlegg)

## Status: READY FOR CODEX RE-REVIEW

### 1. Subproject Identity
- **Subproject Name:** Building Automation System (BMS / SD-Anlegg) & Factory Expansion
- **Git Branch:** `subproject/factory-and-bms`
- **Assigned Directories:**
  - `projects/virtual-factory/building-automation/`
  - `demos/building-automation/`

### 2. Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **SEC Zero-Production Denominator Guard:** Corrected `bms-engine.js` so that when released tea is zero, `kwhPerReleasedKg` evaluates to `null` rather than preserving a stale ratio or causing division anomalies. Handled safely in `demos/building-automation/app.js` with `"—"` / `"N/A (NO PROD)"`.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal scrolling.
  - **R24 (Named Branch Identity):** Preserved branch identity as `subproject/factory-and-bms`.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix (`python shared/serve.py 8080`).
- **Implementation Revision Tested:** `56182dc` (pushed commit on `subproject/factory-and-bms`)

### 3. Deliverables Checklist
- [x] Advance planning document (`projects/virtual-factory/building-automation/ADVANCE-PLAN.md`)
- [x] Point schedule & alarm list (`projects/virtual-factory/building-automation/docs/points-and-alarms.md`)
- [x] Deterministic domain engine (`projects/virtual-factory/building-automation/js/bms-engine.js`)
- [x] Scenario fixtures (`projects/virtual-factory/building-automation/fixtures/bms_scenarios.json`)
- [x] Unit test suite (`projects/virtual-factory/building-automation/tests/bms.test.js` - 5/5 passing)
- [x] Interactive browser demo (`demos/building-automation/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/virtual-factory/building-automation/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/virtual-factory/building-automation/TEST-REPORT.md`)
- [x] Readme files (`projects/virtual-factory/building-automation/README.md`)

### 4. Verification Instructions
Run automated test suite:
```bash
node --test projects/virtual-factory/building-automation/tests/bms.test.js
```
Interactive browser demo:
```bash
python shared/serve.py 8080
# Navigate to http://localhost:8080/demos/building-automation/
```
