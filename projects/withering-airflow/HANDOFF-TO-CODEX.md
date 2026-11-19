# Handoff to Codex — Withering Airflow & Moisture Dynamics (Project 03 / Order 3)

## Metadata & Scope
- **Lead Department:** Dept 1 Production Engineering
- **Contributing Departments:** Dept 3 Controls & Electrical, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/04-withering`
- **Source Paths:**
  - Logic & Specification: `projects/withering-airflow/`
  - Interactive Demo: `demos/withering-airflow/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/04-withering`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Continuous thin-layer moisture evaporation model driven by VFD fan airflow and ambient vapor pressure deficit.
  - Multi-run comparison calculating side-by-side moisture trajectories, elapsed hours to target, and cumulative fan energy (kWh).
  - Ambient environmental scenarios (Spring Nominal, Monsoon Humid, Autumn Dry).
  - Out-of-bounds sensor fault injection with alarm latching and automatic shut-off inhibit.
  - Interactive browser HMI with animated fan speed icon, live instrumentation telemetry gauges, comparison table, event ledger, and CSV/JSON exports.
  - 3 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Thin-layer kinetic rate constants and ambient temperature/RH presets.
- **Missing / Deferred to Codex:**
  - Dynamic psychrometric Mollier chart solver and real-time CFD moisture gradient model across multiple tray layers.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/withering-airflow/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/withering-airflow/tests/withering.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/withering-airflow/js/withering-engine.js`
- **Class:** `WitheringEngine`
- **State Fields:**
  ```typescript
  interface WitheringState {
    batchId: string;
    leafMassKg: number;
    initialMoisture: number;
    targetMoisture: number;
    currentMoisture: number;
    sensorReading: number;
    sensorFault: boolean;
    sensorValid: boolean;
    fanSpeedPercent: number;
    fanRatedPowerKw: number;
    ambient: { name: string; tempC: number; rh: number; baseRate: number };
    elapsedHours: number;
    cumulativeFanKwh: number;
    targetReached: boolean;
    trajectory: Array<TrajectoryPoint>;
  }
  ```
- **Replacement Hook:** Replace `simulateFullRun` or `stepTime` with your differential equation solver or psychrometric drying model.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 4**: `subproject/05-golden-tea-processing` (`projects/golden-tea-sequence/`).
