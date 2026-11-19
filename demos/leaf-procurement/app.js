import { ProcurementEngine } from "../../projects/leaf-procurement/js/procurement-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new ProcurementEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/leaf-procurement/fixtures/procurement_scenarios.json");
    if (res.ok) {
      scenariosData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load scenarios JSON", err);
  }

  // DOM Elements
  const scenarioSelect = document.getElementById("scenarioSelect");
  const chkWintrDormancy = document.getElementById("chkWintrDormancy");
  const btnReset = document.getElementById("btnReset");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnExportCsv = document.getElementById("btnExportCsv");

  const procurementStatusPill = document.getElementById("procurementStatusPill");
  const kpiFeasibility = document.getElementById("kpiFeasibility");
  const kpiFeasibilitySub = document.getElementById("kpiFeasibilitySub");
  const kpiFreshLeaf = document.getElementById("kpiFreshLeaf");
  const kpiFreshLeafSub = document.getElementById("kpiFreshLeafSub");
  const kpiNetDemand = document.getElementById("kpiNetDemand");
  const kpiNetDemandSub = document.getElementById("kpiNetDemandSub");
  const kpiSeason = document.getElementById("kpiSeason");
  const kpiSeasonSub = document.getElementById("kpiSeasonSub");

  const mrpAlertBanner = document.getElementById("mrpAlertBanner");
  const mrpAlertMsg = document.getElementById("mrpAlertMsg");

  // Green Tea Card
  const greenStatusBadge = document.getElementById("greenStatusBadge");
  const greenGrossReadout = document.getElementById("greenGrossReadout");
  const greenStockReadout = document.getElementById("greenStockReadout");
  const greenNetReadout = document.getElementById("greenNetReadout");
  const greenFreshReadout = document.getElementById("greenFreshReadout");
  const greenGrossSlider = document.getElementById("greenGrossSlider");
  const greenGrossVal = document.getElementById("greenGrossVal");
  const greenStockSlider = document.getElementById("greenStockSlider");
  const greenStockVal = document.getElementById("greenStockVal");
  const greenYieldSlider = document.getElementById("greenYieldSlider");
  const greenYieldVal = document.getElementById("greenYieldVal");
  const greenArrivalSlider = document.getElementById("greenArrivalSlider");
  const greenArrivalVal = document.getElementById("greenArrivalVal");
  const greenSupplierName = document.getElementById("greenSupplierName");

  // Golden Tea Card
  const goldenStatusBadge = document.getElementById("goldenStatusBadge");
  const goldenGrossReadout = document.getElementById("goldenGrossReadout");
  const goldenStockReadout = document.getElementById("goldenStockReadout");
  const goldenNetReadout = document.getElementById("goldenNetReadout");
  const goldenFreshReadout = document.getElementById("goldenFreshReadout");
  const goldenGrossSlider = document.getElementById("goldenGrossSlider");
  const goldenGrossVal = document.getElementById("goldenGrossVal");
  const goldenStockSlider = document.getElementById("goldenStockSlider");
  const goldenStockVal = document.getElementById("goldenStockVal");
  const goldenYieldSlider = document.getElementById("goldenYieldSlider");
  const goldenYieldVal = document.getElementById("goldenYieldVal");
  const goldenArrivalSlider = document.getElementById("goldenArrivalSlider");
  const goldenArrivalVal = document.getElementById("goldenArrivalVal");
  const goldenSupplierName = document.getElementById("goldenSupplierName");

  const poTableBody = document.getElementById("poTableBody");

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        chkWintrDormancy.checked = engine.isWinterDormancy;
        
        const g = scen.products.find(p => p.productId === "GREEN_TEA");
        const gl = scen.products.find(p => p.productId === "GOLDEN_TEA");
        if (g) {
          greenGrossSlider.value = g.grossDemandKg;
          greenStockSlider.value = g.releasedStockKg;
          greenYieldSlider.value = g.assumedYieldPct;
          greenArrivalSlider.value = g.estimatedArrivalHour;
        }
        if (gl) {
          goldenGrossSlider.value = gl.grossDemandKg;
          goldenStockSlider.value = gl.releasedStockKg;
          goldenYieldSlider.value = gl.assumedYieldPct;
          goldenArrivalSlider.value = gl.estimatedArrivalHour;
        }
        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const mrp = engine.mrpResults;

    // 1. KPI Cards
    if (mrp.isFeasible) {
      procurementStatusPill.className = "status-indicator ok";
      procurementStatusPill.textContent = "● REQUIREMENT MET";
      kpiFeasibility.textContent = "FEASIBLE";
      kpiFeasibility.style.color = "var(--color-status-success)";
      kpiFeasibilitySub.textContent = "All orders on schedule";
      mrpAlertBanner.style.display = "none";
    } else {
      procurementStatusPill.className = "status-indicator alarm";
      procurementStatusPill.textContent = "⚠ SHORTAGE ALERT";
      kpiFeasibility.textContent = "INFEASIBLE";
      kpiFeasibility.style.color = "var(--color-status-danger)";
      kpiFeasibilitySub.textContent = `${mrp.shortages.length} shortage exceptions`;
      mrpAlertBanner.style.display = "block";
      mrpAlertMsg.textContent = mrp.shortages.map(s => s.reason).join(" | ");
    }

    kpiFreshLeaf.textContent = `${mrp.totalFreshLeafNeededKg.toFixed(1)} kg`;
    kpiNetDemand.textContent = `${mrp.totalNetDemandKg.toFixed(1)} kg`;
    kpiNetDemandSub = `Gross ${mrp.totalGrossDemandKg.toFixed(1)} kg − ${mrp.totalReleasedStockKg.toFixed(1)} kg Stock`;

    kpiSeason.textContent = mrp.month;
    kpiSeasonSub.textContent = mrp.isWinterDormancy ? "Bush Dormancy (0kg harvest)" : "Active Harvest Season";

    // 2. Green Tea Product Card
    const green = mrp.products.find(p => p.productId === "GREEN_TEA");
    if (green) {
      greenGrossVal.textContent = `${green.grossDemandKg} kg`;
      greenStockVal.textContent = `${green.releasedStockKg} kg`;
      greenYieldVal.textContent = `${green.assumedYieldPct.toFixed(1)}%`;
      greenArrivalVal.textContent = `${String(green.estimatedArrivalHour).padStart(2, "0")}:00`;
      greenSupplierName.textContent = green.supplierName;

      greenGrossReadout.textContent = `${green.grossDemandKg.toFixed(1)} kg`;
      greenStockReadout.textContent = `- ${green.releasedStockKg.toFixed(1)} kg`;
      greenNetReadout.textContent = `${green.netDemandKg.toFixed(1)} kg`;
      greenFreshReadout.textContent = `${green.freshLeafNeededKg.toFixed(1)} kg`;

      if (green.isShortage) {
        greenStatusBadge.className = "status-indicator alarm";
        greenStatusBadge.textContent = "LATE ARRIVAL";
      } else {
        greenStatusBadge.className = "status-indicator ok";
        greenStatusBadge.textContent = "ON SCHEDULE";
      }
    }

    // 3. Golden Tea Product Card
    const golden = mrp.products.find(p => p.productId === "GOLDEN_TEA");
    if (golden) {
      goldenGrossVal.textContent = `${golden.grossDemandKg} kg`;
      goldenStockVal.textContent = `${golden.releasedStockKg} kg`;
      goldenYieldVal.textContent = `${golden.assumedYieldPct.toFixed(1)}%`;
      goldenArrivalVal.textContent = `${String(golden.estimatedArrivalHour).padStart(2, "0")}:00`;
      goldenSupplierName.textContent = golden.supplierName;

      goldenGrossReadout.textContent = `${golden.grossDemandKg.toFixed(1)} kg`;
      goldenStockReadout.textContent = `- ${golden.releasedStockKg.toFixed(1)} kg`;
      goldenNetReadout.textContent = `${golden.netDemandKg.toFixed(1)} kg`;
      goldenFreshReadout.textContent = `${golden.freshLeafNeededKg.toFixed(1)} kg`;

      if (golden.isShortage) {
        goldenStatusBadge.className = "status-indicator alarm";
        goldenStatusBadge.textContent = "LATE ARRIVAL";
      } else {
        goldenStatusBadge.className = "status-indicator ok";
        goldenStatusBadge.textContent = "ON SCHEDULE";
      }
    }

    // 4. Render Purchase Orders Table
    renderPoTable(mrp);
  }

  function renderPoTable(mrp) {
    let rows = "";
    mrp.products.forEach((p, idx) => {
      const poNum = `PO-2026-${String(idx + 101).padStart(3, "0")}`;
      const statusPill = p.isShortage
        ? `<span class="log-badge ALARM">LATE (+${p.delayHours}h)</span>`
        : `<span class="log-badge INFO">VALIDATED</span>`;

      rows += `
        <tr>
          <td style="font-family:var(--font-mono); font-weight:700;">${poNum}</td>
          <td>${p.productName}</td>
          <td>${p.supplierName}</td>
          <td><span style="font-family:var(--font-mono); font-size:0.75rem;">${p.requiredGrade}</span></td>
          <td style="font-family:var(--font-mono); font-weight:700;">${p.freshLeafNeededKg.toFixed(1)} kg</td>
          <td style="font-family:var(--font-mono);">${String(p.estimatedArrivalHour).padStart(2, "0")}:00</td>
          <td>${statusPill}</td>
        </tr>
      `;
    });
    poTableBody.innerHTML = rows;
  }

  // Event Listeners
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  chkWintrDormancy.addEventListener("change", (e) => {
    engine.setWinterDormancy(e.target.checked);
    updateUI();
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  // Green Sliders
  greenGrossSlider.addEventListener("input", (e) => {
    engine.updateGrossDemand("GREEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  greenStockSlider.addEventListener("input", (e) => {
    engine.updateReleasedStock("GREEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  greenYieldSlider.addEventListener("input", (e) => {
    engine.updateYield("GREEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  greenArrivalSlider.addEventListener("input", (e) => {
    engine.updateDeliveryTime("GREEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  // Golden Sliders
  goldenGrossSlider.addEventListener("input", (e) => {
    engine.updateGrossDemand("GOLDEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  goldenStockSlider.addEventListener("input", (e) => {
    engine.updateReleasedStock("GOLDEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  goldenYieldSlider.addEventListener("input", (e) => {
    engine.updateYield("GOLDEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  goldenArrivalSlider.addEventListener("input", (e) => {
    engine.updateDeliveryTime("GOLDEN_TEA", parseFloat(e.target.value));
    updateUI();
  });

  // Export handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      mrpResults: engine.mrpResults,
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `mrp_procurement_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    let csv = "ProductId,ProductName,GrossDemandKg,ReleasedStockKg,NetDemandKg,YieldPct,FreshLeafNeededKg,SupplierName,RequiredGrade,ArrivalSlot,Status\n";
    engine.mrpResults.products.forEach(p => {
      csv += `${p.productId},"${p.productName}",${p.grossDemandKg},${p.releasedStockKg},${p.netDemandKg},${p.assumedYieldPct},${p.freshLeafNeededKg},"${p.supplierName}",${p.requiredGrade},${p.estimatedArrivalHour}:00,${p.isShortage ? "SHORTAGE_DELAYED" : "ON_TIME"}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `mrp_procurement_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("DAY-40-MRP-BASE");
});
