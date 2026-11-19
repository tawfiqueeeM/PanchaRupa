# HMI and Simulation

Build a zero-cost browser reconstruction of PanchaRupa

## Specify the operator experience

Create a factory overview with station status, queues and active batch. Provide tabs for batch execution, trends, alarm history and monthly comparison. From the batch view select green or golden tea, confirm recipe version and observe each handoff. Show why a start or transfer command is inhibited and how the operator recovers.

## Design the simulation architecture

Use browser-based HTML, CSS and JavaScript with no paid runtime. Separate plant dynamics, cyclic controller logic, scenario settings, event history and visual presentation. Use a fixed virtual clock for reproducibility, a seeded scenario when randomized behavior is enabled and a reset that restores initial state. Keep a time cursor for accelerated monthly replay and a slower interactive mode for commissioning.

Animate process stations with labels and show measured values, units and active alarms beside the equipment. Plot temperature, setpoint and heater command on interpretable scales. Keep play, pause, reset, speed and fault controls usable by keyboard and on a small screen. Add a reduced-motion option and status text alongside color.

## Show the scale-up clearly

Give the reviewer a manual-era and automated-era comparison. Display founder-reported 100 and 1,000 kg/month separately from modeled results. Make the calendar, accepted mass basis, mix and assumptions visible. Let users run the same load on both configurations and inspect which station constrains each run.

## Build order and acceptance

Prototype a dryer and one material handoff, then connect both tea routes and packing. Integrate alarm injection and monthly replay after route and quality tests pass. A deterministic scenario replay should reproduce output and event order, and the browser version should remain usable without vendor applications. Deliver wireframes, a tag mapping, replay presets and a demo walkthrough.



## Five configurations and browser delivery

Add a selector for manual, drum, dryer, rolling machine and proposed coordinated factory configurations. Show the two product routes, shared roller and dryer queues, and bulk and retail output. Present reported monthly figures separately from modeled values.

Use HTML, CSS and JavaScript for the zero-cost simulator. Import planning inputs and results as JSON or CSV. First release a playable green tea dryer and one fault scenario. Add the 40 kg day and monthly replay after integrating both routes.



## Browser BMS demonstration

Create an original building supervision screen alongside the production HMI. Show ventilation schedule and fan proof, storage humidity, lighting or occupancy state, and meter trends. Use JavaScript adapters to normalize simulated BACnet objects, Modbus registers and optional KNX group objects. Demo cases cover fan command without proof, a humidity excursion and a stale meter reading. Include an energy-per-released-kg trend using the same production period. The browser first release uses emulated signals and needs no vendor runtime, license or hardware.



## Current operating baseline and portfolio responsibilities

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

HMI owns direct routes /demos/robotic-packing/, /demos/factory-data/ and /demos/sustainability/. Show robot interlocks and recovery, lot trace and invalid-import details, and before/after environmental and operational results. Use synthetic fixtures and ordinary direct CV links. Keep SD-anlegg independently shareable within Project 14.
