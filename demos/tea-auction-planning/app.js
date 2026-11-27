import { AuctionEngine } from "../../projects/tea-auction-planning/js/auction-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new AuctionEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/tea-auction-planning/fixtures/auction_scenarios.json");
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

  const auctionStatusPill = document.getElementById("auctionStatusPill");
  const kpiBestVenue = document.getElementById("kpiBestVenue");
  const kpiBestVenueSub = document.getElementById("kpiBestVenueSub");
  const kpiNetPrice = document.getElementById("kpiNetPrice");
  const kpiNetTotal = document.getElementById("kpiNetTotal");
  const kpiLocalNet = document.getElementById("kpiLocalNet");
  const kpiBreakEven = document.getElementById("kpiBreakEven");
  const kpiBreakEvenSub = document.getElementById("kpiBreakEvenSub");

  const qtySlider = document.getElementById("qtySlider");
  const qtyVal = document.getElementById("qtyVal");
  const reserveSlider = document.getElementById("reserveSlider");
  const reserveVal = document.getElementById("reserveVal");

  const panchagarhPriceSlider = document.getElementById("panchagarhPriceSlider");
  const panchagarhPriceVal = document.getElementById("panchagarhPriceVal");
  const sreemangalPriceSlider = document.getElementById("sreemangalPriceSlider");
  const sreemangalPriceVal = document.getElementById("sreemangalPriceVal");
  const chattogramPriceSlider = document.getElementById("chattogramPriceSlider");
  const chattogramPriceVal = document.getElementById("chattogramPriceVal");

  const venuesTableBody = document.getElementById("venuesTableBody");

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        qtySlider.value = scen.lot.quantityKg;
        reserveSlider.value = scen.lot.reservePriceBdt;

        const p = scen.venues.find(v => v.venueId === "PANCHAGARH");
        const s = scen.venues.find(v => v.venueId === "SREEMANGAL");
        const c = scen.venues.find(v => v.venueId === "CHATTOGRAM");

        if (p) panchagarhPriceSlider.value = p.expectedHammerPriceBdt;
        if (s) sreemangalPriceSlider.value = s.expectedHammerPriceBdt;
        if (c) chattogramPriceSlider.value = c.expectedHammerPriceBdt;

        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const analysis = engine.analysis;
    const lot = analysis.lot;

    // 1. KPI Cards
    const bestVenue = analysis.venues.find(v => v.venueId === analysis.recommendedVenueId);
    if (bestVenue) {
      kpiBestVenue.textContent = bestVenue.name.split(" ")[0].toUpperCase();
      kpiBestVenueSub.textContent = `Recommended auction destination`;

      kpiNetPrice.textContent = `BDT ${bestVenue.netRealizationPerKg.toFixed(2)}`;
      kpiNetTotal.textContent = `Proceeds: BDT ${bestVenue.netRealizationTotalBdt.toLocaleString()} (${lot.quantityKg} kg)`;
    }

    const panchagarh = analysis.venues.find(v => v.venueId === "PANCHAGARH");
    if (panchagarh) {
      kpiLocalNet.textContent = `BDT ${panchagarh.netRealizationPerKg.toFixed(2)}`;
    }

    const ctg = analysis.venues.find(v => v.venueId === "CHATTOGRAM");
    if (ctg && ctg.breakEvenHammerPrice > 0) {
      kpiBreakEven.textContent = `BDT ${ctg.breakEvenHammerPrice.toFixed(2)}`;
      kpiBreakEvenSub.textContent = `+BDT ${ctg.breakEvenPremiumRequired.toFixed(2)}/kg premium needed`;
    } else {
      kpiBreakEven.textContent = "N/A";
      kpiBreakEvenSub.textContent = "Chattogram not evaluated";
    }

    qtyVal.textContent = `${lot.quantityKg.toLocaleString()} kg`;
    reserveVal.textContent = `BDT ${lot.reservePriceBdt.toFixed(1)} / kg`;

    if (panchagarh) panchagarhPriceVal.textContent = `${panchagarh.expectedHammerPriceBdt.toFixed(1)} Tk`;
    const sreemangal = analysis.venues.find(v => v.venueId === "SREEMANGAL");
    if (sreemangal) sreemangalPriceVal.textContent = `${sreemangal.expectedHammerPriceBdt.toFixed(1)} Tk`;
    if (ctg) chattogramPriceVal.textContent = `${ctg.expectedHammerPriceBdt.toFixed(1)} Tk`;

    // 2. Render Venues Table
    renderTable(analysis);
  }

  function renderTable(analysis) {
    let rows = "";
    analysis.venues.forEach(v => {
      const isBest = v.venueId === analysis.recommendedVenueId;
      const rowStyle = isBest ? "background:#f0fdf4; font-weight:600;" : "";
      const bestBadge = isBest ? `<span style="font-size:0.7rem; background:#16a34a; color:#fff; padding:1px 4px; border-radius:3px; margin-left:4px;">BEST</span>` : "";

      const totalFeeDeductionPerKg = (v.totalDeductionsBdt / analysis.lot.quantityKg).toFixed(2);

      rows += `
        <tr style="${rowStyle}">
          <td>
            <strong>${v.name}</strong> ${bestBadge}
            <div style="font-size:0.75rem; color:var(--color-text-muted);">
              Freight: BDT ${v.freightPerKg.toFixed(2)}/kg | Comm: ${v.brokerCommissionPct}%
            </div>
          </td>
          <td style="font-family:var(--font-mono);">BDT ${v.expectedHammerPriceBdt.toFixed(2)}</td>
          <td style="font-family:var(--font-mono); color:var(--color-status-danger);">- BDT ${totalFeeDeductionPerKg}</td>
          <td style="font-family:var(--font-mono); font-weight:700; color:var(--color-brand-primary);">
            BDT ${v.netRealizationPerKg.toFixed(2)}
          </td>
          <td style="font-family:var(--font-mono); font-weight:700;">
            BDT ${v.netRealizationTotalBdt.toLocaleString()}
          </td>
          <td>
            <span class="badge-decision ${v.decision}">${v.decision}</span>
            <div style="font-size:0.7rem; color:var(--color-text-muted); max-width:160px;">${v.decisionReason}</div>
          </td>
          <td style="font-family:var(--font-mono); font-size:0.8rem;">
            ${v.settlementDays} days
          </td>
        </tr>
      `;
    });
    venuesTableBody.innerHTML = rows;
  }

  // Event Listeners
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  qtySlider.addEventListener("input", (e) => {
    engine.updateLotQuantity(parseFloat(e.target.value));
    updateUI();
  });

  reserveSlider.addEventListener("input", (e) => {
    engine.updateReservePrice(parseFloat(e.target.value));
    updateUI();
  });

  panchagarhPriceSlider.addEventListener("input", (e) => {
    engine.updateVenueHammerPrice("PANCHAGARH", parseFloat(e.target.value));
    updateUI();
  });

  sreemangalPriceSlider.addEventListener("input", (e) => {
    engine.updateVenueHammerPrice("SREEMANGAL", parseFloat(e.target.value));
    updateUI();
  });

  chattogramPriceSlider.addEventListener("input", (e) => {
    engine.updateVenueHammerPrice("CHATTOGRAM", parseFloat(e.target.value));
    updateUI();
  });

  // Export Handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      analysis: engine.analysis,
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `auction_planning_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    let csv = "VenueId,VenueName,HammerPriceBdt,FreightPerKg,BrokerCommPct,WarehouseFeePerKg,NetRealizationPerKg,NetProceedsBdt,Decision,SettlementDays\n";
    engine.analysis.venues.forEach(v => {
      csv += `${v.venueId},"${v.name}",${v.expectedHammerPriceBdt},${v.freightPerKg},${v.brokerCommissionPct},${v.warehouseFeePerKg},${v.netRealizationPerKg},${v.netRealizationTotalBdt},${v.decision},${v.settlementDays}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `auction_venues_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("THREE-CENTRE-BASELINE");
});
