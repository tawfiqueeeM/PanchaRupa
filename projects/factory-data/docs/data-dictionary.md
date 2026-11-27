# Factory Data Platform & Relational Data Dictionary

## 1. Domain Entities & Schema Definitions
1. **Deliveries (`deliveries`):**
   - `deliveryId` (VARCHAR, PK): Unique leaf receipt ID (e.g. `DEL-2026-001`).
   - `supplierId` (VARCHAR, FK): Estate identifier (`SUPPLIER_01`, `SUPPLIER_02`).
   - `grossWeightKg` (FLOAT, UNIT: `kg`): Scale reading on intake.
   - `tareWeightKg` (FLOAT, UNIT: `kg`): Crate / truck tare weight.
   - `netWeightKg` (FLOAT, UNIT: `kg`): Gross − Tare.

2. **Batches (`batches`):**
   - `batchId` (VARCHAR, PK): Processing batch (`B-G01`, `B-GL01`).
   - `deliveryId` (VARCHAR, FK): Upstream delivery parent key.
   - `product` (ENUM): `GREEN_TEA` or `GOLDEN_TEA`.
   - `freshLeafUsedKg` (FLOAT, UNIT: `kg`): Quantity converted.
   - `status` (ENUM): `COMPLETED`, `IN_PROGRESS`, `ABORTED`.

3. **Inspection Quality Gates (`inspections`):**
   - `inspectionId` (VARCHAR, PK): Lab test record (`QC-2026-001`).
   - `batchId` (VARCHAR, FK): Processing batch parent key.
   - `moisturePct` (FLOAT, UNIT: `%`): Moisture content (target 2.5%–4.0%).
   - `grade` (ENUM): `GRADE_A`, `GRADE_B`, `GRADE_C`.
   - `disposition` (ENUM): `RELEASED`, `ON_HOLD`, `REJECTED`.

4. **Finished Inventory Lots (`lots`):**
   - `lotId` (VARCHAR, PK): Warehouse inventory lot (`LOT-G01-REL`).
   - `batchId` (VARCHAR, FK): Origin batch.
   - `totalKg` (FLOAT, UNIT: `kg`): Released output mass.
   - `storageBin` (VARCHAR): Destination bin (`BIN-A1`, `BIN-A2`).
   - `disposition` (ENUM): `RELEASED`, `ON_HOLD`.

5. **Packaging & Cartoning Runs (`packaging`):**
   - `packId` (VARCHAR, PK): Packaging work run (`PCK-50G-01`).
   - `lotId` (VARCHAR, FK): Origin finished lot.
   - `format` (ENUM): `BULK_SACK`, `RETAIL_50G`, `RETAIL_100G`.
   - `unitCount` (INT): Number of units packed.
   - `packedKg` (FLOAT, UNIT: `kg`): Mass packed.

6. **Sales & Fulfillment Orders (`orders`):**
   - `orderId` (VARCHAR, PK): Commercial order (`ORD-BULK-01`).
   - `packId` (VARCHAR, FK): Packaging run.
   - `channel` (ENUM): `AUCTION_BULK`, `RETAIL_BOTTLES`.
   - `customer` (VARCHAR): Buyer / Auction house name.
   - `lifecycleState` (ENUM): `RESERVED`, `DISPATCHED`, `SETTLED`.

## 2. Integrity & Validation Invariants
- **Primary Key Uniqueness:** Every record's primary key must be globally unique within its entity table.
- **Referential Integrity:** Every foreign key must resolve to an existing record in its parent entity table (zero orphan records).
- **Physical Bounds & Units:** Weights must be positive and non-zero; moisture percentages must be in range $[0, 100]$; temperatures must carry recognized Celsius units.
