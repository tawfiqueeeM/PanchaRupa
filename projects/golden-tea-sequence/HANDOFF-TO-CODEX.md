# Handoff to Codex — Golden Tea Sequence (Project 05 / Order 4)

## Metadata & Scope
- **Lead Department:** Dept 1 Production Engineering
- **Contributing Departments:** Dept 3 Controls & Electrical, Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/05-golden-tea-processing`
- **Source Paths:**
  - Logic & Specification: `projects/golden-tea-sequence/`
  - Interactive Demo: `demos/golden-tea-sequence/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/05-golden-tea-processing`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Mandatory leaf eligibility validation gate (`GOLDEN_ELIGIBLE` qualification required).
  - 4-stage sequential machine flow: Withering Trays → Shared Roller → Oxidation Racks → Shared Final Dryer.
  - Profile-driven oxidation control (`OX-LIGHT-01`, `OX-MED-02`, `OX-DEEP-03`) with target humidity, temperatures, and liquor characteristics.
  - Shared Final Dryer mutual exclusion arbitration preventing simultaneous ownership by Green and Golden batches.
  - Output conservation: Finished golden tea increments only upon final dryer discharge.
  - Animated browser HMI with stage status cards, mutual exclusion panel, eligibility toggle, event ledger, and CSV/JSON exports.
  - 3 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Synthetic oxidation profiles and nominal/contention presets.
- **Missing / Deferred to Codex:**
  - Multi-line dynamic factory scheduler integration (Project 09) and chemical enzymatic oxidation kinetics equations.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/golden-tea-sequence/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/golden-tea-sequence/tests/golden-tea.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/golden-tea-sequence/js/golden-tea-engine.js`
- **Class:** `GoldenTeaEngine`
- **State Fields:**
  ```typescript
  interface GoldenTeaSequenceState {
    activeBatch: {
      batchId: string;
      lotId: string;
      isLeafEligible: boolean;
      freshKg: number;
      expectedOutputKg: number;
      actualOutputKg: number;
      currentStage: 'IDLE' | 'WITHERING' | 'ROLLER' | 'OXIDATION' | 'WAITING_FOR_DRYER' | 'DRYER' | 'COMPLETED';
      waitingReason: string | null;
      totalElapsedMin: number;
    };
    sharedDryer: {
      state: 'FREE' | 'RESERVED_GOLDEN' | 'BUSY_GOLDEN' | 'RESERVED_GREEN' | 'BUSY_GREEN';
      ownerBatchId: string | null;
      tempC: number;
      durationMin: number;
    };
    totalFinishedGoldenKg: number;
    completedBatches: Array<CompletedBatchRecord>;
  }
  ```
- **Replacement Hook:** Implement your formal Petri net or state machine in `projects/golden-tea-sequence/js/golden-tea-engine.js`.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 5**: `subproject/07-packing-and-dispatch` (`projects/packing-and-reject/`).
