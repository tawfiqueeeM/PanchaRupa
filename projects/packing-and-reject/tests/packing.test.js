import test from "node:test";
import assert from "node:assert/strict";
import { PackingEngine } from "../js/packing-engine.js";

test("PackingEngine - Nominal dosing and single dispatch across formats", () => {
  const engine = new PackingEngine();

  // Test 50g Bottle
  engine.selectFormat("RETAIL_50G");
  engine.runFineDosing(50.2); // within [48.5, 51.5]
  assert.equal(engine.getSnapshot().activePack.checkweighStatus, "PASSED");

  const dispatchRes1 = engine.dispatch();
  assert.equal(dispatchRes1.success, true);
  assert.equal(engine.getSnapshot().massLedger.countDispatched, 1);
  assert.equal(engine.getSnapshot().massLedger.totalDispatchedG, 50.2);

  // Test 100g Bottle
  engine.selectFormat("RETAIL_100G");
  engine.runFineDosing(100.1); // within [98.0, 102.0]
  assert.equal(engine.getSnapshot().activePack.checkweighStatus, "PASSED");

  const dispatchRes2 = engine.dispatch();
  assert.equal(dispatchRes2.success, true);
  assert.equal(engine.getSnapshot().massLedger.countDispatched, 2);
  assert.equal(engine.getSnapshot().massLedger.totalDispatchedG, 150.3);

  // Test 25kg Bulk Bag
  engine.selectFormat("BULK_25KG");
  engine.runFineDosing(25010.0); // within [24900, 25100]
  assert.equal(engine.getSnapshot().activePack.checkweighStatus, "PASSED");

  const dispatchRes3 = engine.dispatch();
  assert.equal(dispatchRes3.success, true);
  assert.equal(engine.getSnapshot().massLedger.countDispatched, 3);
  assert.equal(engine.getSnapshot().dispatchedHistory[0].channel, "AUCTION");
});

test("PackingEngine - Underfill reject excluded from dispatch and preserves source lot", () => {
  const engine = new PackingEngine();
  engine.selectFormat("RETAIL_50G");

  // Inject short fill: 42.0g (below 48.5g min)
  engine.runFineDosing(42.0);
  const checkStatus = engine.getSnapshot().activePack.checkweighStatus;
  assert.equal(checkStatus, "REJECTED_UNDERFILL");
  assert.equal(engine.getSnapshot().activePack.rejectPusherActive, true);

  // Attempt dispatch
  const dispatchRes = engine.dispatch();
  assert.equal(dispatchRes.success, false, "Rejected pack must NOT be permitted into dispatch channel");
  assert.equal(dispatchRes.reason, "CANNOT_DISPATCH_REJECTED");

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.dispatchedHistory.length, 0, "Dispatched history must remain empty");
  assert.equal(snapshot.rejectHistory.length, 1, "Reject history must record defect");
  assert.equal(snapshot.rejectHistory[0].actualNetG, 42.0);
  assert.equal(snapshot.rejectHistory[0].sourceLotId, "F-G01", "Source lot ID must be preserved for traceability");
  assert.equal(snapshot.massLedger.totalRejectedG, 42.0);
  assert.equal(snapshot.massLedger.totalDispatchedG, 0.0);
});

test("PackingEngine - Mass balance reconciliation", () => {
  const engine = new PackingEngine();
  engine.selectFormat("RETAIL_50G");

  // Valid pack 1
  engine.runFineDosing(50.0);
  engine.dispatch();

  // Underfilled pack 2
  engine.runFineDosing(40.0);
  engine.dispatch();

  // Valid pack 3
  engine.runFineDosing(51.0);
  engine.dispatch();

  const snapshot = engine.getSnapshot();
  const totalDosed = snapshot.massLedger.totalDosedG;
  const totalDispatched = snapshot.massLedger.totalDispatchedG;
  const totalRejected = snapshot.massLedger.totalRejectedG;

  assert.equal(totalDispatched, 101.0);
  assert.equal(totalRejected, 40.0);
  assert.equal(totalDosed, totalDispatched + totalRejected, "Total dosed mass must equal dispatched plus rejected");
});

test("Regression R09: PackingEngine reset restores initial PK-0001 container ID", () => {
  const engine = new PackingEngine();
  engine.runFineDosing(50);
  engine.dispatch();
  assert.equal(engine.activePack.packId, "PK-0002");
  
  engine.reset();
  assert.equal(engine.activePack.packId, "PK-0001", "Reset must restore serial counter and container ID to PK-0001");
  assert.equal(engine.massLedger.countDispatched, 0);
  assert.equal(engine.massLedger.countRejected, 0);
  assert.equal(engine.massLedger.totalDosedG, 0);
});

test("Regression R09: PackingEngine rejects negative or non-finite dosing without corrupting ledger", () => {
  const engine = new PackingEngine();
  const fineDosingResult = engine.runFineDosing(-50);
  assert.equal(fineDosingResult, false, "Negative dosing mass must be rejected");

  const dispatchResult = engine.dispatch();
  assert.equal(dispatchResult.success, false);
  assert.equal(engine.massLedger.totalDosedG, 0, "Negative mass must not enter dosed total");
  assert.equal(engine.massLedger.totalRejectedG, 0, "Negative mass must not enter rejected total");
  assert.equal(engine.massLedger.countRejected, 0, "Negative mass must not enter reject count");
  assert.equal(engine.rejectHistory.length, 0, "Negative mass must not enter reject history");
});
