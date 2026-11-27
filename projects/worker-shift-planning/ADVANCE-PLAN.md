# Advance Plan — Worker Shift Planning & Skills Matrix (Project 10)

## 1. Requirements & Operational Scope
- **Lead Department:** Dept 2 Operations & Capacity Planning
- **Branch:** `subproject/10-shifts-and-skills`
- **Target Paths:**
  - `projects/worker-shift-planning/`
  - `demos/worker-shift-planning/`
- **Key Objectives:**
  1. Synthetic workforce roster with multi-skill competencies (Tea Master, Operator, Packaging Specialist, Seasonal Worker).
  2. Workstation staffing requirements across factory operations (Intake, Withering, Fixation, Rolling, Oxidation, Drying, Packing).
  3. Strict operator concurrency constraint: No single worker can be assigned to multiple simultaneous stations ($\text{Overlap} = \emptyset$).
  4. Roster modes: Fixed standard roster vs Seasonal expanded roster.
  5. Absence and exception modeling: Worker absence scenario identifying uncovered station minutes and missed production deadlines.
  6. Double-booking conflict detector flagging overlap violations.
  7. Interactive timeline and staffing matrix UI with editable presence/skills, uncovered work visualization, and CSV/JSON export.

## 2. Permitted Files & Directory Map
```
projects/worker-shift-planning/
├── ADVANCE-PLAN.md
├── fixtures/
│   └── shift_scenarios.json
├── docs/
│   └── skills-and-roster-rules.md
├── js/
│   └── shift-engine.js
├── tests/
│   └── shift.test.js
├── DEPARTMENT-WORK-NOTE.md
├── TEST-REPORT.md
├── HANDOFF-TO-CODEX.md
└── README.md

demos/worker-shift-planning/
├── index.html
├── style.css
└── app.js
```

## 3. Data Contract & Domain Model
- **Worker Object:**
  - `id`: Synthetic identifier (e.g. `W-01`, `W-02`, `W-03`, `W-04`).
  - `name`: Role title (`Lead Tea Master`, `Process Operator`, `Packaging Specialist`, `Seasonal Assistant`).
  - `type`: `FIXED` or `SEASONAL`.
  - `isPresent`: Boolean.
  - `skills`: Array of qualified stations (`LEAF_INTAKE`, `WITHERING`, `FIXATION`, `ROLLING`, `OXIDATION`, `DRYING`, `PACKING`).
- **Station Assignment Object:**
  - `station`: Workstation identifier.
  - `startMin`: Shift minute offset from 08:00.
  - `endMin`: Shift minute offset.
  - `requiredSkill`: Skill identifier.
  - `assignedWorkerId`: Worker ID or `null` if uncovered.
- **Uncovered Work Violation:**
  - `station`: Station needing coverage.
  - `startMin`, `endMin`: Duration of gap.
  - `reason`: `WORKER_ABSENT` or `SKILL_DEFICIT`.

## 4. Verification Plan
- Unit tests: `node --test projects/worker-shift-planning/tests/shift.test.js`
- Test cases:
  1. Nominal full coverage in both Fixed and Seasonal rosters.
  2. Worker absence correctly flags uncovered station minutes.
  3. Worker double-booking overlap constraint enforcement.
  4. Skill mismatch validation (unqualified worker rejected).
