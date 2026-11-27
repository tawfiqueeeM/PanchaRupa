# Handoff to Codex — Leaf Procurement & Material Requirements Planning (Dept 7)

## Metadata & Scope
- **Lead Department:** Dept 7 Business Operations & Planning
- **Contributing Departments:** Dept 2 Capacity & Operations, Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/08-procurement`
- **Source Paths:**
  - Logic & Specification: `projects/leaf-procurement/`
  - Interactive Demo: `demos/leaf-procurement/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R01 (DOM Constant Mutation Fix):** Corrected `app.js:120` from `kpiNetDemandSub = ...` to `kpiNetDemandSub.textContent = ...`. Eliminates unhandled `TypeError: Assignment to constant variable` on page render.
  - **R17 (Zero Net Demand Starvation Protection):** Corrected `calculateMRP()` in `procurement-engine.js`: when released stock covers demand (`netDemandKg === 0`), delivery slot checks do not generate false shortage or line starvation exceptions.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Corrected subproject identity badge to `Demo 08`, Dept 7 Business Operations.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `4b54764` (pushed commit on `subproject/08-procurement`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Net MRP requirements computation: Net Demand = Gross Demand − Released Inventory Stock.
  - Reverse yield expansion: Fresh Leaf Required = Net Demand / Dry-to-Wet Yield Ratio.
  - Winter harvest bush dormancy gating: Enforces 0 kg fresh intake during dormancy months and flags inventory buffer deficits.
  - Supplier eligibility verification: Flags uncertified suppliers attempting tender bud plucking.
  - Logistics arrival schedule verification: Identifies delivery delays when net leaf is required.
  - Interactive browser HMI with MRP summary cards, supplier matrices, shortage alerts, and CSV/JSON export.
  - 5 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Scenario fixtures and nominal supplier parameters.
- **Missing / Deferred to Codex:**
  - Integration with live agricultural weather APIs and multi-echelon supply chain replenishment modeling.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/leaf-procurement/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/leaf-procurement/tests/procurement.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/leaf-procurement/js/procurement-engine.js`
- **Class:** `ProcurementEngine`
- **State Fields:**
  ```typescript
  interface ProcurementEngineState {
    products: Array<ProductRequirement>;
    isWinterDormancy: boolean;
    month: string;
    mrpResults: MrpResult;
    auditLog: Array<AuditLogEntry>;
  }
  ```
- **Replacement Hook:** Replace `calculateMRP` in `projects/leaf-procurement/js/procurement-engine.js` with your validated enterprise ERP / MRP II engine.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 13**: `subproject/11-inventory-and-fulfilment` (`projects/inventory-and-fulfilment/`).
