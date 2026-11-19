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
- **Modeled Simulation:** Evaluates queue dynamics, machine mutual exclusion, energy consumption, and unit costs dynamically under synthetic inputs. Never back-fits or fakes model constants to forcibly match founder figures.

---

## 3. Capstone Integration Status & Domain Sub-Engine Architecture

Because each subproject is engineered on its dedicated isolated git branch to maintain clean separation of concerns, the Capstone Simulator in `subproject/14-integrated-factory` provides an integrated umbrella architecture:

| Subproject / Domain | Source Git Branch | Native Engine Location | Capstone Integration Mechanism |
| :--- | :--- | :--- | :--- |
| **01 Leaf Intake** | `subproject/01-leaf-intake` | `projects/leaf-intake/` | Integrated: Intake fine leaf gate and truck tare weighing parameters |
| **02 Green Tea Sequence** | `subproject/02-green-tea-processing` | `projects/green-tea-sequence/` | Integrated: Panning fixation and moisture reduction curve |
| **03 Dryer Controls** | `subproject/03-dryer-controls` | `projects/dryer-control/` | Integrated: Two-stage drying temperature and moisture sensor feedback |
| **04 Withering Airflow** | `subproject/04-withering` | `projects/withering-airflow/` | Integrated: Air velocity and bed moisture loss dynamics |
| **05 Golden Tea Sequence** | `subproject/05-golden-tea-sequence` | `projects/golden-tea-sequence/` | Integrated: Solar withering and light oxidation protocol |
| **06 Grading & Routing** | `subproject/06-grading-and-routing` | `projects/grading-and-routing/` | Integrated: Sieve screen fraction cut and bin allocation |
| **07 Packing & Reject** | `subproject/07-packing-and-dispatch` | `projects/packing-and-reject/` | Integrated: Checkweigher tolerance and defect scrap logic |
| **08 Leaf Procurement** | `subproject/08-procurement` | `projects/leaf-procurement/` | Integrated: MRP conversion ratio ($\text{FreshLeaf} = \text{Demand} / \eta$) |
| **09 Production Scheduling**| `subproject/09-production-scheduling` | `projects/production-scheduling/` | Integrated: Shared Roller & Dryer mutual exclusion with 15m cleaning |
| **10 Shifts & Skills** | `subproject/10-shifts-and-skills` | `projects/worker-shift-planning/` | Integrated: Crew labor hours and concurrency overlap prevention |
| **11 Inventory & Fulfillment**| `subproject/11-inventory-and-fulfilment`| `projects/inventory-and-fulfillment/`| Integrated: DAY-40 pack split benchmark and batch reservation |
| **12 Costing & Finance** | `subproject/12-costing-and-finance` | `projects/costing-and-margin/` | Integrated: Absorption cost bridge (BDT 181.63/kg target baseline) |
| **13 Maintenance** | `subproject/13-maintenance` | `projects/maintenance-planning/` | Integrated: Asset MTBF, planned PM, and 120m unplanned outage |
| **15 Robotic Packing** | `subproject/15-robotic-packing` | `projects/robotic-packing/` | Integrated: High-speed delta robot pick rates (40 bpm) vs manual packaging |
| **16 Factory Data Platform**| `subproject/16-factory-data-platform`| `projects/factory-data/` | Integrated: Relational data dictionary and lot trace link |
| **17 Sustainability & Waste**| `subproject/17-sustainability-and-waste`| `projects/sustainability/` | Integrated: Mass balance separation of moisture loss vs scrap |
| **BMS / SD-anlegg** | `subproject/factory-and-bms` | `projects/virtual-factory/building-automation/` | Integrated: Factory floor environmental setpoints and ventilation proof |
| **Staffing & Payroll** | `subproject/staffing-and-payroll` | `projects/staffing-and-payroll/` | Integrated: Labor payroll cost and profit vs cash bridge |
| **Tea Auction Planning** | `subproject/tea-auction-planning` | `projects/tea-auction-planning/` | Integrated: Auction broker sales realization and freight break-even |
