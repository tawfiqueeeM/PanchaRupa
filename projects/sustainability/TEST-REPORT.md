# Test Report — Factory Sustainability & Waste Control (Row 19)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-19
- **Command:** `node --test projects/sustainability/tests/sustainability.test.js`
- **Runner:** Node.js v22.14.0 native test runner
- **Duration:** ~67 ms
- **Total Test Cases:** 6
- **Passed:** 6
- **Failed:** 0
- **Skipped:** 0
- **Status:** PASS

---

## 2. Test Case Details

### Test 1: Nominal production mass balance and zero waste energy
- **Description:** Verifies that a standard production run (200 kg green leaf) correctly computes moisture loss (154 kg), prime made tea (44.5 kg), sweepings salvage, zero wasted energy, and a clean `RELEASE` disposition by Quality.
- **Outcome:** PASS

### Test 2: Intake failure attributes to Procurement with low energy waste
- **Description:** Verifies that raw leaf quality defects at the weighbridge correctly attribute the incident to Procurement, quarantine 65 kg of substandard leaf, scrap it prior to significant energy expenditure (0.8 kWh), and route a `DOWNGRADE` disposition.
- **Outcome:** PASS

### Test 3: Dryer outage queue deterioration causes stewing, high energy loss, and Maintenance routing
- **Description:** Verifies that an in-process 120-minute dryer breakdown resulting in anaerobic stewing at 46.8°C scraps 50.0 kg wet leaf (12.5 kg made tea dry equivalent), evaporates 112.5 kg moisture, downgrades 33.5 kg, recovers 4.0 kg, expends 42.0 kWh of wasted energy, and strictly reconciles to 200.0 kg (0.0 kg unreconciled).
- **Outcome:** PASS

### Test 4: Paired replay highlights energy and financial divergence under identical 200kg input
- **Description:** Verifies that running paired replay on identical 200 kg starting inputs exposes stark divergence: queue deterioration wastes +41.2 kWh more embedded energy, inflicts +BDT 6,370.00 more financial damage, and delays order delivery by 2.0 additional hours compared to gate rejection.
- **Outcome:** PASS

### Test 5: Strict Wet-Mass Conservation Across Scenarios (Regression R18)
- **Description:** Verifies that total output mass (`moistureEvaporatedKg + primeTeaKg + downgradedCommercialTeaKg + recoverableTeaKg + nonRecoverableDiscardKg`) strictly equals `inputLeafKg` (200.0 kg) across every supported scenario fixture with `unreconciledKg === 0.0`.
- **Outcome:** PASS

### Test 6: Unsupported Input Mass Rejection (Regression R18)
- **Description:** Verifies that passing arbitrary (e.g. 100 kg) or non-finite/negative input masses throws an explicit validation error rather than calculating erroneous extrapolated yields.
- **Outcome:** PASS

---

## 3. UI and Edge Case Verification
- Operational scenario switcher dynamically updates mass balance bars, KPI meters, and action recommendations.
- Paired comparison drawer cleanly contrasts Case A vs Case B vs Comparative Delta.
- Reset button restores nominal factory baseline.
- Export CSV and Export JSON verified with dynamically generated client-side blobs.
