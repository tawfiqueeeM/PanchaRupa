import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ShiftEngine } from "../js/shift-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/shift_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("ShiftEngine - Nominal full crew achieves 100% coverage and zero violations", () => {
  const engine = new ShiftEngine();
  const nominalScenario = fixtures.scenarios.find(s => s.scenarioId === "NOMINAL-FULL-CREW");
  assert.ok(nominalScenario, "Nominal scenario must exist");

  const evalResult = engine.loadScenario(nominalScenario);

  assert.equal(evalResult.isFeasible, true, "Nominal roster must be fully feasible");
  assert.equal(evalResult.coveragePct, 100, "Coverage must be 100%");
  assert.equal(evalResult.uncoveredTasks.length, 0, "No uncovered tasks expected");
  assert.equal(evalResult.violations.length, 0, "No constraint violations expected");
});

test("ShiftEngine - Absent operator triggers uncovered work on assigned stations", () => {
  const engine = new ShiftEngine();
  const absentScenario = fixtures.scenarios.find(s => s.scenarioId === "ABSENT-OPERATOR-DEFICIT");
  assert.ok(absentScenario, "Absent scenario must exist");

  const evalResult = engine.loadScenario(absentScenario);

  assert.equal(evalResult.isFeasible, false, "Absent roster must be flagged infeasible");
  assert.ok(evalResult.uncoveredTasks.length >= 2, "Must identify uncovered tasks for absent worker");
  assert.ok(evalResult.coveragePct < 100, "Coverage percentage must drop below 100%");
  
  const uncoveredStations = evalResult.uncoveredTasks.map(t => t.station);
  assert.ok(uncoveredStations.includes("ROLLING"), "Rolling must be uncovered");
  assert.ok(uncoveredStations.includes("DRYING"), "Drying must be uncovered");
});

test("ShiftEngine - Double-booking overlap detects concurrency violation", () => {
  const engine = new ShiftEngine();
  const overlapScenario = fixtures.scenarios.find(s => s.scenarioId === "OVERLAP-CONFLICT-TEST");
  assert.ok(overlapScenario, "Overlap scenario must exist");

  const evalResult = engine.loadScenario(overlapScenario);

  assert.equal(evalResult.isFeasible, false, "Double-booked roster must be flagged infeasible");
  const doubleBookings = evalResult.violations.filter(v => v.type === "DOUBLE_BOOKING_CONFLICT");
  assert.ok(doubleBookings.length > 0, "Must detect DOUBLE_BOOKING_CONFLICT");
  assert.equal(doubleBookings[0].workerId, "W-01", "Violation must specify W-01");
  assert.match(doubleBookings[0].reason, /double-booked/, "Reason must note double-booking");
});

test("ShiftEngine - Removing skill triggers SKILL_MISMATCH violation", () => {
  const engine = new ShiftEngine();
  const nominalScenario = fixtures.scenarios.find(s => s.scenarioId === "NOMINAL-FULL-CREW");
  engine.loadScenario(nominalScenario);

  // Remove DRYING skill from W-02
  engine.toggleWorkerSkill("W-02", "DRYING");
  const evalResult = engine.evaluation;

  assert.equal(evalResult.isFeasible, false, "Roster with missing skill must be infeasible");
  const mismatches = evalResult.violations.filter(v => v.type === "SKILL_MISMATCH");
  assert.ok(mismatches.length > 0, "Must detect SKILL_MISMATCH");
  assert.equal(mismatches[0].requiredSkill, "DRYING", "Mismatch must target DRYING skill");
});
