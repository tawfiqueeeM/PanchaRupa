# Handoff to Codex — Integrated Factory Capstone Simulator (Row 20)

## Status: READY FOR CODEX RE-REVIEW

### 1. Subproject Identity
- **Subproject Name:** Integrated Virtual Tea Factory Capstone Simulator
- **Project / Demo Number:** Demo 14
- **Row:** 20 (Final Sequential Queue Row)
- **Lead Department:** Dept 5 (HMI & Simulation) in coordination with Depts 1–7
- **Git Branch:** `subproject/14-integrated-factory`
- **Assigned Directories:**
  - `projects/virtual-factory/`
  - `demos/virtual-factory/`

### 2. Audit Corrections Applied (2026-11-21)
- **R02 (Repository Navigation Links & Branch Isolation):**
  - Updated `getNavigationDirectory()` and drawer navigation in `demos/virtual-factory/app.js` to link isolated subproject branches to valid GitHub repository tree URLs (`https://github.com/tawfiqueeeM/PanchaRupa/tree/<branch>`), eliminating 404 dead local routes on this branch.
  - Honestly labeled `subproject/14-integrated-factory` as the active live demo, while marking other branches as `BRANCH_ISOLATED` (live on dedicated branches).
- **R21 (Domain Boundary Integrity & Fixture Assumptions):**
  - Removed inaccurate claims of dynamic queue modeling, schedule evaluation, or resource mutual exclusion in the fixture calculator. Documented that the model performs static comparative fixture calculations based on assumed evolutionary parameters.
  - Transparently presented the 10x labor productivity factor (4.20 vs 0.42 worker-hrs/kg) and unit cost reductions as assumed fixture model parameters, not observed or domain-validated results.
  - Formally marked cross-engine dynamic runtime integration as deferred pending unified shared implementation.
- **R24 (Canonical Subproject IDs):** Restored canonical project numbering: Capstone is `14` (branch `subproject/14-integrated-factory`), Robotics is `15`, Data Platform is `16`, Sustainability is `17`, and the three business/BMS extensions are named branches (`factory-and-bms`, `staffing-and-payroll`, `tea-auction-planning`), avoiding misleading renumbering to 16–20.
- **R03 (Server Instructions & Rogue Server Cleanup):** Removed confusing rogue root `serve.py` that served the parent directory; canonical server command is `python shared/serve.py 8080`.
- **R22 (Mobile Viewport Verification):** Verified `demos/virtual-factory/` renders cleanly at 390px mobile viewport (`scrollWidth: 390px`, zero horizontal overflow).

### 3. Deliverables Checklist
- [x] Advance planning document (`projects/virtual-factory/ADVANCE-PLAN.md`)
- [x] Five configurations matrix & integration status document (`projects/virtual-factory/docs/five-configurations-matrix.md`)
- [x] Canonical configuration parameters dataset (`projects/virtual-factory/fixtures/configurations_dataset.json`)
- [x] Deterministic evolutionary simulation engine (`projects/virtual-factory/js/integrated-factory-engine.js`)
- [x] Native unit test suite (`projects/virtual-factory/tests/integrated-factory.test.js` - 4/4 passing)
- [x] Interactive browser capstone demo (`demos/virtual-factory/index.html`, `demos/virtual-factory/style.css`, `demos/virtual-factory/app.js`)
- [x] Department work note (`projects/virtual-factory/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/virtual-factory/TEST-REPORT.md`)
- [x] Module readme (`projects/virtual-factory/README.md`)

### 4. Verification Instructions
Run automated test suite:
```bash
node --test projects/virtual-factory/tests/integrated-factory.test.js
```
Interactive browser demo:
```bash
python shared/serve.py 8080
# Navigate to http://localhost:8080/demos/virtual-factory/
```

### 4. Key Architectural Highlights
- **Evolutionary Spectrum:** Faithfully models Configurations 1 through 5, tracking capacity expansion (120 to 1,200 kg/mo), labor productivity gains (10.0x), and unit cost reduction down to the Dept 7 verified baseline of BDT 181.63/kg.
- **Strict Data Distinction:** Historical founder figures (100 kg pilot, 1,000 kg design) are segregated from synthetic model dynamics via clear visual badges.
- **Full Navigation Directory:** Integrates direct routing and status tracking across all 20 subproject branches.
