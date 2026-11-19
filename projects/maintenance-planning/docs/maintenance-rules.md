# Maintenance Planning, Work Orders & Outage Impact Rules

## 1. Asset Criticality & Service Windows
1. **Criticality Classification:**
   - `HIGH`: Shared single-point-of-failure assets whose failure shuts down entire processing routes (Fluid Bed Dryer `AST-DRY-01`, Tea Roller `AST-ROL-01`, Robotic Cell `AST-ROB-01`).
   - `MEDIUM`: Parallel or buffered assets where buffer storage permits limited continued upstream operation (Withering Blower `AST-VFD-01`, Fixation Drum `AST-DRM-01`).
   - `LOW`: Auxiliary utility systems with local manual bypass.

2. **Work Order Types & Workflow:**
   - `PREVENTATIVE (PM)`:
     - Scheduled in advance during off-shift hours (e.g. 06:00 to 08:00 before leaf intake arrival) or during scheduled product changeover.
     - Scheduled downtime: Planned, zero production queue impact, standard labor and consumable parts allowance.
   - `CORRECTIVE (CM)`:
     - Triggered by unplanned equipment failure or interlock trip during active processing.
     - Unplanned downtime: Halts active batch, creates downstream line starvation, delays promised dispatch, incurs overtime and emergency parts expedited costs.

## 2. Schedule & Financial Impact Metrics
- **Queued Work-in-Process (WIP):**
  $$\text{WIP}_{\text{delayed}} = \sum_{b \in \text{Batches}} \text{Mass}_{b} \quad \text{for } b \text{ scheduled on asset during outage}$$
- **Dispatch Delay:**
  $$\text{DispatchDelayMin} = \max(0, \text{OutageEndMin} - \text{ScheduledSlotEndMin})$$
- **Total Maintenance Expense:**
  $$\text{Cost}_{\text{maintenance}} = \text{PartsCost} + (\text{LaborHours} \times \text{LaborRate})$$
