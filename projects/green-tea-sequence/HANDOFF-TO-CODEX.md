# Handoff to Codex — Green Tea Sequence (Project 02)

## Metadata & Scope
- **Lead Department:** Dept 1 Production Engineering
- **Contributing Departments:** Dept 3 Controls & Electrical, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/02-green-tea-processing`
- **Source Paths:**
  - Logic & Specification: `projects/green-tea-sequence/`
  - Interactive Demo: `demos/green-tea-sequence/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/02-green-tea-processing`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Sequential machine progression: Heated Drum (Fixation) → Shared Roller (Shaping) → Shared Final Dryer (Drying).
  - Dynamic recipe selector (`GT-STD-01`, `GT-DEL-02`, `GT-ROAST-03`) with distinct cycle times, temperatures, and yield factors.
  - Resource contention interlocks: When Shared Roller or Shared Dryer are unavailable, active batch is held with retained ID `B-G01`, incoming mass, and explicit waiting reason.
  - Strict mass and completion accounting: Finished factory stock increments only after final dryer discharge completes.
  - Interactive browser UI featuring visual pipeline nodes, live station state badges, waiting alerts, stepping controls, auto-run sequencing, and data exports.
  - 4 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Synthetic recipe catalog and nominal/contention scenario presets.
- **Missing / Deferred to Codex:**
  - Integration with shared multi-product factory scheduler (Project 09) and physical PLC ladder/FBD engine.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/green-tea-sequence/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/green-tea-sequence/tests/green-tea.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/green-tea-sequence/js/green-tea-engine.js`
- **Class:** `GreenTeaEngine`
- **State Fields:**
  ```typescript
  interface GreenTeaSequenceState {
    activeBatch: {
      batchId: string;
      recipeId: string;
      productName: string;
      freshLeafKg: number;
      expectedOutputKg: number;
      actualOutputKg: number;
      currentStage: 'IDLE' | 'DRUM' | 'WAITING_FOR_ROLLER' | 'ROLLER' | 'WAITING_FOR_DRYER' | 'DRYER' | 'COMPLETED';
      waitingReason: string | null;
      stageElapsedMin: number;
      totalElapsedMin: number;
    };
    stations: {
      drum: { status: string; tempC: number; occupiedBy: string | null };
      roller: { isAvailable: boolean; status: string; blockReason: string | null; occupiedBy: string | null };
      dryer: { isAvailable: boolean; status: string; tempC: number; blockReason: string | null; occupiedBy: string | null };
    };
    totalFinishedKg: number;
    completedBatches: Array<CompletedBatchRecord>;
  }
  ```
- **Replacement Hook:** Plug in your discrete-event scheduler or PLC sequencer by implementing `stepLine()`, `setRollerAvailable()`, and `setDryerAvailable()`.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 3**: `subproject/04-withering` (`projects/withering-airflow/`).
