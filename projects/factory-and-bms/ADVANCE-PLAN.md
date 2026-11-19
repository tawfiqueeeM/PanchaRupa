# Advance Work Plan — Factory Expansion Planning (subproject/factory-and-bms)

## Lead Department & Work Groups
- **Lead:** Dept 3 Controls & Electrical
- **Contributors:** Dept 1 Production Engineering, Dept 2 Capacity & Operations, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/factory-and-bms`
- **Source Paths:**
  - Factory Expansion Architecture: `projects/factory-and-bms/`
  - Building Automation System (BMS / SD-anlegg): `projects/virtual-factory/building-automation/`
- **Demo Route:** `demos/building-automation/` (served at `/demos/building-automation/index.html`)

## Requirements & Scope
1. **Factory Expansion Master Planning (Opening vs 5th-Year Layout):**
   - Opening-Day Footprint: 1 processing line (1 heated drum, 1 roller, 1 dryer, manual packing, 1,000 kg/month nominal capacity, 50 kVA electrical connection).
   - 5th-Year Footprint: Dual parallel processing lines, secondary withering trough bays, robotic packaging cell, automated dust extraction, expanded dry warehouse storage (5,000 kg/month, 150 kVA substation).
   - Space reservation: Reserved machine bays, truck turning aprons, high-voltage utility easements, piping manifolds.
   - Cost analysis: Early enabling expenditure (BDT 250,000) vs later retrofit & shutdown disruption cost (BDT 850,000).
2. **Building Automation & Supervisory Control (SD-anlegg):**
   - Ventilation system control: AHU supply and exhaust fans with differential pressure air proving.
   - Finished goods warehouse climate control: Temperature (20–24°C) and relative humidity monitoring (< 65% RH). Injected humidity excursion triggers high-humidity storage alarm.
   - Utility metering: Modbus electrical power meter tracking cumulative kWh and instantaneous active power (kW).
   - Communication diagnostics: Stale meter alarm triggered when Modbus polling fails or heartbeats stop for > 15 seconds.
   - Energy KPI: Real-time calculation of kWh consumed per kilogram of released tea over matching operational shifts.
3. **Scenarios:**
   - **Nominal Operations Day:** Ventilation fan scheduled ON, warehouse humidity stable at 58% RH, active power meter reading 18.5 kW, energy intensity 1.45 kWh/kg released.
   - **Missing Ventilation Proof:** Fan commanded ON, proof drops FALSE -> Interlock trip, alarm beacon.
   - **Warehouse Humidity Excursion:** Humidity rises to 78% RH -> Climate alarm trip, dehumidifier boost.
   - **Stale Meter Fault:** Modbus communication frozen -> Stale meter alarm flagged.
4. **Acceptance Checks:**
   - Automated unit tests in `projects/virtual-factory/building-automation/tests/bms.test.js`.
   - Standalone browser execution at `/demos/building-automation/index.html`.
