# Handoff to Codex — Leaf Procurement & Material Requirements Planning (Dept 7)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Leaf Procurement & Material Requirements Planning
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/08-procurement`
- **Assigned Directories:**
  - `projects/leaf-procurement/`
  - `demos/leaf-procurement/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/leaf-procurement/ADVANCE-PLAN.md`)
- [x] MRP & procurement rules documentation (`projects/leaf-procurement/docs/mrp-procurement-rules.md`)
- [x] Deterministic MRP calculation engine (`projects/leaf-procurement/js/procurement-engine.js`)
- [x] Scenario fixtures (`projects/leaf-procurement/fixtures/procurement_scenarios.json`)
- [x] Unit test suite (`projects/leaf-procurement/tests/procurement.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/leaf-procurement/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/leaf-procurement/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/leaf-procurement/TEST-REPORT.md`)
- [x] Module readme (`projects/leaf-procurement/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/leaf-procurement/tests/procurement.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/leaf-procurement/
```
