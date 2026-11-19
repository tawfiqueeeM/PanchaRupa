# Advance Work Plan — Withering Airflow (Project 03 / Order 3)

## Lead Department & Work Groups
- **Lead:** Dept 1 Production Engineering
- **Contributors:** Dept 3 Controls & Electrical, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/04-withering`
- **Source Path:** `projects/withering-airflow/`
- **Demo Route:** `demos/withering-airflow/` (served at `/demos/withering-airflow/index.html`)

## Requirements & Scope
1. **Withering Process & Airflow Model:**
   - Fresh leaf initial moisture (nominal 78.0%, range 70–82%).
   - Target withered leaf moisture: 65.0% (range 60–68%).
   - Airflow control command (`AO_FAN_SPEED`, 0–100%) driving centrifugal ventilation fan.
   - Ambient scenario matrix:
     - `SPRING-NOMINAL`: 25°C, 65% RH (Standard drying rate).
     - `MONSOON-HUMID`: 28°C, 88% RH (Reduced vapor pressure deficit, sluggish drying).
     - `DRY-WINTER`: 20°C, 50% RH (High vapor pressure deficit, accelerated surface drying).
2. **Comparison Trends:**
   - Multi-run comparison: Compare Run A (e.g. 50% fan) vs Run B (e.g. 90% fan) on identical batch.
   - Outputs: Moisture trajectory vs elapsed hours, total time to target (65%), fan hours, and fan kWh energy consumed.
3. **Invalid Reading & Sensor Fault Handling:**
   - Sensor input: `AI_MOISTURE_PROBE` (%IW70).
   - Injectable fault: Out-of-bounds reading (< 0% or > 100% or open-loop NaN).
   - Interlock action: When invalid reading is detected, trigger sensor fault alarm (`DO_SENSOR_FAULT`), flag invalid reading visually, and inhibit automatic moisture-based cutoff.
4. **Editable Assumptions:**
   - Tray leaf density: 4.5 kg/m².
   - Fan rated power: 0.75 kW.
   - Target moisture cutoff: 65.0%.
   - Moisture evaporation coefficient $k$.
5. **Exports:**
   - Time-series trend data as CSV (`withering-trajectory.csv`) and JSON snapshot.

## Permitted Paths
- `projects/withering-airflow/**`
- `demos/withering-airflow/**`

## Proposed Engine Contract for Codex
- **Inputs:** `setFanSpeed(0-100)`, `setInitialMoisture(val)`, `setAmbientScenario(key)`, `injectSensorFault(boolean)`, `runSimulation(hours)`
- **Outputs:** Moisture time series, fan energy kWh, final moisture %, completion status, sensor health.
- **Replacement Point:** `projects/withering-airflow/js/withering-engine.js`.
