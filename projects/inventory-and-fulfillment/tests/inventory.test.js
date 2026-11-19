import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InventoryEngine } from "../js/inventory-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/inventory_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("InventoryEngine - Nominal DAY-40 allocation reserves 36 kg bulk and 4 kg retail", () => {
  const engine = new InventoryEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-ALLOCATION-BASE");
  assert.ok(baseScenario, "Base scenario fixture must exist");

  const snapshot = engine.loadScenario(baseScenario);

  assert.equal(snapshot.isFeasible, true, "Nominal DAY-40 allocation must be valid");
  assert.equal(snapshot.totalStockKg, 40.0, "Total released stock must be 40.0 kg");
  assert.equal(snapshot.channelBreakdown.bulkAuctionKg, 36.0, "Bulk auction allocation must be 36.0 kg");
  assert.equal(snapshot.channelBreakdown.retailBottlesKg, 4.0, "Retail bottle allocation must be 4.0 kg");
});

test("InventoryEngine - Over-allocation attempt is rejected", () => {
  const engine = new InventoryEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-ALLOCATION-BASE");
  engine.loadScenario(baseScenario);

  // Try to allocate 50 kg from LOT-G01-REL (which only has 30 kg total)
  const result = engine.reserveLot("ORD-OVERFLOW-01", "LOT-G01-REL", 50.0);
  assert.equal(result.success, false, "Over-allocation must fail");
  assert.match(result.reason, /Over-allocation Block/, "Reason must specify over-allocation");

  const snapshot = engine.getSnapshot();
  const overflowEx = snapshot.exceptions.find(e => e.type === "EXCESS_ALLOCATION");
  assert.ok(overflowEx, "Must record EXCESS_ALLOCATION exception");
});

test("InventoryEngine - Held lot cannot be reserved or dispatched", () => {
  const engine = new InventoryEngine();
  const heldScenario = fixtures.scenarios.find(s => s.scenarioId === "HELD-LOT-DISPATCH-ATTEMPT");
  assert.ok(heldScenario, "Held lot scenario must exist");

  const snapshot = engine.loadScenario(heldScenario);

  assert.equal(snapshot.isFeasible, false, "Held lot reservation must be flagged infeasible");
  const heldEx = snapshot.exceptions.find(e => e.type === "HELD_LOT_VIOLATION");
  assert.ok(heldEx, "Must record HELD_LOT_VIOLATION exception");
  assert.match(heldEx.reason, /ON_HOLD/, "Reason must specify ON_HOLD quality status");
});

test("InventoryEngine - Full lifecycle: RESERVED -> DISPATCHED -> SETTLED", () => {
  const engine = new InventoryEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-ALLOCATION-BASE");
  engine.loadScenario(baseScenario);

  // Take ORD-BULK-01 (26 kg reserved)
  const targetOrderId = "ORD-BULK-01";
  
  // 1. Initial State: RESERVED
  let order = engine.orders.find(o => o.orderId === targetOrderId);
  assert.equal(order.lifecycleState, "RESERVED");

  // 2. Dispatch
  const dispatchRes = engine.dispatchOrder(targetOrderId);
  assert.equal(dispatchRes.success, true, "Dispatch must succeed");
  assert.equal(dispatchRes.order.lifecycleState, "DISPATCHED");

  // Check lot balances
  const lot = engine.lots.find(l => l.lotId === order.lotId);
  assert.ok(lot.dispatchedKg >= 26.0, "Dispatched kg must be tracked on lot");

  // 3. Settle with delayed flag
  const settleRes = engine.settleOrder(targetOrderId, true);
  assert.equal(settleRes.success, true, "Settlement must succeed");
  assert.equal(settleRes.order.lifecycleState, "SETTLED");
  assert.equal(settleRes.order.settlementStatus, "OVERDUE_DELAYED");
});
