# Handoff to Codex — Factory Data Platform & Traceability Analytics (Row 18)

## Status: READY FOR CODEX REVIEW

### 1. Subproject Identity
- **Subproject Name:** Factory Data Platform & Traceability Analytics
- **Row:** 18
- **Lead Departments:** Dept 4 (Quality & Traceability), Dept 5 (HMI & Simulation), Dept 7 (Business Operations)
- **Git Branch:** `subproject/16-factory-data-platform`
- **Assigned Directories:**
  - `projects/factory-data/`
  - `demos/factory-data/`

### 2. Deliverables Checklist
- [x] Advance planning document (`projects/factory-data/ADVANCE-PLAN.md`)
- [x] Canonical relational data dictionary documentation (`projects/factory-data/docs/data-dictionary.md`)
- [x] Deterministic schema ingestion & genealogy trace engine (`projects/factory-data/js/data-platform-engine.js`)
- [x] Clean and invalid scenario datasets (`projects/factory-data/fixtures/clean_factory_dataset.json`, `projects/factory-data/fixtures/invalid_factory_dataset.json`)
- [x] Native unit test suite (`projects/factory-data/tests/data-platform.test.js` - 4/4 passing)
- [x] Interactive browser demo (`demos/factory-data/index.html`, `demos/factory-data/style.css`, `demos/factory-data/app.js`)
- [x] Department work note (`projects/factory-data/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/factory-data/TEST-REPORT.md`)
- [x] Module readme (`projects/factory-data/README.md`)

### 3. Verification Instructions
Run automated test suite:
```bash
node --test projects/factory-data/tests/data-platform.test.js
```
Interactive browser demo:
```bash
python serve.py
# Navigate to http://localhost:8000/demos/factory-data/
```

### 4. Key Architectural Highlights
- **Relational Integrity Validation:** Ingestion checks validate 6 core entities (`deliveries`, `batches`, `inspections`, `lots`, `packaging`, `orders`), flagging duplicate primary keys, orphan foreign keys, negative readings, and invalid measurement units.
- **Traceability Chain:** Bidirectional traversal connects tea packages and dispatch orders back to the grower harvest batch, intake moisture reading, and delivery lot.
- **Export Standards:** Full JSON dataset export and CSV diagnostic error export.
