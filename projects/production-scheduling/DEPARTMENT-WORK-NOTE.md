# Department Work Note — Production Scheduling & Machine Calendar (Dept 2)

## 1. Department Overview
- **Subproject:** 10 / Row 10 — Production Scheduling
- **Lead Department:** Dept 2 Operations & Capacity Planning
- **Git Branch:** `subproject/09-production-scheduling`
- **Scope:** Multi-product batch scheduling on shared tea manufacturing equipment (Roller, Dryer) with mutual exclusion constraints, changeover sanitization buffers, outage injection modeling, Before vs After schedule comparison, and visible infeasibility detection against shift deadlines.

## 2. Implemented Capabilities
1. **Multi-Product Routes:**
   - Green Tea (`B-G01`): Fixation Drum -> Shared Roller -> Shared Dryer -> Packing Line.
   - Golden Tea (`B-GL01`): Withering Trough -> Shared Roller -> Oxidation Chamber -> Shared Dryer -> Packing Line.
2. **Mutual Exclusion & Contention Handling:**
   - Both `SHARED_ROLLER` and `SHARED_DRYER` enforce strict non-overlapping reservations.
   - A 15-minute changeover cleaning window is automatically inserted whenever a shared machine transitions between product types.
3. **Machine Outages & Rescheduling:**
   - Unplanned maintenance outage (e.g. 120-minute heating element fault on Shared Dryer) blocks machine calendar.
   - Downstream dependent operations dynamically shift forward in time.
4. **Before vs After Rescheduling Analytics:**
   - Calculates exact baseline vs revised completion times, total makespan variance, and batch-level delays.
   - If scheduled tasks push completion past the 17:00 (540 min) shift end deadline, the schedule is visibly flagged as `INFEASIBLE - PROMISE DATE BREACHED`.
5. **Interactive UI & Exports:**
   - Full timeline/Gantt chart with visual color coding for Green Tea, Golden Tea, Changeover, Outages, and a prominent 17:00 shift cutoff marker.
   - Dynamic batch mass sliders and outage injection toggles.
   - Export to formatted JSON and CSV.
