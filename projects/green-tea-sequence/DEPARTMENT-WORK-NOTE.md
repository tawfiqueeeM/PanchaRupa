# Department Work Note — Green Tea Sequence (Project 02)

## Contributing Departments
- **Lead: Dept 2 Capacity & Operations**
  - Defined physical machine sequencing: Heated drum (fixation at 210–245°C) MUST precede shared roller (30 min shaping), and shared roller MUST precede shared final dryer (90–105°C).
  - Specified shared machine queue arbitration: when downstream roller or dryer is busy (e.g., handling golden tea batch B-O01), preceding station enters explicit hold (`WAITING_FOR_ROLLER`, `WAITING_FOR_DRYER`) while strictly retaining batch ID `B-G01`, incoming mass, and elapsed processing history.
  - Required completed final discharge handoff before incrementing released stock output.
- **Dept 1 Production Engineering & Dept 3 Controls**
  - Provided interlocking register map: `%I1.0` (Roller Permissive), `%I2.0` (Dryer Permissive), `%Q1.0` (Drum Run), `%Q1.1` (Roller Run), `%Q1.2` (Dryer Run), `%Q1.3` (Discharge Gate).
- **Dept 5 HMI & Simulation**
  - Built interactive physical pipeline flow UI at `/demos/green-tea-sequence/` featuring animated station nodes, live temperature/cycle readouts, resource lockout toggles, waiting reason alert banner, step-by-step and auto-run sequencing controls, responsive layout (390px viewport certified), and CSV/JSON export.
- **Dept 6 Testing & Portfolio**
  - Authored automated unit test suite in `projects/green-tea-sequence/tests/green-tea.test.js` validating nominal progression, roller contention holding, dryer contention holding, recipe parameter switching, completed batch restart guard, and verified output conservation.

## 21 November 2026 Audit Corrections
- **API Hardening (Batch Restart Guard):** `startBatch()` prohibits restarting a completed batch with the same batch ID without a fresh distinct identity or full reset. Regression test added and verified.
- **R22 (Mobile 390px Viewport):** Contained `.pipeline-flow` scroller to `max-width: 100%` and enabled local touch scrolling, achieving `scrollWidth === 390px` at 390px viewport width (zero page overflow).
- **R24 (Identity & Department):** Fixed department mapping to Dept 2 Capacity & Operations (Demo 02 / Project 02).
- **R03 (Launch):** Standardized launch command to `python shared/serve.py 8080`.
