# Dept 2 – Capacity and Operations

## Current portfolio scope and department responsibilities

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

Operations owns the capacity and seasonal shifts model. Publish machine availability, reservations, worker assignments, queue timestamps and outage windows. For Project 17, replay the same orders and deliveries with revised delivery slots or shift coverage, then compare spoilage, overtime, service and energy. Keep the four staffing × winter-stock conference comparisons independently reproducible.

## Working block diagram

```mermaid
flowchart TD
 A[Orders and due dates] --> B[Net production need]
 B --> C[Leaf and batch plan]
 D[Shifts and machines] --> E[Capacity check]
 C --> E
 E --> F{Plan fits?}
 F -->|Yes| G[Release schedule]
 F -->|No| H[Revise dates or load]
 H --> C
 G --> I[Capture actuals]
 I --> E
```

## Purpose and PanchaRupa history

This department owns the workflow above and signs off on its handoffs. One person may cover several roles. PanchaRupa produced green tea and golden tea, a specialty black tea, from mostly vendor-supplied hand-picked leaves. The founder recalls adding a heated drum for early heat treatment, then automating final drying, then introducing a rolling machine. Monthly output reportedly rose from **100 to 1,000 kg**. Most tea went in bulk bags to the Chattogram auction channel. Some went into plastic retail bottles. Exact historical recipes, machine specifications, costs and intermediate production figures are unknown. This handbook specifies a proposed virtual workflow and a hypothetical low-cost physical configuration.

### Plan and release production
Net due orders against released inventory by tea and pack channel. Convert shortages to finished batch quantities and then to fresh leaf using product-specific yield. Reserve the roller and dryer by occupied minutes, giving each batch a start, end and cleaning or changeover slot. Layer on worker availability and skill coverage. Reserve buffer locations for batches that cannot move immediately. Escalate any promise date the schedule cannot support.

### Manage the shift
Log actual start, stop, processing, waiting and cleaning time with a reason code. Track planned stops separately from failures. Require a supervisor decision when downtime breaks a delivery commitment. Preserve the original plan for comparison with actuals and send confirmed delays to Business Operations.

### Capacity measures and example
DAY-40 is a single integration test with 30 kg green and 10 kg golden tea. With illustrative 25% net yield, base fresh leaf is 160 kg/day and 4,000 kg/month. In an illustrative eight-hour day, output is 5 released kg per scheduled hour, before considering how individual stations are loaded. Compare occupied station minutes against available station minutes. Compare hands-on operator minutes against staffed minutes. Test lower yield, mixed demand, late leaves, an absent worker and a stopped dryer.

### Engineering outputs
Build Excel and Power Query schedules, a machine load view, an editable station calendar and a monthly constraint report. Replay the five factory configurations with a shared order book. Intermediate output is a simulation result. Compare the reported 100 and 1,000 kg/month figures separately.

## Machines, tools and investment

| Hypothetical asset or tool | Illustrative BDT | Purpose |
|---|---:|---|
| Staging carts and buffer racks | 25,000 | Hold and move identified work in process. |
| Production board and logging device allowance | 15,000 | Record batch progress, exceptions and shift data. |
| **Department startup funding** | **40,000** | Before working capital. |

## How the department gets its budget

Request staging investment against queue and handling evidence. Estimate scheduling hours monthly and separate recurring staffing from direct labor already assigned to Production. Allocate scheduling by staffed production hours and staging by transfer counts or handled kg. Record exceptional idle-time costs as a separate period variance so reduced production doesn't silently masquerade as a recipe cost increase.

1. The department lead submits a request with asset or operating item, units, specification, alternatives, reason, required date and cost center.
2. Operations checks utilization, batch forecasts and bottlenecks. The requesting lead estimates released kg gained, time saved, failure exposure reduced or a test requirement met.
3. Finance separates capital, one-time startup costs, recurring production costs, working capital and selling costs. It checks committed spend and projected cash before approval.
4. The founder approves a spending ceiling. For physical purchasing, obtain actual quotes and record landed and installed cost, local support and spare parts. Match approved purchase, receipt and invoice.
5. At month-end, compare budget, committed spend and actuals. Split material differences into quantity, price and timing. Record the corrective owner and revise the next forecast.

## How this department costs the tea

| Department cost pool | BDT/month |
|---|---:|
| Scheduling and shift coordination | 5,000 |
| Plant staging and handling allowance | 3,000 |
| **Recurring factory cash budget** | **8,000** |
| Illustrative depreciation | 666.67 |
| **Monthly manufacturing allocation** | **8,666.67** |

This department contributes **BDT 8.67 per released kg** at 1,000 kg/month. Cost driver: Scheduled and actual production hours, with exceptional idle capacity shown separately. Assign identifiable costs to a specific batch or sales channel first. Allocate the remaining pool by each product’s share of the stated driver. Reconcile direct charges, allocated overhead and period variances to the ledger. Keep the same electricity meter, machine, labor and quality cost with one budget owner.

## Shared factory budget and reconciliation

These numbers are **synthetic BDT planning allowances**, not prices researched in Panchagarh or historical PanchaRupa accounts. The virtual project assumes an existing computer and browser with zero incremental software and equipment spend. The physical example is an exercise in investment and production costing.

| Department | Startup funding (BDT) | Recurring factory cash (BDT/month) |
|---|---:|---:|
| Production Engineering | 350,000 | 26,000 |
| Capacity and Operations | 40,000 | 8,000 |
| Controls and Electrical | 165,000 | 12,000 |
| Quality and Traceability | 55,000 | 6,000 |
| HMI and Simulation | 0 | 0 |
| Testing and Portfolio | 25,000 | 2,000 |
| Business Operations and Planning | 25,000 | 7,000 |
| **Total departmental funding** | **660,000** | **61,000** |

Treat BDT 10,000 of the startup total as one-off commissioning and training. Use BDT 650,000 as the example depreciation base. Straight-line allocation over 60 months with zero residual gives BDT 10,833.33/month. These are modeling choices.

### Design month and direct materials

In the illustrative 1,000 kg costing model, a 25% aggregate net yield implies 4,000 kg of fresh leaf at BDT 25/kg. The 1,000 kg costing case is independent of the variable 994 kg active-month fixture. Apply product-specific yields to live scenario inputs.

Use a 90% bulk / 10% retail split. The bulk example uses 36 bags of 25 kg at BDT 50 per bag. The costing example uses 800 × 50 g bottles at BDT 4 and 600 × 100 g bottles at BDT 8. Confirm pack sizes and commercial requirements before any physical use.

| Worked cost bridge | BDT/month | BDT per released kg |
|---|---:|---:|
| Fresh leaf | 100,000 | 100.00 |
| Bulk bags and retail bottles | 9,800 | 9.80 |
| Departmental recurring factory cash | 61,000 | 61.00 |
| Depreciation | 10,833.33 | 10.83 |
| **Illustrative manufacturing cost** | **181,633.33** | **181.63** |
| Bulk outbound freight, tracked as selling expense | 9,000 | 9.00 plant-wide or 10.00 per bulk kg |

Packaging adds BDT 2 per bulk kg and BDT 80 per retail kg before labor or yield differences. The plant-wide figure is cost per released kg. Recognize cost against sales using opening stock, production, shipped quantities and closing stock. Track broker fees, retail delivery, rent, taxes, site works and finance separately when figures become available. They are outside this simplified cost bridge.

Recurring factory cash in the example is BDT 170,800/month, or BDT 179,800 with bulk outbound. The startup budget plus one example month of that cash spend comes to **BDT 839,800**. Estimate actual working capital from dated vendor payments, wage cycles, stock and cash settlement. Stress-test delayed auction receipts. Build the 100 kg/month configuration with its own labor and asset assumptions. Intermediate upgrade outputs are simulated.

## Build, test and sign off

1. Record input/output fields, owning roles, approval points and the interface with adjacent departments. Agree on the exact machine states and the event or record that closes each handoff.
2. After 16 December 2026, make the block diagram executable in the simulator or planning workbook. First verify one green batch, then add golden tea and both packing branches.
3. Run the DAY-40 integration test. Check quantity and lot reconciliation, no overlapping shared-machine reservations, and correct channel allocation. Repeat with a dryer outage and report delays and costs from the run.
4. Record the scenario version, expected result, observed result, deviations and owner. Sign off only when the applicable checks pass. Publish a standalone case study or demo link with the exact tools and data used.

[Existing department plan](https://docs.google.com/document/d/1KRH5J0IuW6QLVxtJFO8Q313asaUV_OT64sVHrLxVVCw/edit)
