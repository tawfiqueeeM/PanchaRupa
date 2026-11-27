# Advance Work Plan — Green Tea Sequence (Project 02)

## Lead Department & Work Groups
- **Lead:** Dept 1 Production Engineering
- **Contributors:** Dept 3 Controls and Electrical, Dept 5 HMI and Simulation, Dept 6 Testing and Portfolio
- **Git Branch:** `subproject/02-green-tea-processing`
- **Source Path:** `projects/green-tea-sequence/`
- **Demo Route:** `demos/green-tea-sequence/` (served at `/demos/green-tea-sequence/index.html`)

## Requirements & Scope
1. **Station Progression Interlock:**
   - Sequential machine flow: Heated Drum (Fixation) → Shared Roller (Rolling) → Shared Final Dryer (Drying) → Quality Hand-off.
   - Enforce strict sequential permissives: Drum MUST precede Rolling; Rolling MUST precede Drying. No station skipping.
2. **Recipe Management:**
   - Provide selectable recipe configurations:
     - `GT-STD-01`: Standard Green Tea (Drum 230°C / 35 min, Roller 30 min, Dryer 95°C / 60 min, Yield factor 0.25).
     - `GT-DEL-02`: Spring Delicate Flush (Drum 210°C / 25 min, Roller 20 min, Dryer 90°C / 50 min, Yield factor 0.26).
     - `GT-ROAST-03`: High Roast Green (Drum 245°C / 40 min, Roller 35 min, Dryer 105°C / 65 min, Yield factor 0.24).
3. **Queue & Resource Contention Interlock:**
   - Simulate shared equipment contention: Shared Roller and Shared Dryer availability can be toggled by the operator.
   - When downstream machine is busy/unavailable:
     - Preceding batch retains its unique batch ID (`B-G01`), fresh mass (120 kg), and current process state.
     - System transitions to explicit waiting state: `WAITING_FOR_ROLLER` or `WAITING_FOR_DRYER`.
     - Displays explicit waiting reason ("Station occupied by Golden Tea batch B-O01" or "Mechanical cleaning / maintenance interlock").
   - Restoring availability allows handoff to proceed cleanly. Output counter increments ONLY after final drying discharge handshake is completed.
4. **Scenarios:**
   - **Nominal (DAY-40 B-G01):** 120 kg fresh leaf, GT-STD-01, all stations available -> Drum (35m) -> Roll (30m) -> Dry (60m) -> 30 kg finished green tea.
   - **Roller Contention / Lockout:** Roller flagged BUSY while drum finishes; drum retains B-G01 with waiting reason until roller freed.
   - **Dryer Contention / Lockout:** Dryer busy; roller retains B-G01 until dryer freed.
   - **Full Reset:** Deterministic restoration to initial queue state.
5. **Exports:**
   - Export sequence timeline, station state log, and batch records as CSV and JSON.

## Permitted Paths
- `projects/green-tea-sequence/**`
- `demos/green-tea-sequence/**`

## Proposed Engine Contract for Codex
- **State Model:**
  ```typescript
  interface GreenTeaSequenceState {
    activeBatch: {
      batchId: string;
      recipeId: string;
      productName: string;
      freshLeafKg: number;
      expectedOutputKg: number;
      actualOutputKg: number;
      currentStage: 'IDLE' | 'DRUM' | 'WAITING_ROLLER' | 'ROLLER' | 'WAITING_DRYER' | 'DRYER' | 'COMPLETED';
      waitingReason: string | null;
      stageElapsedMin: number;
      totalElapsedMin: number;
    };
    stations: {
      drum: { status: 'IDLE' | 'RUNNING' | 'COMPLETE'; tempC: number; batchId: string | null };
      roller: { isAvailable: boolean; status: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'LOCKED'; batchId: string | null };
      dryer: { isAvailable: boolean; status: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'LOCKED'; tempC: number; batchId: string | null };
    };
    completedBatches: Array<CompletedBatchRecord>;
    eventLedger: Array<EventLogEntry>;
  }
  ```
- **Replacement Point:** `projects/green-tea-sequence/js/green-tea-engine.js`.

## Acceptance Checks
- Automated unit test suite via `node --test projects/green-tea-sequence/tests/green-tea.test.js`.
- Direct launch and scenario verification at `/demos/green-tea-sequence/index.html`.
