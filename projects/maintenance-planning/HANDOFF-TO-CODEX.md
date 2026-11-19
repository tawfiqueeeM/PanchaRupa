# Handoff to Codex — Maintenance Planning & Outage Impact (Depts 7 & 2)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Maintenance Planning & Outage Impact
- **Lead Departments:** Dept 7 (Business Operations) & Dept 2 (Operations & Capacity)
- **Git Branch:** `subproject/13-maintenance`
- **Assigned Directories:**
  - `projects/maintenance-planning/`
  - `demos/maintenance-planning/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/maintenance-planning/ADVANCE-PLAN.md`)
- [x] Maintenance rules & asset hierarchy documentation (`projects/maintenance-planning/docs/maintenance-rules.md`)
- [x] Deterministic maintenance and outage engine (`projects/maintenance-planning/js/maintenance-engine.js`)
- [x] Scenario fixtures (`projects/maintenance-planning/fixtures/maintenance_scenarios.json`)
- [x] Unit test suite (`projects/maintenance-planning/tests/maintenance.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/maintenance-planning/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/maintenance-planning/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/maintenance-planning/TEST-REPORT.md`)
- [x] Module readme (`projects/maintenance-planning/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/maintenance-planning/tests/maintenance.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/maintenance-planning/
```
