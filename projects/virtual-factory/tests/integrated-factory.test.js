import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { IntegratedFactoryEngine } from '../js/integrated-factory-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = join(__dirname, '../fixtures/configurations_dataset.json');
const data = JSON.parse(readFileSync(fixturePath, 'utf8'));
const configs = data.configurations;
const workloads = data.workloads;

test('IntegratedFactoryEngine - Five configurations structural integrity and monotonic scaling', () => {
  assert.equal(configs.length, 5, 'Exact 5 factory configurations');

  // Verify order
  const orders = configs.map(c => c.order);
  assert.deepEqual(orders, [1, 2, 3, 4, 5]);

  // Verify monotonic capacity expansion
  for (let i = 1; i < configs.length; i++) {
    assert.ok(
      configs[i].maxMonthlyCapacityKg > configs[i - 1].maxMonthlyCapacityKg,
      `Capacity of config ${i + 1} (${configs[i].maxMonthlyCapacityKg}) > config ${i} (${configs[i - 1].maxMonthlyCapacityKg})`
    );
    assert.ok(
      configs[i].laborIntensityWorkerHoursPerKg < configs[i - 1].laborIntensityWorkerHoursPerKg,
      `Labor intensity of config ${i + 1} < config ${i}`
    );
  }
});

test('IntegratedFactoryEngine - 1,000 kg design load simulation identifies capacity shortfalls and absorption cost', () => {
  const load1000 = workloads.find(w => w.id === 'load_design_1000kg');
  assert.ok(load1000, '1,000 kg workload exists');

  const comparison = IntegratedFactoryEngine.compareAllConfigurations(configs, load1000);
  assert.equal(comparison.runs.length, 5);

  const manual = comparison.runs[0];
  assert.equal(manual.isOverCapacity, true);
  assert.equal(manual.realizedOutputKg, 120.0);
  assert.equal(manual.unfulfilledDemandKg, 880.0);

  const coordinated = comparison.runs[4];
  assert.equal(coordinated.isOverCapacity, false);
  assert.equal(coordinated.realizedOutputKg, 1000.0);
  assert.equal(coordinated.unfulfilledDemandKg, 0.0);
  assert.equal(coordinated.unitCostBdtPerKg, 181.63, 'Matches Dept 7 absorption benchmark of BDT 181.63/kg');
});

test('IntegratedFactoryEngine - Bottleneck progression accurately shifts from hand rolling to dryer to coordinated balance', () => {
  const loadPilot = workloads.find(w => w.id === 'load_pilot_100kg');
  const comparison = IntegratedFactoryEngine.compareAllConfigurations(configs, loadPilot);

  assert.equal(comparison.runs[0].bottleneckStation, 'Rolling (Hand Labor)');
  assert.equal(comparison.runs[1].bottleneckStation, 'Rolling (Hand Labor)');
  assert.equal(comparison.runs[2].bottleneckStation, 'Rolling (Hand Labor)');
  assert.equal(comparison.runs[3].bottleneckStation, 'Drying (Queue Capacity)');
  assert.equal(comparison.runs[4].bottleneckStation, 'Coordinated Line Balance');
});

test('IntegratedFactoryEngine - Multi-config comparison metrics, 10x labor productivity, and full navigation directory', () => {
  const load1000 = workloads.find(w => w.id === 'load_design_1000kg');
  const comparison = IntegratedFactoryEngine.compareAllConfigurations(configs, load1000);

  assert.equal(comparison.summaryInsights.laborProductivityFactor, 10.0, '10x productivity improvement (4.20 vs 0.42 worker-hrs/kg)');
  assert.ok(comparison.summaryInsights.unitCostReductionBdt > 80.0, 'Substantial unit cost reduction');
  assert.equal(comparison.summaryInsights.capacityScaleMultiplier, 10.0, '10x capacity expansion (120kg to 1200kg)');

  // Verify navigation directory
  const nav = IntegratedFactoryEngine.getNavigationDirectory();
  assert.equal(nav.length, 20, 'Covers all 20 subproject modules');
  assert.ok(nav.some(m => m.id === 'BMS' && m.route === '/demos/building-automation/'));
  assert.ok(nav.some(m => m.id === '20' && m.route === '/demos/virtual-factory/'));

  // Verify CSV export
  const csv = IntegratedFactoryEngine.exportToCSV(comparison);
  assert.ok(csv.includes('Proposed Coordinated Factory'));
  assert.ok(csv.includes('Rolling (Hand Labor)'));
});
