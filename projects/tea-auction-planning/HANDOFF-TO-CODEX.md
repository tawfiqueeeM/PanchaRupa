# Handoff to Codex — Tea Auction Planning & Venue Optimization (Dept 7)

## Status: READY FOR CODEX RE-REVIEW

### 1. Subproject Identity
- **Subproject Name:** Tea Auction Planning & Venue Optimization
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/tea-auction-planning`
- **Assigned Directories:**
  - `projects/tea-auction-planning/`
  - `demos/tea-auction-planning/`

### 2. Audit Review & Boundary Clarifications (2026-11-21)
- **Review Finding Confirmation:** Business review verified that 3-centre net realization, freight break-even premiums, and reserve price gate calculations operate accurately on synthetic baselines with no functional defects.
- **R22 (Mobile Viewport Verification):** Verified `demos/tea-auction-planning/` renders cleanly at 390px mobile viewport (`scrollWidth: 390px`, zero horizontal overflow).
- **R24 (Header & Department Metadata):** Subproject branch is `subproject/tea-auction-planning` (one of the 6 named non-numbered subprojects), owned by Dept 7 Business Operations.
- **R25 (Scope Boundaries & Deferred Work):** Current engine provides deterministic venue net realization and reserve price decision gates. Full multi-lot live bidding simulation, dynamic tea broker rate negotiation, and tea board regulatory changes are explicitly documented as pending/deferred for shared factory integration.
- **R03 (Server Instructions):** Canonical server command is `python shared/serve.py 8080`.

### 3. Deliverables Checklist
- [x] Advance planning document (`projects/tea-auction-planning/ADVANCE-PLAN.md`)
- [x] Auction rules & freight break-even documentation (`projects/tea-auction-planning/docs/auction-rules.md`)
- [x] Deterministic tea auction optimization engine (`projects/tea-auction-planning/js/auction-engine.js`)
- [x] Scenario fixtures (`projects/tea-auction-planning/fixtures/auction_scenarios.json`)
- [x] Unit test suite (`projects/tea-auction-planning/tests/auction.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/tea-auction-planning/index.html`, `style.css`, `app.js`)
- [x] Department work note (`projects/tea-auction-planning/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/tea-auction-planning/TEST-REPORT.md`)
- [x] Module readme (`projects/tea-auction-planning/README.md`)

### 4. Verification Instructions
Run automated test suite:
```bash
node --test projects/tea-auction-planning/tests/auction.test.js
```
Interactive browser demo:
```bash
python shared/serve.py 8080
# Navigate to http://localhost:8080/demos/tea-auction-planning/
```
