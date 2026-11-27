# Handoff to Codex — Grading & Routing Interlocks (Project 06 / Order 7)

## Metadata & Scope
- **Lead Department:** Dept 4 Quality & Traceability
- **Contributing Departments:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/06-grading-and-routing`
- **Source Paths:**
  - Logic & Specification: `projects/grading-and-routing/`
  - Interactive Demo: `demos/grading-and-routing/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R07 (Terminal Idempotency Guard):** Added terminal check in `routeMaterial()`: if `activeLot.routingState === "ROUTED"` or `activeLot.unroutedMassKg <= 0`, further routing attempts are rejected with `ALREADY_ROUTED`, preserving the completed `routedMassKg` and preventing zero-mass overwrite.
  - **R07 (Disposition Gating Post-Route):** `setDisposition()` cannot revert a `ROUTED` lot back to `IDLE` state.
  - **R07 (Inspecting Routed Lots):** `inspectLot()` now cross-references `routingHistory`. If an already routed lot is reloaded, its `ROUTED` state and zero unrouted mass are preserved to avoid reissuing the movement.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Corrected subproject identity badge to `Demo 06`, Dept 4 Quality & Traceability.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `f2388d1` (pushed commit on `subproject/06-grading-and-routing`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Quality grading and disposition gate: Material must be explicitly `RELEASED` before routing is permitted.
  - Mandatory decision reason logging for quality audit compliance.
  - Multi-bin destination management: Bin 1 (Grade A), Bin 2 (Grade B), Bin 3 (Grade C) with capacity tracking.
  - Full-bin interlock protection: If destination bin is at capacity or locked, transfer conveyor immediately drops, retaining source lot ID (`F-G01`) and mass in the surge hopper.
  - Fault acknowledgement and rerouting workflow restoring transfer eligibility.
  - Terminal-state idempotency: Repeated Route calls are blocked and cannot zero out routed mass.
  - End-to-end lot genealogy tracking linking Vendor Deliveries → Batch → Finished Lot → Bin with exact mass conservation.
  - Interactive browser HMI with visual genealogy chain, live bin fill bars, fault alarm banners, event ledger, and CSV/JSON export.
  - 5 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Finished lot catalog (`F-G01`, `F-O01`) and nominal/full-bin scenario presets.
- **Missing / Deferred to Codex:**
  - Enterprise ERP / LIMS database connectivity (e.g. SQL schema or SAP QM integration) and near-infrared (NIR) spectrometer continuous inline moisture analyzer driver.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/grading-and-routing/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/grading-and-routing/tests/grading.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/grading-and-routing/js/grading-engine.js`
- **Class:** `GradingEngine`
- **State Fields:**
  ```typescript
  interface GradingAndRoutingState {
    activeLot: {
      finishedLotId: string;
      batchId: string;
      vendorLotId: string;
      vendorId: string;
      grade: string;
      moisturePercent: number;
      infusionScore: number;
      netMassKg: number;
      targetBinId: string;
      disposition: 'PENDING' | 'RELEASED' | 'ON_HOLD' | 'REJECTED';
      decisionReason: string | null;
      routingState: 'IDLE' | 'ROUTED' | 'HOLD_LOCKED' | 'BLOCKED_FULL_BIN';
      unroutedMassKg: number;
      routedMassKg: number;
    };
    bins: Array<BinState>;
    faultLATCH: boolean;
    faultReason: string | null;
    routingHistory: Array<RoutingRecord>;
  }
  ```
- **Replacement Hook:** Replace `routeMaterial` or `setDisposition` in `projects/grading-and-routing/js/grading-engine.js` with your validated PLC diverter logic or LIMS database integration.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 8**: `subproject/03-dryer-controls` (`projects/dryer-control/`).
