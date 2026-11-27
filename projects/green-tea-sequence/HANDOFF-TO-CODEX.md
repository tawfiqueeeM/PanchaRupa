# Handoff to Codex — Green Tea Sequence (Project 02)

## 1. Status & Subproject Metadata
- **Status:** `READY FOR CODEX RE-REVIEW`
- **Subproject ID:** Project 02 (Demo 02)
- **Lead Department:** Dept 2 Capacity & Operations (in coordination with Dept 1 Production Engineering & Dept 3 Controls)
- **Git Branch:** `subproject/02-green-tea-processing`
- **Assigned Directories:**
  - Logic & Specification: `projects/green-tea-sequence/`
  - Interactive Demo: `demos/green-tea-sequence/`
- **Tested Implementation Revision:** `5b984d95d6219a6ccdf9c70d1b0cd0e643a1882b`
- **Shared Foundation Fix:** `bc9db72` (cherry-picked from `7f18e1c`)

---

## 2. Review Findings Addressed in this Pass

| Review Finding ID | Description | Resolution & Evidence |
|:---|:---|:---|
| **API Boundary** | `startBatch()` allowed completed batch to restart with duplicate ID | Prohibited restarting completed batch with identical batch ID without distinct ID or reset. Regression test added and verified. |
| **R22 (Mobile)** | Whole document overflowed at 390px (width 579px) | Added responsive styles, `max-width: 100%`, and touch-friendly local scrolling for `.pipeline-flow`. Browser verified via Edge CDP: `scrollWidth === 390px` at 390px width (0px horizontal overflow). |
| **R24 (Identity)** | Conflicting department mapping (was labeled Dept 1) | Realigned identity: Project 02 / Demo 02 belongs to **Dept 2 Capacity & Operations**, with Dept 1 and Dept 3 contributing machine and interlock specifications. |
| **R03 (Launch)** | Standardized server launch instructions | Documented `python shared/serve.py 8080` with direct URL `http://localhost:8080/demos/green-tea-sequence/`. |

---

## 3. Verification Commands & Observed Results

### 3.1 Unit Test Execution
Command:
```bash
node --test projects/green-tea-sequence/tests/green-tea.test.js
```
Observed Output:
```text
TAP version 13
# Subtest: GreenTeaEngine - Nominal progression: Drum -> Roller -> Dryer -> Output Increment
ok 1 - GreenTeaEngine - Nominal progression: Drum -> Roller -> Dryer -> Output Increment
# Subtest: GreenTeaEngine - Roller contention retains batch ID and records waiting reason
ok 2 - GreenTeaEngine - Roller contention retains batch ID and records waiting reason
# Subtest: GreenTeaEngine - Dryer contention retains batch ID and records waiting reason
ok 3 - GreenTeaEngine - Dryer contention retains batch ID and records waiting reason
# Subtest: GreenTeaEngine - Recipe selection modifies duration, temps and expected yield
ok 4 - GreenTeaEngine - Recipe selection modifies duration, temps and expected yield
# Subtest: GreenTeaEngine - Regression: Completed batch cannot be restarted with duplicate ID
ok 5 - GreenTeaEngine - Regression: Completed batch cannot be restarted with duplicate ID
1..5
# tests 5
# suites 0
# pass 5
# fail 0
```

### 3.2 Browser & Mobile Viewport Verification
- **Command:** Launch `python shared/serve.py 8080` and navigate to `http://localhost:8080/demos/green-tea-sequence/`.
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1416px (0px document overflow).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (0px document overflow).
- **Unrun Checks:** Native TIA Portal PLC cyclic program generation remains deferred.

---

## 4. Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/green-tea-sequence/js/green-tea-engine.js`
- **Class:** `GreenTeaEngine`
- **State Fields:**
  ```typescript
  interface GreenTeaSequenceState {
    activeBatch: {
      batchId: string;
      recipeId: string;
      currentStage: 'IDLE' | 'DRUM' | 'WAITING_FOR_ROLLER' | 'ROLLER' | 'WAITING_FOR_DRYER' | 'DRYER' | 'COMPLETED';
      waitingReason: string | null;
      stageElapsedMin: number;
      totalElapsedMin: number;
      freshLeafKg: number;
      expectedOutputKg: number;
    };
    stations: {
      drum: { status: 'STANDBY' | 'RUNNING' | 'COMPLETE'; tempC: number; occupiedBy: string | null };
      roller: { status: 'STANDBY' | 'RUNNING' | 'COMPLETE'; isAvailable: boolean; blockReason: string | null; occupiedBy: string | null };
      dryer: { status: 'STANDBY' | 'RUNNING' | 'COMPLETE'; isAvailable: boolean; blockReason: string | null; occupiedBy: string | null };
    };
    totalFinishedKg: number;
    completedBatches: Array<CompletedBatchRecord>;
  }
  ```
- **Deferred Work:** Integration with shared multi-product factory scheduler (Project 09) and physical PLC ladder/FBD engine.
