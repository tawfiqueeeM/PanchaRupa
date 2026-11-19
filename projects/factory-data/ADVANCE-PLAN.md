# Advance Plan — Factory Data Platform & Traceability Analytics (Project 16)

## 1. Requirements & Operational Scope
- **Lead Departments:** Depts 4 (Quality), 5 (HMI), and 7 (Business)
- **Branch:** `subproject/16-factory-data-platform`
- **Target Paths:**
  - `projects/factory-data/`
  - `demos/factory-data/`
- **Key Objectives:**
  1. Relational data dictionary across factory operations (Material Movements, Telemetry, Inspection, Commercial Records, HR/Payroll, Assets).
  2. Data ingestion and validation engine:
     - Detect duplicate primary keys.
     - Detect orphan foreign key references (e.g. Batch referencing non-existent Delivery).
     - Detect invalid/unrecognized physical engineering units (e.g. parsing `120 bar` instead of `°C`).
     - Detect negative or out-of-bounds physical stock balances.
  3. Interactive Lot Explorer & Genealogy Traceability:
     - Bidirectional genealogy tree tracking raw leaf intake delivery (`DEL-2026-001`) -> batch processing (`B-G01`) -> QA inspection disposition (`LOT-G01-REL`) -> packaging runs (`PCK-50G-01`) -> dispatch sales order (`ORD-BULK-01`).
  4. Downloadable test datasets: Clean nominal import vs Invalid import with highlighted error diagnostics.
  5. Interactive UI with schema viewer, fixture upload/preview, error diagnostics table, and CSV/JSON export.

## 2. Permitted Files & Directory Map
```
projects/factory-data/
├── ADVANCE-PLAN.md
├── fixtures/
│   ├── clean_factory_dataset.json
│   └── invalid_factory_dataset.json
├── docs/
│   └── data-dictionary.md
├── js/
│   └── data-platform-engine.js
├── tests/
│   └── data-platform.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/factory-data/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Core Entities:**
  - `Deliveries`: `deliveryId` (PK), `supplierId`, `grossWeightKg`, `tareWeightKg`, `netWeightKg`, `timestamp`.
  - `Batches`: `batchId` (PK), `deliveryId` (FK), `product`, `freshLeafUsedKg`, `status`, `startTime`.
  - `InspectionResults`: `inspectionId` (PK), `batchId` (FK), `moisturePct`, `grade`, `disposition`.
  - `FinishedLots`: `lotId` (PK), `batchId` (FK), `totalKg`, `storageBin`, `disposition`.
  - `PackagingRuns`: `packId` (PK), `lotId` (FK), `format`, `unitCount`, `packedKg`.
  - `SalesOrders`: `orderId` (PK), `packId` (FK), `channel`, `customer`, `lifecycleState`.
- **Validation Rules & Error Types:**
  - `DUPLICATE_KEY`: Entity array contains duplicate PK.
  - `ORPHAN_FOREIGN_KEY`: Foreign key references non-existent parent entity.
  - `INVALID_UNIT`: Measurement unit mismatch or invalid value.
  - `NEGATIVE_STOCK`: Inventory or weight evaluated $\le 0$ or negative.

## 4. Verification Plan
- Unit tests: `node --test projects/factory-data/tests/data-platform.test.js`
- Test cases:
  1. Clean dataset ingestion passes with 0 validation errors.
  2. Duplicate primary key detection.
  3. Orphan foreign key detection.
  4. Unit / physical value out-of-range detection.
  5. Complete end-to-end lot genealogy traversal.
