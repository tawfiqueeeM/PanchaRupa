import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SchedulingEngine } from "../js/scheduling-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/schedule_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("SchedulingEngine - Nominal DAY-40 schedule is feasible within 9-hour shift", () => {
  const engine = new SchedulingEngine();
  const nominalScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-NOMINAL");
  assert.ok(nominalScenario, "Nominal scenario fixture must exist");

  const schedule = engine.loadScenario(nominalScenario);
  
  assert.equal(schedule.isFeasible, true, "Nominal DAY-40 schedule must be feasible");
  assert.equal(schedule.infeasibilities.length, 0, "No infeasibilities expected");
  assert.ok(schedule.makespanMin <= 540, `Makespan ${schedule.makespanMin} min must be <= 540 min (17:00)`);
  assert.equal(schedule.batches.length, 2, "Both Green and Golden tea batches must be scheduled");
});

test("SchedulingEngine - Mutual exclusion on SHARED_ROLLER and SHARED_DRYER", () => {
  const engine = new SchedulingEngine();
  const nominalScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-NOMINAL");
  const schedule = engine.loadScenario(nominalScenario);

  // Check SHARED_ROLLER
  const rollerTasks = schedule.machineCalendars.SHARED_ROLLER.filter(s => s.type === "TASK");
  assert.equal(rollerTasks.length, 2, "Two batches must use SHARED_ROLLER");
  assert.ok(
    rollerTasks[0].endMin <= rollerTasks[1].startMin || rollerTasks[1].endMin <= rollerTasks[0].startMin,
    "Roller tasks must never overlap"
  );

  // Check SHARED_DRYER
  const dryerTasks = schedule.machineCalendars.SHARED_DRYER.filter(s => s.type === "TASK");
  assert.equal(dryerTasks.length, 2, "Two batches must use SHARED_DRYER");
  assert.ok(
    dryerTasks[0].endMin <= dryerTasks[1].startMin || dryerTasks[1].endMin <= dryerTasks[0].startMin,
    "Dryer tasks must never overlap"
  );
});

test("SchedulingEngine - Unplanned dryer outage causes schedule delay and shifts makespan", () => {
  const engine = new SchedulingEngine();
  const outageScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-DRYER-OUTAGE");
  assert.ok(outageScenario, "Dryer outage scenario fixture must exist");

  const schedule = engine.loadScenario(outageScenario);
  const comparison = engine.getComparison();

  assert.ok(comparison, "Before vs After comparison must be available");
  assert.ok(comparison.makespanDeltaMin > 0, "Outage must cause positive makespan delay");
  assert.equal(comparison.activeOutages.length, 1, "One active outage must be recorded");

  // Verify that no task runs on SHARED_DRYER during the outage window [210, 330]
  const dryerTasks = schedule.machineCalendars.SHARED_DRYER.filter(s => s.type === "TASK");
  dryerTasks.forEach(task => {
    const overlaps = task.startMin < 330 && task.endMin > 210;
    assert.equal(overlaps, false, `Task ${task.batchId} must not overlap dryer outage [210, 330]`);
  });
});

test("SchedulingEngine - Excess volume overload triggers visible infeasibility", () => {
  const engine = new SchedulingEngine();
  const excessScenario = fixtures.scenarios.find(s => s.scenarioId === "EXCESS-CAPACITY-INFEASIBLE");
  assert.ok(excessScenario, "Excess scenario fixture must exist");

  const schedule = engine.loadScenario(excessScenario);

  assert.equal(schedule.isFeasible, false, "Excess schedule must be flagged INFEASIBLE");
  assert.ok(schedule.infeasibilities.length > 0, "Must contain infeasibility records");
  assert.ok(schedule.makespanMin > 540, `Makespan ${schedule.makespanMin} min must exceed shift end 540 min`);
  assert.match(schedule.infeasibilities[0].reason, /exceeds shift cutoff/, "Reason must specify shift cutoff breach");
});
