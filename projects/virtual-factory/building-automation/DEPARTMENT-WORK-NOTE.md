# Department Work Note — Building Automation System (BMS / SD-Anlegg)

## 1. Department Overview
- **Subproject:** 09 / Row 9 — Building Automation System (BMS / SD-Anlegg) and Factory Expansion
- **Branch:** `subproject/factory-and-bms`
- **Scope:** Supervisory control and telemetry for HVAC/AHU ventilation differential pressure proof monitoring, finished tea warehouse environmental relative humidity and temperature regulation, electrical incomer Modbus RTU metering with stale communications watchdog, and plant-wide specific energy consumption KPI ($kWh/\text{kg}$).

## 2. Implemented Architecture & Logic
1. **HVAC Air Handling Unit (AHU-01) Interlock:**
   - PLC output `%Q7.0` issues run command to supply fan.
   - Differential pressure sensor `%I7.1` must verify airflow proof.
   - If `%Q7.0` is TRUE but `%I7.1` is FALSE, system trips to alarm state, forces airflow rate to 0 $m^3/h$, and activates latching alarm requiring operator acknowledgment (`acknowledgeVentAlarm()`).
2. **Warehouse Climate & Humidity Gate:**
   - Finished tea warehouse transmitter continuously measures temperature (°C) and relative humidity (% RH).
   - Maximum allowable relative humidity threshold is strictly capped at $65.0\% \text{ RH}$ to prevent mould formation and tea quality degradation.
   - If relative humidity exceeds $65.0\%$, high humidity alarm activates, and dehumidifier unit (`%Q7.4`) is commanded ON.
3. **Modbus RTU Incomer Power Metering:**
   - Polling engine queries active power (kW) and cumulative consumption (kWh) over Modbus RTU.
   - Watchdog timer tracks communication heartbeat elapsed time.
   - If communications are lost or stale for $\ge 15\text{ seconds}$, a `STALE-METER-TIMEOUT` alarm trips, notifying operators of telemetry loss.
4. **Energy Efficiency KPI ($kWh/\text{kg}$):**
   - Integrates active electrical consumption against cumulative released finished tea output mass.
   - Evaluates performance against target intensity benchmark ($< 2.00\text{ kWh/kg}$).

## 3. Physical & Simulation Fixtures
- Fixture path: `projects/virtual-factory/building-automation/fixtures/bms_scenarios.json`
- Contains 4 operational scenarios:
  1. `NOMINAL-OPS-DAY`: Balanced ventilation, normal storage climate ($58\% \text{ RH}$), online metering.
  2. `VENTILATION-PROOF-LOSS`: Fan commanded RUN, proof lost, alarm tripped.
  3. `HUMIDITY-EXCURSION-TRIP`: Humidity spike to $78\% \text{ RH}$, triggering dehumidifier.
  4. `STALE-METER-TIMEOUT`: Modbus communication failure exceeding watchdog threshold.
