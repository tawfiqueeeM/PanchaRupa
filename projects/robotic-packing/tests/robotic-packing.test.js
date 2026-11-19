import test from "node:test";
import assert from "node:assert/strict";
import { RoboticPackingEngine } from "../js/robotic-packing-engine.js";

test("RoboticPackingEngine - Nominal 50g carton packing (12 bottles)", () => {
  const engine = new RoboticPackingEngine();
  assert.equal(engine.getSnapshot().format.bottlesPerCarton, 12);
  assert.equal(engine.getSnapshot().counts.cartonsCompleted, 0);

  // Pack 12 bottles
  for (let i = 1; i <= 12; i++) {
    const res = engine.stepCycle();
    assert.equal(res.success, true);
  }

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.counts.cartonsCompleted, 1, "Carton count should increment after 12 bottles");
  assert.equal(snapshot.counts.bottlesInCurrentCarton, 0, "Carton slots reset for next case");
  assert.equal(snapshot.completedCartons.length, 1);
});

test("RoboticPackingEngine - Format changeover to 100g format (6 bottles)", () => {
  const engine = new RoboticPackingEngine();
  engine.switchFormat("FORMAT_100G");

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.format.bottlesPerCarton, 6);
  assert.equal(snapshot.cartonSlots.length, 6);

  // Pack 6 bottles
  for (let i = 1; i <= 6; i++) {
    engine.stepCycle();
  }

  assert.equal(engine.getSnapshot().counts.cartonsCompleted, 1);
});

test("RoboticPackingEngine - Interrupted pick fault, hold, and safe purge recovery", () => {
  const engine = new RoboticPackingEngine();

  // Pack 4 bottles normally
  for (let i = 1; i <= 4; i++) {
    engine.stepCycle();
  }
  assert.equal(engine.getSnapshot().counts.bottlesInCurrentCarton, 4);

  // Inject vacuum loss on 5th bottle
  engine.injectInterruption("Vacuum pressure switch drop");
  const failedCycle = engine.stepCycle();
  assert.equal(failedCycle.success, false);
  assert.equal(engine.getSnapshot().armState, "INTERRUPTED_HOLD");
  assert.equal(engine.getSnapshot().counts.bottlesInCurrentCarton, 4, "Pocket count must NOT increment for failed pick");

  // Attempt to step again while halted fails
  const blockedStep = engine.stepCycle();
  assert.equal(blockedStep.success, false);
  assert.equal(blockedStep.reason, "ROBOT_HALTED");

  // Execute recovery purge
  const recoveryRes = engine.executeRecoveryPurge();
  assert.equal(recoveryRes, true);

  const recoveredSnapshot = engine.getSnapshot();
  assert.equal(recoveredSnapshot.armState, "IDLE");
  assert.equal(recoveredSnapshot.counts.bottlesPurged, 1, "Purged count must increment");
  assert.equal(recoveredSnapshot.counts.bottlesInCurrentCarton, 4, "Carton count retained at 4/12");

  // Next cycle resumes cleanly as 5th bottle
  const resumeRes = engine.stepCycle();
  assert.equal(resumeRes.success, true);
  assert.equal(engine.getSnapshot().counts.bottlesInCurrentCarton, 5);
});
