# Department Work Note — Robotic Packing Cell (Project 15 / Order 6)

## Contributing Departments
- **Lead: Dept 1 Production Engineering & Dept 3 Controls and Electrical**
  - Designed robotic packaging cell: Delta robot pick-and-place indexing bottles into shipping cases.
  - Specified bottle format grids: 50 g bottle (12 bottles per case, 4x3 matrix) and 100 g bottle (6 bottles per case, 3x2 matrix).
  - Defined PLC ↔ Robot Controller discrete handshake: `%I5.0` (Robot Ready), `%Q5.0` (Conveyor Index Run), `%I5.1` (Bottle At Datum), `%Q5.1` (Trigger Pick), `%I5.2` (Vacuum Closed), `%Q5.2` (Place Carton), `%I5.3` (Place Complete), `%I5.4` (Gripper Fault / Vacuum Loss), `%Q5.4` (Purge & Home Recovery).
  - Formulated safe fault recovery state machine: When vacuum drops mid-transit, arm halts immediately (`INTERRUPTED_HOLD`); operator triggers Purge & Home; dropped bottle is purged to rework without advancing carton pocket count, preserving 100% accurate finished packaging tallies.
- **Dept 5 HMI & Simulation**
  - Implemented cell visualization at `/demos/robotic-packing/` featuring live kinematic state readout, interactive discrete handshake pin monitor, dynamic 12-slot / 6-slot carton pocket grid, emergency alert banner, step/auto-pack controls, and CSV/JSON export.
- **Dept 6 Testing & Portfolio**
  - Authored automated unit test assertions in `projects/robotic-packing/tests/robotic-packing.test.js` validating full carton completion across both formats, vacuum loss interruption hold, and purge recovery count retention.
