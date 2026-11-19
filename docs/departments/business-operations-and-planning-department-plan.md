# Business Operations and Planning

Portfolio projects 8–13

Fresh leaf and procurement. Convert dated orders, released stock and product-specific yields into required leaf by delivery date. Track vendor lots, accepted weight and shortages. Start with deterministic calculations. Add forecasting if dated records support chronological testing.

Sales and production scheduling. Allocate green and golden tea orders to batch slots, respect the shared roller and dryer, and report promised dates and late orders.

Worker shifts and skills. Assign staff using availability, skill coverage, overlapping tasks and hands-on workload. Compare the schedule with a fixed roster under the same orders and test an operator absence.

Inventory, auction and fulfillment. Reserve released lots for bulk bags and bottled retail packs. Track dispatch to Chattogram, sample references, auction results, settlement, retail shipment and packaging shortages.

Finance and costing. Calculate contribution per kg and channel, using editable leaf, packaging, freight, energy and labor inputs. Compare the 100 and 1,000 kg/month configurations using transparent assumptions.

Maintenance and asset reliability. Schedule downtime, simulate a dryer failure and show effects on batch queues, shipments and cost. Use modeled BMS energy and equipment-runtime data as additional inputs.

Acceptance. Reconcile the DAY-40 integration test from orders through production, packing and dispatch. Compare a fixed roster against a skills-based roster. Label synthetic data and export repeatable inputs and results.



## Current operating baseline and portfolio responsibilities

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

Own procurement invoices and credits, selling and settlement events, stock policy and costing. Extend Project 12 with cost centres and overhead drivers, break-even and contribution, auction/retail/winter allocation, scenario-based price elasticity, and dryer NPV/payback. Assign action owners for Project 17 and replay proposed supplier, inventory and maintenance changes. Value waste separately within purchase costs to avoid double counting.

## Operating plan from Day 1

Begin auction and financial tracking in Month 1. Target physical construction in Months 1–2 subject to site readiness and approvals. Use Month 3 for hand production and manual process measurement. Keep selling hand-produced tea locally in bottles during Months 4–6 while building and commissioning the automated line. Target the first repeatable automated batch by the end of Month 6 and auction sales once eligible lots meet release and broker deadlines.

### Relational database and rollout

Plan approximately 20 fields on Day 1 and 110 across ten business areas as operations grow. The counts include identifiers and dates and serve as schema planning estimates.

Day 1: auction history (8), purchases and expenses (12). Months 1–2: factory construction and assets (10). Month 3: production batches (14), quality checks (9), inventory and local bottled sales (12). From first hire: HR and payroll (12). Months 4–6: machine and BMS readings (11). First auction: auction lots and logistics (12), results and settlements (10).

Use shared supplier, product, batch, employee, shift, equipment, sale and lot IDs. Link material use, labour and QC to batches. Link bottling runs and stock movements to retail sale lines. Use a lot allocation table for batch-to-lot links and kilograms. Keep distinct product codes and costs for bottled stock and auction lots. Record manual or automated method on every run. Store sensor readings with timestamp, unit and batch reference when available.

### Auction planning and forecasting

Track Panchagarh, Chattogram and Sreemangal from Month 1. Bangladesh Tea Board results give sale dates, volume and average Tk/kg. TTAB and National Brokers supply Chattogram market reports and selected prices. Complete public lot-result coverage is unverified.

[Bangladesh Tea Board auction results](https://teaboard.gov.bd/pages/static-pages/6922dbc5933eb65569e0c68b)

[Bangladesh Tea Board schedules and registered broker list](https://teaboard.gov.bd/pages/static-pages/6922dfcb933eb65569e24042)

[TTAB weekly market reports](https://ttabctg.com/market_reports/weekly-mr/)

[National Brokers market reports](https://nationalbrokersbd.com/market-reports/)

Confirm the seller of record, lot eligibility, receiving warehouse, sampling and valuation, packing requirements, fees, catalogue and intake deadlines, and settlement terms. Ask registered brokers for matching catalogues and realised results, including unsold and withdrawn lots. Capture grade, weight, garden or factory, valuation timestamp and realised Tk/kg.

Start with a three-centre dashboard and freight break-even calculator. Compare courier or freight from Panchagarh, packaging, handling, fees, deadlines and broker valuations. Show the extra Tk/kg a distant sale needs to earn. Keep hold or relist as an option. Use forecast ranges and expected net profit when data supports them, including the chance and cost of going unsold.

Use roughly five to eight initial inputs for the venue-average Tk/kg forecast, such as venue, season, lagged prices and lagged volumes. Store when results became available and backtest chronologically as of the dispatch decision date. Compare with a recent comparable-sale median. Add lot-level price and sale probability when enough broker data have accumulated. Record forecasts alongside actual results, margin and settlement.

### Staffing, meals and internship

Owner and operations manager: purchasing, local sales, auction selection, broker coordination, quality release, spending, payroll approval and profit review. Worker 1, production lead and machine operator: receive and weigh materials, lead manual processing, operate the line, and log yield, waste, energy and downtime. Worker 2, packing, quality and stock assistant: support processing, sample batches, fill and label bottles, log stock, pack auction lots and prepare dispatch.

Start with two paid workers and the owner for one shift and small batches. Use external contractors and automation specialists, bookkeeping support, labs, brokers and carriers as needed. Confirm shift coverage in commissioning and add part-time packing or dispatch help if workload warrants it.

Provide one meal per worker per attended shift from the first staffed shift. Link meal records to attendance, record the actual cost separately from wages and allocate factory meals through production overhead. The illustrative budget is 2 workers × 26 attended shifts × BDT 120 = BDT 6,240 per month.

Recruit one BI Data Science intern after 24 full months of automated production, around Month 31 if automation starts at the end of Month 6. The intern reports to the owner in Business Intelligence & Analytics and supports Auction Sales & Planning. Deliver a validated dataset, backtested forecast and venue comparison using pre-dispatch information. Use lot-level forecasts if broker coverage supports them.

### Payroll and Month 24 close

Run payroll from the first staffed pay cycle. Supervisors confirm attendance and overtime, HR checks leave and adjustments, Finance computes gross wages, deductions and net pay, and the owner approves payment. Reconcile transfers with the payroll register. Allocate production labour and factory meals to production and office payroll to operating expenses.

At Month 24, reconcile inventory, receivables, broker fees and cash records with the bank. Recognise revenue and match cost to the tea sold. Keep unsold production costs in inventory. Record plant investment separately from operating cash and include depreciation in relevant costs.

Illustrative Month 24 close in BDT: sales 2,400,000 less cost of tea sold 1,650,000 gives gross profit 750,000. Less operating expenses of 390,000 gives operating profit 360,000. Less interest of 60,000 gives profit before tax of 300,000. Illustrative gross payroll of 300,000 comprises 220,000 for factory staff and 80,000 for office staff. Include each portion once in its appropriate cost category. Compare profit with actual collections, bank cash, unpaid broker settlements and cash needed for the next buying and payroll cycles.
