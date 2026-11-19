# Handoff to Codex — Tea Dryer Controls & Safety Interlocks (Project 02 / Order 8)

## Metadata & Scope
- **Lead Department:** Dept 3 Controls & Electrical
- **Contributing Departments:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/03-dryer-controls`
- **Source Paths:**
  - Logic & Specification: `projects/dryer-control/`
  - Interactive Demo: `demos/dryer-control/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/03-dryer-controls`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Dynamic thermal chamber model with adjustable temperature setpoint (nominal 95°C).
  - Modulated heat command output ($CV$) responding to thermocouple temperature ($PV$).
  - Hard fan-proof interlock: circulating fan differential pressure switch (`%I3.0`) forces heat command to 0.0% instantly upon loss of airflow.
  - Rigorous 3-phase safety reset discipline:
    1. Alarm silencing via Acknowledge (`%I3.1`) CANNOT restore heating.
    2. Physical airflow must be re-established (`DI_FAN_PROOF = TRUE`).
    3. Operator must deliberately press the Restart pushbutton (`%I3.2`) to re-arm the burner.
  - Interactive browser HMI with hero temperature gauge, SCR heat output bar, alarm cause-and-effect panel, time-series trend log, and CSV/JSON export.
  - 3 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - First-order thermal time constant and scenario presets.
- **Missing / Deferred to Codex:**
  - Model predictive control (MPC) algorithm and physical Siemens S7-1200 / TIA Portal PLC tag export.

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/dryer-control/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/dryer-control/tests/dryer.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/dryer-control/js/dryer-engine.js`
- **Class:** `DryerEngine`
- **State Fields:**
  ```typescript
  interface DryerState {
    batchId: string;
    setpointC: number;
    measuredTempC: number;
    heatCommandPercent: number;
    fanProof: boolean;
    heatEnabled: boolean;
    batchActive: boolean;
    batchElapsedMin: number;
    batchComplete: boolean;
    alarmLatched: boolean;
    alarmAcked: boolean;
    alarmReason: string | null;
    trendHistory: Array<TrendPoint>;
  }
  ```
- **Replacement Hook:** Replace thermal simulation loop in `projects/dryer-control/js/dryer-engine.js` with your validated PID or MPC model.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 9**: `subproject/factory-and-bms` (`projects/factory-and-bms/`).
