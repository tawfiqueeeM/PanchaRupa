# Department Work Note — Packing & Reject (Project 07 / Order 5)

## Contributing Departments
- **Lead: Dept 1 Production Engineering**
  - Specified automated packaging formats: 50 g retail bottle (48.5–51.5 g), 100 g retail bottle (98.0–102.0 g), and 25 kg bulk auction bag (24.90–25.10 kg).
  - Modeled coarse/fine dual-stage dosing: coarse auger feed (%Q4.0) delivers rapid initial fill to ~85% of target; fine trickle feed (%Q4.1) meters final net weight.
  - Enforced single-dispatch gate and mass reconciliation: each compliant pack enters the allocated channel (`RETAIL` or `AUCTION`) exactly once; total packed mass balances across dispatched and rejected pools.
- **Dept 4 Quality & Traceability**
  - Defined dynamic checkweigher tolerance limits and pneumatic reject pusher interlock (%Q4.2): defective packs (underfill/overfill) are automatically diverted into a physical quarantine bin.
  - Required that rejected packs retain their upstream source lot ID (`F-G01` or `F-O01`) and measured net mass in the quarantine ledger for material balance auditing and rework.
- **Dept 5 HMI & Simulation**
  - Implemented high-contrast checkweigher deck UI at `/demos/packing-and-reject/` with live load-cell readout, coarse/fine/reject actuator indicators, underfill injection, dual manifest tables (Dispatched vs Quarantined Rejects), and CSV/JSON export.
- **Dept 6 Testing & Portfolio**
  - Formulated automated unit test suite in `projects/packing-and-reject/tests/packing.test.js` validating format switching, underfill rejection, strict single dispatch, and mass balance conservation.
