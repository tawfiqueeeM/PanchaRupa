import { CostingEngine } from "../../projects/costing-and-margin/js/costing-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new CostingEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/costing-and-margin/fixtures/costing_scenarios.json");
    if (res.ok) {
      scenariosData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load scenarios JSON", err);
  }

  // DOM Elements
  const scenarioSelect = document.getElementById("scenarioSelect");
  const btnReset = document.getElementById("btnReset");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnExportCsv = document.getElementById("btnExportCsv");

  const marginStatusPill = document.getElementById("marginStatusPill");
  const kpiUnitCost = document.getElementById("kpiUnitCost");
  const kpiUnitCostSub = document.getElementById("kpiUnitCostSub");
  const kpiNetMargin = document.getElementById("kpiNetMargin");
  const kpiNetIncome = document.getElementById("kpiNetIncome");
  const kpiRevenue = document.getElementById("kpiRevenue");
  const kpiRevenueSub = document.getElementById("kpiRevenueSub");
  const kpiBreakEven = document.getElementById("kpiBreakEven");
  const kpiBreakEvenSub = document.getElementById("kpiBreakEvenSub");

  const zeroOutputBanner = document.getElementById("zeroOutputBanner");

  const volSlider = document.getElementById("volSlider");
  const volVal = document.getElementById("volVal");
  const leafPriceSlider = document.getElementById("leafPriceSlider");
  const leafPriceVal = document.getElementById("leafPriceVal");
  const yieldSlider = document.getElementById("yieldSlider");
  const yieldVal = document.getElementById("yieldVal");
  const channelSplitSlider = document.getElementById("channelSplitSlider");
  const channelSplitVal = document.getElementById("channelSplitVal");
  const bulkPriceInput = document.getElementById("bulkPriceInput");
  const retailPriceInput = document.getElementById("retailPriceInput");

  const costBridgeTableBody = document.getElementById("costBridgeTableBody");

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        volSlider.value = scen.volumeKg;
        leafPriceSlider.value = scen.leafPricePerKg;
        yieldSlider.value = scen.netYieldPct;
        channelSplitSlider.value = scen.bulkSharePct;
        bulkPriceInput.value = scen.bulkPricePerKg;
        retailPriceInput.value = scen.retailPricePerKg;
        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const cost = engine.costing;

    // 1. KPI Cards
    if (cost.isZeroOutput) {
      marginStatusPill.className = "status-indicator warn";
      marginStatusPill.textContent = "● ZERO OUTPUT (PERIOD EXPENSE)";
      kpiUnitCost.textContent = "N/A (Zero Output)";
      kpiUnitCost.style.color = "var(--color-text-muted)";
      kpiUnitCostSub.textContent = `Unabsorbed fixed overhead: BDT ${cost.unabsorbedPeriodVarianceBdt.toLocaleString()}`;
      kpiNetMargin.textContent = "N/A";
      kpiNetMargin.style.color = "var(--color-text-muted)";
      kpiNetIncome.textContent = `Loss: -BDT ${cost.unabsorbedPeriodVarianceBdt.toLocaleString()}`;
      kpiRevenue.textContent = "BDT 0";
      kpiRevenueSub.textContent = "0 kg released volume";
      kpiBreakEven.textContent = "N/A";
      kpiBreakEvenSub.textContent = "Zero production";
      zeroOutputBanner.style.display = "block";
    } else {
      const isProfitable = cost.netIncomeBdt >= 0;
      marginStatusPill.className = isProfitable ? "status-indicator ok" : "status-indicator alarm";
      marginStatusPill.textContent = isProfitable ? "● PROFITABLE" : "⚠ OPERATING LOSS";

      kpiUnitCost.textContent = `BDT ${cost.unitManufacturingCostBdt.toFixed(2)}`;
      kpiUnitCost.style.color = "var(--color-text-main)";
      kpiUnitCostSub.textContent = "Excludes outbound freight";

      kpiNetMargin.textContent = `${cost.grossMarginPct.toFixed(1)}%`;
      kpiNetMargin.style.color = isProfitable ? "var(--color-status-success)" : "var(--color-status-danger)";
      kpiNetIncome.textContent = `BDT ${cost.netIncomeBdt.toLocaleString()} net operating income`;

      kpiRevenue.textContent = `BDT ${cost.grossRevenueBdt.toLocaleString()}`;
      kpiRevenueSub.textContent = `Bulk: ${cost.bulkKg}kg | Retail: ${cost.retailKg}kg`;

      kpiBreakEven.textContent = cost.breakEvenVolumeKg ? `${cost.breakEvenVolumeKg} kg` : "N/A";
      const bePct = cost.breakEvenVolumeKg ? ((cost.breakEvenVolumeKg / 1000) * 100).toFixed(1) : "0";
      kpiBreakEvenSub.textContent = `${bePct}% of 1,000kg design capacity`;
      zeroOutputBanner.style.display = "none";
    }

    volVal.textContent = `${cost.volumeKg.toLocaleString()} kg`;
    leafPriceVal.textContent = `BDT ${engine.leafPricePerKg.toFixed(1)} / kg`;
    yieldVal.textContent = `${engine.netYieldPct.toFixed(1)}%`;
    channelSplitVal.textContent = `${engine.bulkSharePct}% Bulk / ${engine.retailSharePct}% Retail`;

    // 2. Render Cost Bridge Table
    renderTable(cost);
  }

  function renderTable(cost) {
    const vol = cost.volumeKg;
    const perKg = (val) => vol > 0 ? (val / vol).toFixed(2) : "0.00";

    const rows = `
      <tr>
        <td style="font-weight:600;">Fresh Green Leaf</td>
        <td>${cost.freshLeafKg.toLocaleString()} kg @ BDT ${engine.leafPricePerKg.toFixed(2)}/kg (${engine.netYieldPct}% yield)</td>
        <td style="text-align:right; font-family:var(--font-mono);">${cost.leafCostBdt.toLocaleString()}</td>
        <td style="text-align:right; font-family:var(--font-mono);">${perKg(cost.leafCostBdt)}</td>
      </tr>
      <tr>
        <td style="font-weight:600;">Packaging Materials</td>
        <td>Bulk bags (BDT 2/kg) + Retail bottles (BDT 80/kg)</td>
        <td style="text-align:right; font-family:var(--font-mono);">${cost.packagingCostBdt.toLocaleString()}</td>
        <td style="text-align:right; font-family:var(--font-mono);">${perKg(cost.packagingCostBdt)}</td>
      </tr>
      <tr>
        <td style="font-weight:600;">Recurring Departmental Cash Overhead</td>
        <td>Production, Ops, Controls, Quality, Testing, Business (6 depts)</td>
        <td style="text-align:right; font-family:var(--font-mono);">${cost.recurringCashBdt.toLocaleString()}</td>
        <td style="text-align:right; font-family:var(--font-mono);">${perKg(cost.recurringCashBdt)}</td>
      </tr>
      <tr>
        <td style="font-weight:600;">Plant Depreciation</td>
        <td>Startup machinery & facility straight-line basis</td>
        <td style="text-align:right; font-family:var(--font-mono);">${cost.depreciationBdt.toLocaleString()}</td>
        <td style="text-align:right; font-family:var(--font-mono);">${perKg(cost.depreciationBdt)}</td>
      </tr>
      <tr class="cost-total-row">
        <td>TOTAL MANUFACTURING COST</td>
        <td>Direct Materials + Packaging + Factory Cash + Depreciation</td>
        <td style="text-align:right; font-family:var(--font-mono); color:var(--color-brand-primary);">${cost.totalManufacturingCostBdt.toLocaleString()}</td>
        <td style="text-align:right; font-family:var(--font-mono); color:var(--color-brand-primary); font-size:1rem;">
          ${cost.isZeroOutput ? "N/A" : cost.unitManufacturingCostBdt.toFixed(2)}
        </td>
      </tr>
      <tr style="color:var(--color-text-muted);">
        <td style="font-style:italic;">Bulk Outbound Freight (Selling Expense)</td>
        <td style="font-style:italic;">Segregated selling & distribution expense (Chattogram haulage)</td>
        <td style="text-align:right; font-family:var(--font-mono); font-style:italic;">${cost.outboundFreightBdt.toLocaleString()}</td>
        <td style="text-align:right; font-family:var(--font-mono); font-style:italic;">${perKg(cost.outboundFreightBdt)}</td>
      </tr>
      <tr style="background:#f1f5f9; font-weight:700;">
        <td>NET OPERATING INCOME</td>
        <td>Gross Revenue − Manufacturing Cost − Freight</td>
        <td style="text-align:right; font-family:var(--font-mono); color:${cost.netIncomeBdt >= 0 ? 'var(--color-status-success)' : 'var(--color-status-danger)'};">
          ${cost.netIncomeBdt.toLocaleString()}
        </td>
        <td style="text-align:right; font-family:var(--font-mono); color:${cost.netIncomeBdt >= 0 ? 'var(--color-status-success)' : 'var(--color-status-danger)'};">
          ${perKg(cost.netIncomeBdt)}
        </td>
      </tr>
    `;

    costBridgeTableBody.innerHTML = rows;
  }

  // Event Listeners
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  volSlider.addEventListener("input", (e) => {
    engine.updateVolume(parseFloat(e.target.value));
    updateUI();
  });

  leafPriceSlider.addEventListener("input", (e) => {
    engine.updateLeafPrice(parseFloat(e.target.value));
    updateUI();
  });

  yieldSlider.addEventListener("input", (e) => {
    engine.updateYield(parseFloat(e.target.value));
    updateUI();
  });

  channelSplitSlider.addEventListener("input", (e) => {
    engine.updateChannelSplit(parseFloat(e.target.value));
    updateUI();
  });

  bulkPriceInput.addEventListener("input", (e) => {
    engine.bulkPricePerKg = parseFloat(e.target.value) || 240;
    engine.costing = engine.computeCosting();
    updateUI();
  });

  retailPriceInput.addEventListener("input", (e) => {
    engine.retailPricePerKg = parseFloat(e.target.value) || 450;
    engine.costing = engine.computeCosting();
    updateUI();
  });

  // Export Handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      costing: engine.costing,
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `costing_model_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    const c = engine.costing;
    let csv = "Component,Basis,TotalBdt,UnitBdtPerKg\n";
    csv += `Fresh Green Leaf,"${c.freshLeafKg} kg @ BDT ${engine.leafPricePerKg}/kg",${c.leafCostBdt},${(c.leafCostBdt / (c.volumeKg || 1)).toFixed(2)}\n`;
    csv += `Packaging Materials,"Bulk + Retail",${c.packagingCostBdt},${(c.packagingCostBdt / (c.volumeKg || 1)).toFixed(2)}\n`;
    csv += `Recurring Factory Cash Overhead,"6 Departments",${c.recurringCashBdt},${(c.recurringCashBdt / (c.volumeKg || 1)).toFixed(2)}\n`;
    csv += `Depreciation,"Straight-line",${c.depreciationBdt},${(c.depreciationBdt / (c.volumeKg || 1)).toFixed(2)}\n`;
    csv += `Total Manufacturing Cost,"Direct Materials + Overhead",${c.totalManufacturingCostBdt},${c.unitManufacturingCostBdt || "N/A"}\n`;
    csv += `Outbound Freight,"Selling Expense",${c.outboundFreightBdt},${(c.outboundFreightBdt / (c.volumeKg || 1)).toFixed(2)}\n`;
    csv += `Net Operating Income,"Revenue - Mfg - Freight",${c.netIncomeBdt},${(c.netIncomeBdt / (c.volumeKg || 1)).toFixed(2)}\n`;

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `costing_bridge_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("DESIGN-MONTH-1000KG");
});
