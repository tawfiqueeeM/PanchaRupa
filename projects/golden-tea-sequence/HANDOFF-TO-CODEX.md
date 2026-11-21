# Handoff to Codex — Golden Tea Sequence (Project 05)

## 1. Status & Subproject Metadata
- **Status:** `READY FOR CODEX RE-REVIEW`
- **Subproject ID:** Project 05 (Demo 05)
- **Lead Department:** Dept 2 Capacity & Operations (in coordination with Dept 1 Production Engineering & Dept 4 Quality)
- **Git Branch:** `subproject/05-golden-tea-processing`
- **Assigned Directories:**
  - Logic & Specification: `projects/golden-tea-sequence/`
  - Interactive Demo: `demos/golden-tea-sequence/`
- **Tested Implementation Revision:** `88440b2` (plus corrective commit on branch)
- **Shared Foundation Fix:** `88440b2` (cherry-picked from `7f18e1c`)

---

## 2. Review Findings Addressed in this Pass

| Review Finding ID | Description | Resolution & Evidence |
|:---|:---|:---|
| **API Boundary** | External lock could preempt dryer while golden batch was actively drying; completed batch restart unguarded | Prohibited external dryer seizure while golden batch is executing. Prohibited restarting completed batch without new ID or reset. Regression test 4 passing. |
| **R22 (Mobile)** | Whole document overflowed at 390px | Added responsive styles, `max-width: 100%`, and touch-friendly local scrolling for `.pipeline-flow`. Browser verified via Edge CDP: `scrollWidth === 390px` at 390px viewport width (0px horizontal overflow). |
| **R24 (Identity)** | Demo number labeled Demo 04; department labeled Dept 1 | Corrected identity to Project 05 / Demo 05, Lead Department: Dept 2 Capacity & Operations. |
| **R03 (Launch)** | Standardized server launch instructions | Documented `python shared/serve.py 8080` with direct URL `http://localhost:8080/demos/golden-tea-sequence/`. |

---

## 3. Verification Commands & Observed Results

### 3.1 Unit Test Execution
Command:
```bash
node --test projects/golden-tea-sequence/tests/golden-tea.test.js
```
Observed Output:
```text
TAP version 13
# Subtest: GoldenTeaEngine - Leaf eligibility gate prevents ineligible leaf processing
ok 1 - GoldenTeaEngine - Leaf eligibility gate prevents ineligible leaf processing
# Subtest: GoldenTeaEngine - Nominal 4-stage progression: Withering -> Rolling -> Oxidation -> Drying
ok 2 - GoldenTeaEngine - Nominal 4-stage progression: Withering -> Rolling -> Oxidation -> Drying
# Subtest: GoldenTeaEngine - Shared dryer mutual exclusion blocks second batch and avoids concurrent ownership
ok 3 - GoldenTeaEngine - Shared dryer mutual exclusion blocks second batch and avoids concurrent ownership
# Subtest: GoldenTeaEngine - Regression: Dryer ownership cannot be stolen during active drying, completed batch restart guarded
ok 4 - GoldenTeaEngine - Regression: Dryer ownership cannot be stolen during active drying, completed batch restart guarded
1..4
# tests 4
# suites 0
# pass 4
# fail 0
```

### 3.2 Browser & Mobile Viewport Verification
- **Command:** Launch `python shared/serve.py 8080` and open `http://localhost:8080/demos/golden-tea-sequence/`.
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1416px (0px document overflow).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (0px document overflow).
- **Unrun Checks:** Chemical enzymatic oxidation kinetics equations remain deferred.

---

## 4. Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/golden-tea-sequence/js/golden-tea-engine.js`
- **Class:** `GoldenTeaEngine`
- **State Fields:**
  ```typescript
  interface GoldenTeaSequenceState {
    activeBatch: {
      batchId: string;
      lotId: string;
      isLeafEligible: boolean;
      currentStage: 'IDLE' | 'WITHERING' | 'ROLLER' | 'OXIDATION' | 'WAITING_FOR_DRYER' | 'DRYER' | 'COMPLETED';
      waitingReason: string | null;
      totalElapsedMin: number;
      freshKg: number;
      expectedOutputKg: number;
      selectedProfile: OxidationProfile;
    };
    sharedDryer: {
      state: 'FREE' | 'BUSY_GREEN' | 'BUSY_GOLDEN';
      ownerBatchId: string | null;
    };
    totalFinishedGoldenKg: number;
    completedBatches: Array<CompletedGoldenBatchRecord>;
  }
  ```
- **Deferred Work:** Dynamic multi-product factory scheduler integration (Project 09).
