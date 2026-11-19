import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProcurementEngine } from "../js/procurement-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/procurement_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("ProcurementEngine - Acceptance check: 20 kg net requirement at 25% yield yields exactly 80 kg fresh leaf", () => {
  const engine = new ProcurementEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-MRP-BASE");
  assert.ok(baseScenario, "Base scenario fixture must exist");

  const mrp = engine.loadScenario(baseScenario);

  const greenProd = mrp.products.find(p => p.productId === "GREEN_TEA");
  assert.ok(greenProd, "Green tea product must be evaluated");

  // Gross 30 kg - Released Stock 10 kg = Net 20 kg
  assert.equal(greenProd.netDemandKg, 20.0, "Net demand must equal 20.0 kg");
  assert.equal(greenProd.assumedYieldPct, 25.0, "Yield must be 25%");
  
  // 20 kg / 0.25 = 80 kg fresh leaf
  assert.equal(greenProd.freshLeafNeededKg, 80.0, "Fresh leaf needed must equal exactly 80.0 kg");
  assert.equal(mrp.isFeasible, true, "Base scenario must be feasible with zero shortages");
});

test("ProcurementEngine - Inventory buffer offset reduces net purchasing demand", () => {
  const engine = new ProcurementEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-MRP-BASE");
  engine.loadScenario(baseScenario);

  // Increase released stock buffer to 30 kg for Green Tea (covering 100% of gross demand)
  engine.updateReleasedStock("GREEN_TEA", 30.0);
  const mrp = engine.mrpResults;

  const greenProd = mrp.products.find(p => p.productId === "GREEN_TEA");
  assert.equal(greenProd.netDemandKg, 0.0, "Net demand must drop to 0 kg");
  assert.equal(greenProd.freshLeafNeededKg, 0.0, "Fresh leaf required must be 0 kg");
});

test("ProcurementEngine - Late delivery slot triggers logistics shortage exception", () => {
  const engine = new ProcurementEngine();
  const shortageScenario = fixtures.scenarios.find(s => s.scenarioId === "SUPPLIER-LEAD-TIME-SHORTAGE");
  assert.ok(shortageScenario, "Shortage scenario fixture must exist");

  const mrp = engine.loadScenario(shortageScenario);

  assert.equal(mrp.isFeasible, false, "Late arrival must be flagged infeasible");
  assert.ok(mrp.shortages.length > 0, "Shortage record must be logged");
  
  const goldenShortage = mrp.shortages.find(s => s.productId === "GOLDEN_TEA");
  assert.ok(goldenShortage, "Golden tea shortage must be identified");
  assert.equal(goldenShortage.delayHours, 6, "Delay must be 6 hours (14:00 vs 08:00)");
  assert.match(goldenShortage.reason, /Line starvation/, "Reason must specify production starvation");
});

test("ProcurementEngine - Winter dormancy halts fresh leaf procurement and alerts if buffer inadequate", () => {
  const engine = new ProcurementEngine();
  const winterScenario = fixtures.scenarios.find(s => s.scenarioId === "WINTER-DORMANCY-JANUARY");
  assert.ok(winterScenario, "Winter scenario fixture must exist");

  const mrp = engine.loadScenario(winterScenario);

  assert.equal(mrp.isWinterDormancy, true, "Winter dormancy must be active");
  assert.equal(mrp.totalFreshLeafNeededKg, 0.0, "Total fresh leaf required must be 0.0 kg in winter");

  // In winterScenario, released stock (45kg green, 15kg golden) exceeds gross demand (30kg green, 10kg golden) -> 0 shortages
  assert.equal(mrp.shortages.length, 0, "Adequate winter stock buffer must prevent shortages");

  // Reduce winter stock to 5 kg for Green Tea (below 30 kg demand)
  engine.updateReleasedStock("GREEN_TEA", 5.0);
  const deficitMrp = engine.mrpResults;

  assert.equal(deficitMrp.isFeasible, false, "Stock deficit during winter must trigger infeasibility");
  const winterShortage = deficitMrp.shortages.find(s => s.type === "WINTER_BUFFER_DEFICIT");
  assert.ok(winterShortage, "Must report WINTER_BUFFER_DEFICIT");
  assert.equal(winterShortage.netDemandKg, 25.0, "Deficit must be 25.0 kg");
});
