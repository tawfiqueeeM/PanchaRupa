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
4. **3D Interactive Operator HMI (`demos/virtual-factory/`):** Full-viewport Three.js 6-room L-shaped digital twin with ISA-101 / ISA-18.2 / ISA-5.1 High-Performance HMI, Light/Dark mode, dual-line Green/Golden Tea XOR priority routing, optical/vibratory sorting (`GR-01`, `OS-01`, `RJ-01`), a 4-vendor IEC 61131-3 Target Control Platform Switcher (`?vendor=siemens|abb|beckhoff|rockwell`), and a reusable step-by-step `How to Use` tour (`shared/js/demo-tour.js`) across all 20 demos.

### Scale-Up Progression Summary

| Metric | Pilot Baseline (Config 1: Manual) | Commercial Target (Config 5: Coordinated) | Scale-Up Delta |
| :--- | :--- | :--- | :--- |
| Monthly Dry Tea Capacity | `120 kg/month` | `1,200 kg/month` (design load `1,000 kg/mo`) | `10.0x` |
| Labor Intensity | `4.20 worker-hrs/kg` | `0.42 worker-hrs/kg` | `10.0x` productivity |
| Bottleneck Station | Rolling (Hand Labor) | Coordinated Line Balance | Bottleneck eliminated |
| Unit Absorption Cost Benchmark | `BDT 265.17 / kg` | `BDT 181.63 / kg` | `-BDT 83.54 / kg` (`-31.5%`) |

---

## 2. 6-Room L-Shaped Factory Floor Plan, XOR Priority Routing & Mass Balance

### 2.1 ASCII L-Shaped Two-Tier Floor Plan (Rooms 01–06)

```text
+----------------------------------------------------------------------------------------------------------+
|                 PANCHARUPA SPECIALTY TEA FACILITY — L-SHAPED 6-ROOM FLOOR PLAN (ISA-101)                 |
|                                                                                                          |
|  [ROOM 01: INTAKE]      [ROOM 02: WITHERING]      [ROOM 04: DRYER]       [ROOM 05: SORTING]   [ROOM 06]  |
|  SC-01, DV-01A/B  -----> T-01..04, FN-01..04      ATEX Zone 22 (DR-01) -> GR-01, OS-01     -> PK-01     |
|  (Path 1: 01->02)       (250 kg Golden Buffer)    TT-401/402, FS-401     RJ-01 Reject Bin     250g Foil  |
|        |                          |                        ^             (ALM-502 >8.0%)      Pouches    |
|        | Path 2: 01->03           | Path 3: 02->03         |                                             |
|        | (Green Tea Direct)       | (Golden Handover)      | Discharge (03->04)                          |
|        v                          v                        |                                             |
|  +----------------------------------------------------+    |                                             |
|  | ROOM 03 (FRONT BAY): FIXATION, ROLLING & OXIDATION |----+                                             |
|  | RL-01..02 · Strict XOR Single-Source Infeed        |                                                  |
|  | (01->03 pauses automatically when 02->03 active)   |                                                  |
|  +----------------------------------------------------+                                                  |
+----------------------------------------------------------------------------------------------------------+
```

### 2.2 Strict Single-Source (XOR) Batch Priority Interlock & 4-Vendor Target Architecture

- **Strict Single-Source (XOR) Roller Interlock (`bGoldenBatchActive`):** Room 03 never receives from Room 01 and Room 02 simultaneously. While Room 02 accumulates withered Golden Tea leaves (`rWitheringBufferKg < 250 kg`), **Path 2 (`01→03`)** feeds fresh green shoots directly into Room 03 and gate `DG-02` remains closed. Once `rWitheringBufferKg >= 250 kg`, `bGoldenBatchActive` latches `TRUE`, diverter `DV-01B` closes to pause `01→03`, and **Path 3 (`02→03`)** discharges the Golden Tea batch until empty (`250 → 0 kg`) before resuming `01→03`.
- **Optical Color Sorting & Reject Interlock (Room 05):** Vibratory grader `GR-01` and RGB optical sorter `OS-01` divert pale stalks and scorched dust into `RJ-01` (`3.2%` nominal reject rate), raising ISA-18.2 alarm `ALM-502` if reject rate exceeds `8.0%`.
- **Portable IEC 61131-3 4-Vendor Architecture:** Benchmarked on **Siemens S7-1500 / S7-1512SP F-1 PN** (`SINAMICS G120`, `PROFINET / PROFIsafe`) and mapped to **ABB AC500 V3 + SM560-S** (`ACS580`, `System 800xA` OPC UA, `TTH300` / `266DSH`), **Beckhoff CX5240 + TwinSAFE EL6910** (`TwinCAT 3`, `AX5000`, `EtherCAT / FSoE`), and **Rockwell GuardLogix 5380** (`PowerFlex 525` STO, `EtherNet/IP / CIP Safety`).

### 2.3 Stage-by-Stage Mass & Moisture Balance (4.2:1 Wet-to-Dry Ratio)

For a canonical `1,000 kg` finished dry tea monthly design target (`4,200 kg` fresh green leaf intake at `4.2:1` wet-to-dry ratio, `23.81%` net dry yield; DES standard outturn parameter `0.25` for `4.0:1` sensitivity runs):

| Stage | Room | Input Mass (kg) | Moisture In (%) | Moisture Out (%) | Moisture / Trim Loss (kg) | Output Mass (kg) | Key Process Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1. Leaf Intake & Diverter | Room 01 | `4,200.0` | `78.0%` | `77.5%` | `93.3` (foreign matter / surface) | `4,106.7` | `SC-01` (`gross > tare`), `DV-01A/B` split |
| 2. Withering (Golden Buffer) | Room 02 | `4,106.7` | `77.5%` | `68.0%` | `1,466.7` (evaporated) | `2,640.0` | `250 kg` batch threshold; cutoff `<= 65.0%` |
| 3. Fixation, Rolling & Oxidation | Room 03 | `2,640.0` | `68.0%` | `65.0%` | `208.4` (cell sap / evap.) | `2,431.6` | XOR single-source (`01→03` or `02→03`) |
| 4. Thermal Drying (ATEX Z22) | Room 04 | `2,431.6` | `65.0%` | `3.0%` | `1,473.9` (thermal moisture) | `957.7` (or `1,000.0` @ `4.2:1` net) | `95.0 °C` SP; runaway trip `>= 115/140 °C` |
| 5. Vibratory & Optical Sorting | Room 05 | `1,033.0` | `3.0%` | `3.0%` | `33.0` (`3.2%` nominal to `RJ-01`) | `1,000.0` | `GR-01` + `OS-01`; `ALM-502` at `> 8.0%` |
| 6. Cleanroom Weigh-Fill & Pack | Room 06 | `1,000.0` | `3.0%` | `3.0%` | `0.0` (underfill recycled) | `1,000.0` | `PK-01` `250g` kraft-and-foil pouches |

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
