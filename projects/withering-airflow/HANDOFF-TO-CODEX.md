# Handoff to Codex — Withering Airflow & Moisture Dynamics (Project 04)

## 1. Status & Subproject Metadata
- **Status:** `READY FOR CODEX RE-REVIEW`
- **Subproject ID:** Project 04 (Demo 04)
- **Lead Department:** Dept 3 Controls & Electrical (in coordination with Dept 1 Production Engineering)
- **Git Branch:** `subproject/04-withering`
- **Assigned Directories:**
  - Logic & Specification: `projects/withering-airflow/`
  - Interactive Demo: `demos/withering-airflow/`
- **Tested Implementation Revision:** `ee7bfb78949cc1e9e9f1a3cbcf130fb48ea508d7`
- **Shared Foundation Fix:** `16d0d38` (cherry-picked from `7f18e1c`)

---

## 2. Review Findings Addressed in this Pass

| Review Finding ID | Description | Resolution & Evidence |
|:---|:---|:---|
| **R08 (P2)** | Initial moisture below target (50% with 65% target) jumped upward to 64.75% | Handled initially satisfied target moisture explicitly. When initial moisture <= target moisture, `targetReached` is immediately set to `true`, rehydration jump to ambient equilibrium is prevented, and fan energy is not consumed. Regression test 4 passing. |
| **R22 (Mobile)** | Viewport overflowed at 390px | Added responsive styles, container bounds, and flexible layouts in `shared/css/base.css`. Browser verified via Edge CDP: `scrollWidth === 390px` at 390px viewport width (0px horizontal overflow). |
| **R24 (Identity)** | Demo number labeled Demo 03 instead of Project 04; department labeled Dept 1 | Corrected identity to Project 04 (Demo 04), Lead Department: Dept 3 Controls & Electrical. |
| **R03 (Launch)** | Standardized server launch instructions | Documented `python shared/serve.py 8080` with direct URL `http://localhost:8080/demos/withering-airflow/`. |

---

## 3. Verification Commands & Observed Results

### 3.1 Unit Test Execution
Command:
```bash
node --test projects/withering-airflow/tests/withering.test.js
```
Observed Output:
```text
TAP version 13
# Subtest: WitheringEngine - Fan speed comparison on identical batch
ok 1 - WitheringEngine - Fan speed comparison on identical batch
# Subtest: WitheringEngine - Ambient humidity scenario sensitivity
ok 2 - WitheringEngine - Ambient humidity scenario sensitivity
# Subtest: WitheringEngine - Sensor fault injection and invalid reading detection
ok 3 - WitheringEngine - Sensor fault injection and invalid reading detection
# Subtest: WitheringEngine - Regression R08: Initially satisfied moisture target is recognized without upward jump
ok 4 - WitheringEngine - Regression R08: Initially satisfied moisture target is recognized without upward jump
1..4
# tests 4
# suites 0
# pass 4
# fail 0
```

### 3.2 Browser & Mobile Viewport Verification
- **Command:** Launch `python shared/serve.py 8080` and open `http://localhost:8080/demos/withering-airflow/`.
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1416px (0px document overflow).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (0px document overflow).
- **Unrun Checks:** Full 3D CFD spatial moisture gradient modeling across multi-layer troughs remains deferred.

---

## 4. Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/withering-airflow/js/withering-engine.js`
- **Class:** `WitheringEngine`
- **State Fields:**
  ```typescript
  interface WitheringState {
    batchId: string;
    leafMassKg: number;
    initialMoisture: number;
    targetMoisture: number;
    currentMoisture: number;
    ambientKey: 'SPRING-NOMINAL' | 'MONSOON-HUMID' | 'AUTUMN-DRY';
    fanSpeedPercent: number;
    elapsedHours: number;
    cumulativeFanKwh: number;
    targetReached: boolean;
    sensorFault: boolean;
    sensorReading: number;
    trajectory: Array<{
      elapsedHours: number;
      moisturePercent: number;
      sensorReading: number;
      sensorValid: boolean;
      fanSpeedPercent: number;
      cumulativeFanKwh: number;
      targetReached: boolean;
    }>;
  }
  ```
- **Deferred Work:** Dynamic psychrometric Mollier chart solver and real-time CFD moisture gradient model.
