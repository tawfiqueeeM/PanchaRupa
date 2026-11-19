# Advance Work Plan — Golden Tea Sequence (Project 05 / Order 4)

## Lead Department & Work Groups
- **Lead:** Dept 1 Production Engineering
- **Contributors:** Dept 3 Controls & Electrical, Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/05-golden-tea-processing`
- **Source Path:** `projects/golden-tea-sequence/`
- **Demo Route:** `demos/golden-tea-sequence/` (served at `/demos/golden-tea-sequence/index.html`)

## Requirements & Scope
1. **Leaf Eligibility Quality Gate:**
   - Enforce leaf eligibility requirement: Golden tea requires tender bud/leaf lots classified as `GOLDEN_ELIGIBLE`.
   - Ineligible leaf (standard coarse green leaf) is rejected with explicit interlock: "LEAF INELIGIBLE: Requires GOLDEN_ELIGIBLE grade".
2. **Four-Stage Sequence Interlock:**
   - Sequential station progression: Withering Trays → Shared Roller → Oxidation Rack → Shared Final Dryer → Finished Stock.
   - Enforce sequential permissives: Premature transfer is blocked; each stage must reach completion before handoff.
3. **Oxidation Profile Management:**
   - Selectable oxidation profiles:
     - `OX-LIGHT-01`: Light Golden Flush (60 min @ 24°C / 90% RH, Yield 0.25).
     - `OX-MED-02`: Classic Amber Golden (90 min @ 25°C / 90% RH, Yield 0.25).
     - `OX-DEEP-03`: Deep Muscatel (120 min @ 26°C / 92% RH, Yield 0.24).
4. **Shared-Dryer Mutual Exclusion Interlock:**
   - The final dryer is shared between Green Tea and Golden Tea.
   - Dryer reservation states: `FREE`, `RESERVED_FOR_GOLDEN`, `RESERVED_FOR_GREEN`, `BUSY_GREEN`, `BUSY_GOLDEN`.
   - When the dryer is busy/reserved by another batch (e.g. Green batch `B-G01`), the Golden batch finishing oxidation enters `WAITING_FOR_DRYER`.
   - Simultaneous ownership by two batches is strictly impossible.
   - Output increments only upon completed final drying discharge.
5. **Scenarios:**
   - **Nominal (DAY-40 B-O01):** 40 kg fresh leaf, Golden Eligible, Classic Amber profile -> Withering (120m) -> Roller (30m) -> Oxidation (90m) -> Dryer (60m) -> 10.0 kg finished golden tea.
   - **Ineligible Leaf Rejection:** Attempt to start with ineligible coarse green leaf.
   - **Shared-Dryer Lockout / Contention:** Oxidation finishes while dryer is reserved by Green batch `B-G01`. Batch `B-O01` is held in oxidation chamber until dryer is freed.
   - **Reset:** Full deterministic restoration.
6. **Exports:**
   - Export recipe parameters, stage timeline, and reservation history as CSV and JSON.

## Permitted Paths
- `projects/golden-tea-sequence/**`
- `demos/golden-tea-sequence/**`

## Proposed Engine Contract for Codex
- **State Model:**
  ```typescript
  interface GoldenTeaSequenceState {
    activeBatch: {
      batchId: string;
      lotId: string;
      isLeafEligible: boolean;
      freshKg: number;
      expectedOutputKg: number;
      actualOutputKg: number;
      currentStage: 'IDLE' | 'WITHERING' | 'WAITING_ROLLER' | 'ROLLER' | 'OXIDATION' | 'WAITING_DRYER' | 'DRYER' | 'COMPLETED';
      waitingReason: string | null;
      oxidationProfile: OxidationProfile;
      totalElapsedMin: number;
    };
    sharedDryer: {
      reservationState: 'FREE' | 'RESERVED_GOLDEN' | 'RESERVED_GREEN' | 'BUSY_GOLDEN' | 'BUSY_GREEN';
      ownerBatchId: string | null;
      isAvailable: boolean;
    };
    completedBatches: Array<CompletedBatchRecord>;
  }
  ```
- **Replacement Point:** `projects/golden-tea-sequence/js/golden-tea-engine.js`.
