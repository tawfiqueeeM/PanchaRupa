import test from "node:test";
import assert from "node:assert/strict";
import { LeafIntakeEngine } from "../js/leaf-intake-engine.js";

test("LeafIntakeEngine - Nominal scale computation and lot acceptance", () => {
  const engine = new LeafIntakeEngine();
  engine.setGrossWeight(125.0);
  engine.setTareWeight(5.0);

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeLot.netKg, 120.0, "Net weight should be gross minus tare");

  const acceptResult = engine.acceptLot();
  assert.equal(acceptResult.success, true, "Valid lot should accept successfully");

  const acceptedSnapshot = engine.getSnapshot();
  assert.equal(acceptedSnapshot.activeLot.disposition, "ACCEPTED");
  assert.equal(acceptedSnapshot.destinationBuffer.targetStation, "DRUM_INFEED_HOPPER");
  assert.equal(acceptedSnapshot.activeLot.transferStatus, "READY");
});

test("LeafIntakeEngine - Validation error on gross <= tare or negative tare", () => {
  const engine = new LeafIntakeEngine();
  engine.setGrossWeight(10.0);
  engine.setTareWeight(15.0); // gross < tare

  assert.equal(engine.getSnapshot().activeLot.netKg, 0);
  const result = engine.acceptLot();
  assert.equal(result.success, false);
  assert.ok(result.errors.length > 0, "Should return validation errors for gross <= tare");
});

test("LeafIntakeEngine - Downstream buffer interlock drop and recovery", () => {
  const engine = new LeafIntakeEngine();
  engine.setGrossWeight(125.0);
  engine.setTareWeight(5.0);
  engine.acceptLot();

  // Buffer is clear: transfer starts
  const startResult = engine.startTransfer();
  assert.equal(startResult.success, true);
  assert.equal(engine.getSnapshot().transferInterlock.commandActive, true);
  assert.equal(engine.getSnapshot().activeLot.transferStatus, "IN_TRANSIT");

  // Destination buffer sensor trips (simulating hopper full / blockage)
  engine.setBufferClear(false);
  const trippedSnapshot = engine.getSnapshot();
  assert.equal(trippedSnapshot.transferInterlock.commandActive, false, "Transfer command must drop on blocked buffer");
  assert.equal(trippedSnapshot.transferInterlock.interlockTripped, true);
  assert.equal(trippedSnapshot.activeLot.transferStatus, "BLOCKED");
  assert.equal(trippedSnapshot.activeLot.lotId, "L-001", "Lot must remain assigned in hopper");
  assert.equal(trippedSnapshot.history.length, 0, "No duplicate or premature mass completion");

  // Re-clearing the buffer restores transfer eligibility
  engine.setBufferClear(true);
  const restoredSnapshot = engine.getSnapshot();
  assert.equal(restoredSnapshot.transferInterlock.interlockTripped, false);
  assert.equal(restoredSnapshot.activeLot.transferStatus, "READY");

  // Complete transfer
  const resumeResult = engine.startTransfer();
  assert.equal(resumeResult.success, true);
  engine.jogTransfer(100);

  const completedSnapshot = engine.getSnapshot();
  assert.equal(completedSnapshot.activeLot.transferStatus, "COMPLETED");
  assert.equal(completedSnapshot.history.length, 1);
  assert.equal(completedSnapshot.history[0].netKg, 120.0);
});

test("LeafIntakeEngine - Quality rejection diverted to quarantine", () => {
  const engine = new LeafIntakeEngine();
  engine.setGrossWeight(60.0);
  engine.setTareWeight(5.0);
  const rejectResult = engine.rejectLot("HIGH_MOISTURE");

  assert.equal(rejectResult.success, true);
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeLot.disposition, "REJECTED");
  assert.equal(snapshot.activeLot.rejectionReason, "HIGH_MOISTURE");
  assert.equal(snapshot.activeLot.transferStatus, "QUARANTINED");

  // Transfer must be inhibited
  const transferResult = engine.startTransfer();
  assert.equal(transferResult.success, false);
});

test("LeafIntakeEngine - Regression R04: Completed transfer is idempotent, additional jogs do not duplicate deliveries", () => {
  const engine = new LeafIntakeEngine();
  engine.setGrossWeight(125.0);
  engine.setTareWeight(5.0);
  const acceptRes = engine.acceptLot();
  assert.equal(acceptRes.success, true);

  // 4 jogs at 25% complete the transfer (100%)
  for (let i = 0; i < 4; i++) {
    const r = engine.jogTransfer(25);
    assert.equal(r.success, true);
  }
  assert.equal(engine.getSnapshot().activeLot.transferStatus, "COMPLETED");
  assert.equal(engine.dispatchedHistory.length, 1);
  assert.equal(engine.dispatchedHistory[0].netKg, 120.0);

  // Additional jogs must be rejected and must NOT create duplicate deliveries
  for (let i = 0; i < 5; i++) {
    const extraJog = engine.jogTransfer(25);
    assert.equal(extraJog.success, false);
    assert.equal(extraJog.reason, "LOT_ALREADY_COMPLETED");
  }

  // History and mass must remain strictly 1 delivery of 120 kg
  assert.equal(engine.dispatchedHistory.length, 1);
  const totalDelivered = engine.dispatchedHistory.reduce((s, x) => s + x.netKg, 0);
  assert.equal(totalDelivered, 120.0, "Total delivered mass must remain 120 kg, not duplicate to 240 kg");
});

test("LeafIntakeEngine - Regression R05: Weight mutation after acceptance invalidates approval and negative tare is blocked", () => {
  const engine = new LeafIntakeEngine();
  engine.setGrossWeight(125.0);
  engine.setTareWeight(5.0);
  engine.acceptLot();
  assert.equal(engine.getSnapshot().activeLot.disposition, "ACCEPTED");

  // Changing tare weight after acceptance must revoke approval
  engine.setTareWeight(-100.0);
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.activeLot.disposition, "PENDING", "Disposition must be invalidated to PENDING upon weight edit");
  assert.equal(snapshot.activeLot.transferStatus, "IDLE");

  // Attempting transfer with invalid tare must fail and not issue material
  const transferRes = engine.jogTransfer(100);
  assert.equal(transferRes.success, false);
  assert.equal(engine.dispatchedHistory.length, 0, "No material issued on invalid tare");
  assert.equal(engine.validateWeights().isValid, false, "Tare <= 0 must fail validation");
});
