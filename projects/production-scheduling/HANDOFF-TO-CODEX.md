# Handoff to Codex — Production Scheduling & Machine Calendar (Dept 2)

## Metadata & Scope
- **Lead Department:** Dept 2 Capacity & Operations
- **Contributing Departments:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/09-production-scheduling`
- **Source Paths:**
  - Logic & Specification: `projects/production-scheduling/`
  - Interactive Demo: `demos/production-scheduling/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R12 (Immutable Base Scaling):** Duration adjustments now compute strictly from stored immutable base parameters (`baseQuantityKg` and `baseDurationMin`). Toggling quantity 10 -> 5 -> 10 kg reproduces the original schedule exactly without rounding drift.
  - **R13 (Cleanup Interval Reservation):** Changeover and clean intervals between incompatible runs are now explicitly registered as `CLEANUP` calendar slots on shared machines, preventing third batch tasks from scheduling during cleanup.
  - **R14 (Order Due Time Checking):** Order feasibility is checked against each batch's individual `targetTime` as well as the 17:00 shift cutoff. Orders finishing after their due time are flagged late even if they complete before 17:00.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Corrected subproject identity badge to `Demo 09`, Dept 2 Operations.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `b73d8b6` (pushed commit on `subproject/09-production-scheduling`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Discrete constraint programming engine for machine scheduling.
  - Mutual exclusion on shared assets (`SHARED_ROLLER`, `SHARED_DRYER`).
  - Explicit changeover cleanup slot reservation between different product varieties.
  - Outage injection and before-vs-after rescheduling comparison.
  - Exact order due time checking against individual target due times and shift limits.
  - Deterministic quantity rescaling referencing base durations.
  - Interactive browser HMI with Gantt calendar visualization, scenario presets, and JSON/CSV export.
  - 7 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Scenario definitions and stage durations.
- **Missing / Deferred to Codex:**
  - Advanced integer linear programming (MIP/CP-SAT) solver for multi-objective optimization across multiple days and workforce shifts.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/production-scheduling/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/production-scheduling/tests/scheduling.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/production-scheduling/js/scheduling-engine.js`
- **Class:** `SchedulingEngine`
- **State Fields:**
  ```typescript
  interface SchedulingEngineState {
    shiftStartMin: number;
    shiftEndMin: number;
    orders: Array<OrderRecord>;
    outages: Array<OutageRecord>;
    schedule: ScheduleResult;
    baselineSchedule: ScheduleResult;
  }
  ```
- **Replacement Hook:** Replace `computeSchedule` in `projects/production-scheduling/js/scheduling-engine.js` with your validated mathematical optimization solver (e.g. OR-Tools or Z3).

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 11**: `subproject/10-shifts-and-skills` (`projects/shifts-and-skills/`).
