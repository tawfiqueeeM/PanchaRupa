# Test Report — Factory Sustainability & Waste Control (Row 19)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-19
- **Command:** `node --test projects/sustainability/tests/sustainability.test.js`
- **Runner:** Node.js v22.14.0 native test runner
- **Duration:** ~67 ms
- **Total Test Cases:** 4
- **Passed:** 4
- **Failed:** 0
- **Skipped:** 0
- **Status:** PASS

---

## 2. Test Case Details

### Test 1: Nominal production mass balance and zero waste energy
- **Description:** Verifies that a standard production run (200 kg green leaf) correctly computes moisture loss (154 kg), prime made tea (44.5 kg), sweepings salvage, zero wasted energy, and a clean `RELEASE` disposition by Quality.
- **Assertions:**
  - `analysis.massBalance.inputLeafKg === 200.0`
  - `analysis.massBalance.moistureEvaporatedKg === 154.0`
  - `analysis.massBalance.primeTeaKg === 44.5`
  - `analysis.impact.totalWastedEnergyKwh === 0.0`
  - `analysis.routing.qualityDisposition === 'RELEASE'`
  - `analysis.routing.primaryOwner === 'Quality'`
- **Outcome:** PASS

### Test 2: Intake failure attributes to Procurement with low energy waste
- **Description:** Verifies that raw leaf quality defects at the weighbridge correctly attribute the incident to Procurement, quarantine 65 kg of substandard leaf, scrap it prior to significant energy expenditure (0.8 kWh), and route a `DOWNGRADE` disposition.
- **Assertions:**
  - `analysis.massBalance.nonRecoverableDiscardKg === 65.0`
  - `analysis.impact.totalWastedEnergyKwh === 0.8`
  - `analysis.routing.rootCause === 'SUPPLIER_LOW_GRADE_LEAF'`
  - `analysis.routing.causeConfidence === 'CONFIRMED'`
  - `analysis.routing.primaryOwner === 'Procurement'`
  - `analysis.routing.qualityDisposition === 'DOWNGRADE'`
- **Outcome:** PASS

### Test 3: Dryer outage queue deterioration causes stewing, high energy loss, and Maintenance routing
- **Description:** Verifies that an in-process 120-minute dryer breakdown resulting in anaerobic stewing at 46.8°C scraps 12.5 kg made tea equivalent (50 kg wet leaf), downgrades the remainder, expends 42.0 kWh of wasted energy, and routes to Maintenance with a `SCRAP` disposition.
- **Assertions:**
  - `analysis.massBalance.nonRecoverableDiscardKg === 12.5`
  - `analysis.massBalance.primeTeaKg === 0.0`
  - `analysis.massBalance.downgradedCommercialTeaKg === 33.5`
  - `analysis.impact.totalWastedEnergyKwh === 42.0`
  - `analysis.routing.rootCause === 'DRYER_OUTAGE_QUEUE_SPOILAGE'`
  - `analysis.routing.primaryOwner === 'Maintenance'`
  - `analysis.routing.qualityDisposition === 'SCRAP'`
- **Outcome:** PASS

### Test 4: Paired replay highlights energy and financial divergence under identical 200kg input
- **Description:** Verifies that running paired replay on identical 200 kg starting inputs exposes stark divergence: queue deterioration wastes +41.2 kWh more embedded energy, inflicts +BDT 6,370.00 more financial damage, and delays order delivery by 2.0 additional hours compared to gate rejection.
- **Assertions:**
  - `replay.inputLeafKg === 200.0`
  - `replay.comparison.differential.wastedEnergyDeltaKwh > 40.0`
  - `replay.comparison.differential.financialLossDeltaBdt > 6000.0`
  - `replay.comparison.differential.scheduleDelayDeltaHours === 2.0`
  - CSV export validation containing cause and owner strings.
- **Outcome:** PASS

---

## 3. UI and Edge Case Verification
- Operational scenario switcher dynamically updates mass balance bars, KPI meters, and action recommendations.
- Paired comparison drawer cleanly contrasts Case A vs Case B vs Comparative Delta.
- Reset button restores nominal factory baseline.
- Export CSV and Export JSON verified with dynamically generated client-side blobs.
