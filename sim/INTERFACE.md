# Seasonal Staffing & Winter Inventory Simulation Contract (`sim/INTERFACE.md`)

## 1. Scope & Execution Boundary
This specification standardizes the inputs, state variables, and execution output schema for the Python discrete-event simulation model (`simpy`) of PanchaRupa Virtual Tea Factory. It targets scientific publication and peer review at **SIMS EUROSIM 2027 (Federation of European Simulation Societies / Scandinavian Simulation Society)**.

The simulation models the extreme agricultural seasonality of the **Panchagarh sub-Himalayan tea terroir in Northern Bangladesh**, where fresh green leaf availability fluctuates dramatically across three climatic regimes:
1. **Monsoon Surge & Peak Flush (May – August):** Maximum fresh leaf plucking (up to 200–300 kg/day), machine capacity saturation, high overtime demand.
2. **Shoulder Seasons (March – April, September – October):** Moderate intake, single-shift operations.
3. **Winter Dormancy (November – February):** Plucking drops to **0 kg/day** due to cold fog and dormancy of *Camellia sinensis var. assamica*. The factory operates exclusively on warehouse finished goods inventory, facing severe working capital cash drain while carrying fixed payroll and maintenance expenses.

---

## 2. Input Configuration Schema (`simulation_config.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PanchaRupaEurosimConfig",
  "type": "object",
  "properties": {
    "experimentId": { "type": "string", "example": "EXP-EUROSIM-2027-BENCHMARK" },
    "randomSeed": { "type": "integer", "default": 42 },
    "replicationCount": { "type": "integer", "default": 1000 },
    "simulationHorizonDays": { "type": "integer", "default": 365 },
    
    "seasonalHarvestProfile": {
      "type": "object",
      "properties": {
        "monthlyFreshLeafKg": {
          "type": "array",
          "items": { "type": "number" },
          "description": "12-month array of fresh leaf input (Jan..Dec). Months 0,1,10,11 (Jan,Feb,Nov,Dec) = 0.0 kg."
        },
        "dailyArrivalVariancePct": { "type": "number", "default": 0.15 },
        "outturnDryRatio": { "type": "number", "default": 0.25 }
      },
      "required": ["monthlyFreshLeafKg", "outturnDryRatio"]
    },

    "staffingPolicy": {
      "type": "object",
      "properties": {
        "regularHeadcount": { "type": "integer", "default": 4 },
        "seasonalContractors": { "type": "integer", "default": 2 },
        "baseShiftRateBdt": { "type": "number", "default": 650.0 },
        "shiftMealAllowanceBdt": { "type": "number", "default": 120.0 },
        "overtimeMultiplier": { "type": "number", "default": 2.0 },
        "winterStaffRetentionPct": { "type": "number", "default": 1.0 }
      },
      "required": ["regularHeadcount", "baseShiftRateBdt", "shiftMealAllowanceBdt"]
    },

    "inventoryPolicy": {
      "type": "object",
      "properties": {
        "preWinterBufferTargetKg": {
          "type": "number",
          "default": 400.0,
          "description": "Finished goods buffer built prior to October 31 to survive winter dormancy."
        },
        "safetyStockKg": { "type": "number", "default": 50.0 },
        "reorderPointKg": { "type": "number", "default": 100.0 }
      },
      "required": ["preWinterBufferTargetKg"]
    },

    "financialParameters": {
      "type": "object",
      "properties": {
        "initialWorkingCapitalBdt": { "type": "number", "default": 500000.0 },
        "monthlyFixedOverheadBdt": { "type": "number", "default": 65000.0 },
        "greenLeafCostBdtPerKg": { "type": "number", "default": 38.0 },
        "averageSellingPriceBdtPerKg": { "type": "number", "default": 260.0 }
      },
      "required": ["initialWorkingCapitalBdt", "monthlyFixedOverheadBdt"]
    }
  }
}
```

---

## 3. Discrete-Event Process Architecture (SimPy)

```text
Fresh Leaf Generator (Poisson) 
   │
   ▼
[Withering Trough Queue] ──(Trough Capacity = 200 kg)
   │
   ▼
[Rolling Table Resource] ──(Shared Machine Mutual Exclusion, 35 min)
   │
   ▼
[Fluidized Bed Dryer] ──(Batch Capacity = 40 kg, 60 min, SCR Interlocked)
   │
   ▼
[Grading & Packaging Cell] ──(Bulk vs Retail Bottling)
   │
   ▼
[Finished Goods Warehouse Buffer] ──(Winter Survival Stock)
   │
   ▼
[Customer Order Outflow] ──(Local Retail + Chattogram Auction Dispatches)
```

### Key State Equations
1. **Finished Goods Balance:**
   $$I(t + \Delta t) = I(t) + Q_{\text{packaged}}(t) - D_{\text{orders}}(t)$$
2. **Winter Working Capital Trajectory:**
   $$\text{Cash}(t + \Delta t) = \text{Cash}(t) + R_{\text{sales}}(t) - C_{\text{fixed}} - C_{\text{payroll}}(t) - C_{\text{energy}}(t)$$
   *During winter ($t \in [\text{Day } 305, 365]$), $R_{\text{sales}}(t)$ depends entirely on pre-built buffer inventory $I(t)$ fulfilling customer orders.*

---

## 4. Simulation Output & KPI Schema (`simulation_results.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PanchaRupaEurosimResults",
  "type": "object",
  "properties": {
    "runSummary": {
      "type": "object",
      "properties": {
        "experimentId": { "type": "string" },
        "completedAt": { "type": "string", "format": "date-time" },
        "totalSimulatedDays": { "type": "integer" }
      }
    },

    "operationalKpis": {
      "type": "object",
      "properties": {
        "annualFreshLeafProcessedKg": { "type": "number" },
        "annualFinishedTeaProducedKg": { "type": "number" },
        "averageDryerUtilizationPct": { "type": "number" },
        "peakFlushQueueWaitHours": { "type": "number" }
      }
    },

    "winterDormancyResilience": {
      "type": "object",
      "properties": {
        "winterStockoutDays": { "type": "integer", "description": "Days where warehouse finished goods were 0 kg while orders existed." },
        "winterOrderFulfillmentPct": { "type": "number", "description": "Service level % during Nov 1 - Feb 28 dormancy." },
        "minimumWinterCashBalanceBdt": { "type": "number", "description": "Lowest bank cash balance observed during dormancy." },
        "workingCapitalDeficitOccurred": { "type": "boolean", "description": "True if cash balance dipped below 0 BDT (liquidity crisis)." }
      },
      "required": ["winterStockoutDays", "winterOrderFulfillmentPct", "minimumWinterCashBalanceBdt"]
    },

    "laborAndCostingKpis": {
      "type": "object",
      "properties": {
        "totalOvertimeHoursPaid": { "type": "number" },
        "totalWorkerIdleHours": { "type": "number" },
        "averageAbsorptionCostBdtPerKg": { "type": "number", "example": 181.63 },
        "totalMealAllowancesPaidBdt": { "type": "number" }
      }
    }
  }
}
```

---

## 5. EUROSIM 2027 Scientific Benchmark Policy
To ensure reproducibility in the EUROSIM 2027 proceedings:
1. Every simulation script must accept `--seed <int>` and `--replications <int>`.
2. Benchmarks must execute paired comparisons between:
   - **Policy A (Static Baseline):** Linear staffing, unconstrained plucking without pre-winter inventory build.
   - **Policy B (Adaptive Buffer & Multi-Skilling):** Buffer pre-build of 400 kg finished tea by Oct 31, cross-trained maintenance during winter dormancy, and phased seasonal shift scheduling.
3. Outputs must report **95% Confidence Intervals** across all 1,000 Monte Carlo runs.
