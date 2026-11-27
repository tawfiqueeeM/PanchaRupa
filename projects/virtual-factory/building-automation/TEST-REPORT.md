# Test Report — Building Automation System (BMS / SD-Anlegg)

## Test Execution Summary
- **Test Suite:** `projects/virtual-factory/building-automation/tests/bms.test.js`
- **Execution Command:** `node --test projects/virtual-factory/building-automation/tests/bms.test.js`
- **Environment:** Node.js native test runner (zero external dependencies)
- **Status:** PASS (5/5 tests passed, 0 failures, 0 regressions)

## Detailed Test Cases

### 1. Ventilation Airflow Proof Loss and Alarm Trip
- **Objective:** Verify that commanded ventilation fan drops flow to 0 $m^3/h$ and trips `ventProofLoss` alarm when differential pressure sensor `%I7.1` drops low.
- **Verification:**
  - Initial command TRUE + proof TRUE -> flow = 4,500 $m^3/h$, alarm FALSE.
  - Set proof FALSE -> flow drops to 0 $m^3/h$, alarm `ventProofLoss` becomes TRUE.
  - Acknowledgment silences alarm latch without restoring airflow until proof returns.
- **Result:** PASS

### 2. Storage Room Humidity Excursion and Dehumidifier Trigger
- **Objective:** Verify that humidity exceeding $65.0\% \text{ RH}$ trips `highHumidity` alarm and engages dehumidifier output `%Q7.4`.
- **Verification:**
  - Baseline $58\% \text{ RH}$ -> alarm FALSE, dehumidifier FALSE.
  - Injected $78\% \text{ RH}$ -> alarm TRUE, dehumidifier TRUE.
  - Restored to $55\% \text{ RH}$ -> alarm clears, dehumidifier turns OFF.
- **Result:** PASS

### 3. Modbus Stale Meter Watchdog Timeout
- **Objective:** Verify that severed Modbus communications trigger watchdog timeout alarm after elapsed time exceeds 15 seconds.
- **Verification:**
  - Online polling -> heartbeat increments, timeout timer reset.
  - Severed polling -> timer advances past 15 seconds, alarm `staleMeter` trips TRUE.
- **Result:** PASS

### 4. Specific Energy Consumption KPI Calculation
- **Objective:** Verify accurate specific energy calculation ($kWh/\text{kg}$) based on cumulative electrical energy and released production mass.
- **Verification:**
  - Total cumulative energy 58.00 kWh with 40.0 kg released finished tea -> calculated specific energy $1.45\text{ kWh/kg}$.
  - Advancing time integrates additional power and updates specific energy deterministically.
- **Result:** PASS

### 5. Regression: Zero Production Denominator Protection
- **Objective:** Verify that when zero production is released, specific energy consumption returns `null` rather than a stale or division-by-zero ratio.
- **Verification:**
  - Injected `ZERO-PRODUCTION` scenario with `shiftReleasedTeaKg: 0`.
  - Stepped simulation time 5 min.
  - Asserted `productionEnergy.releasedTeaKg === 0` and `productionEnergy.kwhPerReleasedKg === null`.
- **Result:** PASS

## Browser & Interface Verification
- **Direct Route Launch:** `http://localhost:8080/demos/building-automation/` loads cleanly without errors.
- **Responsive Viewport Verification (R22):** Verified via Edge CDP: Desktop (1440px) `scrollWidth: 1401px`, Mobile (390px) `scrollWidth: 390px` with zero horizontal overflow.
- **Console Errors:** 0 unhandled exceptions.
