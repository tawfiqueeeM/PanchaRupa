import { DataPlatformEngine } from "../../projects/factory-data/js/data-platform-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new DataPlatformEngine();
  let cleanData = null;
  let invalidData = null;

  try {
    const resClean = await fetch("../../projects/factory-data/fixtures/clean_factory_dataset.json");
    if (resClean.ok) cleanData = await resClean.json();

    const resInvalid = await fetch("../../projects/factory-data/fixtures/invalid_factory_dataset.json");
    if (resInvalid.ok) invalidData = await resInvalid.json();
  } catch (err) {
    console.warn("Could not load dataset fixtures", err);
  }

  // DOM Elements
  const datasetSelect = document.getElementById("datasetSelect");
  const btnDownloadClean = document.getElementById("btnDownloadClean");
  const btnDownloadInvalid = document.getElementById("btnDownloadInvalid");
  const btnExportReport = document.getElementById("btnExportReport");

  const dataStatusPill = document.getElementById("dataStatusPill");
  const kpiStatus = document.getElementById("kpiStatus");
  const kpiStatusSub = document.getElementById("kpiStatusSub");
  const kpiTotalRecords = document.getElementById("kpiTotalRecords");
  const kpiEntityCounts = document.getElementById("kpiEntityCounts");
  const kpiDuplicates = document.getElementById("kpiDuplicates");
  const kpiDuplicatesSub = document.getElementById("kpiDuplicatesSub");
  const kpiOrphans = document.getElementById("kpiOrphans");
  const kpiOrphansSub = document.getElementById("kpiOrphansSub");

  const dataAlertBanner = document.getElementById("dataAlertBanner");
  const dataAlertMsg = document.getElementById("dataAlertMsg");

  const lotSelect = document.getElementById("lotSelect");
  const genealogyContainer = document.getElementById("genealogyContainer");
  const diagTableBody = document.getElementById("diagTableBody");

  function loadDatasetChoice(choice) {
    const data = choice === "CLEAN" ? cleanData : invalidData;
    if (data) {
      engine.loadDataset(data);
      updateUI();
    }
  }

  function updateUI() {
    const rep = engine.validationReport;

    // 1. KPI Cards
    if (rep.isValid) {
      dataStatusPill.className = "status-indicator ok";
      dataStatusPill.textContent = "● DATASET VALID";
      kpiStatus.textContent = "VALID";
      kpiStatus.style.color = "var(--color-status-success)";
      kpiStatusSub.textContent = "Zero relational violations";
      dataAlertBanner.style.display = "none";
    } else {
      dataStatusPill.className = "status-indicator alarm";
      dataStatusPill.textContent = `⚠ ${rep.errors.length} VIOLATIONS`;
      kpiStatus.textContent = "INVALID";
      kpiStatus.style.color = "var(--color-status-danger)";
      kpiStatusSub.textContent = `${rep.errors.length} data quality exceptions`;
      dataAlertBanner.style.display = "block";
      dataAlertMsg.textContent = rep.errors.map(e => e.message).join(" | ");
    }

    kpiTotalRecords.textContent = rep.totalRecords;
    const countsStr = Object.entries(rep.entityCounts).map(([k, v]) => `${k}: ${v}`).join(", ");
    kpiEntityCounts.textContent = countsStr;

    const dupCount = rep.errors.filter(e => e.type === "DUPLICATE_KEY").length;
    kpiDuplicates.textContent = dupCount;
    kpiDuplicates.style.color = dupCount > 0 ? "var(--color-status-danger)" : "var(--color-status-success)";
    kpiDuplicatesSub.textContent = dupCount > 0 ? "Primary key collision!" : "Uniqueness verified";

    const orphanCount = rep.errors.filter(e => e.type === "ORPHAN_FOREIGN_KEY").length;
    kpiOrphans.textContent = orphanCount;
    kpiOrphans.style.color = orphanCount > 0 ? "var(--color-status-danger)" : "var(--color-status-success)";
    kpiOrphansSub.textContent = orphanCount > 0 ? "Broken referential links" : "Referential integrity intact";

    // 2. Populate Lot Select
    const lots = engine.dataset.lots || [];
    if (lots.length > 0) {
      lotSelect.innerHTML = lots.map(l => `<option value="${l.lotId}">${l.lotId} (${l.disposition})</option>`).join("");
      renderGenealogy(lots[0].lotId);
    } else {
      lotSelect.innerHTML = `<option value="">No lots in dataset</option>`;
      genealogyContainer.innerHTML = `<p style="color:var(--color-text-muted); font-style:italic;">No valid inventory lots available for genealogy tracing in this dataset.</p>`;
    }

    // 3. Render Diagnostics Table
    renderDiagnostics(rep);
  }

  function renderGenealogy(lotId) {
    const trace = engine.getLotTrace(lotId);
    if (!trace) {
      genealogyContainer.innerHTML = `<p style="color:var(--color-text-muted);">Lot trace not found.</p>`;
      return;
    }

    const { lot, batch, delivery, inspections, packagingRuns, orders } = trace;

    let html = `
      <!-- Node 1: Raw Leaf Intake Delivery -->
      <div class="genealogy-node">
        <span class="node-title">1. Raw Leaf Intake Delivery</span>
        <span class="node-desc">
          Delivery ID: <strong class="node-badge">${delivery ? delivery.deliveryId : 'N/A'}</strong> | Supplier: <strong>${delivery ? delivery.supplierId : 'N/A'}</strong>
        </span>
        <span class="node-desc">
          Gross: <strong>${delivery ? delivery.grossWeightKg : 0} kg</strong> | Tare: <strong>${delivery ? delivery.tareWeightKg : 0} kg</strong> | Net: <strong style="color:var(--color-brand-primary);">${delivery ? delivery.netWeightKg : 0} kg</strong>
        </span>
      </div>

      <!-- Node 2: Processing Batch -->
      <div class="genealogy-node">
        <span class="node-title">2. Production Batch Execution</span>
        <span class="node-desc">
          Batch ID: <strong class="node-badge">${batch ? batch.batchId : 'N/A'}</strong> | Product: <strong>${batch ? batch.product : 'N/A'}</strong>
        </span>
        <span class="node-desc">
          Fresh Leaf Used: <strong>${batch ? batch.freshLeafUsedKg : 0} kg</strong> | Status: <strong style="color:var(--color-status-success);">${batch ? batch.status : 'N/A'}</strong>
        </span>
      </div>

      <!-- Node 3: QA Inspection Results -->
      <div class="genealogy-node">
        <span class="node-title">3. Quality Gate & Laboratory Inspection</span>
    `;

    (inspections || []).forEach(ins => {
      html += `
        <span class="node-desc">
          Inspection ID: <strong class="node-badge">${ins.inspectionId}</strong> | Moisture: <strong>${ins.moisturePct}%</strong> | Grade: <strong>${ins.grade}</strong> | Disposition: <strong style="color:${ins.disposition === 'RELEASED' ? 'var(--color-status-success)' : 'var(--color-status-danger)'};">${ins.disposition}</strong>
        </span>
      `;
    });

    html += `
      </div>

      <!-- Node 4: Finished Warehouse Lot -->
      <div class="genealogy-node">
        <span class="node-title">4. Finished Warehouse Inventory Lot</span>
        <span class="node-desc">
          Lot ID: <strong class="node-badge">${lot.lotId}</strong> | Storage Bin: <strong>${lot.storageBin}</strong> | Released Mass: <strong>${lot.totalKg} kg</strong>
        </span>
      </div>

      <!-- Node 5: Downstream Packaging & Dispatch Orders -->
      <div class="genealogy-node" style="border-left-color:var(--color-brand-gold);">
        <span class="node-title" style="color:var(--color-brand-gold);">5. Downstream Packaging & Fulfillment</span>
    `;

    if (packagingRuns.length === 0) {
      html += `<span class="node-desc" style="font-style:italic;">No packaging runs completed yet.</span>`;
    } else {
      packagingRuns.forEach(p => {
        const matchingOrder = orders.find(o => o.packId === p.packId);
        html += `
          <span class="node-desc">
            Pack ID: <strong class="node-badge">${p.packId}</strong> (${p.format}, ${p.unitCount} units, ${p.packedKg} kg)
            ${matchingOrder ? `➔ Order: <strong class="node-badge">${matchingOrder.orderId}</strong> (${matchingOrder.channel}, ${matchingOrder.customer}, ${matchingOrder.lifecycleState})` : ''}
          </span>
        `;
      });
    }

    html += `</div>`;
    genealogyContainer.innerHTML = html;
  }

  function renderDiagnostics(rep) {
    if (rep.isValid) {
      diagTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:var(--color-status-success); font-weight:600; padding:16px;">
            ✓ All relational tables, foreign key constraints, primary key indexes, and physical engineering units validated successfully.
          </td>
        </tr>
      `;
      return;
    }

    let rows = "";
    rep.errors.forEach(err => {
      rows += `
        <tr>
          <td><span class="log-badge ALARM">${err.type}</span></td>
          <td style="font-family:var(--font-mono); font-weight:700;">${err.table}.${err.field}</td>
          <td style="font-family:var(--font-mono); color:var(--color-status-danger);">${err.value !== undefined ? err.value : 'N/A'}</td>
          <td>${err.message}</td>
        </tr>
      `;
    });
    diagTableBody.innerHTML = rows;
  }

  // Event Listeners
  datasetSelect.addEventListener("change", (e) => {
    loadDatasetChoice(e.target.value);
  });

  lotSelect.addEventListener("change", (e) => {
    renderGenealogy(e.target.value);
  });

  btnDownloadClean.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanData, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `clean_factory_dataset.json`);
    dlAnchorElem.click();
  });

  btnDownloadInvalid.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invalidData, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `invalid_factory_dataset.json`);
    dlAnchorElem.click();
  });

  btnExportReport.addEventListener("click", () => {
    const exportObj = {
      timestamp: new Date().toISOString(),
      report: engine.validationReport,
      dataset: engine.dataset
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `validation_report_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  // Initial load
  loadDatasetChoice("CLEAN");
});
