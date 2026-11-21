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

test("Regression R12: Toggling quantity (10 -> 5 -> 10 kg) reproduces original schedule exactly", () => {
  const engine = new SchedulingEngine();
  const nominalScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-NOMINAL");
  const origSchedule = engine.loadScenario(nominalScenario);
  const origGoldenSteps = JSON.parse(JSON.stringify(origSchedule.batches.find(b => b.batchId === "B-GL01").steps));
  const origMakespan = origSchedule.makespanMin;

  // Toggle to 5 kg
  engine.updateOrderQuantity("B-GL01", 5);
  const reducedSchedule = engine.schedule;
  assert.ok(reducedSchedule.makespanMin <= origMakespan);

  // Toggle back to 10 kg
  engine.updateOrderQuantity("B-GL01", 10);
  const restoredSchedule = engine.schedule;
  const restoredGoldenSteps = restoredSchedule.batches.find(b => b.batchId === "B-GL01").steps;

  assert.equal(restoredSchedule.makespanMin, origMakespan, "Restored makespan must match original exactly");
  origGoldenSteps.forEach((origStep, i) => {
    assert.equal(restoredGoldenSteps[i].durationMin, origStep.durationMin, `Step ${i} duration must match original`);
    assert.equal(restoredGoldenSteps[i].startMin, origStep.startMin, `Step ${i} startMin must match original`);
    assert.equal(restoredGoldenSteps[i].endMin, origStep.endMin, `Step ${i} endMin must match original`);
  });
});

test("Regression R13: Changeover cleanup intervals explicitly reserved on machine calendar", () => {
  const engine = new SchedulingEngine();
  const nominalScenario = fixtures.scenarios.find(s => s.scenarioId === "DAY-40-NOMINAL");
  const schedule = engine.loadScenario(nominalScenario);

  // Shared roller has cleanMin = 15 between Green Tea and Golden Tea
  const rollerCalendar = schedule.machineCalendars.SHARED_ROLLER;
  const cleanups = rollerCalendar.filter(s => s.type === "CLEANUP");
  assert.ok(cleanups.length > 0, "Calendar must contain explicit CLEANUP reservation slots");
  
  const cleanSlot = cleanups[0];
  assert.equal(cleanSlot.durationMin, 15);
  
  // Verify that subsequent task starts only after cleanSlot.endMin
  const nextTask = rollerCalendar.find(s => s.type === "TASK" && s.startMin >= cleanSlot.startMin);
  assert.ok(nextTask, "Task after cleanup must exist");
  assert.ok(nextTask.startMin >= cleanSlot.endMin, "Task must start at or after cleanup completion");
});

test("Regression R14: Order evaluated against its own target due time", () => {
  const engine = new SchedulingEngine();
  const testScenario = {
    scenarioId: "EARLY-DUE-ORDER",
    description: "Order with early target time of 13:00 (minute 300)",
    shiftStartMin: 0,
    shiftEndMin: 540,
    orders: [
      {
        batchId: "B-EARLY",
        product: "GREEN_TEA",
        quantityKg: 30.0,
        targetTime: "10:00", // 10:00 is minute 120 from 08:00
        steps: [
          { machine: "FIXATION_DRUM", durationMin: 90, cleanMin: 0 },
          { machine: "SHARED_ROLLER", durationMin: 60, cleanMin: 0 } // finishes at 150 min (10:30 > 10:00)
        ]
      }
    ],
    outages: []
  };

  const schedule = engine.loadScenario(testScenario);
  const earlyBatch = schedule.batches[0];
  assert.equal(earlyBatch.completionMin, 150); // 10:30
  assert.ok(earlyBatch.completionMin < 540, "Finishes well before shift cutoff (17:00)");
  assert.equal(earlyBatch.isLate, true, "Must be flagged late because 10:30 > 10:00 target time");
  assert.equal(earlyBatch.delayMin, 30, "Delay must be 30 min against due time");
  assert.equal(schedule.isFeasible, false, "Schedule must be flagged infeasible due to missed target time");
});
