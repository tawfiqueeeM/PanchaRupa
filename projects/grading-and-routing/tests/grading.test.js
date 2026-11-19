import test from "node:test";
import assert from "node:assert/strict";
import { GradingEngine } from "../js/grading-engine.js";

test("GradingEngine - Route only released material (Hold gate)", () => {
  const engine = new GradingEngine();
  
  // Initially PENDING: Routing must be inhibited
  const initialRoute = engine.routeMaterial();
  assert.equal(initialRoute.success, false);
  assert.equal(initialRoute.reason, "LOT_NOT_RELEASED");

  // Place on Hold: Routing must be locked
  engine.setDisposition("ON_HOLD", "Awaiting sensor verification");
  const holdRoute = engine.routeMaterial();
  assert.equal(holdRoute.success, false);
  assert.equal(holdRoute.reason, "LOT_NOT_RELEASED");

  // Release lot: Routing succeeds
  engine.setDisposition("RELEASED", "Quality approved");
  const releasedRoute = engine.routeMaterial();
  assert.equal(releasedRoute.success, true);
  assert.equal(engine.getSnapshot().activeLot.routingState, "ROUTED");
  assert.equal(engine.getSnapshot().activeLot.routedMassKg, 30.0);
});

test("GradingEngine - Destination full bin interlock and reroute recovery", () => {
  const engine = new GradingEngine();
  engine.setDisposition("RELEASED", "Quality approved");

  // Fill Bin 1 to capacity (50 kg)
  engine.setBinOccupancy("BIN-01", 50.0);

  // Attempt to route 30 kg lot F-G01 into full Bin 1
  const routeRes = engine.routeMaterial();
  assert.equal(routeRes.success, false);
  assert.equal(routeRes.reason, "BIN_FULL_OR_LOCKED");

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.faultLATCH, true);
  assert.equal(snapshot.activeLot.routingState, "BLOCKED_FULL_BIN");
  assert.equal(snapshot.activeLot.unroutedMassKg, 30.0, "Unrouted mass must be preserved in surge hopper");
  assert.equal(snapshot.activeLot.finishedLotId, "F-G01", "Source lot ID must remain assigned");

  // Acknowledge fault
  engine.acknowledgeFault();
  assert.equal(engine.getSnapshot().faultLATCH, false);

  // Select Bin 2 (has 50 kg capacity) and reroute
  engine.selectTargetBin("BIN-02");
  const rerouteRes = engine.routeMaterial();
  assert.equal(rerouteRes.success, true);

  const finalSnapshot = engine.getSnapshot();
  assert.equal(finalSnapshot.activeLot.routingState, "ROUTED");
  assert.equal(finalSnapshot.activeLot.routedMassKg, 30.0);
  assert.equal(finalSnapshot.activeLot.unroutedMassKg, 0.0);
  const bin2 = finalSnapshot.bins.find(b => b.binId === "BIN-02");
  assert.equal(bin2.currentOccupancyKg, 30.0);
});

test("GradingEngine - Quantity conservation across genealogy", () => {
  const engine = new GradingEngine();
  engine.setDisposition("RELEASED", "Quality sign-off");
  engine.routeMaterial();

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.routingHistory.length, 1);
  assert.equal(snapshot.routingHistory[0].routedKg, 30.0);
  assert.equal(snapshot.routingHistory[0].finishedLotId, "F-G01");
  assert.equal(snapshot.routingHistory[0].vendorLotId, "L-G01");
});
