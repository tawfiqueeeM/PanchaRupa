# Five Configurations Comparative Matrix & Integration Status

## 1. Five Factory Configurations Overview
To evaluate technical and economic scale-up, the factory is modeled across five evolutionary operational stages under an identical monthly demand load (1,000 kg made tea target):

| Parameter | 1. Manual | 2. Heated Drum | 3. Automated Drying | 4. Machine Rolling | 5. Coordinated Modern Factory |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Withering Station** | Sun / bamboo trays | Indoor static troughs | Static troughs + axial fans | Static troughs + VFD fans | Automated withering with BMS temperature & RH control |
| **Rolling / Maceration** | Manual hand-rolling (table) | Manual hand-rolling | Manual hand-rolling | Single motorized rolling table (batch) | Shared mechanized rolling table with changeover cleaning |
| **Drying Station** | Charcoal pan / sun drying | Heated rotary drum pan | Continuous belt conveyor dryer | Continuous conveyor dryer | PLC modulated two-stage dryer with air recycling |
| **Packaging Station** | Manual scoop & heat sealer | Manual scale & sealer | Semi-auto auger filler | Semi-auto auger filler | Dual-cell Delta robot + auto checkweigher & cartoner |
| **Plant Capacity (Max)** | 120 kg / month | 250 kg / month | 450 kg / month | 750 kg / month | 1,200 kg / month |
| **Primary Bottleneck** | Rolling (Hand fatigue) | Rolling (Hand labor) | Rolling (Hand labor) | Drying (Shared queue) | Coordinated balance (No single machine stall) |
| **Labor Intensity** | 4.2 worker-hrs / kg | 2.8 worker-hrs / kg | 1.9 worker-hrs / kg | 1.1 worker-hrs / kg | 0.42 worker-hrs / kg |
| **Specific Energy (SEC)** | 0.15 kWh / kg (wood/coal) | 0.65 kWh / kg | 1.85 kWh / kg | 1.45 kWh / kg | 1.05 kWh / kg (BMS optimized) |
| **Unit Mfg Cost (BDT/kg)**| 265.00 BDT | 225.00 BDT | 205.00 BDT | 192.00 BDT | 181.63 BDT |
| **Order Cycle Time** | 18.5 days | 12.0 days | 7.5 days | 4.0 days | 1.8 days |

---

## 2. Founder-Reported Figures vs Modeled Outputs

### 2.1 Explicit Boundary
- **Founder-Reported Benchmark (Pilot Phase):** Exactly 100 kg/month pilot capacity achieved with manual/drum processing, high labor reliance, batch-level yield fluctuations.
- **Founder-Reported Target (Design Phase):** 1,000 kg/month design baseline for active plucking months (March through November).
- **Modeled Simulation Scope:** Evaluates static comparative fixture specifications across five configurations based on synthetic assumed capacities, labor intensities (e.g. 4.20 vs 0.42 worker-hrs/kg 10x ratio), specific energies, and absorption costs. It does **not** evaluate live queue dynamics, schedules, or machine mutual exclusion (which are modeled independently on individual subproject branches). All cross-engine dynamic integrations remain pending unified implementation.

---

## 3. Subproject Architecture & Integration Status Registry

Each subproject is engineered on its dedicated isolated git branch to maintain clean separation of concerns. The Capstone in `subproject/14-integrated-factory` provides an umbrella comparison based on assumed fixture parameters; full cross-branch runtime dynamic integration is marked pending:

| Subproject / Domain | Source Git Branch | Native Engine Location | Capstone Status & Scope |
| :--- | :--- | :--- | :--- |
| **01 Leaf Intake** | `subproject/01-leaf-intake` | `projects/leaf-intake/` | Assumed Input: Intake fine leaf gate (Live demo isolated on branch; dynamic integration pending) |
| **02 Green Tea Sequence** | `subproject/02-green-tea-processing` | `projects/green-tea-sequence/` | Assumed Input: Panning fixation curve (Live demo isolated on branch; dynamic integration pending) |
| **03 Dryer Controls** | `subproject/03-dryer-controls` | `projects/dryer-control/` | Assumed Input: Two-stage drying setpoints (Live demo isolated on branch; dynamic integration pending) |
| **04 Withering Airflow** | `subproject/04-withering` | `projects/withering-airflow/` | Assumed Input: Air velocity and bed moisture (Live demo isolated on branch; dynamic integration pending) |
| **05 Golden Tea Sequence** | `subproject/05-golden-tea-sequence` | `projects/golden-tea-sequence/` | Assumed Input: Solar withering protocol (Live demo isolated on branch; dynamic integration pending) |
| **06 Grading & Routing** | `subproject/06-grading-and-routing` | `projects/grading-and-routing/` | Assumed Input: Sieve fraction cuts (Live demo isolated on branch; dynamic integration pending) |
| **07 Packing & Reject** | `subproject/07-packing-and-dispatch` | `projects/packing-and-dispatch/` | Assumed Input: Checkweigher reject logic (Live demo isolated on branch; dynamic integration pending) |
| **08 Leaf Procurement** | `subproject/08-procurement` | `projects/leaf-procurement/` | Assumed Input: MRP conversion ratio (FreshLeaf = Demand / eta) (Live demo isolated on branch; dynamic integration pending) |
| **09 Production Scheduling**| `subproject/09-production-scheduling` | `projects/production-scheduling/` | Assumed Input: Shared machine scheduling constraints (Live demo isolated on branch; dynamic integration pending) |
| **10 Shifts & Skills** | `subproject/10-shifts-and-skills` | `projects/worker-shift-planning/` | Assumed Input: Crew labor hours and coverage (Live demo isolated on branch; dynamic integration pending) |
| **11 Inventory & Fulfillment**| `subproject/11-inventory-and-fulfilment`| `projects/inventory-and-fulfillment/`| Assumed Input: DAY-40 pack split benchmark (Live demo isolated on branch; dynamic integration pending) |
| **12 Costing & Finance** | `subproject/12-costing-and-finance` | `projects/costing-and-margin/` | Assumed Input: Absorption cost benchmark (BDT 181.63/kg) (Live demo isolated on branch; dynamic integration pending) |
| **13 Maintenance** | `subproject/13-maintenance` | `projects/maintenance-planning/` | Assumed Input: Asset MTBF and planned PM (Live demo isolated on branch; dynamic integration pending) |
| **14 Integrated Factory** | `subproject/14-integrated-factory` | `projects/virtual-factory/` | Active Capstone: Five-configuration comparative fixture simulator |
| **15 Robotic Packing** | `subproject/15-robotic-packing` | `projects/robotic-packing/` | Assumed Input: Delta robot pick rate parameters (Live demo isolated on branch; dynamic integration pending) |
| **16 Factory Data Platform**| `subproject/16-factory-data-platform`| `projects/factory-data/` | Assumed Input: Relational data dictionary schema (Live demo isolated on branch; dynamic integration pending) |
| **17 Sustainability & Waste**| `subproject/17-sustainability-and-waste`| `projects/sustainability/` | Assumed Input: Thermodynamic mass balance parameters (Live demo isolated on branch; dynamic integration pending) |
| **BMS / SD-anlegg** | `subproject/factory-and-bms` | `projects/virtual-factory/building-automation/` | Assumed Input: Factory floor environmental setpoints (Live demo isolated on branch; dynamic integration pending) |
| **Staffing & Payroll** | `subproject/staffing-and-payroll` | `projects/staffing-and-payroll/` | Assumed Input: Labor payroll cost model (Live demo isolated on branch; dynamic integration pending) |
| **Tea Auction Planning** | `subproject/tea-auction-planning` | `projects/tea-auction-planning/` | Assumed Input: Auction broker sales realization (Live demo isolated on branch; dynamic integration pending) |
