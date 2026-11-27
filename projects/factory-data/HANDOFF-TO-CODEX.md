# Handoff to Codex — Factory Data Platform & Traceability Analytics (Row 18)

## Status: READY FOR CODEX RE-REVIEW

### 1. Subproject Identity
- **Subproject Name:** Factory Data Platform & Traceability Analytics
- **Project / Demo Number:** Demo 16
- **Row:** 18
- **Lead Departments:** Dept 4 (Quality & Traceability), Dept 5 (HMI & Simulation), Dept 7 (Business Operations)
- **Git Branch:** `subproject/16-factory-data-platform`
- **Assigned Directories:**
  - `projects/factory-data/`
  - `demos/factory-data/`

### 2. Audit Corrections Applied (2026-11-21)
- **R20 (Data Validator Linkage & Stock Checks):** Upgraded `validateDataset()` in `projects/factory-data/js/data-platform-engine.js`:
  - Required foreign keys (`batch.deliveryId`, `inspection.batchId`, `lot.batchId`, `pack.lotId`, `order.packId`) must not be omitted, undefined, or empty; missing linkages now trigger `MISSING_FOREIGN_KEY`.
  - Required units (`expected: 'kg'`) and finite positive weights (`grossWeightKg > 0`, `netWeightKg > 0`); omissions or non-positive values trigger `INVALID_UNIT` and `NEGATIVE_OR_ZERO_VALUE`.
  - Validated lot stock to require finite non-negative values (`totalKg >= 0`); negative stock triggers `NEGATIVE_OR_ZERO_VALUE`.
  - Validated packaging allocations against available lot inventory; packaging overdraws (e.g. 999 kg packed against a 30 kg lot) trigger `ALLOCATION_EXCEEDS_LOT_STOCK`.
- **R22 (Mobile Viewport Verification):** Verified `demos/factory-data/` renders cleanly at 390px mobile viewport (`scrollWidth: 390px`, zero horizontal overflow).
- **R24 (Header & Department Metadata):** Subproject branch is `subproject/16-factory-data-platform`, Project/Demo 16, owned by Depts 4, 5 & 7. Added `Demo 16` badge.
- **R03 (Server Instructions):** Canonical server command is `python shared/serve.py 8080`.

### 3. Deliverables Checklist
- [x] Advance planning document (`projects/factory-data/ADVANCE-PLAN.md`)
- [x] Canonical relational data dictionary documentation (`projects/factory-data/docs/data-dictionary.md`)
- [x] Deterministic schema ingestion & genealogy trace engine (`projects/factory-data/js/data-platform-engine.js`)
- [x] Clean and invalid scenario datasets (`projects/factory-data/fixtures/clean_factory_dataset.json`, `projects/factory-data/fixtures/invalid_factory_dataset.json`)
- [x] Native unit test suite (`projects/factory-data/tests/data-platform.test.js` - 7/7 passing, including R20 regressions)
- [x] Interactive browser demo (`demos/factory-data/index.html`, `demos/factory-data/style.css`, `demos/factory-data/app.js`)
- [x] Department work note (`projects/factory-data/DEPARTMENT-WORK-NOTE.md`)
- [x] Test report (`projects/factory-data/TEST-REPORT.md`)
- [x] Module readme (`projects/factory-data/README.md`)

### 4. Verification Instructions
Run automated test suite:
```bash
node --test projects/factory-data/tests/data-platform.test.js
```
Interactive browser demo:
```bash
python shared/serve.py 8080
# Navigate to http://localhost:8080/demos/factory-data/
```

### 4. Key Architectural Highlights
- **Relational Integrity Validation:** Ingestion checks validate 6 core entities (`deliveries`, `batches`, `inspections`, `lots`, `packaging`, `orders`), flagging duplicate primary keys, orphan foreign keys, negative readings, and invalid measurement units.
- **Traceability Chain:** Bidirectional traversal connects tea packages and dispatch orders back to the grower harvest batch, intake moisture reading, and delivery lot.
- **Export Standards:** Full JSON dataset export and CSV diagnostic error export.
