# Handoff to Codex — Packing & Reject Interlocks (Project 07 / Order 5)

## Metadata & Scope
- **Lead Department:** Dept 1 Production Engineering
- **Contributing Departments:** Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/07-packing-and-dispatch`
- **Source Paths:**
  - Logic & Specification: `projects/packing-and-reject/`
  - Interactive Demo: `demos/packing-and-reject/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R09 (Reset & Seeded Determinism):** Fixed container ID progression after reset so `reset()` resets `this.serialCounter = 1` and restores initial container `PK-0001`. Replaced unseeded `Math.random()` with seeded deterministic variation sequence for reproducible scenario execution.
  - **R09 (Negative / Non-finite Dosing Guard):** Hardened `runFineDosing()` and `dispatch()` against non-positive/non-finite mass inputs (`w <= 0`). Negative mass is blocked at boundary and cannot corrupt `massLedger` or `rejectHistory`.
  - **R22 (Mobile Viewport 390px):** Resolved CSS grid min-width blowout and added mobile scale font sizing. Verified `scrollWidth === 390px` at 390px mobile viewport with zero horizontal scrolling.
  - **R24 (Demo & Subproject Identity):** Verified Demo 07 identity and Dept 1 Production Engineering alignment in HMI badge.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `ec8f86c` (pushed commit on `subproject/07-packing-and-dispatch`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Precision two-stage dosing logic: coarse feed (%Q4.0) and fine trickle feed (%Q4.1).
  - Multi-format packaging: 50 g retail bottles, 100 g retail bottles, and 25 kg bulk auction bags.
  - Checkweighing tolerance gates with automatic reject pusher (%Q4.2) activation for short/over fills.
  - Strict single dispatch: Valid packs enter dispatch manifest exactly once; duplicate dispatch blocked.
  - Defect quarantine & traceability: Rejected packs retain finished lot ID (`F-G01`, `F-O01`) and measured net mass.
  - Closed mass reconciliation: Total dosed mass = Total dispatched mass + Total rejected mass.
  - Reset & Seeded Dosing: Replaying scenarios produces deterministic dosing, and `reset()` cleanly returns to container `PK-0001` with zeroed ledgers.
  - Boundary Protection: Non-positive or non-finite mass is blocked from dosing or entering the mass ledger.
  - Interactive browser HMI with animated checkweigher deck, live feeder/pusher indicators, dual manifests, and CSV/JSON export.
  - 5 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Packaging format specifications and nominal/underfill presets.
- **Missing / Deferred to Codex:**
  - High-speed checkweigher fieldbus driver (e.g. Ethernet/IP or Modbus TCP) and multi-head combination weigher dispersion modeling.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/packing-and-reject/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/packing-and-reject/tests/packing.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/packing-and-reject/js/packing-engine.js`
- **Class:** `PackingEngine`
- **State Fields:**
  ```typescript
  interface PackingEngineState {
    activePack: {
      packId: string;
      sourceLotId: string;
      formatId: string;
      formatName: string;
      targetNetG: number;
      actualNetG: number;
      dosingState: 'EMPTY' | 'COARSE_DONE' | 'FINE_DONE';
      checkweighStatus: 'PENDING' | 'PASSED' | 'REJECTED_UNDERFILL' | 'REJECTED_OVERFILL' | 'INVALID';
      dispatchStatus: 'NOT_DISPATCHED' | 'DISPATCHED' | 'REJECTED_QUARANTINE';
      rejectPusherActive: boolean;
    };
    massLedger: {
      totalDosedG: number;
      totalDispatchedG: number;
      totalRejectedG: number;
      countDispatched: number;
      countRejected: number;
    };
    dispatchedHistory: Array<PackRecord>;
    rejectHistory: Array<RejectRecord>;
  }
  ```
- **Replacement Hook:** Replace `runCoarseDosing`, `runFineDosing`, and `checkweigh` in `projects/packing-and-reject/js/packing-engine.js` with your validated load-cell PLC logic.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 6**: `subproject/15-robotic-packing` (`projects/robotic-packing/`).
