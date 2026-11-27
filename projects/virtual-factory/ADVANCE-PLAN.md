# Advance Plan — Integrated Factory Capstone & Five-Configuration Simulator (Row 20)

## 1. Executive Summary
- **Subproject:** 20 / Row 20 (Capstone) — Integrated Factory
- **Target Branch:** `subproject/14-integrated-factory`
- **Lead Department:** Dept 5 (HMI & Simulation) with representation from all 7 departments (Depts 1–7)
- **Primary Routes:**
  - Logic & Documentation: `projects/virtual-factory/`
  - Browser Capstone Portal: `demos/virtual-factory/` (Direct URL: `http://localhost:8000/demos/virtual-factory/`)

## 2. Core Objectives & Architecture
1. **Portfolio-Wide Capstone Navigation:**
   - Unified control panel linking all factory routes across the 7 engineering and operations departments.
   - Comprehensive **Integration Status & Missing Engines Matrix** documenting which sub-engines exist natively on their respective subproject branches and how the integrated capstone aggregates or mocks external domain signals.
2. **Five Historical & Modern Factory Configurations:**
   - Configuration 1: `MANUAL` (Foundational cottage processing — manual hand rolling, tray pan drying, high labor, low yield).
   - Configuration 2: `HEATED_DRUM` (Early mechanization — wood/gas heated rotary panning drum, manual rolling).
   - Configuration 3: `AUTOMATED_DRYING` (Intermediate automation — continuous conveyor dryer, manual rolling).
   - Configuration 4: `MACHINE_ROLLING` (Mechanized rolling table & automated dryer, manual packing).
   - Configuration 5: `COORDINATED_FACTORY` (Modern PanchaRupa proposed factory — coordinated shared roller/dryer scheduling, robotic packing cell, BMS environmental control, end-to-end lot traceability).
3. **Founder-Reported vs Simulated Output Rigor:**
   - Strict UI and model segregation between historical founder-reported numbers (100 kg/month pilot, 1,000 kg/month design capacity) and dynamically computed simulation outputs.
   - Identical load replay: 1,000 kg design order book replayed across all 5 configurations to isolate bottleneck migration, labor intensity (worker-hours/kg), SEC (kWh/kg), unit manufacturing cost (BDT/kg), and lead times.
4. **Interactive HMI & Real-Time Exports:**
   - Comprehensive dashboard featuring configuration switcher, station load meters, bottleneck indicators, financial bridge, and live JSON/CSV export.
   - Native Node.js test suite (`node --test`) with zero runtime npm dependencies.

## 3. Engineering Work Breakdown
1. `projects/virtual-factory/docs/five-configurations-matrix.md`: Deep comparative specifications, bottleneck shifts, and integration status matrix.
2. `projects/virtual-factory/fixtures/configurations_dataset.json`: Canonical dataset containing parameters and baseline benchmarks for all 5 configurations.
3. `projects/virtual-factory/js/integrated-factory-engine.js`: Pure ES module capstone simulation engine.
4. `projects/virtual-factory/tests/integrated-factory.test.js`: Native unit tests verifying configuration comparison, bottleneck detection, and metrics.
5. `demos/virtual-factory/index.html`, `style.css`, `app.js`: Interactive multi-station capstone browser application.
6. Documentation files: `DEPARTMENT-WORK-NOTE.md`, `TEST-REPORT.md`, `HANDOFF-TO-CODEX.md` (marked `READY FOR CODEX REVIEW`), and `README.md`.
