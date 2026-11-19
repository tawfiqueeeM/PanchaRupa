import test from "node:test";
import assert from "node:assert/strict";
import { WitheringEngine } from "../js/withering-engine.js";

test("WitheringEngine - Fan speed comparison on identical batch", () => {
  // Run A: Gentle airflow (40% fan)
  const engineA = new WitheringEngine();
  engineA.setFanSpeed(40);
  const trajA = engineA.simulateFullRun(10);

  // Run B: High airflow (85% fan)
  const engineB = new WitheringEngine();
  engineB.setFanSpeed(85);
  const trajB = engineB.simulateFullRun(10);

  const moistureAt6hA = trajA.find(p => p.elapsedHours === 6.0).moisturePercent;
  const moistureAt6hB = trajB.find(p => p.elapsedHours === 6.0).moisturePercent;

  assert.ok(moistureAt6hB < moistureAt6hA, "Higher fan speed must produce lower moisture at the same elapsed hour");

  const finalKwhA = trajA[trajA.length - 1].fanKwh;
  const finalKwhB = trajB[trajB.length - 1].fanKwh;
  assert.ok(finalKwhB > finalKwhA, "Higher fan speed must consume more electrical energy (cubic power law)");
});

test("WitheringEngine - Ambient humidity scenario sensitivity", () => {
  // Nominal Spring
  const engineSpring = new WitheringEngine();
  engineSpring.setFanSpeed(60);
  engineSpring.setAmbientScenario("SPRING-NOMINAL");
  const trajSpring = engineSpring.simulateFullRun(8);

  // Monsoon Humid
  const engineMonsoon = new WitheringEngine();
  engineMonsoon.setFanSpeed(60);
  engineMonsoon.setAmbientScenario("MONSOON-HUMID");
  const trajMonsoon = engineMonsoon.simulateFullRun(8);

  const mSpring = trajSpring.find(p => p.elapsedHours === 8.0).moisturePercent;
  const mMonsoon = trajMonsoon.find(p => p.elapsedHours === 8.0).moisturePercent;

  assert.ok(mSpring < mMonsoon, "High humidity monsoon ambient must impede evaporation rate");
});

test("WitheringEngine - Sensor fault injection and invalid reading detection", () => {
  const engine = new WitheringEngine();
  assert.equal(engine.getSnapshot().sensorValid, true);

  // Inject open-loop sensor disconnection
  engine.setSensorFault(true);
  const faultSnapshot = engine.getSnapshot();
  assert.equal(faultSnapshot.sensorFault, true);
  assert.equal(faultSnapshot.sensorValid, false, "Sensor reading must be marked invalid");
  assert.equal(faultSnapshot.sensorReading, -99.9);

  // Restore sensor
  engine.setSensorFault(false);
  const restoredSnapshot = engine.getSnapshot();
  assert.equal(restoredSnapshot.sensorFault, false);
  assert.equal(restoredSnapshot.sensorValid, true);
});
