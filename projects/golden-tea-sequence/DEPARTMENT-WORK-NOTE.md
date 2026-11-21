# Department Work Note — Golden Tea Sequence (Project 05)

## Contributing Departments
- **Lead: Dept 2 Capacity & Operations**
  - Specified 4-stage processing line for specialty black/golden tea: Withering Trays (120 min) → Shared Roller (30 min) → Oxidation Racks (60–120 min @ 24–26°C / 90% RH) → Shared Final Dryer (60 min @ 95°C).
  - Enforced equipment arbitration and mutual exclusion on the Shared Final Dryer: Dryer can only be owned by one batch at a time (`BUSY_GREEN` or `BUSY_GOLDEN`). If the dryer is occupied by green tea batch B-G01, golden tea batch B-O01 is held at oxidation discharge with retained batch ID and mass until the dryer is cleared.
  - Required completed final drying discharge before incrementing finished stock ledger.
- **Dept 4 Quality & Traceability**
  - Established leaf eligibility gate: Golden tea strictly requires tender shoot/bud grade leaves (`GOLDEN_ELIGIBLE`). Ineligible lots are rejected at start gate to prevent wasted processing of coarse leaf.
- **Dept 5 HMI & Simulation**
  - Implemented 4-stage pipeline visualization at `/demos/golden-tea-sequence/` with stage status badges, leaf eligibility toggle, oxidation liquor color indicators, shared dryer arbitration lock panel, step/auto-run controls, responsive layout (390px viewport certified), and CSV/JSON audit export.
- **Dept 6 Testing & Portfolio**
  - Authored automated unit test assertions in `projects/golden-tea-sequence/tests/golden-tea.test.js` verifying eligibility gating, nominal 4-stage completion, mutual exclusion interlock, dryer ownership protection, and output conservation.

## 21 November 2026 Audit Corrections
- **API Hardening (Dryer Ownership & Batch Restart Guard):** Protected active golden tea batch from external preemption while in the dryer. Prohibited restarting completed batch without a distinct new batch ID. Regression test 4 passing.
- **R22 (Mobile 390px Viewport):** Contained `.pipeline-flow` scroller to `max-width: 100%` and enabled local touch scrolling, achieving `scrollWidth === 390px` at 390px viewport width (zero page overflow).
- **R24 (Identity & Department):** Fixed identity to Project 05 / Demo 05, Lead Department: Dept 2 Capacity & Operations.
- **R03 (Launch):** Standardized launch command to `python shared/serve.py 8080`.
