import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MaintenanceEngine } from "../js/maintenance-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/maintenance_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("MaintenanceEngine - Planned PM window results in zero dispatch delay and zero queued batches", () => {
  const engine = new MaintenanceEngine();
  const pmScenario = fixtures.scenarios.find(s => s.scenarioId === "PLANNED-PM-BASELINE");
  assert.ok(pmScenario, "Planned PM scenario fixture must exist");

  const snapshot = engine.loadScenario(pmScenario);

  assert.equal(snapshot.plannedDowntimeMin, 120, "Planned downtime must be 120 min");
  assert.equal(snapshot.unplannedDowntimeMin, 0, "Unplanned downtime must be 0 min");
  assert.equal(snapshot.totalDispatchDelayMin, 0, "Dispatch delay must be 0 min");
  assert.equal(snapshot.queuedBatchesCount, 0, "Zero queued batches expected");
});

test("MaintenanceEngine - Unplanned breakdown trips asset and triggers dispatch delay with queued WIP", () => {
  const engine = new MaintenanceEngine();
  const emScenario = fixtures.scenarios.find(s => s.scenarioId === "UNPLANNED-DRYER-BREAKDOWN");
  assert.ok(emScenario, "Breakdown scenario fixture must exist");

  const snapshot = engine.loadScenario(emScenario);

  const dryer = snapshot.assets.find(a => a.assetId === "AST-DRY-01");
  assert.equal(dryer.status, "TRIPPED_OUTAGE", "Dryer asset status must be TRIPPED_OUTAGE");
  assert.equal(snapshot.unplannedDowntimeMin, 120, "Unplanned downtime must be 120 min");
  assert.equal(snapshot.totalDispatchDelayMin, 120, "Dispatch delay must be 120 min");
  assert.equal(snapshot.queuedBatchesCount, 2, "Two queued batches expected");
  assert.ok(snapshot.queuedBatches.includes("B-G01"), "B-G01 must be queued");
  assert.ok(snapshot.queuedBatches.includes("B-GL01"), "B-GL01 must be queued");
});

test("MaintenanceEngine - Dynamic work order creation links asset and updates schedule impact", () => {
  const engine = new MaintenanceEngine();
  const pmScenario = fixtures.scenarios.find(s => s.scenarioId === "PLANNED-PM-BASELINE");
  engine.loadScenario(pmScenario);

  // Inject emergency breakdown on Tea Roller AST-ROL-01 at min 150
  const result = engine.createWorkOrder({
    woId: "WO-EM-TEST-01",
    type: "CORRECTIVE",
    assetId: "AST-ROL-01",
    title: "Roller gearbox bearing seizure",
    priority: "CRITICAL",
    startMin: 150,
    durationMinutes: 90,
    partsCostBdt: 7500.0,
    laborHours: 3.5
  });

  assert.equal(result.success, true, "Work order creation must succeed");
  const roller = engine.assets.find(a => a.assetId === "AST-ROL-01");
  assert.equal(roller.status, "TRIPPED_OUTAGE", "Roller status must become TRIPPED_OUTAGE");
  assert.equal(result.workOrder.dispatchDelayMin, 90, "Delay must equal duration");
});

test("MaintenanceEngine - Completing work order restores asset to OPERATIONAL and resets runtime", () => {
  const engine = new MaintenanceEngine();
  const emScenario = fixtures.scenarios.find(s => s.scenarioId === "UNPLANNED-DRYER-BREAKDOWN");
  engine.loadScenario(emScenario);

  const completeRes = engine.completeWorkOrder("WO-EM-2026-088");
  assert.equal(completeRes.success, true, "Completion must succeed");

  const dryer = engine.assets.find(a => a.assetId === "AST-DRY-01");
  assert.equal(dryer.status, "OPERATIONAL", "Asset must return to OPERATIONAL");
  assert.equal(dryer.runtimeHours, 0.0, "Runtime hours must be reset to 0 after overhaul");
});

test("MaintenanceEngine R16 - Completing work order preserves TRIPPED_OUTAGE if another corrective order remains open", () => {
  const engine = new MaintenanceEngine();
  const emScenario = fixtures.scenarios.find(s => s.scenarioId === "UNPLANNED-DRYER-BREAKDOWN");
  engine.loadScenario(emScenario);

  const dryer = engine.assets.find(a => a.assetId === "AST-DRY-01");
  dryer.runtimeHours = 450.0;

  // Add a second corrective order on the same asset AST-DRY-01
  const secondWO = engine.createWorkOrder({
    woId: "WO-EM-SECOND-01",
    type: "CORRECTIVE",
    assetId: "AST-DRY-01",
    title: "SCR secondary thermocouple replacement",
    priority: "HIGH",
    startMin: 180,
    durationMinutes: 45
  });
  assert.equal(secondWO.success, true);
  assert.equal(dryer.status, "TRIPPED_OUTAGE");

  // Complete the first work order (WO-EM-2026-088)
  const completeFirst = engine.completeWorkOrder("WO-EM-2026-088");
  assert.equal(completeFirst.success, true);

  // Status must remain TRIPPED_OUTAGE because WO-EM-SECOND-01 is still OPEN
  assert.equal(dryer.status, "TRIPPED_OUTAGE", "Dryer status must remain TRIPPED_OUTAGE while second corrective order is open");
  assert.equal(dryer.runtimeHours, 450.0, "Runtime hours must not be reset while asset is still under repair");

  // Complete the second work order
  const completeSecond = engine.completeWorkOrder("WO-EM-SECOND-01");
  assert.equal(completeSecond.success, true);

  // Now that all open orders are completed, status must transition to OPERATIONAL
  assert.equal(dryer.status, "OPERATIONAL", "Dryer status must transition to OPERATIONAL once all open orders are closed");
  assert.equal(dryer.runtimeHours, 0.0, "Runtime hours reset to 0.0 upon full restoration");
});
