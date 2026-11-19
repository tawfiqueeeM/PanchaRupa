# Handoff to Codex — Production Scheduling & Machine Calendar (Dept 2)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Production Scheduling & Machine Calendar
- **Lead Department:** Dept 2 Operations & Capacity Planning
- **Git Branch:** `subproject/09-production-scheduling`
- **Assigned Directories:**
  - `projects/production-scheduling/`
  - `demos/production-scheduling/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/production-scheduling/ADVANCE-PLAN.md`)
- [x] Workstation rules & constraints documentation (`projects/production-scheduling/docs/scheduling-rules.md`)
- [x] Deterministic scheduling engine (`projects/production-scheduling/js/scheduling-engine.js`)
- [x] Scenario fixtures (`projects/production-scheduling/fixtures/schedule_scenarios.json`)
- [x] Unit test suite (`projects/production-scheduling/tests/scheduling.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/production-scheduling/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/production-scheduling/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/production-scheduling/TEST-REPORT.md`)
- [x] Module readme (`projects/production-scheduling/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/production-scheduling/tests/scheduling.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/production-scheduling/
```
