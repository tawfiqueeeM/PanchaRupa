# Department Work Note — Maintenance Planning & Outage Impact (Depts 7 & 2)

## 1. Department Overview
- **Subproject:** 15 / Row 15 — Maintenance Planning
- **Lead Departments:** Dept 7 (Business Operations) & Dept 2 (Operations & Capacity)
- **Git Branch:** `subproject/13-maintenance`
- **Scope:** Factory equipment asset registers, runtime hours and MTBF tracking, dual work order management (Planned PM vs Unplanned CM Breakdown), asset criticality hierarchy, work-order linkage to schedule decisions, and side-by-side planned vs unplanned downtime variance analysis.

## 2. Implemented Capabilities
1. **Asset Register & Health Indices:**
   - Registers critical factory equipment: Fluid Bed Dryer (`AST-DRY-01`), Tea Roller (`AST-ROL-01`), and Delta Robot Cell (`AST-ROB-01`).
   - Tracks cumulative runtime hours against equipment MTBF thresholds.
2. **Planned Preventative Maintenance (PM):**
   - Scheduled pre-shift service window (06:00 to 08:00) executing burner descaling and blower inspections.
   - Verified zero queued work-in-process batches and zero dispatch delays.
3. **Unplanned Breakdown & Schedule Impact (CM):**
   - Simulates mid-shift SCR heating element failure on `AST-DRY-01` during active processing.
   - Trips asset into `TRIPPED_OUTAGE`, halts downstream lines, queues 40 kg WIP (`B-G01` and `B-GL01`), and calculates 120-minute dispatch delay past shift deadline.
4. **Maintenance Expense Modeling:**
   - Reconciles consumable parts costs and technician labor hours (BDT 250/hr).
5. **Interactive UI & Exports:**
   - Asset runtime health indicators.
   - SAP PM/QM-style maintenance queue with dynamic work order creation and completion workflows.
   - Export to formatted JSON and CSV.
