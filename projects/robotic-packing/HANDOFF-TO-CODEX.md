# Handoff to Codex — Robotic Packing Cell (Project 15 / Order 6)

## Metadata & Scope
- **Lead Departments:** Dept 1 Production Engineering & Dept 3 Controls and Electrical
- **Contributing Departments:** Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/15-robotic-packing`
- **Source Paths:**
  - Logic & Specification: `projects/robotic-packing/`
  - Interactive Demo: `demos/robotic-packing/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R19 (Format Changeover with Partial Carton):** Interlocked `switchFormat()` so any partial carton is preserved with individual bottle IDs (`BT-50-xxxx`) and diverted into a traceable rework manifest (`DIVERTED_TO_REWORK`). Closed bottle accountability ensures `bottlesProcessed = bottlesInCurrentCarton + sealedBottles + reworkedBottles + purgedBottles` with zero dropped bottles.
  - **R19 (Motion & Fault Inhibit):** Gated format changeover against arm states: blocked during `INTERRUPTED_HOLD` (fault hold) and motion (`INDEXING`, `GRIPPING`, `TRANSIT`).
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with responsive carton grid and zero horizontal overflow.
  - **R24 (Demo Identity):** Corrected subproject identity badge to `Demo 15`, preserving original project numbering (Project 15).
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `198f38f` (pushed commit on `subproject/15-robotic-packing`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Full discrete I/O handshake simulation between PLC and robot controller (`%I5.0`..`%I5.4`, `%Q5.0`..`%Q5.4`).
  - Dynamic format changeover between 50 g (12 bottles, 4x3 matrix) and 100 g (6 bottles, 3x2 matrix).
  - Vacuum loss fault detection with immediate emergency arm freeze (`INTERRUPTED_HOLD`).
  - Safe purge recovery workflow: arm diverts damaged bottle to purge bin, homes to zero datum, and clears fault without corrupting carton pocket tally.
  - Strict bottle accountability across format switches: partial cartons diverted to rework with serial numbers preserved.
  - Interactive browser HMI with animated kinematic arm status, live handshake registers, visual carton matrix, event ledger, and CSV/JSON export.
  - 5 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Kinematic cycle durations (1.5s / 2.0s per pick) and scenario presets.
- **Missing / Deferred to Codex:**
  - Native robot programming interface (e.g. KUKA KRL, ABB RAPID, or Fanuc TP) and ROS 2 / MoveIt 3D inverse kinematics trajectory planning.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/robotic-packing/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/robotic-packing/tests/robotic-packing.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/robotic-packing/js/robotic-packing-engine.js`
- **Class:** `RoboticPackingEngine`
- **State Fields:**
  ```typescript
  interface RoboticPackingState {
    format: { formatId: string; name: string; bottlesPerCarton: number; cols: number; rows: number };
    armState: 'IDLE' | 'INDEXING' | 'GRIPPING' | 'TRANSIT' | 'PLACED' | 'INTERRUPTED_HOLD' | 'PURGING';
    interrupted: boolean;
    interruptionReason: string | null;
    counts: {
      bottlesProcessed: number;
      bottlesInCurrentCarton: number;
      cartonsCompleted: number;
      bottlesPurged: number;
    };
    cartonSlots: Array<{ slotIndex: number; filled: boolean; bottleId: string | null }>;
    completedCartons: Array<CartonRecord>;
  }
  ```
- **Replacement Hook:** Replace `stepCycle` or `executeRecoveryPurge` in `projects/robotic-packing/js/robotic-packing-engine.js` with your validated robot controller driver or trajectory simulator.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 7**: `subproject/06-grading-and-routing` (`projects/grading-and-routing/`).
