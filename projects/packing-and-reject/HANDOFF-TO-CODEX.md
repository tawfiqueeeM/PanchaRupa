# Handoff to Codex — Packing & Reject Interlocks (Project 07 / Order 5)

## Metadata & Scope
- **Lead Department:** Dept 1 Production Engineering
- **Contributing Departments:** Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/07-packing-and-dispatch`
- **Source Paths:**
  - Logic & Specification: `projects/packing-and-reject/`
  - Interactive Demo: `demos/packing-and-reject/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/07-packing-and-dispatch`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Precision two-stage dosing logic: coarse feed (%Q4.0) and fine trickle feed (%Q4.1).
  - Multi-format packaging: 50 g retail bottles, 100 g retail bottles, and 25 kg bulk auction bags.
  - Checkweighing tolerance gates with automatic reject pusher (%Q4.2) activation for short/over fills.
  - Strict single dispatch: Valid packs enter dispatch manifest exactly once; rejected packs are physically excluded and quarantined.
  - Upstream source lot genealogy preservation: Rejected packs retain finished lot ID (`F-G01`, `F-O01`) and measured net mass.
  - Closed mass reconciliation: Total dosed mass = Total dispatched mass + Total rejected mass.
  - Interactive browser HMI with animated checkweigher deck, live feeder/pusher indicators, dual manifests, and CSV/JSON export.
  - 3 automated unit tests running in Node.js test runner (`node --test`).
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
      checkweighStatus: 'PENDING' | 'PASSED' | 'REJECTED_UNDERFILL' | 'REJECTED_OVERFILL';
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
