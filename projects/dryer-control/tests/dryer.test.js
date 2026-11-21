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

test("Regression R06: Dryer does not complete batch during permanent unheated fault trip", () => {
  const engine = new DryerEngine();
  engine.startBatch();
  engine.setFanProof(false); // Immediate trip

  // Step 60 minutes while unheated
  for (let i = 0; i < 60; i++) {
    engine.stepTime(1.0);
  }

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.batchComplete, false, "Batch must NOT be declared complete when unheated");
  assert.equal(snapshot.batchStatus, "FAULTED_INCOMPLETE");
  assert.equal(snapshot.batchElapsedMin, 0, "Processing time must not accumulate during fault trip");
  assert.equal(snapshot.measuredTempC, 25.0, "Temperature remains at ambient");
  assert.equal(snapshot.alarmLatched, true);
  assert.equal(snapshot.heatEnabled, false);
});

test("Regression R06: deliberateRestart cannot energize an inactive stopped batch", () => {
  const engine = new DryerEngine();
  engine.startBatch();
  engine.stepTime(1.0);
  engine.setFanProof(false);
  engine.acknowledgeAlarm();
  engine.stopBatch();
  engine.setFanProof(true);

  // Attempt deliberate restart on stopped batch
  const rearmed = engine.deliberateRestart();
  assert.equal(rearmed, false, "Restart must fail on inactive stopped batch");
  
  engine.stepTime(1.0);
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.batchActive, false);
  assert.equal(snapshot.heatEnabled, false);
  assert.equal(snapshot.heatCommandPercent, 0.0, "Heaters must remain de-energized");
});

test("Regression R06: Nominal 60-minute cycle completes with operating temperature", () => {
  const engine = new DryerEngine();
  engine.startBatch();
  for (let i = 0; i < 60; i++) {
    engine.stepTime(1.0);
  }

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.batchComplete, true, "Nominal batch completes after 60 min");
  assert.equal(snapshot.batchStatus, "COMPLETE");
  assert.ok(snapshot.measuredTempC >= 70.0, "Chamber temperature reached operating drying range");
  assert.equal(snapshot.heatEnabled, false, "Heaters shut off after completion");
  assert.equal(snapshot.heatCommandPercent, 0.0);
});
