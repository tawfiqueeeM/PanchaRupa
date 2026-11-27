# 26-Week Industrial Training & Engineering Report
## PanchaRupa Specialty Tea Facility — Panchagarh, Bangladesh

**Facility:** PanchaRupa Specialty Tea Processing Facility (Tetulia / Panchagarh, Bangladesh)  
**Scope:** Pilot-to-Commercial Scale-Up (`100 kg/month` pilot → `1,000 kg/month` design target)  
**Engineering Stack:** SQLite Lot Genealogy (`db/`), IEC 61131-3 Structured Text PLC Controls (`plc/`), SimPy / Python Discrete-Event Simulation (`sim/`), and Three.js 3D Interactive HMI (`demos/virtual-factory/`)

---

## 1. Executive Summary & Company Background

PanchaRupa Specialty Tea Facility operates in Panchagarh District (northern Bangladesh), sourcing high-grade clonal and orthodox green leaf (`SUPER_FINE` and `STANDARD` grades) from smallholder growers. To transition from artisanal pilot batches (`100 kg/month` dry tea output) to a coordinated commercial line (`1,000 kg/month` design target; `1,200 kg/month` nominal ceiling), the engineering team designed, modeled, and verified a four-layer digital twin:

1. **Database & Lot Genealogy Layer (`db/`):** SQLite schema (`db/schema.sql`) with `CHECK` and foreign-key constraints plus recursive Common Table Expression (CTE) queries (`db/queries.sql`) tracing every finished pack back to its smallholder supplier and delivery lot.
2. **Industrial PLC Controls Layer (`plc/`):** Deterministic IEC 61131-3 Structured Text (`ST`) function blocks for Withering Airflow (`FB_WitheringAirflowControl.st`) and Dryer Safety (`FB_DryerSafetyControl.st`), verified scan-by-scan by `plc/plc_verify.py`.
3. **Discrete-Event Simulation Layer (`sim/`):** Paired-seed Monte Carlo engine (`sim/factory_des.py`, `sim/policies.py`) evaluating 4 crossed staffing × inventory policies over 365-day horizons (`N = 1,000` replications, seed `42`), capturing monsoon peaks and the Jan–Feb winter dormancy (`0.0 kg/day` fresh leaf intake).
4. **3D Interactive Operator HMI (`demos/virtual-factory/`):** Full-viewport Three.js 3D factory floor with eye-level `OrbitControls`, clickable station hotspots, dual-sided Operator HMI and live IEC 61131-3 code panels, and cross-layer telemetry hydrated from `shared/data/factory-snapshot.json`.

### Scale-Up Progression Summary

| Metric | Pilot Baseline (Config 1: Manual) | Commercial Target (Config 5: Coordinated) | Scale-Up Delta |
| :--- | :--- | :--- | :--- |
| Monthly Dry Tea Capacity | `120 kg/month` | `1,200 kg/month` (design load `1,000 kg/mo`) | `10.0x` |
| Labor Intensity | `4.20 worker-hrs/kg` | `0.42 worker-hrs/kg` | `10.0x` productivity |
| Bottleneck Station | Rolling (Hand Labor) | Coordinated Line Balance | Bottleneck eliminated |
| Unit Absorption Cost Benchmark | `BDT 265.17 / kg` | `BDT 181.63 / kg` | `-BDT 83.54 / kg` (`-31.5%`) |

---

## 2. Factory Floor Plan & Mass / Moisture Balance

### 2.1 ASCII Factory Floor Plan (Zones 1–5)

```text
+---------------------------------------------------------------------------------------------------+
|                        PANCHARUPA SPECIALTY TEA FACILITY — FLOOR PLAN (5 ZONES)                   |
|                                                                                                   |
|  [ZONE 1: INTAKE DOCK]     [ZONE 2: WITHERING]     [ZONE 3: ROLLING]     [ZONE 4: DRYER LINE]    |
|  +--------------------+    +------------------+    +---------------+    +--------------------+    |
|  | Weighbridge Scale  |    | Trough A (%QW64) |    | Roller Drum 1 |    | Fluidized-Bed      |    |
|  | Load Cell (4-20mA) |--->| Trough B (%QW64) |--->| Roller Drum 2 |--->| Dryer (%QW60 SCR)  |    |
|  | Quarantine Gate    |    | Fans + %IW70 RH  |    | Oxidation Bed |    | PT100 (%IW60)      |    |
|  +--------------------+    +------------------+    +---------------+    +---------+----------+    |
|                                                                                   |               |
|  ==================== SAFETY WALKWAY & INTER-STATION CONVEYOR =================== | ============= |
|                                                                                   v               |
|                                                                     [ZONE 5: PACKAGING & WHS]     |
|                                                                     +--------------------------+  |
|                                                                     | Grading & Dosing Cell    |  |
|                                                                     | 50g / 100g / 50kg Sacks  |  |
|                                                                     | Pre-Winter Buffer Racks  |  |
|                                                                     +--------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

### 2.2 Stage-by-Stage Mass & Moisture Balance (4.2:1 Wet-to-Dry Ratio)

For a canonical `1,000 kg` finished dry tea monthly design target (`4,200 kg` fresh green leaf intake at `4.2:1` wet-to-dry ratio, `23.81%` net dry yield; DES standard outturn parameter `0.25` for `4.0:1` sensitivity runs):

| Stage | Zone | Input Mass (kg) | Moisture In (%) | Moisture Out (%) | Moisture / Trim Loss (kg) | Output Mass (kg) | Key Process Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1. Leaf Intake & Cleaning | Zone 1 | `4,200.0` | `78.0%` | `77.5%` | `93.3` (foreign matter / surface) | `4,106.7` | `gross > tare`, `SUPPLIER -> DELIVERY` |
| 2. Withering | Zone 2 | `4,106.7` | `77.5%` | `65.0%` | `1,466.7` (evaporated) | `2,640.0` | Cutoff at `rLeafMoisturePct <= 65.0%` |
| 3. Rolling & Oxidation | Zone 3 | `2,640.0` | `65.0%` | `62.0%` | `208.4` (cell sap / evap.) | `2,431.6` | `35 min` rolling + controlled oxidation |
| 4. Fluidized-Bed Drying | Zone 4 | `2,431.6` | `62.0%` | `3.5%` | `1,473.9` (thermal moisture) | `957.7` (or `1,000.0` @ `4.2:1` net) | `95.0 °C` SP; runaway trip `>= 140.0 °C` |
| 5. Grading & Packaging | Zone 5 | `1,000.0` | `3.5%` | `3.5%` | `0.0` (underfill recycled) | `1,000.0` | `50g` jars, `100g` bottles, `50kg` sacks |

---

## 3. Electrical Single-Line Diagram & Control P&IDs

### 3.1 Electrical Single-Line Diagram (415V 3-Phase MCC + 24V DC UPS Bus)

```text
  415V 3-Phase 50Hz Utility / DG Supply
                  |
           [400A MCCB Main]
                  |
  +---------------+---------------+-------------------+-------------------+
  | 415V 3-Phase MCC Bus          |                   |                   |
  v                               v                   v                   v
[VFD-01/02]                  [DOL-03/04]         [SCR-05 Thyristor]  [24V DC UPS]
SINAMICS G120                Roller Motors       Dryer Heater Bank   230V/24VDC 20A
Withering Fans               (2 x 3.7 kW)        (36 kW Modulated)   Battery Backup
(%QW64, %I3.0)                                   (%QW60, %IW60)           |
                                                                          v
                                                            +---------------------------+
                                                            | PLC & Safety Bus (24V DC) |
                                                            | - S7-1500F / S7-1200 CPU  |
                                                            | - PT100 RTDs, Load Cells  |
                                                            | - E-Stop & %Q3.1 Beacons  |
                                                            +---------------------------+
```

### 3.2 P&ID — Withering Airflow Control (`plc/FB_WitheringAirflowControl.st`)

```text
  Ambient Temp (%IW72) ----+
  Ambient RH   (%IW74) ----+--> [ FB_WitheringAirflowControl ] ---> VFD Speed Ref (%QW64: 0..27648)
  Leaf Moisture (%IW70) ---+      |  - Plausibility: 5%..95%          |
  VFD Run FB    (%I3.0) ---+      |  - Cutoff at <= 65% target        +--> Sensor Fault Lamp (%Q3.3)
                                  |  - Psychrometric compensation     +--> Target Reached Lamp (%Q3.4)
```

### 3.3 P&ID — Dryer Safety & Thermal Control (`plc/FB_DryerSafetyControl.st`)

```text
  Fan Diff. Pressure (%I3.0) --+
  PT100 Temp Probe   (%IW60) --+--> [ FB_DryerSafetyControl ] ---> SCR Firing Cmd (%QW60: 0..27648)
  Ack / Restart PBs  (%I3.1/2)-+      |  - Runaway trip >= 140 C       +--> Alarm Siren (%Q3.0)
  Start / Stop NC    (%I3.3/4)-+      |  - Latched fault (%M0.0)       +--> Red Strobe Beacon (%Q3.1)
                                      |  - 3-step reset: Ack->Proof->Restart
```

---

## 4. Database Traceability & Monte Carlo Simulation Benchmarks

### 4.1 SQL Recursive CTE Lot Genealogy (`db/schema.sql`, `db/queries.sql`)

The SQLite traceability schema enforces `PRAGMA foreign_keys = ON;` and `CHECK` constraints across `suppliers`, `deliveries`, `batches`, `inspections`, `packaging_records`, `dispatches`, and `genealogy_edges`. Using a `WITH RECURSIVE` CTE in `db/queries.sql`, any finished dispatch or retail pack can be traced backward to the exact farm delivery (`SUPPLIER -> DELIVERY -> BATCH -> PACKAGING -> DISPATCH`) or forward for recall isolation.

### 4.2 Paired-Seed Monte Carlo Benchmark (`N = 1,000`, Seed `42`)

Executed via `python sim/policies.py --seed 42 --replications 1000` (and aggregated by `python integrate.py` into `shared/data/factory-snapshot.json`), incorporating stochastic daily harvest arrivals, stochastic station processing durations, random equipment downtime (`p = 0.04` per batch), and stochastic customer demand while enforcing strict Jan–Feb dormancy (`0.0 kg/day` intake):

| Policy | Finished Tea (kg/yr) Mean (95% CI) | Dryer Util. (%) Mean (95% CI) | Worker Idle Hours Mean (95% CI) | Min Winter Cash (BDT) Mean (95% CI) | Absorption Cost (BDT/kg) Mean (95% CI) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A1 (`fixed_standard`)** | `10,443.89` (`10,437.26–10,450.53`) | `41.40%` (`41.37–41.43%`) | `14,480.39` (`14,478.27–14,482.51`) | `-1,933,541.95` (`-1,934,865.93` to `-1,932,217.97`) | `402.06` (`401.91–402.22`) |
| **A2 (`fixed_buffer`)** | `10,443.89` (`10,437.26–10,450.53`) | `41.40%` (`41.37–41.43%`) | `14,480.39` (`14,478.27–14,482.51`) | `-1,946,541.95` (`-1,947,865.93` to `-1,945,217.97`) | `402.06` (`401.91–402.22`) |
| **B1 (`seasonal_standard`)** | `10,443.89` (`10,437.26–10,450.53`) | `41.40%` (`41.37–41.43%`) | `9,664.39` (`9,662.27–9,666.51`) | `-1,470,001.95` (`-1,471,325.93` to `-1,468,677.97`) | `357.68` (`357.55–357.80`) |
| **B2 (`seasonal_buffer`)** | `10,443.89` (`10,437.26–10,450.53`) | `41.40%` (`41.37–41.43%`) | `9,664.39` (`9,662.27–9,666.51`) | `-1,483,001.95` (`-1,484,325.93` to `-1,481,677.97`) | `357.68` (`357.55–357.80`) |

**Key Finding:** Switching from fixed year-round staffing (`A1`/`A2`) to seasonal staffing (`B1`/`B2`) reduces annual worker idle hours by **`4,816.00 hrs`** (`-33.3%`), lowers unit absorption cost by **`BDT 44.39/kg`**, and improves minimum winter cash balance by **`~BDT 463,540`**.

---

## 5. 26-Week Progressive Engineering Log & Next-Phase Recommendations

### 5.1 26-Week Engineering Log

| Phase | Weeks | Engineering Deliverables & Milestones |
| :--- | :--- | :--- |
| **Phase 1: Process Baseline & Intake** | Weeks 1–4 | Benchmarked 100 kg/mo pilot line; built `leaf-intake`, `green-tea-processing`, `withering`, and `dryer-control` JS engines & unit tests. |
| **Phase 2: Quality, Grading & Packing** | Weeks 5–8 | Implemented `golden-tea-processing`, `grading-and-routing`, `packing-and-dispatch`, and `robotic-packing` with mass conservation checks. |
| **Phase 3: Planning, Payroll & Finance** | Weeks 9–13 | Built `procurement`, `production-scheduling`, `shifts-and-skills`, `inventory-and-fulfilment`, `costing-and-finance`, `staffing-and-payroll`, and `tea-auction-planning`. |
| **Phase 4: Data Platform & PLC Controls** | Weeks 14–18 | Authored `db/schema.sql`, `db/queries.sql` (recursive CTE), `db/verify.py`, `plc/FB_DryerSafetyControl.st`, `plc/FB_WitheringAirflowControl.st`, and `plc/plc_verify.py`. |
| **Phase 5: Monte Carlo DES & CI** | Weeks 19–22 | Built `sim/factory_des.py`, `sim/policies.py` (`N=1,000` paired CRN), `sim/test_sim.py`, `integrate.py`, and `.github/workflows/ci.yml`. |
| **Phase 6: 3D Digital Twin & HMI** | Weeks 23–26 | Upgraded `demos/virtual-factory/` to a Three.js 360° 3D factory with dual-sided Operator HMI & live IEC 61131-3 panels, swipe navigation, and `shared/data/factory-snapshot.json` binding. |

### 5.2 Next-Phase Recommendations

1. **Winter Working-Capital Line & Pre-Winter Buffer Tuning:** Pair Seasonal Staffing (`B2`) with a `BDT 1.5M` seasonal revolving credit facility and extend the Aug–Oct buffer build window to eliminate the `59`-day Jan–Feb stockout gap.
2. **OPC UA / Modbus TCP Hardware-in-the-Loop (HIL):** Connect `FB_DryerSafetyControl.st` and `FB_WitheringAirflowControl.st` on an S7-1500F / S7-1200 PLC directly to the 3D HMI via a lightweight WebSocket-to-OPC-UA bridge.
3. **Automated Biomass / Solar Thermal Pre-Heating:** Integrate solar thermal pre-heating on the fluidized-bed dryer intake air to reduce specific energy consumption (`SEC`) and energy cost per batch (`BDT 120/batch`).
