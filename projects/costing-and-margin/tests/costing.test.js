import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CostingEngine } from "../js/costing-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/costing_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("CostingEngine - Acceptance check: 1,000 kg design month matches BDT 181.63 per released kg", () => {
  const engine = new CostingEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DESIGN-MONTH-1000KG");
  assert.ok(baseScenario, "1,000 kg design scenario must exist");

  const cost = engine.loadScenario(baseScenario);

  assert.equal(cost.volumeKg, 1000.0, "Volume must be 1,000 kg");
  assert.equal(cost.leafCostBdt, 100000.0, "Leaf cost must be BDT 100,000");
  assert.equal(cost.packagingCostBdt, 9800.0, "Packaging must be BDT 9,800");
  assert.equal(cost.recurringCashBdt, 61000.0, "Overhead cash must be BDT 61,000");
  assert.equal(cost.depreciationBdt, 10833.33, "Depreciation must be BDT 10,833.33");
  
  // Total Mfg Cost = 100,000 + 9,800 + 61,000 + 10,833.33 = 181,633.33
  assert.equal(cost.totalManufacturingCostBdt, 181633.33, "Total mfg cost must be BDT 181,633.33");
  assert.equal(cost.unitManufacturingCostBdt, 181.63, "Unit mfg cost must equal exactly BDT 181.63 / kg");
});

test("CostingEngine - Outbound freight is segregated from manufacturing unit cost", () => {
  const engine = new CostingEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DESIGN-MONTH-1000KG");
  const cost = engine.loadScenario(baseScenario);

  // Freight is BDT 9,000
  assert.equal(cost.outboundFreightBdt, 9000.0, "Freight must be BDT 9,000");
  
  // Unit manufacturing cost is strictly 181.63, NOT 190.63
  assert.equal(cost.unitManufacturingCostBdt, 181.63, "Unit cost must not include freight");
  
  // Net operating income deducts freight
  // Revenue = 900 * 240 + 100 * 450 = 216,000 + 45,000 = 261,000
  // Net income = 261,000 - 181,633.33 - 9,000 = 70,366.67
  assert.equal(cost.grossRevenueBdt, 261000.0, "Gross revenue must be 261,000");
  assert.equal(cost.netIncomeBdt, 70366.67, "Net operating income must accurately deduct freight");
});

test("CostingEngine - Zero output handled gracefully without division by zero", () => {
  const engine = new CostingEngine();
  const zeroScenario = fixtures.scenarios.find(s => s.scenarioId === "ZERO-OUTPUT-DORMANCY");
  assert.ok(zeroScenario, "Zero output scenario must exist");

  const cost = engine.loadScenario(zeroScenario);

  assert.equal(cost.volumeKg, 0.0, "Volume must be 0 kg");
  assert.equal(cost.isZeroOutput, true, "isZeroOutput must be true");
  assert.equal(cost.unitManufacturingCostBdt, null, "Unit cost must be null, not NaN or Infinity");
  assert.equal(cost.unitManufacturingCostStr, "N/A (Zero Output)", "String readout must be readable N/A");
  
  // Unabsorbed fixed overhead = 61,000 + 10,833.33 = 71,833.33
  assert.equal(cost.unabsorbedPeriodVarianceBdt, 71833.33, "Unabsorbed period variance must equal BDT 71,833.33");
  assert.equal(cost.netIncomeBdt, -71833.33, "Net operating income reflects period variance loss");
});

test("CostingEngine - Break-even volume calculation", () => {
  const engine = new CostingEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DESIGN-MONTH-1000KG");
  const cost = engine.loadScenario(baseScenario);

  assert.ok(cost.breakEvenVolumeKg > 0, "Break-even volume must be positive");
  assert.ok(cost.breakEvenVolumeKg < 1000, `Break-even (${cost.breakEvenVolumeKg} kg) must be below 1,000 kg capacity`);
});
