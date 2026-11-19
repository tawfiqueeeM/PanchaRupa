import test from "node:test";
import assert from "node:assert/strict";
import { GoldenTeaEngine } from "../js/golden-tea-engine.js";

test("GoldenTeaEngine - Leaf eligibility gate prevents ineligible leaf processing", () => {
  const engine = new GoldenTeaEngine();
  engine.setLeafEligible(false);

  const startRes = engine.startBatch();
  assert.equal(startRes.success, false, "Ineligible leaf must be rejected at start gate");
  assert.equal(startRes.reason, "LEAF_INELIGIBLE");
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "IDLE");

  // Setting eligibility allows batch start
  engine.setLeafEligible(true);
  const validStartRes = engine.startBatch();
  assert.equal(validStartRes.success, true);
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "WITHERING");
});

test("GoldenTeaEngine - Nominal 4-stage progression: Withering -> Rolling -> Oxidation -> Drying", () => {
  const engine = new GoldenTeaEngine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "IDLE");

  // Step 1: Start -> Withering
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "WITHERING");

  // Step 2: Withering complete -> Roller
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "ROLLER");

  // Step 3: Rolling complete -> Oxidation
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "OXIDATION");

  // Step 4: Oxidation complete -> Dryer (free, so transitions directly)
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "DRYER");
  assert.equal(engine.getSnapshot().sharedDryer.state, "BUSY_GOLDEN");
  assert.equal(engine.getSnapshot().sharedDryer.ownerBatchId, "B-O01");
  assert.equal(engine.getSnapshot().totalFinishedGoldenKg, 0.0, "Output must not increment before drying completes");

  // Step 5: Drying complete -> Completed & output incremented
  engine.stepLine();
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeBatch.currentStage, "COMPLETED");
  assert.equal(snapshot.totalFinishedGoldenKg, 10.0, "40 kg fresh @ 0.25 yield = 10.0 kg finished golden tea");
  assert.equal(snapshot.sharedDryer.state, "FREE", "Dryer must be released upon batch completion");
  assert.equal(snapshot.sharedDryer.ownerBatchId, null);
});

test("GoldenTeaEngine - Shared dryer mutual exclusion blocks second batch and avoids concurrent ownership", () => {
  const engine = new GoldenTeaEngine();
  // Simulate Green Tea batch currently occupying the shared dryer
  engine.setDryerExternalLock(true, "B-G01");
  assert.equal(engine.getSnapshot().sharedDryer.state, "BUSY_GREEN");
  assert.equal(engine.getSnapshot().sharedDryer.ownerBatchId, "B-G01");

  // Advance Golden batch through Withering -> Roller -> Oxidation
  engine.stepLine(); // IDLE -> WITHERING
  engine.stepLine(); // WITHERING -> ROLLER
  engine.stepLine(); // ROLLER -> OXIDATION
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "OXIDATION");

  // Oxidation finishes: Dryer is busy with B-G01!
  const stepRes = engine.stepLine();
  assert.equal(stepRes, false, "Cannot step into busy dryer");

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeBatch.currentStage, "WAITING_FOR_DRYER");
  assert.equal(snapshot.sharedDryer.ownerBatchId, "B-G01", "Dryer ownership must strictly belong to B-G01");
  assert.notEqual(snapshot.sharedDryer.ownerBatchId, "B-O01", "Both batches must never own dryer simultaneously");
  assert.ok(snapshot.activeBatch.waitingReason.includes("B-G01"));

  // Release green batch from dryer
  engine.setDryerExternalLock(false);
  const unblockedSnapshot = engine.getSnapshot();
  assert.equal(unblockedSnapshot.activeBatch.currentStage, "DRYER");
  assert.equal(unblockedSnapshot.sharedDryer.state, "BUSY_GOLDEN");
  assert.equal(unblockedSnapshot.sharedDryer.ownerBatchId, "B-O01");
});
