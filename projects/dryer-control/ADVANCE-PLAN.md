# Advance Work Plan — Dryer Controls & Fan Proof Interlocks (Project 02 / Order 8)

## Lead Department & Work Groups
- **Lead:** Dept 3 Controls & Electrical
- **Contributors:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/03-dryer-controls`
- **Source Path:** `projects/dryer-control/`
- **Demo Route:** `demos/dryer-control/` (served at `/demos/dryer-control/index.html`)

## Requirements & Scope
1. **Dryer Thermal Control Loop:**
   - Adjustable setpoint $SP$ (nominal 95.0°C, range 70–120°C).
   - Measured process variable $PV$ (`AI_DRYER_TEMP_PV`, %IW60).
   - Modulated heat command output $CV$ (`AO_HEAT_COMMAND`, %QW60, 0–100%).
   - Simulated first-order plus dead time (FOPDT) thermal response.
2. **Fan Proof Interlock & Trip Action:**
   - Circulating air differential pressure switch (`DI_FAN_PROOF`, %I3.0).
   - Inviolable Safety Rule: If fan proof is lost (`DI_FAN_PROOF = FALSE`), heat command $CV$ must drop to exactly 0.0% immediately.
3. **Three-Phase Safety Reset Discipline:**
   - Acknowledge vs Clear vs Deliberate Restart:
     - Step 1: Trip occurs → Alarm latches (`DO_ALARM_BEACON = TRUE`), heat cut.
     - Step 2: Operator presses "Acknowledge" (`CMD_ACK`) → Siren silences, but **acknowledgement alone CANNOT re-energize heat**.
     - Step 3: Fan physical proof is restored (`DI_FAN_PROOF = TRUE`).
     - Step 4: Operator presses "Deliberate Restart" (`CMD_RESTART`) → Burner re-arms and heating resumes.
4. **Scenarios:**
   - **Nominal (DRY-NORMAL):** 95°C SP, continuous proof, smooth heat ramp and temperature stabilization, normal 60 min batch completion.
   - **Fan Proof Loss Trip & Recovery (DRY-FAULT):** Lost proof injected; heat drops to 0%; tested that Acknowledge alone does not restore heat; proof cleared + deliberate restart restores heating.
   - **Reset:** Full deterministic restoration.
5. **Exports:**
   - Export time-series trends (Time, SP, PV, Heat CV, Fan Proof, Alarm State) as CSV and JSON.

## Permitted Paths
- `projects/dryer-control/**`
- `demos/dryer-control/**`

## Proposed Engine Contract for Codex
- **State Model:**
  ```typescript
  interface DryerControlState {
    setpointC: number;
    measuredTempC: number;
    heatCommandPercent: number;
    fanProof: boolean;
    alarmLatched: boolean;
    alarmAcknowledged: boolean;
    batchActive: boolean;
    batchElapsedMin: number;
    trendHistory: Array<TrendPoint>;
  }
  ```
- **Replacement Point:** `projects/dryer-control/js/dryer-engine.js`.
