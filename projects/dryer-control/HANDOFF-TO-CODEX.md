# Handoff to Codex — Tea Dryer Controls & Safety Interlocks (Project 03 / Order 8)

## Metadata & Scope
- **Lead Department:** Dept 3 Controls and Electrical
- **Contributing Departments:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/03-dryer-controls`
- **Source Paths:**
  - Logic & Specification: `projects/dryer-control/`
  - Interactive Demo: `demos/dryer-control/`
- **Status:** `READY FOR CODEX RE-REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Audit Corrections Applied:**
  - **R06 (Faulted Incomplete Drying):** Gated batch completion and elapsed processing time accumulation so they only accumulate when heat is active, fan proof is healthy, and the chamber is in the operating drying range. Permanent fan-proof loss / unheated states record `batchStatus: FAULTED_INCOMPLETE` without declaring completion at ambient 25°C.
  - **R06 (Inactive Batch Restart Guard):** Hardened `deliberateRestart()` so it cannot energize or re-arm heaters for an inactive, stopped, or already completed batch.
  - **R22 (Mobile Viewport 390px):** Verified mobile layout via Edge CDP (`scrollWidth === 390px` at 390px mobile viewport) with zero horizontal overflow.
  - **R24 (Demo Identity):** Corrected subproject identity badge to `Demo 03`, Dept 3 Controls & Electrical.
  - **R03 (Server Root):** Integrated dynamic repository root detection via shared fix.
- **Implementation Revision Tested:** `90138ca` (pushed commit on `subproject/03-dryer-controls`)

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - First-order thermal chamber response with proportional heating modulation (`%QW60`).
  - Circulating fan proof differential pressure switch supervision (`%I3.0`).
  - Immediate fail-safe cutoff: loss of fan proof forces heat command to 0.0% immediately.
  - 3-Phase Safety Reset discipline: Acknowledge (%I3.1) -> Clear Proof (%I3.0) -> Deliberate Restart (%I3.2).
  - Validated processing time accumulation: batches unheated or faulted during loss of proof do not falsely complete and are recorded as `FAULTED_INCOMPLETE`.
  - Inactive batch protection: deliberate restart cannot re-arm heat when a batch is not actively running.
  - Interactive browser HMI with animated temperature meters, heat command bar, safety reset controls, and CSV/JSON trend export.
  - 6 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - First-order thermal model constants (gain = 5.0, time constant dt = 0.15 min⁻¹).
- **Missing / Deferred to Codex:**
  - Complete PID controller implementation with anti-windup integration and burner flame safety relay (e.g. UV scanner / Honeywell flame safeguard) hardware driver.

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
  interface DryerEngineState {
    batchId: string;
    setpointC: number;
    measuredTempC: number;
    heatCommandPercent: number;
    fanProof: boolean;
    heatEnabled: boolean;
    batchActive: boolean;
    batchStatus: 'IDLE' | 'RUNNING' | 'FAULTED_INCOMPLETE' | 'COMPLETE' | 'STOPPED';
    batchElapsedMin: number;
    batchComplete: boolean;
    alarmLatched: boolean;
    alarmAcked: boolean;
    alarmReason: string | null;
    trendHistory: Array<TrendPoint>;
  }
  ```
- **Replacement Hook:** Replace `stepTime` and `deliberateRestart` in `projects/dryer-control/js/dryer-engine.js` with your validated PLC safety block and hardware I/O driver.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 9**: `subproject/factory-and-bms` (`projects/virtual-factory/building-automation/`).
