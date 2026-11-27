# Test Report — Inventory Reservation & Fulfillment (Dept 7)

## Test Execution Summary
- **Date:** 2026-11-21
- **Test Suite:** `projects/inventory-and-fulfillment/tests/inventory.test.js`
- **Execution Command:** `node --test projects/inventory-and-fulfillment/tests/inventory.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (5/5 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Nominal DAY-40 Pack Split Allocation
- **Objective:** Verify acceptance scenario: 40 kg released finished tea reserves 36 kg bulk auction and 4 kg retail bottles.
- **Verification:**
  - `isFeasible` evaluates to `true`.
  - Bulk auction allocation equals 36.0 kg.
  - Retail bottles allocation equals 4.0 kg.
- **Result:** PASS

### 2. Over-Allocation Prevention
- **Objective:** Verify that reservation requests exceeding unreserved available lot mass are rejected.
- **Verification:**
  - Attempting to reserve 50.0 kg from a 30.0 kg lot fails (`success = false`).
  - Records `EXCESS_ALLOCATION` exception.
- **Result:** PASS

### 3. Held Lot Quarantine Gate
- **Objective:** Verify that lots in `ON_HOLD` status cannot be reserved or dispatched.
- **Verification:**
  - Attempting to reserve from `LOT-QA-HOLD` fails.
  - Generates `HELD_LOT_VIOLATION` exception.
- **Result:** PASS

### 4. Full Lifecycle & Delayed Settlement Receivables (R11)
- **Objective:** Verify complete traceable lifecycle transitions: delayed settlement keeps order open as an overdue receivable (`DISPATCHED` / `OVERDUE_DELAYED`), and subsequent collection transitions order to `SETTLED` / closed.
- **Verification:**
  - Order transitions from `RESERVED` to `DISPATCHED` (updating lot dispatched balance).
  - Delayed settlement leaves order in `DISPATCHED` state with `settlementStatus: OVERDUE_DELAYED` and `isOverdue: true`.
  - Subsequent settlement call successfully collects payment and closes order (`SETTLED`).
- **Result:** PASS

### 5. Quantity Validation Boundary Guard (R10)
- **Objective:** Verify that non-positive, NaN, or non-numeric allocation quantities are rejected without mutating lot balances.
- **Verification:**
  - Tested negative (-15 kg), NaN, and zero allocation attempts.
  - All calls returned `success = false` with `INVALID_QUANTITY` exception.
  - Verified `lot.reservedKg` remained unchanged across all invalid requests.
- **Result:** PASS

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/inventory-and-fulfillment/` loads cleanly without errors.
- **Header Badge & Identity (R24):** Header badge reflects `Demo 11`, Dept 7 Business Operations.
- **Responsive Viewport Verification (R22):** Verified via Edge CDP: Desktop (1440px) `scrollWidth: 1401px`, Mobile (390px) `scrollWidth: 390px` with zero horizontal overflow.
- **Console Errors:** 0 unhandled exceptions.
