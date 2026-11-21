import { IntegratedFactoryEngine } from '../../projects/virtual-factory/js/integrated-factory-engine.js';

let configurations = [];
let workloads = [];
let activeWorkload = null;
let selectedConfigId = 'config_5_coordinated_factory';
let currentComparison = null;

async function init() {
  try {
    const res = await fetch('../../projects/virtual-factory/fixtures/configurations_dataset.json');
    const data = await res.json();
    configurations = data.configurations;
    workloads = data.workloads;
    activeWorkload = workloads.find(w => w.id === 'load_design_1000kg') || workloads[0];

    bindEvents();
    render();
  } catch (err) {
    console.error('Failed to load configuration dataset:', err);
  }
}

function bindEvents() {
  const workloadSelect = document.getElementById('workloadSelect');
  workloadSelect.addEventListener('change', (e) => {
    activeWorkload = workloads.find(w => w.id === e.target.value) || workloads[0];
    document.getElementById('customTargetInput').value = activeWorkload.targetOutputKg;
    render();
  });

  document.getElementById('btnApplyTarget').addEventListener('click', () => {
    const customVal = parseFloat(document.getElementById('customTargetInput').value);
    if (!isNaN(customVal) && customVal > 0) {
      activeWorkload = {
        id: 'load_custom',
        name: `Custom Target (${customVal} kg)`,
        targetOutputKg: customVal,
        founderReported: false
      };
      render();
    }
  });

  document.getElementById('btnToggleNav').addEventListener('click', () => {
    const drawer = document.getElementById('navDrawer');
    const isHidden = drawer.style.display === 'none';
    drawer.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      drawer.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    workloadSelect.value = 'load_design_1000kg';
    activeWorkload = workloads.find(w => w.id === 'load_design_1000kg');
    document.getElementById('customTargetInput').value = activeWorkload.targetOutputKg;
    selectedConfigId = 'config_5_coordinated_factory';
    document.getElementById('navDrawer').style.display = 'none';
    render();
  });

  document.getElementById('btnExportCsv').addEventListener('click', () => {
    if (!currentComparison) return;
    const csvContent = IntegratedFactoryEngine.exportToCSV(currentComparison);
    downloadFile(csvContent, `factory_comparison_${currentComparison.workloadId}.csv`, 'text/csv');
  });

  document.getElementById('btnExportJson').addEventListener('click', () => {
    if (!currentComparison) return;
    const jsonContent = JSON.stringify(currentComparison, null, 2);
    downloadFile(jsonContent, `factory_comparison_${currentComparison.workloadId}.json`, 'application/json');
  });
}

function render() {
  if (!activeWorkload || configurations.length === 0) return;

  // Run comparative simulation
  currentComparison = IntegratedFactoryEngine.compareAllConfigurations(configurations, activeWorkload);

  // Update badge
  const badgeEl = document.getElementById('workloadSourceBadge');
  if (activeWorkload.founderReported) {
    badgeEl.textContent = 'FOUNDER-REPORTED BENCHMARK';
    badgeEl.className = 'badge-founder';
  } else {
    badgeEl.textContent = 'SYNTHETIC SCENARIO';
    badgeEl.className = 'badge-simulated';
  }

  // Render Config Cards
  renderConfigCards();

  // Render Selected Equipment Details
  renderEquipmentDetail();

  // Render Table
  renderComparisonTable();

  // Render Scaleup Summary
  renderScaleupSummary();

  // Render Navigation Drawer
  renderNavDrawer();
}

function renderConfigCards() {
  const container = document.getElementById('configCardsGrid');
  container.innerHTML = configurations.map(config => {
    const isActive = config.id === selectedConfigId;
    return `
      <div class="config-card ${isActive ? 'active' : ''}" data-id="${config.id}">
        <div class="title">${config.name}</div>
        <div class="capacity">${config.maxMonthlyCapacityKg} <span style="font-size:0.85rem;">kg/month</span></div>
        <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:2px;">Mechanization: ${config.mechanizationLevel}</div>
        <div class="bottleneck">⚠ Bottleneck: ${config.bottleneckStation}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.config-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedConfigId = card.getAttribute('data-id');
      render();
    });
  });
}

function renderEquipmentDetail() {
  const selectedConfig = configurations.find(c => c.id === selectedConfigId) || configurations[0];
  document.getElementById('detailConfigTitle').textContent = `${selectedConfig.name} — Architecture & Station Lineup`;

  const grid = document.getElementById('equipmentGrid');
  grid.innerHTML = `
    <div style="background:var(--color-bg-surface-alt); padding:10px; border-radius:var(--radius-sm);">
      <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-text-muted);">Withering Station</div>
      <div style="font-weight:600; font-size:0.9rem; margin-top:2px;">${selectedConfig.equipment.withering}</div>
    </div>
    <div style="background:var(--color-bg-surface-alt); padding:10px; border-radius:var(--radius-sm);">
      <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-text-muted);">Rolling / Maceration</div>
      <div style="font-weight:600; font-size:0.9rem; margin-top:2px;">${selectedConfig.equipment.rolling}</div>
    </div>
    <div style="background:var(--color-bg-surface-alt); padding:10px; border-radius:var(--radius-sm);">
      <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-text-muted);">Drying Station</div>
      <div style="font-weight:600; font-size:0.9rem; margin-top:2px;">${selectedConfig.equipment.drying}</div>
    </div>
    <div style="background:var(--color-bg-surface-alt); padding:10px; border-radius:var(--radius-sm);">
      <div style="font-size:0.75rem; text-transform:uppercase; color:var(--color-text-muted);">Packaging Station</div>
      <div style="font-weight:600; font-size:0.9rem; margin-top:2px;">${selectedConfig.equipment.packaging}</div>
    </div>
  `;
}

function renderComparisonTable() {
  const tbody = document.getElementById('comparisonTableBody');
  tbody.innerHTML = currentComparison.runs.map(run => {
    const isSelected = run.configId === selectedConfigId;
    return `
      <tr class="${isSelected ? 'active-row' : ''}">
        <td><strong>#${run.configOrder}</strong></td>
        <td>${run.configName}</td>
        <td>${run.maxCapacityKg} kg</td>
        <td><strong>${run.realizedOutputKg} kg</strong></td>
        <td>
          ${run.isOverCapacity 
            ? `<span class="over-capacity-tag">OVER LIMIT (-${run.unfulfilledDemandKg}kg)</span>` 
            : `<span style="color:#16a34a; font-weight:700;">FEASIBLE (${run.capacityUtilizationPercent}%)</span>`
          }
        </td>
        <td style="color:${run.bottleneckStation.includes('Coordinated') ? '#16a34a' : '#b91c1c'}; font-weight:600;">
          ${run.bottleneckStation}
        </td>
        <td>${run.laborIntensityWorkerHoursPerKg.toFixed(2)}</td>
        <td>${run.totalLaborWorkerHours.toLocaleString()} hrs</td>
        <td>${run.secKwhPerKg.toFixed(2)}</td>
        <td><strong>BDT ${run.unitCostBdtPerKg.toFixed(2)}</strong></td>
        <td>BDT ${run.totalManufacturingCostBdt.toLocaleString()}</td>
        <td>${run.effectiveCycleTimeDays} days</td>
      </tr>
    `;
  }).join('');
}

function renderScaleupSummary() {
  const insights = currentComparison.summaryInsights;
  const container = document.getElementById('scaleupSummary');
  container.innerHTML = `
    <strong>Scale-Up Progression Summary (Assumed Model Fixture Comparison: Config 1 Manual ➔ Config 5 Coordinated):</strong><br>
    • <strong>Assumed Labor Productivity Ratio:</strong> ${insights.laborProductivityFactor}x productivity factor based on assumed fixture intensities (${insights.laborSavingsWorkerHours.toLocaleString()} worker-hours modeled differential at design load).<br>
    • <strong>Modeled Cost Absorption Curve:</strong> BDT ${insights.unitCostReductionBdt} / kg lower unit cost modeled (-31.5% from scale economies and assumed mechanization).<br>
    • <strong>Nominal Capacity Envelope:</strong> ${insights.capacityScaleMultiplier}x monthly capacity envelope (120 kg/mo artisanal assumption ➔ 1,200 kg/mo coordinated line).<br>
    • <strong>Modeled Bottleneck Progression:</strong> Hand Rolling Fatigue (Configs 1–3) ➔ Dryer Thermal Queue (Config 4) ➔ Coordinated System Balance (Config 5).<br>
    <em>Note: These figures reflect synthetic comparative fixture parameters for evolutionary analysis; live unified dynamic cross-engine execution remains deferred pending shared integration.</em>
  `;
}

function renderNavDrawer() {
  const container = document.getElementById('navGridContainer');
  const modules = IntegratedFactoryEngine.getNavigationDirectory();

  container.innerHTML = modules.map(m => {
    const isLive = m.liveOnThisBranch;
    const targetUrl = isLive ? m.route : m.sourceUrl;
    const badgeStyle = isLive ? 'background:#dcfce7; color:#166534;' : 'background:#fef3c7; color:#92400e;';
    const badgeText = isLive ? 'LIVE DEMO (ACTIVE)' : 'BRANCH REPO LINK';
    const note = isLive ? 'Active demo on current branch' : 'Lives on isolated git branch';

    return `
      <a href="${targetUrl}" class="nav-item" target="_blank" rel="noopener noreferrer">
        <div>
          <div style="font-weight:700;">[Demo ${m.id}] ${m.name}</div>
          <div style="font-size:0.75rem; color:var(--color-text-muted);">${m.dept} · <code>${m.branch}</code></div>
          <div style="font-size:0.7rem; color:var(--color-text-muted); margin-top:2px;">${note}</div>
        </div>
        <span style="font-size:0.75rem; ${badgeStyle} padding:2px 6px; border-radius:4px; font-weight:700; white-space:nowrap;">
          ${badgeText}
        </span>
      </a>
    `;
  }).join('');
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
