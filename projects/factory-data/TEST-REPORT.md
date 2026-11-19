# Test Report — Factory Data Platform & Traceability Analytics (Row 18)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-19
- **Command:** `node --test projects/factory-data/tests/data-platform.test.js`
- **Runner:** Node.js v22.14.0 native test runner
- **Duration:** ~84 ms
- **Total Test Cases:** 4
- **Passed:** 4
- **Failed:** 0
- **Skipped:** 0
- **Status:** PASS

---

## 2. Test Case Details

### Test 1: Clean dataset ingestion passes with zero validation errors
- **Description:** Verifies that a structurally sound dataset containing deliveries, batches, inspections, lots, packaging, and orders passes all relational and boundary integrity checks.
- **Assertions:**
  - `result.valid` is `true`.
  - `result.errors.length` is `0`.
  - `result.summary.entityCounts.deliveries` is `2`.
  - `result.summary.entityCounts.batches` is `2`.
  - `result.summary.entityCounts.inspections` is `2`.
  - `result.summary.entityCounts.lots` is `2`.
- **Outcome:** PASS

### Test 2: Ingestion of invalid dataset detects duplicate keys and orphan foreign keys
- **Description:** Verifies that primary key duplication and non-existent parent foreign key references are flagged with descriptive error codes and field names.
- **Assertions:**
  - `result.valid` is `false`.
  - Error detected with `code === 'DUPLICATE_PRIMARY_KEY'` for `batchId: "B-G01"`.
  - Error detected with `code === 'ORPHAN_FOREIGN_KEY'` for non-existent delivery `DEL-NON-EXISTENT`.
- **Outcome:** PASS

### Test 3: Ingestion detects invalid measurement units and negative weights
- **Description:** Verifies physical consistency rules: detecting unapproved measurement units (e.g., `psi` for weight) and negative physical measurements (`grossWeight < 0`).
- **Assertions:**
  - `result.valid` is `false`.
  - Error detected with `code === 'INVALID_MEASUREMENT_UNIT'` on delivery entity.
  - Error detected with `code === 'NEGATIVE_PHYSICAL_VALUE'` on gross weight.
- **Outcome:** PASS

### Test 4: Complete lot genealogy trace traversal
- **Description:** Verifies bidirectional lineage tree generation from finished lot `LOT-GT-2026-001` back to intake delivery `DEL-2026-1001` and forward to downstream customer order `ORD-2026-501`.
- **Assertions:**
  - `trace.lot.lotId` equals `'LOT-GT-2026-001'`.
  - `trace.batch.batchId` equals `'B-G01'`.
  - `trace.inspection.inspectionId` equals `'INS-2026-001'`.
  - `trace.delivery.deliveryId` equals `'DEL-2026-1001'`.
  - `trace.packaging.length` is `1` (`PKG-GT-50G-01`).
  - `trace.orders.length` is `1` (`ORD-2026-501`).
- **Outcome:** PASS

---

## 3. UI and Edge Case Verification
- Live scenario switcher between Clean Production Dataset and Dirty Diagnostic Dataset.
- Diagnostic error table accurately displays entity name, entity index, error code, and error message.
- Full genealogy visual timeline connects intake -> processing -> inspection -> warehousing -> packaging -> customer fulfillment.
- JSON and CSV export functionality validated.
