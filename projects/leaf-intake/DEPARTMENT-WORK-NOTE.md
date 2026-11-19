# Department Work Note — Leaf Intake (Project 01)

## Contributing Departments
- **Lead: Dept 1 Production Engineering**
  - Specified station handoff rules: digital scale I/O (%IW64 Gross, %IW66 Tare), gross/tare net weight computation, 250 kg hopper limits, destination buffer routing (Green Grade -> Drum Infeed Hopper, Golden Eligible -> Withering Trays).
  - Defined mechanical interlock: Transfer command (%Q0.0) cannot energize when destination buffer sensor (%I0.3) is FALSE. If downstream hopper becomes blocked during transit, transfer drops instantly while retaining the active batch ID and unissued mass in the intake hopper.
- **Dept 4 Quality and Traceability**
  - Specified quality disposition gates: mandatory reason coding for rejected leaf (`HIGH_MOISTURE`, `COARSE_STALK`, `FOREIGN_MATTER`, `FERMENTED_HEAT`). Rejections are diverted into a quarantined discard ledger and cannot enter processing equipment.
- **Dept 5 HMI and Simulation**
  - Implemented standalone interactive browser UI at `/demos/leaf-intake/` with real-time digital scale readout, interactive buffer sensor toggle, progressive jog/auto transfer controls, live emulated PLC register table, responsive layout, keyboard access, and CSV/JSON audit exports.
- **Dept 6 Testing and Portfolio**
  - Formulated acceptance scenarios: Nominal DAY-40 (V-01, L-001, 120 kg net), Golden-eligible DAY-40 (V-02, L-O01, 40 kg net), Buffer Blocked Fault trip and recovery, and Quality Rejection quarantine.
  - Authored automated unit test assertions in `projects/leaf-intake/tests/leaf-intake.test.js` verified with `node --test`.
