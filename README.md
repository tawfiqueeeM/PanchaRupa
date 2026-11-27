# Online PanchaRupa

> **Live 3D Digital Twin & Engineering Report**  
> - **Launch Interactive 3D Virtual Tea Factory:** [https://tawfiqueeem.github.io/PanchaRupa/demos/virtual-factory/](https://tawfiqueeem.github.io/PanchaRupa/demos/virtual-factory/)  
> - **Read the Full Technical Report:** [26-Week Industrial Training & Engineering Report](docs/INTERNSHIP_REPORT.md)

Engineering documentation for the Panchagarh virtual tea factory and operating business.

- [factory and bms](docs/factory-and-bms.md)
- [production and quality](docs/production-and-quality.md)
- [database and traceability](docs/database-and-traceability.md)
- [auction planning](docs/auction-planning.md)
- [staffing payroll and costing](docs/staffing-payroll-and-costing.md)

## Subproject branches

- `subproject/01-leaf-intake`
- `subproject/02-green-tea-processing`
- `subproject/03-dryer-controls`
- `subproject/04-withering`
- `subproject/05-golden-tea-processing`
- `subproject/06-grading-and-routing`
- `subproject/07-packing-and-dispatch`
- `subproject/08-procurement`
- `subproject/09-production-scheduling`
- `subproject/10-shifts-and-skills`
- `subproject/11-inventory-and-fulfilment`
- `subproject/12-costing-and-finance`
- `subproject/13-maintenance`
- `subproject/14-integrated-factory`
- `subproject/15-robotic-packing`
- `subproject/16-factory-data-platform`
- `subproject/17-sustainability-and-waste`
- `subproject/factory-and-bms`
- `subproject/tea-auction-planning`
- `subproject/staffing-and-payroll`

## Engineering Documentation

- [26-Week Industrial Training & Engineering Report](docs/INTERNSHIP_REPORT.md) — Complete scale-up documentation, floor plan, mass/moisture balance, electrical single-line diagram, P&IDs, SQL lot genealogy, and `N=1,000` Monte Carlo benchmarks.

### Live 3D Virtual Factory HMI

Serve the repository over HTTP and open `/demos/virtual-factory/` in your browser:

```bash
python -m http.server 8080
# Open http://localhost:8080/demos/virtual-factory/
```

## All 20 Interactive Modules (GitHub Pages)

| Module # | Project Title | Engineering Domain / Tools | Live GitHub Pages URL |
| :--- | :--- | :--- | :--- |
| `01` | Leaf Intake & Weighbridge | Dept 1 · Tare Deduction, Fine Leaf %, Buffer Gate (`%I0.1`) | https://tawfiqueeem.github.io/PanchaRupa/demos/leaf-intake/ |
| `02` | Green Tea Steaming & Rolling | Dept 1 · Enzyme Kill, Drum Roaster, Machine Lock | https://tawfiqueeem.github.io/PanchaRupa/demos/green-tea-sequence/ |
| `03` | Fluidized Bed Dryer Controls | Dept 1 · IEC 61131-3, Burner Safety (`%I3.0`), 3-Phase Reset | https://tawfiqueeem.github.io/PanchaRupa/demos/dryer-control/ |
| `04` | Withering Trough Airflow | Dept 1 · Psychrometrics, VFD Airflow (`%IW70`), Sensor Watchdog | https://tawfiqueeem.github.io/PanchaRupa/demos/withering-airflow/ |
| `05` | Orthodox Golden Tea & Fermentation | Dept 1 · Theaflavin/TR, Oxidation Bed, Shared Dryer | https://tawfiqueeem.github.io/PanchaRupa/demos/golden-tea-sequence/ |
| `06` | Tea Grading & Mesh Routing | Dept 1 · Mesh Sieving, Bin Interlock, Idempotent Gate | https://tawfiqueeem.github.io/PanchaRupa/demos/grading-and-routing/ |
| `07` | Packing & Reject Routing | Dept 4 · Checkweigher, Underfill Reject, Ledger Audit | https://tawfiqueeem.github.io/PanchaRupa/demos/packing-and-reject/ |
| `08` | Smallholder Leaf Procurement | Dept 7 · Smallholders, 25% Yield, Winter Buffer | https://tawfiqueeem.github.io/PanchaRupa/demos/leaf-procurement/ |
| `09` | Production Scheduling | Dept 2 · Makespan Gantt, Changeover Window, Machine Calendar | https://tawfiqueeem.github.io/PanchaRupa/demos/production-scheduling/ |
| `10` | Worker Shift Planning & Skills | Dept 2 · Skill Matrix, Roster Coverage, Absence Alarm | https://tawfiqueeem.github.io/PanchaRupa/demos/worker-shift-planning/ |
| `11` | Inventory & Fulfillment | Dept 2 · Warehouse WMS, Quality Hold, Order Settlement | https://tawfiqueeem.github.io/PanchaRupa/demos/inventory-and-fulfillment/ |
| `12` | Costing, Margins & Break-Even | Dept 7 · Absorption Cost (`BDT 181.63`), Break-Even | https://tawfiqueeem.github.io/PanchaRupa/demos/costing-and-margin/ |
| `13` | Preventive Maintenance | Dept 2 · CMMS Orders, Runtime Hours, Outage Isolation | https://tawfiqueeem.github.io/PanchaRupa/demos/maintenance-planning/ |
| `14` | Integrated Virtual Factory Simulator (3D Capstone) | Dept 5 · Three.js 3D Digital Twin, DB/PLC/DES Snapshot | https://tawfiqueeem.github.io/PanchaRupa/demos/virtual-factory/ |
| `15` | Delta Robot Packing Cell | Dept 4 · Delta Kinematics, Carton Changeover, Fault Recovery | https://tawfiqueeem.github.io/PanchaRupa/demos/robotic-packing/ |
| `16` | Factory Data Platform | Dept 3 · Relational DDL, Foreign Keys, Lot Genealogy | https://tawfiqueeem.github.io/PanchaRupa/demos/factory-data/ |
| `17` | Sustainability & Waste Balance | Dept 4 · Mass Balance, Biomass Furnace, Energy Waste | https://tawfiqueeem.github.io/PanchaRupa/demos/sustainability/ |
| `18` | Building Automation & BMS | Dept 3 · BACnet / Modbus, AHU Flow, kWh/kg SEC | https://tawfiqueeem.github.io/PanchaRupa/demos/building-automation/ |
| `19` | Staffing & 4-Tier Payroll Close | Dept 7 · 4-Tier Approval, Meal Allowance, Cash Recon | https://tawfiqueeem.github.io/PanchaRupa/demos/staffing-and-payroll/ |
| `20` | Multi-Center Tea Auction Planning | Dept 7 · Chattogram CGP, Freight Premium, Reserve Deficit | https://tawfiqueeem.github.io/PanchaRupa/demos/tea-auction-planning/ |

## Verification

Run the verification suites across all four layers:

```bash
node --test projects/*/tests/*.test.js
python db/verify.py
python plc/plc_verify.py
python sim/test_sim.py
```
