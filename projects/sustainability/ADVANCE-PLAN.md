# Advance Plan — Factory Sustainability and Waste Control (Row 19)

## 1. Executive Summary
- **Subproject:** 19 / Row 19 — Factory Sustainability and Waste Control
- **Target Branch:** `subproject/17-sustainability-and-waste`
- **Lead Departments:** Dept 4 (Quality & Traceability) and Dept 7 (Business Operations & Costing)
- **Primary Routes:**
  - Logic & Documentation: `projects/sustainability/`
  - Browser HMI Application: `demos/sustainability/`

## 2. Core Objectives & Scope
1. **Intake Failure vs Queue Deterioration Analysis:**
   - Differentiate waste origin: incoming poor leaf (supplier plucking defect, coarse leaf, high surface water) vs queue delay deterioration (accepted high-grade leaf held during an unplanned dryer outage, resulting in heat accumulation, souring, and enzymatic stewing).
2. **Four-Tier Waste Categorization & Mass Balance:**
   - *Moisture Evaporation Loss:* Natural thermodynamic water loss during withering/drying ($\approx 75\%-78\%$ of raw green leaf), not counted as defective waste.
   - *Recoverable Product:* Off-grade tea sweepings, fannings/dust, or extractable biomass sold at secondary market salvage value (e.g. BDT 45/kg) or used as on-site compost/biomass fuel.
   - *Non-Recoverable Discard:* Spoiled, moldy, scorched, or foreign-contaminated leaf sent to landfill/disposal (zero salvage value, incur disposal cost).
   - *Packaging Waste:* Crushed bottles, damaged corrugated cartons, label tears, and defective caps segregated from organic biomass.
3. **Departmental Routing & Root-Cause Attribution:**
   - Detailed incident audit trail capturing sensor readings, dwell time, temperature, and visual inspection.
   - Root-cause confidence scoring: `CONFIRMED`, `SUSPECTED`, `UNKNOWN`.
   - Action owner routing: `Procurement`, `Quality`, `Scheduling`, `Maintenance`, `Packing`, `Sales`, `Building Controls`.
   - Final disposition decision: Solely retained by Quality Authority (`HOLD`, `RELEASE`, `DOWNGRADE`, `SCRAP`, `REPROCESS`).
4. **Paired Replay & Impact Accounting:**
   - Comparative analysis between baseline intake failure and outage queue deterioration under identical starting quantities (e.g., 200 kg green leaf).
   - Multi-metric impact: Physical loss (kg), Financial cost (BDT leaf loss + packaging waste + downtime costs), Energy loss (kWh consumed prior to spoilage), and Schedule delay (hours impact on order commitment).
5. **Interactive HMI & Export Capabilities:**
   - Interactive simulation dashboard at `/demos/sustainability/`.
   - Multi-scenario selector, mass balance visualizer, root cause diagnostic table, and action dispatch cards.
   - Real-time JSON/CSV exports.

## 3. Engineering Deliverables
1. `projects/sustainability/docs/waste-classification-rules.md`: Mathematical formulations, category taxonomy, and routing matrix.
2. `projects/sustainability/fixtures/sustainability_scenarios.json`: Paired scenarios (`case_intake_failure`, `case_queue_outage_deterioration`, `case_nominal_production`).
3. `projects/sustainability/js/sustainability-engine.js`: Pure ES module calculation engine.
4. `projects/sustainability/tests/sustainability.test.js`: Native `node --test` suite covering mass balance, classification, routing, and paired comparison.
5. `demos/sustainability/index.html`, `style.css`, `app.js`: Interactive browser interface.
6. Documentation files: `DEPARTMENT-WORK-NOTE.md`, `TEST-REPORT.md`, `HANDOFF-TO-CODEX.md`, and `README.md`.
