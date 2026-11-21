# Handoff to Codex — Maintenance Planning & Outage Impact (Depts 7 & 2)

## Status: READY FOR CODEX RE-REVIEW

### 1. Subproject Identity
- **Subproject Name:** Maintenance Planning & Outage Impact
- **Lead Departments:** Dept 7 (Business Operations) & Dept 2 (Operations & Capacity)
- **Git Branch:** `subproject/13-maintenance`
- **Assigned Directories:**
  - `projects/maintenance-planning/`
  - `demos/maintenance-planning/`

### 2. Audit Corrections Applied (2026-11-21)
- **R16 (Asset Status Recomputation):** Implemented `recomputeAssetStatus(assetId)` in `projects/maintenance-planning/js/maintenance-engine.js`. Completing a work order now scans remaining open work orders on the asset. If an open corrective order remains, the asset is preserved in `TRIPPED_OUTAGE` and cumulative runtime hours are preserved. Only when all open work orders are closed does the asset transition to `OPERATIONAL` and reset runtime hours.
- **R22 (Mobile Viewport Verification):** Verified `demos/maintenance-planning/` renders cleanly at 390px mobile viewport (`scrollWidth: 390px`, zero horizontal overflow).
- **R24 (Header & Department Metadata):** Updated demo badge to explicitly display `Demo 13` and linked departments `Dept 7 Business Operations & Dept 2 Capacity & Operations`.
- **R03 (Server Instructions):** Canonical server command is `python shared/serve.py 8080`.

### 3. Deliverables Checklist
- [x] Advance planning document (`projects/maintenance-planning/ADVANCE-PLAN.md`)
- [x] Maintenance rules & asset hierarchy documentation (`projects/maintenance-planning/docs/maintenance-rules.md`)
- [x] Deterministic maintenance and outage engine (`projects/maintenance-planning/js/maintenance-engine.js`)
- [x] Scenario fixtures (`projects/maintenance-planning/fixtures/maintenance_scenarios.json`)
- [x] Unit test suite (`projects/maintenance-planning/tests/maintenance.test.js` - 5/5 passing, including R16 regression test)
- [x] Interactive browser demo (`demos/maintenance-planning/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/maintenance-planning/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/maintenance-planning/TEST-REPORT.md`)
- [x] Module readme (`projects/maintenance-planning/README.md`)

### 4. Verification Instructions
Run automated test suite:
```bash
node --test projects/maintenance-planning/tests/maintenance.test.js
```
Interactive browser demo:
```bash
python shared/serve.py 8080
# Navigate to http://localhost:8080/demos/maintenance-planning/
```
