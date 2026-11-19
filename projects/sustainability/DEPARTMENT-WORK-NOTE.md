# Department Work Note — Factory Sustainability & Waste Control (Depts 4 & 7)

## 1. Department Overview
- **Subproject:** 19 / Row 19 — Factory Sustainability and Waste Control
- **Lead Departments:** Dept 4 (Quality & Traceability) and Dept 7 (Business Operations & Planning)
- **Git Branch:** `subproject/17-sustainability-and-waste`
- **Scope:** Thermodynamic mass balance differentiating natural moisture vaporization from operational scrap, root-cause attribution contrasting supplier intake defects against in-process dryer breakdown queue spoilage, four-stream waste categorization, energy & financial impact accounting, and Quality Authority decision routing.

## 2. Implemented Capabilities
1. **Thermodynamic Mass Balance:**
   - Differentiates water vaporization loss ($\approx 75\%-78\%$ of raw leaf mass) from defective discarded material.
   - Categorizes physical streams into Moisture Evaporated, Prime Saleable Tea, Commercial Downgraded Tea, Recoverable Secondary Product (sweepings/fannings @ BDT 45/kg salvage), Non-Recoverable Organic Discard, and Packaging Waste.
2. **Paired Replay Attribution (Intake Failure vs Queue Deterioration):**
   - *Intake Failure:* Substandard coarse leaf (48% fine leaf) rejected at receiving bay. Discard = 65 kg raw leaf; Wasted energy = 0.8 kWh; Primary Owner = `Procurement`; Quality Disposition = `DOWNGRADE`.
   - *Queue Delay Outage:* Dryer heating failure causes 120-minute line stoppage. Wet rolled leaf stews anaerobically at 46.8°C. Discard = 12.5 kg made tea equivalent (50 kg wet leaf); Prime tea = 0 kg; Wasted energy = 42.0 kWh; Financial loss = BDT 9,680.00; Primary Owner = `Maintenance`; Quality Disposition = `SCRAP`.
   - *Comparative Insight:* The paired replay proves that downstream equipment delays destroy all prior embedded energy (+41.2 kWh delta) and compound financial damage (+BDT 6,370.00 delta).
3. **Departmental Routing & Governance:**
   - Evidence corroboration with confidence tiers (`CONFIRMED`, `SUSPECTED`, `UNKNOWN`).
   - Action dispatching across Procurement, Maintenance, Scheduling, Building Controls, and Warehouse.
   - Quality Control Department exclusively retains statutory `HOLD`, `DOWNGRADE`, `SCRAP`, or `RELEASE` decision authority.
4. **Interactive HMI & Real-time Exports:**
   - Dynamic simulation controls at `/demos/sustainability/`.
   - Interactive paired comparison drawer.
   - JSON and CSV live data export.
