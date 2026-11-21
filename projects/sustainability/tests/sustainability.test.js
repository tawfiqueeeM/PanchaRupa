import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SustainabilityEngine } from '../js/sustainability-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = join(__dirname, '../fixtures/sustainability_scenarios.json');
const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8')).scenarios;

test('SustainabilityEngine - Nominal production mass balance and zero waste energy', () => {
  const scenario = fixtures.find(s => s.id === 'case_nominal_production');
  assert.ok(scenario, 'Nominal scenario exists');

  const analysis = SustainabilityEngine.analyze(scenario);

  assert.equal(analysis.massBalance.inputLeafKg, 200.0);
  assert.equal(analysis.massBalance.moistureEvaporatedKg, 154.0);
  assert.equal(analysis.massBalance.primeTeaKg, 44.5);
  assert.equal(analysis.massBalance.recoverableTeaKg, 1.2);
  assert.equal(analysis.massBalance.nonRecoverableDiscardKg, 0.3);
  assert.equal(analysis.impact.totalWastedEnergyKwh, 0.0);
  assert.equal(analysis.impact.scheduleDelayHours, 0.0);
  assert.equal(analysis.routing.qualityDisposition, 'RELEASE');
  assert.equal(analysis.routing.primaryOwner, 'Quality');
  assert.equal(analysis.routing.rootCause, 'NONE');
});

test('SustainabilityEngine - Intake failure attributes to Procurement with low energy waste', () => {
  const scenario = fixtures.find(s => s.id === 'case_intake_failure');
  assert.ok(scenario, 'Intake failure scenario exists');

  const analysis = SustainabilityEngine.analyze(scenario);

  assert.equal(analysis.massBalance.nonRecoverableDiscardKg, 65.0, '65 kg coarse leaf discarded at gate');
  assert.equal(analysis.impact.totalWastedEnergyKwh, 0.8, 'Negligible energy wasted prior to processing');
  assert.equal(analysis.routing.rootCause, 'SUPPLIER_LOW_GRADE_LEAF');
  assert.equal(analysis.routing.causeConfidence, 'CONFIRMED');
  assert.equal(analysis.routing.primaryOwner, 'Procurement');
  assert.equal(analysis.routing.secondaryOwner, 'Quality');
  assert.equal(analysis.routing.qualityDisposition, 'DOWNGRADE');
  assert.ok(analysis.impact.financialLossBdt > 3000, 'Financial loss includes raw leaf cost');
  assert.equal(analysis.impact.scheduleDelayHours, 0.5);
});

test('SustainabilityEngine - Dryer outage queue deterioration causes stewing, high energy loss, and Maintenance routing', () => {
  const scenario = fixtures.find(s => s.id === 'case_queue_outage_deterioration');
  assert.ok(scenario, 'Queue outage scenario exists');

  const analysis = SustainabilityEngine.analyze(scenario);

  assert.equal(analysis.massBalance.nonRecoverableDiscardKg, 50.0, '50.0 kg wet spoiled leaf scrapped');
  assert.equal(analysis.massBalance.dryDiscardEquivalentKg, 12.5, '12.5 kg made tea dry equivalent');
  assert.equal(analysis.massBalance.moistureEvaporatedKg, 112.5, '112.5 kg moisture evaporated');
  assert.equal(analysis.massBalance.unreconciledKg, 0.0, 'Zero unreconciled mass');
  assert.equal(analysis.massBalance.primeTeaKg, 0.0, 'Zero prime tea due to batch-wide stewing');
  assert.equal(analysis.massBalance.downgradedCommercialTeaKg, 33.5, 'Remaining tea downgraded');
  assert.equal(analysis.impact.totalWastedEnergyKwh, 42.0, 'High energy waste from withering + rolling + reheat');
  assert.equal(analysis.routing.rootCause, 'DRYER_OUTAGE_QUEUE_SPOILAGE');
  assert.equal(analysis.routing.causeConfidence, 'CONFIRMED');
  assert.equal(analysis.routing.primaryOwner, 'Maintenance');
  assert.equal(analysis.routing.secondaryOwner, 'Scheduling');
  assert.equal(analysis.routing.qualityDisposition, 'SCRAP');
  assert.ok(analysis.impact.financialLossBdt > 9000, 'Severe financial damage from prime revenue loss and downtime');
  assert.equal(analysis.impact.scheduleDelayHours, 2.5);
});

test('SustainabilityEngine - Paired replay highlights energy and financial divergence under identical 200kg input', () => {
  const intakeScenario = fixtures.find(s => s.id === 'case_intake_failure');
  const queueScenario = fixtures.find(s => s.id === 'case_queue_outage_deterioration');

  const replay = SustainabilityEngine.runPairedReplay(intakeScenario, queueScenario);

  assert.equal(replay.inputLeafKg, 200.0, 'Identical 200kg green leaf starting point');
  assert.equal(replay.comparison.intakeFailure.primaryOwner, 'Procurement');
  assert.equal(replay.comparison.queueOutage.primaryOwner, 'Maintenance');

  // Verify that outage queue deterioration is significantly worse in wasted energy and financial loss
  assert.ok(replay.comparison.differential.wastedEnergyDeltaKwh > 40.0, 'Outage wastes over 40 kWh more energy');
  assert.ok(replay.comparison.differential.financialLossDeltaBdt > 6000.0, 'Outage inflicts over 6,000 BDT more financial loss');
  assert.equal(replay.comparison.differential.scheduleDelayDeltaHours, 2.0, 'Outage delays schedule by 2.0 additional hours');

  // Verify CSV export
  const csv = SustainabilityEngine.exportToCSV(SustainabilityEngine.analyze(queueScenario));
  assert.ok(csv.includes('DRYER_OUTAGE_QUEUE_SPOILAGE'));
  assert.ok(csv.includes('Maintenance'));
});

test('SustainabilityEngine R18 - Strict wet-mass conservation holds across all supported scenario fixtures', () => {
  for (const scenario of fixtures) {
    const analysis = SustainabilityEngine.analyze(scenario);
    const m = analysis.massBalance;
    const outputMass = m.moistureEvaporatedKg + m.primeTeaKg + m.downgradedCommercialTeaKg + m.recoverableTeaKg + m.nonRecoverableDiscardKg;
    assert.equal(
      outputMass,
      m.inputLeafKg,
      `Mass balance must strictly conserve input mass (${m.inputLeafKg} kg) for scenario ${scenario.id}, got ${outputMass} kg`
    );
    assert.equal(m.unreconciledKg, 0.0, `Unreconciled mass must be exactly 0.0 for ${scenario.id}`);
  }
});

test('SustainabilityEngine R18 - Rejects unsupported or arbitrary input batch masses', () => {
  const nominal = fixtures.find(s => !s.incident);
  assert.throws(
    () => SustainabilityEngine.calculateMassBalance({ ...nominal, inputLeafKg: 100.0 }),
    /Unsupported inputLeafKg/,
    'Engine must reject arbitrary/uncalibrated input masses instead of advertising general extrapolation'
  );
  assert.throws(
    () => SustainabilityEngine.calculateMassBalance({ ...nominal, inputLeafKg: -50.0 }),
    /Invalid inputLeafKg/,
    'Engine must reject negative or non-finite batch masses'
  );
});
