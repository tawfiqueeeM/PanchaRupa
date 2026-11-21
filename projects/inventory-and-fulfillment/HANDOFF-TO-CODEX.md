# Handoff to Codex — Inventory Reservation & Fulfillment (Dept 7)

## Metadata & Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Contributing Departments:** Dept 1 Production Engineering, Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/11-inventory-and-fulfilment`
- **Source Paths:**
  - Logic & Specification: `projects/inventory-and-fulfillment/`
  - Interactive Demo: `demos/inventory-and-fulfillment/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R10 (Quantity Validation Guard):** Added strict numerical validation in `reserveLot()`: rejects non-positive, zero, NaN, or non-finite quantities with `INVALID_QUANTITY` exception without mutating lot reserved stock.
  - **R11 (Delayed Settlement Open Receivables):** Corrected `settleOrder()`: delayed settlement marks the order `OVERDUE_DELAYED` while keeping `lifecycleState: DISPATCHED` (open receivable). Subsequent settlement calls are permitted to collect funds and transition the order to `SETTLED`. Updated tests to assert open state on delay.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Corrected subproject identity badge to `Demo 11`, Dept 7 Business Operations.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `b04a257` (pushed commit on `subproject/11-inventory-and-fulfilment`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Three-stage order lifecycle: `RESERVED` -> `DISPATCHED` -> `SETTLED`.
  - Quality disposition gating: Prevents reservations against `ON_HOLD` or quarantined lots.
  - Over-allocation prevention: Blocks requests exceeding unreserved inventory mass.
  - Finite positive quantity boundary validation.
  - Delayed settlement open receivables: Keeps delayed orders open as receivables until collected.
  - Channel allocation accounting: Separates bulk auction sacks from retail bottles.
  - Interactive browser HMI with lot balance visual bars, dispatch/settle controls, exception alerts, and CSV/JSON export.
  - 5 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Warehouse lot catalog and nominal allocation scenarios.
- **Missing / Deferred to Codex:**
  - Real-time warehouse management system (WMS) barcode scanner integration and ERP financial ledger reconciliation.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/inventory-and-fulfillment/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/inventory-and-fulfillment/tests/inventory.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/inventory-and-fulfillment/js/inventory-engine.js`
- **Class:** `InventoryEngine`
- **State Fields:**
  ```typescript
  interface InventoryEngineState {
    lots: Array<LotRecord>;
    orders: Array<OrderRecord>;
    exceptions: Array<ExceptionRecord>;
    auditLog: Array<AuditLogEntry>;
  }
  ```
- **Replacement Hook:** Replace `reserveLot`, `dispatchOrder`, and `settleOrder` in `projects/inventory-and-fulfillment/js/inventory-engine.js` with your validated enterprise ERP / WMS adapter.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 14**: `subproject/12-costing-and-finance` (`projects/costing-and-finance/`).
