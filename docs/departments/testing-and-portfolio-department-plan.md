# Testing and Portfolio

Prove the behavior and document the original scale-up

## Define the evidence trail

Assign requirements IDs across routing, control, quality and capacity. Link each test to a requirement, scenario version, inputs, expected outputs and observed result. Record data provenance as founder report, verified historical material, engineering assumption or simulation output. Keep high-impact unknowns visible in a decision register.

## Build the commissioning matrix

Run both products in both eras. Test normal operation, blocked transfer, bad sensor value, fan failure, hold/release, interrupted batch recovery, wrong product selection and pack rejection. For monthly replay, test common-calendar comparison and independent historical calendars where evidence exists. Treat acceptance limits as proposed until the relevant department confirms them.

## Verify the integrated system

Replay deterministic cases with test data from a clean start. Verify sequence order, lot conservation, alarms, operator recovery and final accepted mass. Test rapid repeated commands and the restart behavior of in-flight batches. Record exact steps, observed states and defects. Retest affected scenarios after each logic change.

## Prepare the portfolio story

Build a short case study around the manual operation, the automation decisions, and the founder-reported rise from 100 to 1,000 kg/month. Show the route progression, plant constraints, fault recovery and capacity waterfall. Include a walkthrough with one batch of each product and one fault scenario. Explain why the simulated gain differs if the evidence does not support a 10× reproduction.

## Release gate

Verify links, browser usability, downloadable test evidence and reproducible scenario results. Check that screenshots and settings are approved for public use before publishing anything. Keep raw business records and private recipe evidence in Drive. Candidate GitHub deliverables include original diagrams, source files, an assumptions register and a README with the evidence basis for every historical claim.



## Portfolio acceptance test

Run the 40 kg example day with 30 kg green and 10 kg golden tea, 36 kg bulk and 4 kg retail. Under nominal settings, verify no shared-machine overlap, full traceability, released mass reconciliation and 40 correctly filled 50 g bottles and 20 correctly filled 100 g bottles. Test a shared dryer outage and report the delayed batches and dispatches without assuming a fixed loss.

The public deliverables are a live browser demo, a GitHub README, source and scenario data, I/O maps, control diagrams, expected-versus-observed results and one case study. Use reproducible scenarios and label all synthetic data. Development begins after 16 December 2026.



## Current operating baseline and portfolio responsibilities

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

Test robot interrupted pick, barcode and pack counts; data import duplicates, orphan keys, invalid readings and reconciled stock; sustainability paired replay with identical inputs and confirmed/suspected/unknown causes. Verify waste classification, net credits and energy denominators. Also verify every direct CV link, restart/reset, source link and observed test evidence. Record source revision and scenario version.
