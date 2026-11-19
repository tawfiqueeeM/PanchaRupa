import test from "node:test";
import assert from "node:assert/strict";
import { GreenTeaEngine } from "../js/green-tea-engine.js";

test("GreenTeaEngine - Nominal progression: Drum -> Roller -> Dryer -> Output Increment", () => {
  const engine = new GreenTeaEngine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "IDLE");
  assert.equal(engine.getSnapshot().totalFinishedKg, 0.0);

  // Step 1: Start Batch into Heated Drum
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "DRUM");
  assert.equal(engine.getSnapshot().stations.drum.status, "RUNNING");
  assert.equal(engine.getSnapshot().totalFinishedKg, 0.0, "Output must not increment prematurely");

  // Step 2: Drum finishes, Roller available -> Transitions to Roller
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "ROLLER");
  assert.equal(engine.getSnapshot().stations.roller.status, "RUNNING");
  assert.equal(engine.getSnapshot().totalFinishedKg, 0.0);

  // Step 3: Rolling finishes, Dryer available -> Transitions to Dryer
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "DRYER");
  assert.equal(engine.getSnapshot().stations.dryer.status, "RUNNING");
  assert.equal(engine.getSnapshot().totalFinishedKg, 0.0);

  // Step 4: Drying finishes -> Completed, output incremented
  engine.stepLine();
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeBatch.currentStage, "COMPLETED");
  assert.equal(snapshot.totalFinishedKg, 30.0, "Standard 120 kg @ 0.25 yield yields 30.0 kg finished tea");
  assert.equal(snapshot.completedBatches.length, 1);
  assert.equal(snapshot.completedBatches[0].batchId, "B-G01");
});

test("GreenTeaEngine - Roller contention retains batch ID and records waiting reason", () => {
  const engine = new GreenTeaEngine();
  engine.setRollerAvailable(false, "Roller occupied by Golden Tea Batch B-O01");

  // Start batch in drum
  engine.stepLine();
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "DRUM");

  // Drum completes, but roller is unavailable
  engine.stepLine();
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeBatch.currentStage, "WAITING_FOR_ROLLER");
  assert.equal(snapshot.activeBatch.batchId, "B-G01", "Batch ID must be strictly retained");
  assert.equal(snapshot.activeBatch.freshLeafKg, 120.0, "Batch mass must be preserved");
  assert.equal(snapshot.activeBatch.waitingReason, "Roller occupied by Golden Tea Batch B-O01");
  assert.equal(snapshot.totalFinishedKg, 0.0, "No premature output increment");

  // Attempting to step again fails while roller remains locked
  const stepRes = engine.stepLine();
  assert.equal(stepRes, false);
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "WAITING_FOR_ROLLER");

  // Restoring roller availability allows transition
  engine.setRollerAvailable(true);
  const unblockedSnapshot = engine.getSnapshot();
  assert.equal(unblockedSnapshot.activeBatch.currentStage, "ROLLER");
  assert.equal(unblockedSnapshot.activeBatch.waitingReason, null);
  assert.equal(unblockedSnapshot.activeBatch.batchId, "B-G01");
});

test("GreenTeaEngine - Dryer contention retains batch ID and records waiting reason", () => {
  const engine = new GreenTeaEngine();
  engine.setDryerAvailable(false, "Dryer reserved for Golden Tea Batch B-O01");

  // Advance through drum to roller
  engine.stepLine(); // IDLE -> DRUM
  engine.stepLine(); // DRUM -> ROLLER
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "ROLLER");

  // Roller completes, but dryer is locked
  engine.stepLine();
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeBatch.currentStage, "WAITING_FOR_DRYER");
  assert.equal(snapshot.activeBatch.batchId, "B-G01");
  assert.equal(snapshot.activeBatch.waitingReason, "Dryer reserved for Golden Tea Batch B-O01");

  // Unlock dryer and verify completion
  engine.setDryerAvailable(true);
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "DRYER");
  engine.stepLine(); // DRYER -> COMPLETED
  assert.equal(engine.getSnapshot().activeBatch.currentStage, "COMPLETED");
  assert.equal(engine.getSnapshot().totalFinishedKg, 30.0);
});

test("GreenTeaEngine - Recipe selection modifies duration, temps and expected yield", () => {
  const engine = new GreenTeaEngine();
  engine.selectRecipe("GT-DEL-02");

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.selectedRecipe.name, "Spring Delicate Flush");
  assert.equal(snapshot.stations.drum.tempC, 210);
  assert.equal(snapshot.stations.dryer.tempC, 90);
  assert.equal(snapshot.activeBatch.expectedOutputKg, 31.2); // 120 * 0.26 = 31.2
});
