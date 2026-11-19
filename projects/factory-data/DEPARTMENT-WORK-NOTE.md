# Department Work Note — Factory Data Platform & Traceability Analytics (Depts 4, 5, 7)

## 1. Department Overview
- **Subproject:** 18 / Row 18 — Factory Data Platform
- **Lead Departments:** Dept 4 (Quality & Traceability), Dept 5 (HMI & Simulation), Dept 7 (Business Operations)
- **Git Branch:** `subproject/16-factory-data-platform`
- **Scope:** Centralized relational data dictionary across factory operations (Deliveries, Batches, Inspections, Lots, Packaging, Orders), schema integrity and validation engine (duplicate primary key detection, foreign key orphan references, unit mismatch diagnostics, negative value guards), end-to-end lot genealogy explorer, and downloadable test datasets.

## 2. Implemented Capabilities
1. **Relational Data Dictionary & Schema Ingestion:**
   - 6 relational entities: `deliveries`, `batches`, `inspections`, `lots`, `packaging`, and `orders`.
   - Structured keys: `deliveryId`, `batchId`, `inspectionId`, `lotId`, `packId`, `orderId`.
2. **Schema Ingestion & Integrity Validation:**
   - Detects duplicate primary keys (e.g. duplicate `batchId: "B-G01"`).
   - Detects orphan foreign keys (e.g. batch referencing non-existent delivery `DEL-NON-EXISTENT`).
   - Detects invalid physical measurement units (e.g. `"psi"` instead of `"kg"` on leaf delivery).
   - Detects negative or out-of-bounds physical readings (e.g. negative gross weight or moisture exceeding 20%).
3. **End-to-End Lot Genealogy Explorer:**
   - Bidirectional relational trace:
     1. Raw Leaf Delivery (Supplier, Gross/Tare/Net)
     2. Processing Batch (Fresh leaf converted, Status)
     3. Laboratory Inspection (Moisture %, Grade, Disposition)
     4. Finished Inventory Lot (Storage Bin, Total mass)
     5. Downstream Packaging & Fulfillment Orders (Format, Customer, Lifecycle)
4. **Downloadable Standard Datasets:**
   - `clean_factory_dataset.json`: Valid production run with 0 errors.
   - `invalid_factory_dataset.json`: Injected with duplicates, orphans, and unit anomalies for testing.
5. **Interactive UI & Exports:**
   - Real-time diagnostic error table with field and index diagnostics.
   - Interactive lot selection and visual lineage tree.
   - Export to formatted JSON and CSV.
