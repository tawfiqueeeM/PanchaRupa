import { MaintenanceEngine } from "../../projects/maintenance-planning/js/maintenance-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new MaintenanceEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/maintenance-planning/fixtures/maintenance_scenarios.json");
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

  const maintStatusPill = document.getElementById("maintStatusPill");
  const kpiStatus = document.getElementById("kpiStatus");
  const kpiStatusSub = document.getElementById("kpiStatusSub");
  const kpiUnplanned = document.getElementById("kpiUnplanned");
  const kpiPlannedSub = document.getElementById("kpiPlannedSub");
  const kpiDelay = document.getElementById("kpiDelay");
  const kpiDelaySub = document.getElementById("kpiDelaySub");
  const kpiWip = document.getElementById("kpiWip");
  const kpiWipSub = document.getElementById("kpiWipSub");

  const maintAlertBanner = document.getElementById("maintAlertBanner");
  const maintAlertMsg = document.getElementById("maintAlertMsg");

  const assetsContainer = document.getElementById("assetsContainer");
  const formAssetSelect = document.getElementById("formAssetSelect");
  const formTypeSelect = document.getElementById("formTypeSelect");
  const formDurationInput = document.getElementById("formDurationInput");
  const formTitleInput = document.getElementById("formTitleInput");
  const formPartsInput = document.getElementById("formPartsInput");
  const formLaborInput = document.getElementById("formLaborInput");
  const btnSubmitWO = document.getElementById("btnSubmitWO");

  const woTableBody = document.getElementById("woTableBody");

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
    const hasOutage = snap.assets.some(a => a.status === "TRIPPED_OUTAGE") || snap.unplannedDowntimeMin > 0;
    if (!hasOutage) {
      maintStatusPill.className = "status-indicator ok";
      maintStatusPill.textContent = "● 100% OPERATIONAL";
      kpiStatus.textContent = "NORMAL";
      kpiStatus.style.color = "var(--color-status-success)";
      kpiStatusSub.textContent = "Zero active breakdowns";
      maintAlertBanner.style.display = "none";
    } else {
      maintStatusPill.className = "status-indicator alarm";
      maintStatusPill.textContent = "⚠ CRITICAL OUTAGE";
      kpiStatus.textContent = "OUTAGE";
      kpiStatus.style.color = "var(--color-status-danger)";
      kpiStatusSub.textContent = "Active machine breakdown!";
      maintAlertBanner.style.display = "block";
      maintAlertMsg.textContent = `EMERGENCY OUTAGE: ${snap.unplannedDowntimeMin}m breakdown! Queued batches: ${snap.queuedBatches.join(", ") || 'None'} (+${snap.totalDispatchDelayMin}m dispatch delay)`;
    }

    kpiUnplanned.textContent = `${snap.unplannedDowntimeMin} min`;
    kpiPlannedSub.textContent = `Planned PM: ${snap.plannedDowntimeMin} min`;

    kpiDelay.textContent = `${snap.totalDispatchDelayMin} min`;
    kpiDelay.style.color = snap.totalDispatchDelayMin > 0 ? "var(--color-status-danger)" : "var(--color-status-success)";
    kpiDelaySub.textContent = snap.totalDispatchDelayMin > 0 ? "Shipments delayed past 17:00" : "Shipments on schedule";

    kpiWip.textContent = snap.queuedBatchesCount;
    kpiWipSub.textContent = snap.queuedBatchesCount > 0 ? `Queued: ${snap.queuedBatches.join(", ")}` : "Zero queued batches";

    // 2. Render Assets
    renderAssets(snap);

    // 3. Render Work Orders
    renderWorkOrders(snap);

    // 4. Update Select Options
    formAssetSelect.innerHTML = snap.assets.map(a => `
      <option value="${a.assetId}">${a.name} (${a.assetId}) - ${a.status}</option>
    `).join("");
  }

  function renderAssets(snap) {
    let html = "";
    snap.assets.forEach(a => {
      const mtbf = a.mtbfHours || 300;
      const pct = Math.min(100, Math.round((a.runtimeHours / mtbf) * 100));

      let badgeClass = "ok";
      if (a.status === "TRIPPED_OUTAGE") badgeClass = "alarm";
      else if (a.status === "MAINTENANCE_PLANNED") badgeClass = "warn";

      html += `
        <div class="asset-item">
          <div class="asset-item-header">
            <div>
              <strong style="font-size:0.85rem;">${a.name}</strong>
              <span style="font-size:0.75rem; color:var(--color-text-muted); font-family:var(--font-mono);">(${a.assetId})</span>
            </div>
            <span class="status-indicator ${badgeClass}" style="font-size:0.75rem; padding:2px 6px;">${a.status}</span>
          </div>
          <div style="font-size:0.75rem; display:flex; justify-content:space-between; margin-top:2px;">
            <span>Runtime: <strong>${a.runtimeHours.toFixed(1)} hrs</strong></span>
            <span>MTBF: <strong>${mtbf} hrs</strong> (${pct}%)</span>
            <span>Criticality: <strong style="color:${a.criticality === 'HIGH' ? 'var(--color-status-danger)' : 'inherit'};">${a.criticality}</strong></span>
          </div>
          <div class="asset-runtime-bar" title="Runtime health: ${pct}% of MTBF">
            <div class="asset-runtime-fill" style="width:${pct}%; background:${pct > 90 ? 'var(--color-status-danger)' : 'var(--color-brand-primary)'};"></div>
          </div>
        </div>
      `;
    });
    assetsContainer.innerHTML = html;
  }

  function renderWorkOrders(snap) {
    let rows = "";
    snap.workOrders.forEach(wo => {
      const asset = snap.assets.find(a => a.assetId === wo.assetId);
      const isComplete = wo.status === "COMPLETED";

      let actionHtml = isComplete
        ? `<span style="font-size:0.75rem; color:var(--color-status-success); font-weight:700;">✓ CLOSED</span>`
        : `<button class="action-btn success btn-complete" data-id="${wo.woId}">Complete</button>`;

      const impactHtml = wo.dispatchDelayMin > 0
        ? `<span style="color:var(--color-status-danger); font-weight:700;">+${wo.dispatchDelayMin}m Delay</span> (${(wo.queuedBatches || []).join(", ")})`
        : `<span style="color:var(--color-status-success);">Zero Delay</span>`;

      rows += `
        <tr>
          <td style="font-family:var(--font-mono); font-weight:700;">${wo.woId}</td>
          <td><span class="badge-wo ${wo.type}">${wo.type}</span></td>
          <td>${asset ? asset.name : wo.assetId}</td>
          <td>${wo.title}</td>
          <td style="font-family:var(--font-mono);">${wo.durationMinutes}m</td>
          <td><span class="log-badge ${isComplete ? 'INFO' : (wo.type === 'CORRECTIVE' ? 'ALARM' : 'WARN')}">${wo.status}</span></td>
          <td>${impactHtml}</td>
          <td style="text-align:right;">${actionHtml}</td>
        </tr>
      `;
    });
    woTableBody.innerHTML = rows;

    woTableBody.querySelectorAll(".btn-complete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        engine.completeWorkOrder(e.target.dataset.id);
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

  btnSubmitWO.addEventListener("click", () => {
    const assetId = formAssetSelect.value;
    const type = formTypeSelect.value;
    const duration = parseInt(formDurationInput.value, 10) || 60;
    const title = formTitleInput.value || "Service intervention";
    const partsCost = parseFloat(formPartsInput.value) || 0;
    const laborHours = parseFloat(formLaborInput.value) || 2.0;
    const woId = `WO-${type === 'CORRECTIVE' ? 'EM' : 'PM'}-${Date.now().toString().slice(-4)}`;

    const res = engine.createWorkOrder({
      woId,
      type,
      assetId,
      title,
      priority: type === 'CORRECTIVE' ? 'CRITICAL' : 'MEDIUM',
      startMin: 120,
      durationMinutes: duration,
      partsCostBdt: partsCost,
      laborHours
    });

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
    dlAnchorElem.setAttribute("download", `maintenance_log_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    let csv = "WoId,Type,AssetId,Title,DurationMinutes,Status,PartsCostBdt,LaborHours,DispatchDelayMin,QueuedBatches\n";
    engine.workOrders.forEach(w => {
      csv += `${w.woId},${w.type},${w.assetId},"${w.title}",${w.durationMinutes},${w.status},${w.partsCostBdt},${w.laborHours},${w.dispatchDelayMin},"${(w.queuedBatches || []).join(';')}"\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `maintenance_work_orders_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("PLANNED-PM-BASELINE");
});
