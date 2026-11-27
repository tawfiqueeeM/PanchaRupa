# Advance Plan — Production Scheduling (Project 09)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 2 Operations & Capacity Planning
- **Branch:** `subproject/09-production-scheduling`
- **Target Paths:**
  - `projects/production-scheduling/`
  - `demos/production-scheduling/`
- **Key Objectives:**
  1. Multi-product batch scheduling: Green Tea (Fixation Drum -> Roller -> Dryer -> Packing) and Golden Tea (Withering Trough -> Roller -> Oxidation -> Dryer -> Packing).
  2. Shared machine calendar constraints: Strict mutual exclusion on the shared Roller and Dryer assets with mandatory changeover cleaning allowance.
  3. Machine outage modeling: Injection of planned/unplanned maintenance outages (e.g. Dryer breakdown).
  4. Deterministic rescheduling engine: Re-computes start/finish times, detects infeasibilities (exceeding shift end cutoff 17:00 or conflicting reservations), and outputs detailed side-by-side Before vs After metrics.
  5. Interactive timeline/Gantt browser UI with editable order parameters, outage toggling, constraint validation, and export capabilities (JSON/CSV).

## 2. Permitted Files & Directory Map
```
projects/production-scheduling/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── schedule_scenarios.json
├── docs/
│   └── scheduling-rules.md
├── js/
│   └── scheduling-engine.js
├── tests/
│   └── scheduling.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/production-scheduling/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Batch Object:**
  - `id`: Unique batch identifier (`B-G01`, `B-GL01`).
  - `product`: `GREEN_TEA` or `GOLDEN_TEA`.
  - `quantityKg`: Finished tea target mass (e.g. 30 kg Green, 10 kg Golden).
  - `freshLeafKg`: Calculated from net yield (25% yield -> $4 \times \text{quantityKg}$).
  - `steps`: Array of task steps with `machine`, `durationMin`, `cleanMin`, `startTime`, `endTime`, `status`.
- **Machine Calendar:**
  - Available window: 08:00 to 17:00 (540 minutes).
  - Outage blocks: `machine`, `startMin`, `endMin`, `reason`.
- **Infeasibility Criteria:**
  - Any task finishing after shift end (17:00 / 540 min).
  - Any machine reservation overlap between distinct batches.

## 4. Verification Plan
- Native test suite: `node --test projects/production-scheduling/tests/scheduling.test.js`
- Tests covering:
  1. Nominal conflict-free schedule generation (DAY-40 baseline).
  2. Shared machine contention detection (overlap between Green and Golden rolling/drying).
  3. Outage injection and automatic reschedule shifting.
  4. Infeasibility flagging when delayed jobs exceed shift limits.
