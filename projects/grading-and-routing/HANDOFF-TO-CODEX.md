# Handoff to Codex — Grading & Routing Interlocks (Project 06 / Order 7)

## Metadata & Scope
- **Lead Department:** Dept 4 Quality & Traceability
- **Contributing Departments:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/06-grading-and-routing`
- **Source Paths:**
  - Logic & Specification: `projects/grading-and-routing/`
  - Interactive Demo: `demos/grading-and-routing/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/06-grading-and-routing`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Quality grading and disposition gate: Material must be explicitly `RELEASED` before routing is permitted.
  - Mandatory decision reason logging for quality audit compliance.
  - Multi-bin destination management: Bin 1 (Grade A), Bin 2 (Grade B), Bin 3 (Grade C) with capacity tracking.
  - Full-bin interlock protection: If destination bin is at capacity or locked, transfer conveyor immediately drops, retaining source lot ID (`F-G01`) and mass in the surge hopper.
  - Fault acknowledgement and rerouting workflow restoring transfer eligibility.
  - End-to-end lot genealogy tracking linking Vendor Deliveries → Batch → Finished Lot → Bin with exact mass conservation.
  - Interactive browser HMI with visual genealogy chain, live bin fill bars, fault alarm banners, event ledger, and CSV/JSON export.
  - 3 automated unit tests running in Node.js test runner (`node --test`).
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
      grade: string;
      disposition: 'PENDING' | 'RELEASED' | 'ON_HOLD' | 'REJECTED';
      decisionReason: string | null;
      routingState: 'IDLE' | 'ROUTING' | 'ROUTED' | 'BLOCKED_FULL_BIN' | 'HOLD_LOCKED';
      unroutedMassKg: number;
      routedMassKg: number;
      targetBinId: string;
    };
    bins: Array<{
      binId: string;
      name: string;
      capacityKg: number;
      currentOccupancyKg: number;
      isLocked: boolean;
    }>;
    faultLATCH: boolean;
    faultReason: string | null;
    routingHistory: Array<RoutingRecord>;
  }
  ```
- **Replacement Hook:** Replace `routeMaterial` or `setDisposition` in `projects/grading-and-routing/js/grading-engine.js` with your validated relational database or PLC routing routine.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 8**: `subproject/03-dryer-controls` (`projects/dryer-control/`).
