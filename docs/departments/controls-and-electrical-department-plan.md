# Controls and Electrical

Translate the verified production story into testable control designs

## Inventory and design boundary

Document any PLC, modular I/O, drives, motors, instrumentation, relay logic and panels the founder can verify. Store native make and model where known. Use Siemens-oriented LAD, FBD and ST as the proposed portfolio design. Record simulator I/O separately from historical equipment and vendor runtime validation.

## Specify interfaces

Assign each tag a station ID, data type, unit, valid range, default and simulated failure behavior. Create a functional I/O schedule and concept drawings showing sensor, logic, actuator and operator-screen relationships. Candidate signals include buffer-ready, drive feedback, temperature, fan proof, weight stable and pack presence, subject to route validation.

Define station interfaces for start permission, run request, running confirmation, blocked, complete, fault and reset. Define Manual, Auto and Fault transitions. Manual commands still honor modeled interlocks. Resume requires a defined recovery step and batch reconciliation when material position is uncertain.

## Implement in stages

Start with one conveyor or transfer station and document scan order, signal filtering, timing and edge detection. Add reusable motor, valve or station blocks once the first case works. Pair the dryer model with scaled temperature, output limits and a configurable controller. Add a simulated dosing and sealing sequence, then integrate routes through ready and accept handshakes.

## Fault arbitration and acceptance

Build a cause-and-effect matrix for stale sensor, failed feedback, blocked transfer, high temperature and interrupted dosing. Show cause, affected actuators, operator message, acknowledgement and release condition. Test timeout boundaries and loss and restoration of input. Batch identity and counters must survive a modeled restart or require explicit reconciliation.

## Deliverables

Publish tag dictionary, state-transition tables, concept electrical and controls diagrams, control descriptions and a verification matrix. Keep concept drawings scoped to virtual behavior and record platform validation as a later milestone.



## Low-cost control scope

Use a single Siemens-style control design in the browser. Model the drum, shared roller and dryer, vendor intake scale, and weighing stations. Use simple transfers and batch handshakes. Operators perform receiving, cleaning, quality release and packaging replenishment. Document tolerance, timing and fault settings as simulation inputs.

Interlock shared equipment so only one batch occupies it at a time. Reject new starts when equipment is unavailable and retain the waiting batch ID. For the first playable demo, trend dryer temperature, setpoint and commanded heat, then inject a fault and test recovery.



## Building automation and SD-anlegg

Keep building supervision separate from the simulated production PLC. Supervise ventilation fans and schedules, storage temperature and relative humidity, and electricity consumption. Use simulated BACnet/IP points for fans and room sensors and Modbus meter registers for electricity. Document point names, units, alarms and trend periods. Use Siemens Desigo CC and PXC terminology as a Norwegian industry reference. The browser demo uses emulated signals and does not require a vendor license.

Commission one scenario with a failed ventilation fan and another with high storage humidity. Show alarm acknowledgement and alert clearance. Trend kWh and kWh per released kg and publish a building point list and cause-and-effect table.



## Virtual BMS tools and point mapping

Use Desigo CC as the reference for supervisory graphics, alarms, schedules and trends. Model PXC-style local control of the ventilation zone, with fan command, proof, override and fault states. Use Niagara as the reference for normalizing device points into one supervisory model. Map the same alarm and trend scenarios to equivalent EcoStruxure and Metasys workflows as portfolio documentation.

Define a simulated BACnet/IP point list for fan command, status and room temperature and humidity. Define a Modbus register map for electricity demand and cumulative kWh, including units, scaling and stale-data handling. Represent occupancy and lighting commands with optional KNX group objects. Separate simulated points from any future live protocol adapter or vendor commissioning.



## Current operating baseline and portfolio responsibilities

The portfolio has 16 standalone projects plus the integrated factory capstone (Project 14), for 17 total. The seasonal operating baseline is near-daily during active months, with roughly 1,000 kg total per active month, variable daily output, golden tea only when eligible leaf is available, and zero fresh-leaf processing in January–February. Winter packing and shipping draw from released stock. Retail uses 50 g and 100 g bottles. DAY-40 is one synthetic integration test (30 kg green, 10 kg golden; 36 kg bulk and 4 kg retail in 40 × 50 g and 20 × 100 g bottles). MONTH-VAR is a separate synthetic month (994 kg over 29 operating days).

Controls owns timestamps, run state, tag units, data quality and fault histories. Project 15 uses a simulated PLC-to-robot handshake, position and gripper feedback, and recovery without duplicate bottle counts. Project 16 ingests control and BMS signals, with sampling rates and provenance. Project 17 attributes energy to run, wait and idle states. Include a normal dryer completion test in addition to fan loss and deliberate restart.
