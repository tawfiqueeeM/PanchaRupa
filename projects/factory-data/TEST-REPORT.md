# Test Report — Factory Data Platform & Traceability Analytics (Row 18)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-19
- **Command:** `node --test projects/factory-data/tests/data-platform.test.js`
- **Runner:** Node.js v22.14.0 native test runner
- **Duration:** ~84 ms
- **Total Test Cases:** 7
- **Passed:** 7
- **Failed:** 0
- **Skipped:** 0
- **Status:** PASS

---

## 2. Test Case Details

### Test 1: Clean dataset ingestion passes with zero validation errors
- **Description:** Verifies that a structurally sound dataset containing deliveries, batches, inspections, lots, packaging, and orders passes all relational and boundary integrity checks.
- **Outcome:** PASS

### Test 2: Ingestion of invalid dataset detects duplicate keys and orphan foreign keys
- **Description:** Verifies that primary key duplication and non-existent parent foreign key references are flagged with descriptive error codes and field names.
- **Outcome:** PASS

### Test 3: Ingestion detects invalid measurement units and negative weights
- **Description:** Verifies physical consistency rules: detecting unapproved measurement units (e.g., `psi` for weight) and negative physical measurements (`grossWeight < 0`).
- **Outcome:** PASS

### Test 4: Complete lot genealogy trace traversal
- **Description:** Verifies bidirectional lineage tree generation from finished lot back to intake delivery and forward to downstream customer order.
- **Outcome:** PASS

### Test 5: Missing Foreign Key Invalidation (Regression R20)
- **Description:** Verifies that removing a required foreign key (e.g., `batches[0].deliveryId`) triggers validation failure (`isValid: false`) with error code `MISSING_FOREIGN_KEY`.
- **Outcome:** PASS

### Test 6: Missing Weight/Unit and Negative Lot Stock Invalidation (Regression R20)
- **Description:** Verifies that omitting unit or weight on intake deliveries, and setting lot stock to negative (`totalKg: -30`), are flagged with `INVALID_UNIT` and `NEGATIVE_OR_ZERO_VALUE`.
- **Outcome:** PASS

### Test 7: Packaging Allocation Overdraw Invalidation (Regression R20)
- **Description:** Verifies that allocating packaging mass (e.g., 999 kg) that exceeds available released lot inventory (30 kg) triggers `ALLOCATION_EXCEEDS_LOT_STOCK`.
- **Outcome:** PASS

---

## 3. UI and Edge Case Verification
- Live scenario switcher between Clean Production Dataset and Dirty Diagnostic Dataset.
- Diagnostic error table accurately displays entity name, entity index, error code, and error message.
- Full genealogy visual timeline connects intake -> processing -> inspection -> warehousing -> packaging -> customer fulfillment.
- JSON and CSV export functionality validated.
