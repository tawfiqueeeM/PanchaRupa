# PanchaRupa Virtual Tea Factory

From manual production at 100 kg/month to automated production at 1,000 kg/month

## The project

Reconstruct PanchaRupa’s green tea and golden tea production as an interactive browser factory. The founder reports a tenfold increase in monthly output. Use the manual and automated eras as the comparison, with an evidence trail for what changed. First confirm the time periods, the kilogram basis, and how each product contributed to the totals.

## Roadmap

1. Discover. After 16 December 2026, sketch both routes, capture equipment and operating history, and agree on what can be public. Gate this stage on four route maps and an assumptions register.

2. Model. Establish the baseline and automated capacities. Prototype one transfer and a dryer using simulated signals. Check handoffs, recipe variation, and the mass ledger before expanding.

3. Integrate. Connect process routing, control, quality and the HMI. Run both teas in both eras and compare bottlenecks using the same scenario inputs, then replay historically appropriate cases where evidence allows.

4. Commission. Demonstrate one normal batch for each product, one failure and recovery, and the monthly replay. Record expected and observed results. Prepare a GitHub-ready case study once the evidence and public material have been reviewed.

## Department plans

[1. Production Engineering](https://docs.google.com/document/d/16vX1fCainUtzDCdql09INb92skpureTZfu4yDSknx6M/edit?usp=drivesdk)

[2. Capacity and Operations](https://docs.google.com/document/d/1KRH5J0IuW6QLVxtJFO8Q313asaUV_OT64sVHrLxVVCw/edit?usp=drivesdk)

[3. Controls and Electrical](https://docs.google.com/document/d/1j-hmtGAg8CngUPglk5OHFYgH3USHkNdhy58znNsmYAc/edit?usp=drivesdk)

[4. Quality and Traceability](https://docs.google.com/document/d/1GxFjp3-fgZ98qM3QJQNqi_L-Xijj3-8MK88BlFp0eMw/edit?usp=drivesdk)

[5. HMI and Simulation](https://docs.google.com/document/d/1g5cKXBOBg4q0SRGI7w17RD-Y_VGZWTYadizPr6xP4Rs/edit?usp=drivesdk)

[6. Testing and Portfolio](https://docs.google.com/document/d/1WcOyPEq2HB6HAK1cyXBPDfRCUArjipvUCmjUkZDohFY/edit?usp=drivesdk)

## What a reviewer should see

Run green tea, switch to golden tea, and inspect the stages that differ. Change from the manual factory to the automated factory and see which stations and operator tasks changed. Replay a comparable month and inspect accepted output, utilization, queues, downtime and yield. Show the historical 100 and 1,000 kg/month next to the modeled numbers with the assumptions visible.

## Project boundaries

Start with zero-cost browser simulations and Siemens-oriented control designs. Historical PLC brands, machine specifications, recipe values and sources of the capacity gain will be confirmed during discovery. Native PLC compilation, equipment commissioning and GitHub publication are later milestones.



## Portfolio build plan and building automation

Build 16 standalone subprojects and one integrated capstone. Weeks 1–5 cover leaf intake, green tea processing and dryer controls. Weeks 6–8 add withering, golden tea, grading and routing, bulk bags for Chattogram auction and plastic retail bottles. Weeks 9–12 add the six business operations projects. Weeks 13–16 integrate the HMI, monthly replay, testing and GitHub case study. Implementation starts after 16 December 2026.

Use five factory configurations in this order: manual, heated drum, automated final drying, machine rolling, and proposed coordinated factory. DAY-40 uses 30 kg green and 10 kg golden tea, with 36 kg bulk and 4 kg retail across 40 × 50 g and 20 × 100 g bottles. Keep these settings editable and historical figures separate from simulated outputs.

Include building ventilation, storage humidity and energy monitoring within Controls and Electrical. Validate simulated fan failure and high-humidity alarms. Keep the portfolio at 17 projects.

[Business Operations and Planning — Department Plan](https://docs.google.com/document/d/1msj8Gkj4XZjjMZhBSyBQfbrvTpxaYr-bEaHjH5X9S84/edit?usp=drivesdk)



## Virtual BMS implementation scope

Use Desigo CC and PXC as the main design reference, Niagara for cross-device integration concepts, and EcoStruxure and Metasys for a comparison of equivalent workflows. Use simulated BACnet/IP points, Modbus meter registers and optional KNX occupancy or lighting in the browser. Include this work within the existing Controls and Electrical and HMI workstreams. Deliver the point list, alarm matrix, trend export and commissioning scenarios as part of the 14-project portfolio. Development starts after 16 December 2026.



## Norwegian job-market tooling and standalone projects

Use at least one Norwegian job-relevant product or workflow per project. Use Siemens SIMATIC / TIA Portal and WinCC as the reference for projects 1–7 and 14. Within project 14 use Desigo CC / PXC as the reference for the SD-anlegg. Use Excel and Power Query for projects 8–11, Excel and Power BI for project 12, and a SAP maintenance work-order reference workflow for project 13. The shift optimizer can use Python and OR-Tools with Excel inputs and outputs. MATLAB/Simulink is an optional native tool for the dryer model if access is available.

Publish a standalone project page for each module with its target role, product, runnable example or downloadable artifact, test result and exact tool usage. Label native projects, browser simulations and vendor-reference workflows clearly. Only claim native tool experience after using the product. Keep the zero-cost baseline and add native files where legitimate access is available. Use evidence from Norwegian job ads to assess relevance without treating a sample as market share.

Norwegian examples: Siemens Oslo asks for Desigo CC and PXC (FINN 481179775). A plant automation posting names TIA Portal and WinCC (FINN 480686532). Yara planning lists Excel, Power BI and Power Query (FINN 479160888). Eramet maintenance lists SAP work orders (FINN 481207683). Kongsberg Maritime lists MATLAB/Simulink (FINN 480691610).



## Final portfolio scope and delivery

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

15. Robotic Packing Cell (/demos/robotic-packing/). Connect checkweighing, reject lane and carton handling. Switch 50 g and 100 g formats, interrupt a pick and verify recovery and exact bottle/carton counts.

16. Factory Data Platform and Analytics (/demos/factory-data/). Ingest stage events and timestamps into Python/SQL, with delivery, lot, batch, pack and order keys. Separate telemetry, material movements, inspection and commercial records. Validate units, IDs, duplicates, missing relationships and stock; show a lot trace and an invalid import.

17. Factory Sustainability and Waste Control (/demos/sustainability/). Compare poor incoming leaf with accepted leaf delayed by a dryer outage. Separate moisture removal, recoverable product, packaging and discard. Route recommendations to Procurement, Quality, Scheduling, Maintenance, Packing, Sales or Building Controls. Record evidence, cause confidence, owner, decision and paired replay outcomes for waste, BDT, energy and service. Quality retains hold/release authority.

Project 12 includes BI costing, pricing and investment appraisal. Build the dryer first, then use the shared data and control contracts when adding Projects 15–17. Run the SIMS EUROSIM paper in parallel. Its core experiment remains fixed versus seasonal shifts crossed with a pre-winter stock target under identical deliveries and orders. Antigravity builds the UI against an agreed contract, Codex owns logic, integration and evidence, and every workday ends with a GitHub checkpoint. See the parallel schedule for dated handoffs.

## Online PanchaRupa business roadmap

Use the virtual factory as the operating model for one Panchagarh tea business. The roadmap below is a new-business scenario with Day 1 on 19 November 2026. The browser build schedule and the historical manual-to-automated reconstruction have their own milestones.

Day 1: Open the relational database, log capital, purchasing and expenses, and start tracking the three auction markets. Import available historical results. Define the first product, spending ceiling and working-capital reserve.

Months 1–2: Target two months of physical construction once site, design, approvals, contractors and utility arrangements are ready. Confirm relevant building, environmental, fire, factory and tea-sector requirements before proceeding. If the site slips, use a suitable partner facility for manual trials where feasible.

Month 3: Run hand production for one month. Measure processing steps, labour, yield, quality, waste and bottlenecks. Use those observations to specify machinery and controls. Begin local sales of bottled tea when ready.

Months 4–6: Continue manual production and local bottled sales while machines and controls are built, installed and tested. Keep the work areas and schedules coordinated. Commission within Month 6 and target repeatable automated production by month-end. Release auction-grade lots after quality checks, then consign through a broker for the first feasible sale.

Months 7–23: Run one shift with the owner and two workers as the starting model. Track raw leaf, stock, local orders, auction lots, costs, settlements, payroll and cash. Check staffing and shift coverage during commissioning and use part-time support if overlapping work regularly exceeds capacity.

Month 24, ending 18 November 2028: Complete the payroll cycle, reconcile stock, auction settlements and bank activity, and close the month. Report monthly, Year 2 and cumulative profit, alongside cash and outstanding receipts.

After 24 full months of automated production: Bring in one BI Data Science intern in Business Intelligence & Analytics, working with Auction Sales & Planning and reporting to the owner. Month 31 is the estimate if the line starts at the end of Month 6.

### Factory & Utilities

Maintain a dedicated factory subproject within PanchaRupa. Draw opening-day and fifth-year expansion layouts. Plan for a second line with minimal interruption by reserving bay space, equipment and truck access, utility routes and connection points. Check shared bottlenecks across receiving, processing, drying, packing and storage. Compare early enabling costs with later retrofit and downtime costs.

Extend the BMS for building ventilation, storage conditions and utility metering. Machine controls run the tea process. Connect runtime, downtime, throughput and energy per kg to operations reporting. Use the existing Controls and Electrical and HMI workstreams for the BMS integration.

### Company functions and portfolio

Use existing engineering and business workstreams to cover purchasing, inventory, production, quality, sales, dispatch, HR, payroll, finance and analytics. Demonstrate a batch from purchasing through sale and settlement. Present Tea Auction Planning as a BI case study inside PanchaRupa, with an operator demo and a technical walkthrough of the data, forecast and decision rules. Show ERP-style purchasing and stock, MES-style production tracking, payroll and BI through the same operating scenario.

Detailed operating, data, auction, staffing and financial plan
