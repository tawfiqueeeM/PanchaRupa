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

## Verification

Run the verification suites across all four layers:

```bash
node --test projects/*/tests/*.test.js
python db/verify.py
python plc/plc_verify.py
python sim/test_sim.py
```
