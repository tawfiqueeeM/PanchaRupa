# Advance Plan — Maintenance Planning, Asset Registers & Outage Impact (Project 13)

## 1. Requirements & Operational Scope
- **Lead Departments:** Depts 7 (Business) & 2 (Operations)
- **Branch:** `subproject/13-maintenance`
- **Target Paths:**
  - `projects/maintenance-planning/`
  - `demos/maintenance-planning/`
- **Key Objectives:**
  1. Factory asset register with hierarchy, runtime tracking, and criticality rating (Fluid Bed Dryer, Tea Roller, Fixation Drum, Withering Blower, Delta Robot).
  2. Dual work order management: Planned Preventative Maintenance (PM) vs Unplanned Emergency Breakdown (CM).
  3. Work order linkage: Linking each maintenance work order directly to an asset ID, failure event or PM schedule, maintenance window, assigned technician, and required spare parts.
  4. Production schedule & dispatch impact: Evaluating queued batches and dispatch delays resulting from machine outages.
  5. Side-by-side comparison: Planned PM service window (controlled non-peak hours, zero lost production batches) vs Unplanned Breakdown (active shift halt, 120-minute outage, queued work-in-process, missed dispatch window).
  6. Interactive UI with work order creator, failure injection toggle, asset health gauges, and CSV/JSON export.

## 2. Permitted Files & Directory Map
```
projects/maintenance-planning/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── maintenance_scenarios.json
├── docs/
│   └── maintenance-rules.md
├── js/
│   └── maintenance-engine.js
├── tests/
│   └── maintenance.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/maintenance-planning/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Asset Object:**
  - `assetId`: E.g. `AST-DRY-01`, `AST-ROL-01`, `AST-DRM-01`, `AST-ROB-01`.
  - `name`: Equipment name.
  - `criticality`: `HIGH`, `MEDIUM`, `LOW`.
  - `runtimeHours`: Cumulative hours since last overhaul.
  - `mtbfHours`: Mean Time Between Failures.
  - `status`: `OPERATIONAL`, `MAINTENANCE_PLANNED`, `TRIPPED_OUTAGE`.
- **Work Order Object:**
  - `woId`: Work order identifier (`WO-PM-2026-01`, `WO-EM-2026-09`).
  - `type`: `PREVENTATIVE` or `CORRECTIVE`.
  - `assetId`: Target asset.
  - `priority`: `LOW`, `MEDIUM`, `CRITICAL`.
  - `scheduledStart`: Time offset in minutes or timestamp.
  - `durationMinutes`: Downtime duration.
  - `status`: `OPEN`, `IN_PROGRESS`, `COMPLETED`.
  - `partsCostBdt`: Material cost.
  - `laborHours`: Labor effort.
  - `scheduleImpact`: Batches delayed, minutes queued, dispatch delay.

## 4. Verification Plan
- Unit tests: `node --test projects/maintenance-planning/tests/maintenance.test.js`
- Test cases:
  1. Asset register runtime and health index calculation.
  2. Planned PM execution maintains zero dispatch delay.
  3. Unplanned emergency breakdown halts asset, marks status `TRIPPED_OUTAGE`, and calculates queued batches and dispatch delays.
  4. Planned vs Unplanned cost & downtime variance comparison.
