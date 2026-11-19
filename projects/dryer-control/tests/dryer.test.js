import test from "node:test";
import assert from "node:assert/strict";
import { DryerEngine } from "../js/dryer-engine.js";

test("DryerEngine - Nominal heat ramp and batch start", () => {
  const engine = new DryerEngine();
  engine.setSetpoint(95.0);

  const startRes = engine.startBatch();
  assert.equal(startRes.success, true);
  assert.equal(engine.getSnapshot().heatEnabled, true);

  // Step 10 minutes
  for (let i = 0; i < 10; i++) {
    engine.stepTime(1.0);
  }

  const snapshot = engine.getSnapshot();
  assert.ok(snapshot.measuredTempC > 25.0, "Temperature must rise above ambient");
  assert.ok(snapshot.heatCommandPercent > 0.0, "Heat command must modulate");
});

test("DryerEngine - Fan proof loss forces heat command to 0.0%", () => {
  const engine = new DryerEngine();
  engine.startBatch();
  engine.stepTime(5.0);

  assert.ok(engine.getSnapshot().heatCommandPercent > 0.0);

  // Trip fan proof
  engine.setFanProof(false);
  const trippedSnapshot = engine.getSnapshot();
  assert.equal(trippedSnapshot.heatCommandPercent, 0.0, "Heat command must drop to 0% immediately on lost proof");
  assert.equal(trippedSnapshot.heatEnabled, false);
  assert.equal(trippedSnapshot.alarmLatched, true);
});

test("DryerEngine - Strict safety reset: Acknowledge alone cannot restore heat command", () => {
  const engine = new DryerEngine();
  engine.startBatch();
  engine.stepTime(5.0);
  engine.setFanProof(false);

  assert.equal(engine.getSnapshot().heatCommandPercent, 0.0);
  assert.equal(engine.getSnapshot().alarmLatched, true);

  // Step 1: Operator Acknowledges alarm
  const ackRes = engine.acknowledgeAlarm();
  assert.equal(ackRes, true);
  const ackedSnapshot = engine.getSnapshot();
  assert.equal(ackedSnapshot.alarmAcked, true);
  assert.equal(ackedSnapshot.alarmLatched, true, "Alarm remains latched");
  assert.equal(ackedSnapshot.heatCommandPercent, 0.0, "Acknowledgement alone CANNOT restore heat command!");
  assert.equal(ackedSnapshot.heatEnabled, false);

  // Step 2: Attempt deliberate restart while fan proof is still missing (must fail)
  const prematureRestart = engine.deliberateRestart();
  assert.equal(prematureRestart, false, "Restart must fail while fan proof is missing");

  // Step 3: Physical fan proof restored
  engine.setFanProof(true);
  const proofRestoredSnapshot = engine.getSnapshot();
  assert.equal(proofRestoredSnapshot.heatCommandPercent, 0.0, "Proof restoration alone must not re-energize heat without deliberate restart");

  // Step 4: Deliberate Restart pushbutton pressed
  const validRestart = engine.deliberateRestart();
  assert.equal(validRestart, true);

  // Step time to allow heating to resume
  engine.stepTime(1.0);
  const resumedSnapshot = engine.getSnapshot();
  assert.equal(resumedSnapshot.alarmLatched, false);
  assert.equal(resumedSnapshot.heatEnabled, true);
  assert.ok(resumedSnapshot.heatCommandPercent > 0.0, "Heating successfully resumed post-deliberate restart");
});
