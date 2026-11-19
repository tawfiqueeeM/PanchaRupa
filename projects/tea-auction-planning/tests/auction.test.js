import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuctionEngine } from "../js/auction-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/auction_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("AuctionEngine - Three-centre net realization comparison", () => {
  const engine = new AuctionEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "THREE-CENTRE-BASELINE");
  assert.ok(baseScenario, "Base scenario fixture must exist");

  const analysis = engine.loadScenario(baseScenario);

  assert.equal(analysis.venues.length, 3, "Must evaluate 3 auction centres");

  const p = analysis.venues.find(v => v.venueId === "PANCHAGARH");
  assert.ok(p, "Panchagarh venue must exist");
  // Gross: 215, Freight: 1.50, Commission: 215 * 0.0125 = 2.6875, WH: 0.50 -> Net = 215 - 1.50 - 2.6875 - 0.50 = 210.31
  assert.equal(p.netRealizationPerKg, 210.31, "Panchagarh net realization must equal 210.31 BDT/kg");
  assert.equal(p.decision, "SOLD_SETTLE", "Panchagarh decision must be SOLD_SETTLE (exceeds reserve 200)");

  const ctg = analysis.venues.find(v => v.venueId === "CHATTOGRAM");
  assert.ok(ctg, "Chattogram venue must exist");
  // Gross: 255, Freight: 10.00, Comm: 255 * 0.0175 = 4.4625, WH: 1.50 -> Net = 255 - 10 - 4.4625 - 1.50 = 239.04
  assert.equal(ctg.netRealizationPerKg, 239.04, "Chattogram net realization must equal 239.04 BDT/kg");

  // Chattogram should be recommended because 239.04 > 210.31
  assert.equal(analysis.recommendedVenueId, "CHATTOGRAM", "Chattogram must be the recommended venue");
});

test("AuctionEngine - Freight break-even premium calculation", () => {
  const engine = new AuctionEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "THREE-CENTRE-BASELINE");
  const analysis = engine.loadScenario(baseScenario);

  const ctg = analysis.venues.find(v => v.venueId === "CHATTOGRAM");
  // Required price to match Panchagarh net (210.31):
  // (210.3125 + 10.00 + 1.50) / (1 - 0.0175) = 221.8125 / 0.9825 = 225.76 BDT/kg
  assert.equal(ctg.breakEvenHammerPrice, 225.76, "Chattogram break-even hammer price must be BDT 225.76");
  // Premium required over Panchagarh 215: 225.76 - 215 = +10.76 BDT/kg
  assert.equal(ctg.breakEvenPremiumRequired, 10.76, "Chattogram premium required must equal +BDT 10.76/kg");
});

test("AuctionEngine - Reserve price deficit triggers RELIST decision", () => {
  const engine = new AuctionEngine();
  const relistScenario = fixtures.scenarios.find(s => s.scenarioId === "RESERVE-PRICE-DEFICIT-RELIST");
  assert.ok(relistScenario, "Relist scenario fixture must exist");

  const analysis = engine.loadScenario(relistScenario);
  const ctg = analysis.venues[0];

  assert.equal(ctg.decision, "RELIST", "Decision must be RELIST");
  assert.match(ctg.decisionReason, /Re-enter next sale/, "Reason must specify re-entering next sale");
});

test("AuctionEngine - Settlement days timeline tracking", () => {
  const engine = new AuctionEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "THREE-CENTRE-BASELINE");
  const analysis = engine.loadScenario(baseScenario);

  const p = analysis.venues.find(v => v.venueId === "PANCHAGARH");
  const s = analysis.venues.find(v => v.venueId === "SREEMANGAL");
  const c = analysis.venues.find(v => v.venueId === "CHATTOGRAM");

  assert.equal(p.settlementDays, 7, "Panchagarh settlement must be 7 days");
  assert.equal(s.settlementDays, 14, "Sreemangal settlement must be 14 days");
  assert.equal(c.settlementDays, 21, "Chattogram settlement must be 21 days");
});
