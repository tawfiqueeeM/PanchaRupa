# Test Report — Integrated Factory Capstone (Demo 14 / Row 20)

## 1. Test Execution Summary
- **Execution Date:** 2026-11-21
- **Command:** `node --test projects/virtual-factory/tests/integrated-factory.test.js`
- **Runner:** Node.js native test runner
- **Duration:** ~75 ms
- **Total Test Cases:** 4
- **Passed:** 4
- **Failed:** 0
- **Skipped:** 0
- **Status:** PASS

---

## 2. Test Case Details

### Test 1: Five configurations structural integrity and monotonic scaling
- **Description:** Verifies that exactly 5 configurations exist in canonical sequence (order 1 to 5), with strictly monotonic monthly capacity expansion (120 to 1,200 kg/mo) and strictly declining labor intensity (4.20 down to 0.42 worker-hrs/kg).
- **Assertions:**
  - `configs.length === 5`
  - `orders` deep equals `[1, 2, 3, 4, 5]`
  - `configs[i].maxMonthlyCapacityKg > configs[i - 1].maxMonthlyCapacityKg` for all $i \in [1, 4]$
  - `configs[i].laborIntensityWorkerHoursPerKg < configs[i - 1].laborIntensityWorkerHoursPerKg` for all $i \in [1, 4]$
- **Outcome:** PASS

### Test 2: 1,000 kg design load simulation identifies capacity shortfalls and absorption cost
- **Description:** Verifies that applying the 1,000 kg design month workload accurately flags artisanal configurations 1 through 4 as over capacity (Config 1 realizes only 120 kg with 880 kg unfulfilled), while Configuration 5 realizes the full 1,000 kg at the verified absorption benchmark unit cost of BDT 181.63/kg.
- **Assertions:**
  - `manual.isOverCapacity === true`
  - `manual.realizedOutputKg === 120.0`
  - `manual.unfulfilledDemandKg === 880.0`
  - `coordinated.isOverCapacity === false`
  - `coordinated.realizedOutputKg === 1000.0`
  - `coordinated.unitCostBdtPerKg === 181.63`
- **Outcome:** PASS

### Test 3: Bottleneck progression accurately shifts from hand rolling to dryer to coordinated balance
- **Description:** Verifies bottleneck station assignment across the evolutionary spectrum: hand rolling in configurations 1, 2, and 3; continuous dryer in configuration 4; and coordinated line balance in configuration 5.
- **Assertions:**
  - `runs[0].bottleneckStation === 'Rolling (Hand Labor)'`
  - `runs[1].bottleneckStation === 'Rolling (Hand Labor)'`
  - `runs[2].bottleneckStation === 'Rolling (Hand Labor)'`
  - `runs[3].bottleneckStation === 'Drying (Queue Capacity)'`
  - `runs[4].bottleneckStation === 'Coordinated Line Balance'`
- **Outcome:** PASS

### Test 4: Multi-config comparison metrics, 10x labor productivity, and full navigation directory
- **Description:** Verifies scale-up summary analytics (10.0x labor productivity improvement factor, 10.0x capacity scale multiplier), complete 20-subproject navigation directory, and CSV export string integrity.
- **Assertions:**
  - `summaryInsights.laborProductivityFactor === 10.0`
  - `summaryInsights.capacityScaleMultiplier === 10.0`
  - `nav.length === 20`
  - Nav contains BMS and Capstone routes.
  - CSV contains expected configuration and bottleneck strings.
- **Outcome:** PASS

---

## 3. UI and Edge Case Verification
- Replay workload selector switches between 1,000 kg Design Target, 100 kg Pilot Benchmark, and 40 kg DAY-40 Benchmark.
- Custom target input allows arbitrary workload entry.
- Visual badge correctly toggles between `FOUNDER-REPORTED BENCHMARK` and `SYNTHETIC SCENARIO`.
- Configuration cards dynamically update active equipment detail panel.
- Portfolio Navigation drawer displays all 20 modules with verified direct links.
- Export CSV and Export JSON client-side downloads validated.
