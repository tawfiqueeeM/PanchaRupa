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

test("Regression R19: Format change with partial carton preserves bottle accountability and identity", () => {
  const engine = new RoboticPackingEngine();

  // 1. Pack 1x 50g bottle into carton
  const firstCycle = engine.stepCycle();
  assert.equal(firstCycle.success, true);
  const beforeSnapshot = engine.getSnapshot();
  assert.equal(beforeSnapshot.counts.bottlesProcessed, 1);
  assert.equal(beforeSnapshot.counts.bottlesInCurrentCarton, 1);
  assert.equal(beforeSnapshot.cartonSlots[0].filled, true);
  assert.equal(beforeSnapshot.cartonSlots[0].bottleId, "BT-50-0001");

  // 2. Change format to 100g while partial carton is present
  const formatSwitchRes = engine.switchFormat("FORMAT_100G");
  assert.equal(formatSwitchRes, true);

  // Partial carton should be safely diverted to rework manifest, preserving BT-50-0001
  const midSnapshot = engine.getSnapshot();
  assert.equal(midSnapshot.completedCartons.length, 1);
  assert.equal(midSnapshot.completedCartons[0].status, "DIVERTED_TO_REWORK");
  assert.equal(midSnapshot.completedCartons[0].bottlesPacked, 1);
  assert.deepEqual(midSnapshot.completedCartons[0].bottleIds, ["BT-50-0001"]);
  assert.equal(midSnapshot.counts.bottlesInCurrentCarton, 0, "Current carton slots reset for new 100g format");

  // 3. Pack 6x 100g bottles into the new 100g carton
  for (let i = 0; i < 6; i++) {
    const cycleRes = engine.stepCycle();
    assert.equal(cycleRes.success, true);
  }

  const finalSnapshot = engine.getSnapshot();
  assert.equal(finalSnapshot.counts.bottlesProcessed, 7, "Total processed bottles must be 7");
  assert.equal(finalSnapshot.completedCartons.length, 2, "2 carton records: 1 partial rework + 1 sealed 100g");

  const totalAccountedBottles = finalSnapshot.counts.bottlesInCurrentCarton +
    finalSnapshot.completedCartons.reduce((sum, c) => sum + c.bottlesPacked, 0) +
    finalSnapshot.counts.bottlesPurged;
  assert.equal(totalAccountedBottles, 7, "All 7 bottles must be strictly accounted for across cartons/rework");
  assert.equal(finalSnapshot.completedCartons[0].status, "SEALED_AND_DISPATCHED");
  assert.equal(finalSnapshot.completedCartons[0].bottlesPacked, 6);
  assert.equal(finalSnapshot.completedCartons[0].formatId, "FORMAT_100G");
});

test("Regression R19: Format change blocked during arm fault hold", () => {
  const engine = new RoboticPackingEngine();
  engine.injectInterruption("Vacuum trip");
  engine.stepCycle(); // enters INTERRUPTED_HOLD
  assert.equal(engine.armState, "INTERRUPTED_HOLD");

  const switchBlocked = engine.switchFormat("FORMAT_100G");
  assert.equal(switchBlocked, false, "Format switch must be blocked during fault hold");
  assert.equal(engine.selectedFormat.formatId, "FORMAT_50G", "Format must remain 50G");
});
