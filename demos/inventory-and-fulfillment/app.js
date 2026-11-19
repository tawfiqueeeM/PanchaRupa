import { InventoryEngine } from "../../projects/inventory-and-fulfillment/js/inventory-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new InventoryEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/inventory-and-fulfillment/fixtures/inventory_scenarios.json");
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

  const invStatusPill = document.getElementById("invStatusPill");
  const kpiFeasibility = document.getElementById("kpiFeasibility");
  const kpiFeasibilitySub = document.getElementById("kpiFeasibilitySub");
  const kpiTotalStock = document.getElementById("kpiTotalStock");
  const kpiTotalStockSub = document.getElementById("kpiTotalStockSub");
  const kpiBulk = document.getElementById("kpiBulk");
  const kpiRetail = document.getElementById("kpiRetail");

  const invAlertBanner = document.getElementById("invAlertBanner");
  const invAlertMsg = document.getElementById("invAlertMsg");

  const lotsContainer = document.getElementById("lotsContainer");
  const formLotSelect = document.getElementById("formLotSelect");
  const formChannelSelect = document.getElementById("formChannelSelect");
  const formQtyInput = document.getElementById("formQtyInput");
  const formCustomerInput = document.getElementById("formCustomerInput");
  const btnSubmitReserve = document.getElementById("btnSubmitReserve");

  const ordersTableBody = document.getElementById("ordersTableBody");

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const snap = engine.getSnapshot();

    // 1. KPI Cards
    if (snap.isFeasible) {
      invStatusPill.className = "status-indicator ok";
      invStatusPill.textContent = "● ALLOCATION COMPLIANT";
      kpiFeasibility.textContent = "COMPLIANT";
      kpiFeasibility.style.color = "var(--color-status-success)";
      kpiFeasibilitySub.textContent = "All lots released, zero over-allocation";
      invAlertBanner.style.display = "none";
    } else {
      invStatusPill.className = "status-indicator alarm";
      invStatusPill.textContent = "⚠ ALLOCATION EXCEPTION";
      kpiFeasibility.textContent = "EXCEPTION";
      kpiFeasibility.style.color = "var(--color-status-danger)";
      kpiFeasibilitySub.textContent = `${snap.exceptions.length} compliance violation(s)`;
      invAlertBanner.style.display = "block";
      invAlertMsg.textContent = snap.exceptions.map(e => e.reason).join(" | ");
    }

    kpiTotalStock.textContent = `${snap.totalStockKg.toFixed(1)} kg`;
    kpiTotalStockSub.textContent = `Avail: ${snap.totalAvailableKg.toFixed(1)} kg | Res: ${snap.totalReservedKg.toFixed(1)} kg | Disp: ${snap.totalDispatchedKg.toFixed(1)} kg`;

    kpiBulk.textContent = `${snap.channelBreakdown.bulkAuctionKg.toFixed(1)} kg`;
    kpiRetail.textContent = `${snap.channelBreakdown.retailBottlesKg.toFixed(1)} kg`;

    // 2. Render Lots
    renderLots(snap);

    // 3. Render Orders
    renderOrders(snap);

    // 4. Update Select Options
    formLotSelect.innerHTML = snap.lots.map(l => `
      <option value="${l.lotId}">${l.lotId} (${l.product}, ${l.disposition}) - Avail: ${l.availableKg} kg</option>
    `).join("");
  }

  function renderLots(snap) {
    let html = "";
    snap.lots.forEach(l => {
      const total = l.totalKg || 1;
      const dispPct = (l.dispatchedKg / total) * 100;
      const resPct = (l.reservedKg / total) * 100;
      const availPct = (l.availableKg / total) * 100;

      const dispBadgeClass = l.disposition === "RELEASED" ? "ok" : "alarm";

      html += `
        <div class="lot-item">
          <div class="lot-item-header">
            <div>
              <strong style="font-family:var(--font-mono); font-size:0.85rem;">${l.lotId}</strong>
              <span style="font-size:0.75rem; color:var(--color-text-muted); margin-left:4px;">(${l.product})</span>
            </div>
            <span class="status-indicator ${dispBadgeClass}" style="font-size:0.75rem; padding:2px 6px;">${l.disposition}</span>
          </div>
          <div style="font-size:0.75rem; display:flex; justify-content:space-between; margin-top:2px;">
            <span>Total: <strong>${l.totalKg.toFixed(1)} kg</strong></span>
            <span>Avail: <strong style="color:var(--color-status-success);">${l.availableKg.toFixed(1)} kg</strong></span>
            <span>Res: <strong>${l.reservedKg.toFixed(1)} kg</strong></span>
            <span>Disp: <strong>${l.dispatchedKg.toFixed(1)} kg</strong></span>
          </div>
          <div class="lot-bar-container" title="Dispatched: ${dispPct.toFixed(0)}%, Reserved: ${resPct.toFixed(0)}%, Avail: ${availPct.toFixed(0)}%">
            <div class="lot-bar-dispatched" style="width:${dispPct}%;"></div>
            <div class="lot-bar-reserved" style="width:${resPct}%;"></div>
            <div class="lot-bar-available" style="width:${availPct}%;"></div>
          </div>
        </div>
      `;
    });
    lotsContainer.innerHTML = html;
  }

  function renderOrders(snap) {
    let rows = "";
    snap.orders.forEach(o => {
      let actionsHtml = "";
      if (o.lifecycleState === "RESERVED") {
        actionsHtml = `<button class="action-btn primary btn-dispatch" data-id="${o.orderId}">Dispatch</button>`;
      } else if (o.lifecycleState === "DISPATCHED") {
        actionsHtml = `
          <button class="action-btn success btn-settle" data-id="${o.orderId}">Settle</button>
          <button class="action-btn btn-settle-delay" data-id="${o.orderId}" title="Simulate 21-day auction delay">Delay</button>
        `;
      } else if (o.lifecycleState === "SETTLED") {
        actionsHtml = `<span style="font-size:0.75rem; color:var(--color-status-success); font-weight:700;">✓ CLOSED</span>`;
      }

      const settlementBadge = o.settlementStatus === "OVERDUE_DELAYED"
        ? `<span class="log-badge ALARM">OVERDUE (${o.settlementDays}d)</span>`
        : `<span class="log-badge ${o.settlementStatus === 'SETTLED' ? 'INFO' : 'WARN'}">${o.settlementStatus} (${o.settlementDays}d)</span>`;

      rows += `
        <tr>
          <td style="font-family:var(--font-mono); font-weight:700;">${o.orderId}</td>
          <td><span style="font-size:0.75rem;">${o.channel.replace("_", " ")}</span></td>
          <td style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${o.customer}">${o.customer}</td>
          <td>${o.format}</td>
          <td style="font-family:var(--font-mono); font-weight:700;">${o.allocatedKg.toFixed(1)}</td>
          <td><span class="badge-lifecycle ${o.lifecycleState}">${o.lifecycleState}</span></td>
          <td>${settlementBadge}</td>
          <td style="text-align:right;">${actionsHtml}</td>
        </tr>
      `;
    });
    ordersTableBody.innerHTML = rows;

    // Attach event listeners for actions
    ordersTableBody.querySelectorAll(".btn-dispatch").forEach(btn => {
      btn.addEventListener("click", (e) => {
        engine.dispatchOrder(e.target.dataset.id);
        updateUI();
      });
    });

    ordersTableBody.querySelectorAll(".btn-settle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        engine.settleOrder(e.target.dataset.id, false);
        updateUI();
      });
    });

    ordersTableBody.querySelectorAll(".btn-settle-delay").forEach(btn => {
      btn.addEventListener("click", (e) => {
        engine.settleOrder(e.target.dataset.id, true);
        updateUI();
      });
    });
  }

  // Event Listeners
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  btnSubmitReserve.addEventListener("click", () => {
    const lotId = formLotSelect.value;
    const channel = formChannelSelect.value;
    const qty = parseFloat(formQtyInput.value);
    const customer = formCustomerInput.value || "Market Order";
    const orderId = `ORD-USR-${Date.now().toString().slice(-4)}`;
    const format = channel === "AUCTION_BULK" ? `Bulk ${qty}kg Sack` : `Retail ${qty}kg Pack`;

    const res = engine.reserveLot(orderId, lotId, qty, channel, customer, format, 1);
    if (!res.success) {
      alert(res.reason);
    }
    updateUI();
  });

  // Export Handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      snapshot: engine.getSnapshot(),
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `fulfillment_ledger_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    let csv = "OrderId,Channel,Customer,LotId,AllocatedKg,Format,UnitCount,LifecycleState,SettlementDays,SettlementStatus\n";
    engine.orders.forEach(o => {
      csv += `${o.orderId},${o.channel},"${o.customer}",${o.lotId},${o.allocatedKg},"${o.format}",${o.unitCount},${o.lifecycleState},${o.settlementDays},${o.settlementStatus}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `fulfillment_ledger_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("DAY-40-ALLOCATION-BASE");
});
