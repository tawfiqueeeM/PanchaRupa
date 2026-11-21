# Handoff to Codex — Worker Shift Planning & Skills Matrix (Dept 2)

## Metadata & Scope
- **Lead Department:** Dept 2 Capacity & Operations
- **Contributing Departments:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/10-shifts-and-skills`
- **Source Paths:**
  - Logic & Specification: `projects/worker-shift-planning/`
  - Interactive Demo: `demos/worker-shift-planning/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Scope Classification (R25)
- **Delivered Capability:** Fixed Assignment Verification. Evaluates supplied worker-to-task assignments against competency matrices, skill certifications, attendance states, and temporal concurrency overlaps.
- **Explicitly Deferred / Pending:** Mathematical roster optimization (e.g. integer programming / CP-SAT algorithmic shift generation), dynamic overtime/idle equalization, and automated shift synthesis. These capabilities are deferred to future optimization solver integration.

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R25 (Explicit Scope Labeling):** Transparently labeled the deliverable as fixed assignment verification rather than roster optimization. Marked mathematical roster optimization, overtime/idle equalization, and automated schedule generation as deferred.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Added `Demo 10` identity badge in HMI header and aligned with Dept 2 Operations.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `6a4fbf8` (pushed commit on `subproject/10-shifts-and-skills`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Skill competency validation: flags `SKILL_MISMATCH` when worker lacks required workstation certification.
  - Concurrency overlap gating: flags `DOUBLE_BOOKING_CONFLICT` when a worker is assigned to concurrent tasks.
  - Absence detection: flags `WORKER_ABSENT` and uncovers assigned tasks when a worker is unavailable.
  - Shift coverage metrics (% covered minutes, count of violations).
  - Interactive browser HMI with worker roster, station coverage table, violation alerts, and CSV/JSON export.
  - 4 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Worker competency profiles and scenario presets.
- **Missing / Deferred to Codex:**
  - Algorithmic roster generation using mathematical optimization (MIP / CP-SAT) and automated shift re-balancing.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/worker-shift-planning/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/worker-shift-planning/tests/shift.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/worker-shift-planning/js/shift-engine.js`
- **Class:** `ShiftEngine`
- **State Fields:**
  ```typescript
  interface ShiftEngineState {
    workers: Array<WorkerProfile>;
    tasks: Array<ShiftTask>;
    assignments: Array<Assignment>;
    violations: Array<ViolationRecord>;
    coveragePct: number;
    isFeasible: boolean;
  }
  ```
- **Replacement Hook:** Replace `evaluateShift` in `projects/worker-shift-planning/js/shift-engine.js` with your validated workforce constraint solver or HRMS integration.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 12**: `subproject/08-procurement` (`projects/procurement-and-suppliers/`).
