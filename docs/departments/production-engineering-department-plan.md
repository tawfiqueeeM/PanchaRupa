# Production Engineering

Reconstruct how green tea and golden tea moved through PanchaRupa

## Recover the two production routes

Start after 16 December 2026 by walking through one batch of each product with the founder. For every operation record the incoming material, equipment or manual method, batch size, approximate duration, operator decision, destination and observable sign of completion. Ask specifically where the two products diverged and rejoined. Record golden tea as PanchaRupa’s specialty black tea and use the founder’s own terminology for its steps.

Check equipment photos, layout sketches, batch sheets and invoices if available. Assign evidence IDs. Mark each station and parameter as founder-confirmed, documented or provisional. Assign every operation a station ID and link historic evidence to the before and after versions separately.

## Model the manual and automated lines

Create one route diagram per product with manual and automated views. Include queue points, handoffs, shared equipment, buffers and rework loops. Add line layout zones for intake, process, packing and finished stock only after confirming placement. Distinguish manual labour, unattended process time and machine-occupied time for each batch.

Provide the simulation with a route table keyed by product and era. Each stage defines its station, predecessors, completion condition, material losses, compatible lots and downstream buffer. Model at least one shared resource and prevent simultaneous use by incompatible batches if confirmed or explicitly enabled as a scenario assumption.

## Build sequence and handoffs

First replay one normal run for each tea in both eras. Next add waiting, planned product changeover and interrupted transfer. Link each station to the controls I/O dictionary, quality checkpoints and capacity calendar. Give every batch a unique ID that follows it through the route and handoffs.

## Deliverables and acceptance

Produce four route views, an equipment register, a route and station data dictionary, and an evidence log. Validate all four runs against the route matrix. Every stage needs an owner, completion condition and timing source. A reviewer should be able to point to the exact manual-to-automated handoffs demonstrated by the simulation.

## Open evidence

Confirm machinery and actual processing order, which operations stayed manual, shared dryer or packing equipment, any intermediate grades, and when each automation change happened.



## Remembered upgrade sequence and working routes

Fresh leaves were mostly purchased from vendors and hand-picked. The founder recalls adding a heated drum for early green tea treatment, then automating final drying, then introducing machine rolling. The working green tea route is intake → heated drum → rolling → drying. The working golden tea route is intake → withering → rolling → oxidation → drying. Use one shared roller and dryer in the proposed design. Verify the order of upgrades separately from the order of production steps. Historical settings and intermediate outputs are unknown.

Plan the final layout with bulk bagging as the primary route to the Chattogram auction channel and a small plastic-bottle packing bench for retail. Confirm the process model with one batch of each product, including a conflict over the shared dryer.



## Current operating baseline and portfolio responsibilities

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

Production owns stage inputs and outputs, hopper and scale readings, weights at each handoff, queue exposure before processing, measured discard, recovered material, and estimated moisture removal. Project 15 extends packing with a virtual robot, bottle-size changeover, reachability checks and interrupted pick recovery. Project 17 tests whether revised handoffs and delivery timing reduce spoilage without moving the bottleneck downstream.
