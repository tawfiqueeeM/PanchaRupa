# Department Work Note — Leaf Intake (Project 01)

## Contributing Departments
- **Lead: Dept 4 Quality and Traceability**
  - Specified intake gate inspection protocols, vendor lot registration, and quality disposition gates (`ACCEPTED`, `REJECTED`, `PENDING`).
  - Mandatory reason coding for rejected leaf (`HIGH_MOISTURE`, `COARSE_STALK`, `FOREIGN_MATTER`, `FERMENTED_HEAT`). Rejections diverted to quarantined ledger.
  - Specified station handoff rules: digital scale I/O (%IW64 Gross, %IW66 Tare), gross/tare net weight computation, 250 kg hopper limits, destination buffer routing (Green Grade -> Drum Infeed Hopper, Golden Eligible -> Withering Trays).
- **Dept 1 Production Engineering & Dept 3 Controls**
  - Defined mechanical interlock: Transfer command (%Q0.0) cannot energize when destination buffer sensor (%I0.3) is FALSE. If downstream hopper becomes blocked during transit, transfer drops instantly while retaining the active batch ID and unissued mass in the intake hopper.
- **Dept 5 HMI and Simulation**
  - Implemented standalone interactive browser UI at `/demos/leaf-intake/` with real-time digital scale readout, interactive buffer sensor toggle, progressive jog/auto transfer controls, live emulated PLC register table, responsive mobile layout (390px viewport certified), keyboard access, and CSV/JSON audit exports.
- **Dept 6 Testing and Portfolio**
  - Formulated acceptance scenarios: Nominal DAY-40 (V-01, L-001, 120 kg net), Golden-eligible DAY-40 (V-02, L-O01, 40 kg net), Buffer Blocked Fault trip and recovery, and Quality Rejection quarantine.
  - Authored automated unit test assertions in `projects/leaf-intake/tests/leaf-intake.test.js` verified with `node --test` (6/6 passing).

## 21 November 2026 Audit Corrections
- **R04 (Completed Transfer Idempotency):** Completed lot transfers are strictly idempotent. Once transfer status is `COMPLETED`, subsequent jogs or transfer starts are inhibited with reason `LOT_ALREADY_COMPLETED`, preventing duplicate dispatches in the ledger.
- **R05 (Weight Modification & Pre-Dispatch Revalidation):** Any weight modification after lot acceptance revokes the `ACCEPTED` disposition back to `PENDING`. Weights are revalidated immediately prior to motor energization. Negative or non-positive tare values are blocked from issuing material.
- **R22 (Mobile 390px Viewport):** Verified `scrollWidth === 390` at 390px width with no document-level horizontal overflow.
- **R24 (Identity & Department):** Fixed department mapping to Dept 4 Quality & Traceability (Demo 01 / Project 01).
