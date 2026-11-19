# Handoff to Codex — Integrated Factory Capstone Simulator (Row 20)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Integrated Virtual Tea Factory Capstone Simulator
- **Row:** 20 (Final Sequential Queue Row)
- **Lead Department:** Dept 5 (HMI & Simulation) in coordination with Depts 1–7
- **Git Branch:** `subproject/14-integrated-factory`
- **Assigned Directories:**
  - `projects/virtual-factory/`
  - `demos/virtual-factory/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/virtual-factory/ADVANCE-PLAN.md`)
- [x] Five configurations matrix & integration status document (`projects/virtual-factory/docs/five-configurations-matrix.md`)
- [x] Canonical configuration parameters dataset (`projects/virtual-factory/fixtures/configurations_dataset.json`)
- [x] Deterministic evolutionary simulation engine (`projects/virtual-factory/js/integrated-factory-engine.js`)
- [x] Native unit test suite (`projects/virtual-factory/tests/integrated-factory.test.js` - 4/4 passing)
- [x] Interactive browser capstone demo (`demos/virtual-factory/index.html`, `demos/virtual-factory/style.css`, `demos/virtual-factory/app.js`)
- [x] Department work note (`projects/virtual-factory/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/virtual-factory/TEST-REPORT.md`)
- [x] Module readme (`projects/virtual-factory/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/virtual-factory/tests/integrated-factory.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/virtual-factory/
```

### 4. Key Architectural Highlights
- **Evolutionary Spectrum:** Faithfully models Configurations 1 through 5, tracking capacity expansion (120 to 1,200 kg/mo), labor productivity gains (10.0x), and unit cost reduction down to the Dept 7 verified baseline of BDT 181.63/kg.
- **Strict Data Distinction:** Historical founder figures (100 kg pilot, 1,000 kg design) are segregated from synthetic model dynamics via clear visual badges.
- **Full Navigation Directory:** Integrates direct routing and status tracking across all 20 subproject branches.
