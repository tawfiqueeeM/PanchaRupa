# Department Work Note — Grading & Routing (Project 06 / Order 7)

## Contributing Departments
- **Lead: Dept 4 Quality & Traceability**
  - Formulated quality inspection parameters: moisture content verification (< 4.0%), sensory infusion scores, and physical leaf grade classifications (Grade A Whole Leaf, Grade B Broken, Grade C Fannings).
  - Defined mandatory disposition gates: `RELEASED` grants routing permissive; `ON_HOLD` locks diverter gate; `REJECTED` diverts only to quarantine. Every disposition requires recorded decision reasons.
  - Established end-to-end lot genealogy: links intake vendor deliveries (`V-01`, `L-G01`) through process batches (`B-G01`) to finished lot IDs (`F-G01`), assigned grades, and final packaging runs with 100% quantity conservation.
- **Dept 1 Production Engineering**
  - Specified bulk storage bin capacities (Bin 1: 50 kg, Bin 2: 50 kg, Bin 3: 30 kg) and mechanical diverter gate mechanisms.
  - Defined full-bin interlock: optical level sensors (`DI_BIN_FULL`) drop the transfer conveyor drive (`DO_ROUTING_CONVEYOR = FALSE`) immediately; material and source lot IDs remain safely buffered in the upstream surge hopper without duplicate issuance.
- **Dept 5 HMI & Simulation**
  - Designed interactive UI at `/demos/grading-and-routing/` featuring visual genealogy breadcrumbs, real-time bin occupancy bars with fill/empty simulation toggles, quality sign-off buttons, fault latch alert banners, and CSV/JSON export.
- **Dept 6 Testing & Portfolio**
  - Authored automated unit test assertions in `projects/grading-and-routing/tests/grading.test.js` validating the Hold gate, destination full-bin trip and recovery, and genealogy mass reconciliation.
