# Department Work Note — Worker Shift Planning & Skills Matrix (Dept 2)

## 1. Department Overview
- **Subproject:** 11 / Row 11 — Worker Shift Planning & Skills Matrix
- **Lead Department:** Dept 2 Operations & Capacity Planning
- **Git Branch:** `subproject/10-shifts-and-skills`
- **Scope:** Synthetic workforce scheduling, multi-skill certification matrix, fixed vs seasonal roster models, strict single-worker concurrency gating ($\text{Task}_1 \cap \text{Task}_2 = \emptyset$), worker absence modeling, and uncovered workstation deficit detection.

## 2. Implemented Capabilities
1. **Workforce Profiles & Skill Certification:**
   - 4-person crew model: Lead Tea Master (`W-01`, Fixed), Process Operator (`W-02`, Fixed), Packaging Specialist (`W-03`, Fixed), Seasonal Assistant (`W-04`, Seasonal).
   - Certification tracking across 7 distinct factory stations: Leaf Intake, Withering, Fixation, Rolling, Oxidation, Drying, and Packing.
2. **Fixed vs Seasonal Roster Comparison:**
   - Evaluates operations under core baseline (`FIXED`) vs peak-flush augmented (`SEASONAL`) staffing.
3. **Absence & Skill Gaps:**
   - Unplanned worker absence automatically identifies impacted stations, marks them `UNCOVERED`, and calculates unstaffed minutes.
   - Skill mismatch detection flags tasks assigned to operators lacking required certification.
4. **Concurrency Invariant (No Double-Booking):**
   - Strictly enforces that no individual operator can be scheduled at two distinct workstations simultaneously.
   - Overlap conflicts trigger `DOUBLE_BOOKING_CONFLICT` exceptions with exact minute boundaries.
5. **Interactive UI & Exports:**
   - Live roster timeline showing staffed vs uncovered tracks.
   - Interactive skill matrix toggles and presence checkboxes.
   - Export to formatted JSON and CSV.
