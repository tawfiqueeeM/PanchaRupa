# Handoff to Codex — Tea Auction Planning & Venue Optimization (Dept 7)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Tea Auction Planning & Venue Optimization
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/tea-auction-planning`
- **Assigned Directories:**
  - `projects/tea-auction-planning/`
  - `demos/tea-auction-planning/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/tea-auction-planning/ADVANCE-PLAN.md`)
- [x] Auction rules & freight break-even documentation (`projects/tea-auction-planning/docs/auction-rules.md`)
- [x] Deterministic tea auction optimization engine (`projects/tea-auction-planning/js/auction-engine.js`)
- [x] Scenario fixtures (`projects/tea-auction-planning/fixtures/auction_scenarios.json`)
- [x] Unit test suite (`projects/tea-auction-planning/tests/auction.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/tea-auction-planning/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/tea-auction-planning/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/tea-auction-planning/TEST-REPORT.md`)
- [x] Module readme (`projects/tea-auction-planning/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/tea-auction-planning/tests/auction.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/tea-auction-planning/
```
