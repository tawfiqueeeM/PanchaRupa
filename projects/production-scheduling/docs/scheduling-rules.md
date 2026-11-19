# Production Scheduling Rules & Constraints

## 1. Workstation & Route Definitions
- **Workstations:**
  1. `WITHERING_TROUGH`: Dedicated to Golden Tea (air-drying kinetics, 180 min).
  2. `FIXATION_DRUM`: Dedicated to Green Tea (high heat de-enzyming, 45 min).
  3. `SHARED_ROLLER`: Shared between Green Tea (45 min) and Golden Tea (60 min). Requires 15 min sanitization/cleanout between product types.
  4. `OXIDATION_CHAMBER`: Dedicated to Golden Tea (fermentation/color development, 90 min).
  5. `SHARED_DRYER`: Shared fluid-bed drying unit (60 min per batch). Requires 15 min cooldown/cleanout between batches.
  6. `PACKING_LINE`: Final packaging line (Bulk 25kg + Retail 50g/100g bottles).

## 2. Shift Windows & Operating Limits
- **Standard Working Shift:** 08:00 to 17:00 (540 total operational minutes).
- **Shift Overtime Cap:** Max 60 minutes overtime allowed under supervisor sign-off.
- **Infeasibility Threshold:** Any batch requiring processing past 18:00 (600 min) is flagged as `INFEASIBLE - PROMISE DATE BREACHED`.

## 3. Mutual Exclusion & Contention Handling
- Mutual exclusion rule:
  $$\forall i \ne j, \quad \text{Overlap}(M, B_i, B_j) = \emptyset \quad \text{for } M \in \{\text{SHARED\_ROLLER}, \text{SHARED\_DRYER}\}$$
- Priority rule:
  - If Green Tea is started first, Golden Tea rolling must wait until Green rolling completes + 15 min changeover.
  - If an outage strikes a shared machine, in-progress tasks are delayed, and downstream dependent stages are shifted sequentially.
