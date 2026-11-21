import { SustainabilityEngine } from '../../projects/sustainability/js/sustainability-engine.js';

let scenarios = [];
let activeScenario = null;
let currentAnalysis = null;

async function init() {
  try {
    const res = await fetch('../../projects/sustainability/fixtures/sustainability_scenarios.json');
    const data = await res.json();
    scenarios = data.scenarios;
    activeScenario = scenarios[0];
    bindEvents();
    render();
  } catch (err) {
    console.error('Failed to load scenarios:', err);
  }
}

function bindEvents() {
  const scenarioSelect = document.getElementById('scenarioSelect');
  scenarioSelect.addEventListener('change', (e) => {
    activeScenario = scenarios.find(s => s.id === e.target.value) || scenarios[0];
    render();
  });

  document.getElementById('btnPairedReplay').addEventListener('click', () => {
    const section = document.getElementById('pairedReplaySection');
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    scenarioSelect.value = 'case_nominal_production';
    activeScenario = scenarios[0];
    document.getElementById('pairedReplaySection').style.display = 'none';
    render();
  });

  document.getElementById('btnExportCsv').addEventListener('click', () => {
    if (!currentAnalysis) return;
    const csvContent = SustainabilityEngine.exportToCSV(currentAnalysis);
    downloadFile(csvContent, `sustainability_${currentAnalysis.scenarioId}.csv`, 'text/csv');
  });

  document.getElementById('btnExportJson').addEventListener('click', () => {
    if (!currentAnalysis) return;
    const jsonContent = JSON.stringify(currentAnalysis, null, 2);
    downloadFile(jsonContent, `sustainability_${currentAnalysis.scenarioId}.json`, 'application/json');
  });
}

function render() {
  if (!activeScenario) return;

  currentAnalysis = SustainabilityEngine.analyze(activeScenario);
  const { massBalance, impact, routing, energyMetrics } = currentAnalysis;

  // KPI cards
  document.getElementById('kpiInputLeaf').innerHTML = `${massBalance.inputLeafKg.toFixed(1)} <span style="font-size:0.9rem;">kg</span>`;
  
  const primeEl = document.getElementById('kpiPrimeTea');
  primeEl.innerHTML = `${massBalance.primeTeaKg.toFixed(1)} <span style="font-size:0.9rem;">kg</span>`;
  primeEl.style.color = massBalance.primeTeaKg > 0 ? '#16a34a' : '#dc2626';

  const yieldPct = ((massBalance.primeTeaKg / massBalance.inputLeafKg) * 100).toFixed(1);
  document.getElementById('kpiYieldPercent').textContent = `Prime Yield: ${yieldPct}%`;

  document.getElementById('kpiWastedEnergy').innerHTML = `${impact.totalWastedEnergyKwh.toFixed(1)} <span style="font-size:0.9rem;">kWh</span>`;
  document.getElementById('kpiSecDenominator').textContent = energyMetrics.secKwhPerKg ? `SEC: ${energyMetrics.secKwhPerKg} kWh/kg` : 'SEC: N/A (zero yield)';

  document.getElementById('kpiFinancialImpact').textContent = `BDT ${impact.netCostBdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  document.getElementById('kpiSalvageSubtext').textContent = `Salvage credit: BDT ${impact.salvageCreditBdt.toFixed(2)}`;

  const dispEl = document.getElementById('kpiDisposition');
  dispEl.innerHTML = renderDispositionBadge(routing.qualityDisposition);
  document.getElementById('kpiDelayHours').textContent = `Schedule delay: ${impact.scheduleDelayHours.toFixed(1)} hrs`;

  // Mass balance segments
  renderMassSegments(massBalance);

  // Incident & Audit
  document.getElementById('auditRootCause').textContent = formatRootCause(routing.rootCause);
  document.getElementById('auditConfidence').innerHTML = `<span class="badge ${routing.causeConfidence === 'CONFIRMED' ? 'badge-confirmed' : 'badge-suspected'}">${routing.causeConfidence}</span>`;
  document.getElementById('auditPrimaryOwner').innerHTML = `<strong style="color:var(--color-brand-primary);">${routing.primaryOwner}</strong>`;
  document.getElementById('auditSecondaryOwner').textContent = routing.secondaryOwner || 'None';
  document.getElementById('auditDisposition').innerHTML = renderDispositionBadge(routing.qualityDisposition);

  const actionList = document.getElementById('auditActionList');
  actionList.innerHTML = routing.actionRecommendations.map(a => `<li>${a}</li>`).join('');
}

function renderMassSegments(mass) {
  const container = document.getElementById('massSegmentsContainer');
  container.innerHTML = `
    <div class="mass-segment evaporated">
      <span><strong>Moisture Evaporation (Natural Vapor):</strong></span>
      <span><strong>${mass.moistureEvaporatedKg.toFixed(1)} kg</strong> (${((mass.moistureEvaporatedKg / mass.inputLeafKg) * 100).toFixed(1)}%)</span>
    </div>
    <div class="mass-segment prime">
      <span><strong>Prime Saleable Tea:</strong></span>
      <span><strong>${mass.primeTeaKg.toFixed(1)} kg</strong> (${((mass.primeTeaKg / mass.inputLeafKg) * 100).toFixed(1)}%)</span>
    </div>
    ${mass.downgradedCommercialTeaKg > 0 ? `
    <div class="mass-segment commercial">
      <span><strong>Commercial Downgraded Tea:</strong></span>
      <span><strong>${mass.downgradedCommercialTeaKg.toFixed(1)} kg</strong> (${((mass.downgradedCommercialTeaKg / mass.inputLeafKg) * 100).toFixed(1)}%)</span>
    </div>` : ''}
    <div class="mass-segment recoverable">
      <span><strong>Recoverable Tea Sweepings (Biomass / Salvage):</strong></span>
      <span><strong>${mass.recoverableTeaKg.toFixed(1)} kg</strong> (${((mass.recoverableTeaKg / mass.inputLeafKg) * 100).toFixed(1)}%)</span>
    </div>
    <div class="mass-segment discard">
      <span><strong>Non-Recoverable Discard (Scrap Spoilage):</strong></span>
      <span><strong>${mass.nonRecoverableDiscardKg.toFixed(1)} kg</strong> (${((mass.nonRecoverableDiscardKg / mass.inputLeafKg) * 100).toFixed(1)}% wet basis${mass.dryDiscardEquivalentKg && mass.dryDiscardEquivalentKg !== mass.nonRecoverableDiscardKg ? `, dry equiv: ${mass.dryDiscardEquivalentKg.toFixed(1)} kg` : ''})</span>
    </div>
    <div class="mass-segment packaging">
      <span><strong>Packaging Waste (Cartons & Defective PET):</strong></span>
      <span><strong>${mass.packagingWasteKg.toFixed(1)} kg</strong></span>
    </div>
    <div class="mass-segment" style="border-top:1px dashed var(--color-border); padding-top:6px; margin-top:6px; display:flex; justify-content:space-between; font-weight:700;">
      <span>Mass Balance Conservation:</span>
      <span style="color:var(--color-status-success);">Accounted ${mass.outputMassKg.toFixed(1)} kg / ${mass.inputLeafKg.toFixed(1)} kg (Unreconciled: ${mass.unreconciledKg.toFixed(1)} kg)</span>
    </div>
  `;
}

function renderDispositionBadge(disp) {
  switch (disp) {
    case 'RELEASE':
      return '<span class="badge badge-release">RELEASE</span>';
    case 'DOWNGRADE':
      return '<span class="badge badge-downgrade">DOWNGRADE</span>';
    case 'SCRAP':
      return '<span class="badge badge-scrap">SCRAP</span>';
    default:
      return '<span class="badge badge-quality-hold">HOLD</span>';
  }
}

function formatRootCause(cause) {
  switch (cause) {
    case 'SUPPLIER_LOW_GRADE_LEAF':
      return 'Supplier Substandard Pluck (Coarse Leaf > 50%)';
    case 'DRYER_OUTAGE_QUEUE_SPOILAGE':
      return '120m Dryer Outage / Anaerobic Respiration Stewing';
    case 'NONE':
      return 'Nominal Operating Parameters (Zero Anomalies)';
    default:
      return cause;
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', init);
