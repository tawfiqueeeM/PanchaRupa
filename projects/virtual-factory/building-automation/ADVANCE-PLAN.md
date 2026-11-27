# Advance Work Plan — Building Automation System (SD-anlegg / BMS)

## Lead Department & Route Mapping
- **Lead:** Dept 3 Controls & Electrical
- **Contributors:** Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/factory-and-bms`
- **Source Path:** `projects/virtual-factory/building-automation/`
- **Demo Route:** `demos/building-automation/` (served at `/demos/building-automation/index.html`)

## Key Supervisory Capabilities
1. **AHU Ventilation Scheduling & Proof Interlock:**
   - Command supply & exhaust fans (`CMD_VENT_FAN`).
   - Monitor differential pressure airflow sensor (`DI_VENT_PROOF`, %I7.0).
   - If fan commanded ON but proof drops FALSE: Latch `VENT_PROOF_LOSS_ALARM`.
2. **Storage Climate & Humidity Excursion:**
   - Finished goods tea storage room relative humidity sensor (`AI_ROOM_RH`, %IW90).
   - High humidity alarm setpoint: 65.0% RH (maximum safe threshold for dried tea hygroscopic degradation).
   - Above 65.0% RH: Latch `CLIMATE_HUMIDITY_EXCURSION` alarm.
3. **Utility Energy Metering & Stale Meter Detection:**
   - Main incomer Modbus power meter (`MTR_ACTIVE_POWER_KW`, `MTR_CUMULATIVE_KWH`).
   - Communication heartbeat tracking: If meter packet update delta exceeds 15 seconds or user clicks "Stop Meter Updates":
     - Latch `STALE_METER_ALARM` (%M7.3).
4. **Energy KPI: kWh per Released kg:**
   - Real-time specific energy consumption:
     $$\text{SEC} = \frac{\text{Cumulative kWh}}{\text{Released kg of tea}}$$
   - Operational baseline: ~1.45 kWh / kg released.
5. **Exports:**
   - Time-series environmental log, energy points, and BMS alarms as CSV and JSON.

## Permitted Paths
- `projects/virtual-factory/building-automation/**`
- `demos/building-automation/**`
- `projects/factory-and-bms/**`
