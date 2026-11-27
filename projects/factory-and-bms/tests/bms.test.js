import test from "node:test";
import assert from "node:assert/strict";
import { BmsEngine } from "../js/bms-engine.js";

test("BmsEngine - Ventilation airflow proof loss and alarm trip", () => {
  const engine = new BmsEngine();
  assert.equal(engine.getSnapshot().alarms.ventProofLoss, false);

  // Commanded ON, but proof lost
  engine.setVentilationCommand(true);
  engine.setVentilationProof(false);

  const trippedSnapshot = engine.getSnapshot();
  assert.equal(trippedSnapshot.alarms.ventProofLoss, true, "Missing proof must latch vent proof alarm");
  assert.equal(trippedSnapshot.ventilation.flowM3h, 0.0);

  // Acknowledge
  engine.acknowledgeVentAlarm();
  assert.equal(engine.getSnapshot().alarms.ventProofAcked, true);

  // Restore proof
  engine.setVentilationProof(true);
  const restoredSnapshot = engine.getSnapshot();
  assert.equal(restoredSnapshot.alarms.ventProofLoss, false);
  assert.equal(restoredSnapshot.ventilation.flowM3h, 4500.0);
});

test("BmsEngine - Storage room humidity excursion and dehumidifier trigger", () => {
  const engine = new BmsEngine();
  engine.setStorageHumidity(58.0);
  assert.equal(engine.getSnapshot().alarms.highHumidity, false);
  assert.equal(engine.getSnapshot().storageClimate.dehumidifierActive, false);

  // Inject high humidity excursion (75% > 65% limit)
  engine.setStorageHumidity(75.0);
  const excursionSnapshot = engine.getSnapshot();
  assert.equal(excursionSnapshot.alarms.highHumidity, true, "Exceeding 65% RH threshold must trigger alarm");
  assert.equal(excursionSnapshot.storageClimate.dehumidifierActive, true, "Dehumidifier booster must activate");

  // Restore safe humidity
  engine.setStorageHumidity(60.0);
  const safeSnapshot = engine.getSnapshot();
  assert.equal(safeSnapshot.alarms.highHumidity, false);
  assert.equal(safeSnapshot.storageClimate.dehumidifierActive, false);
});

test("BmsEngine - Modbus stale meter watchdog timeout", () => {
  const engine = new BmsEngine();
  assert.equal(engine.getSnapshot().alarms.staleMeter, false);

  // Freeze meter polling
  engine.setMeterPolling(false);
  // Advance time past 15s timeout
  engine.stepTime(1.0); // 1 min = 60s > 15s

  const staleSnapshot = engine.getSnapshot();
  assert.equal(staleSnapshot.alarms.staleMeter, true, "Watchdog must trip after > 15s without polling updates");

  // Reconnect meter
  engine.setMeterPolling(true);
  engine.stepTime(1.0);
  assert.equal(engine.getSnapshot().alarms.staleMeter, false);
});

test("BmsEngine - Specific energy consumption KPI calculation", () => {
  const engine = new BmsEngine();
  engine.stepTime(60.0); // 1 hour step

  const snapshot = engine.getSnapshot();
  assert.ok(snapshot.electricalMetering.cumulativeEnergyKwh > 58.0);
  assert.ok(snapshot.productionEnergy.kwhPerReleasedKg > 0.0);
  assert.equal(
    snapshot.productionEnergy.kwhPerReleasedKg,
    Math.round((snapshot.electricalMetering.cumulativeEnergyKwh / snapshot.productionEnergy.releasedTeaKg) * 100) / 100
  );
});

test("Regression: Zero production returns null SEC ratio instead of stale value", () => {
  const engine = new BmsEngine();
  engine.loadScenario({
    scenarioId: "ZERO-PRODUCTION",
    description: "Idle factory zero production",
    meterPollingActive: true,
    shiftReleasedTeaKg: 0
  });
  engine.stepTime(5.0);

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.productionEnergy.releasedTeaKg, 0);
  assert.equal(snapshot.productionEnergy.kwhPerReleasedKg, null, "SEC ratio must be null when production is 0 kg");
});
