import { GradingEngine, DEFAULT_LOTS, DEFAULT_BINS } from "../../projects/grading-and-routing/js/grading-engine.js";
import { exportToCsv, exportToJson, formatKg } from "../../shared/js/ui-utils.js";

const SCENARIOS = {
  "NOMINAL-RELEASE-BIN1": {
    scenarioId: "NOMINAL-RELEASE-BIN1",
    description: "Nominal inspection, Grade A assignment, and routing to Bin 1",
    finishedLotId: "F-G01",
    grade: "GRADE_A",
    disposition: "RELEASED",
    decisionReason: "INFUSION_SCORE_EXCELLENT",
    targetBinId: "BIN-01",
    bin1Occupancy: 10.0
  },
  "QUALITY-HOLD-GATE": {
    scenarioId: "QUALITY-HOLD-GATE",
    description: "Lot placed on Hold pending sensory check; routing locked",
    finishedLotId: "F-G01",
    grade: "GRADE_A",
    disposition: "ON_HOLD",
    decisionReason: "SAMPLE_PENDING_LAB",
    targetBinId: "BIN-01",
    bin1Occupancy: 10.0
  },
  "DESTINATION-BIN-FULL": {
    scenarioId: "DESTINATION-BIN-FULL",
    description: "Bin 1 at capacity; routing trips; material held in surge hopper",
    finishedLotId: "F-G01",
    grade: "GRADE_A",
    disposition: "RELEASED",
    decisionReason: "MOISTURE_VERIFIED",
    targetBinId: "BIN-01",
    bin1Occupancy: 50.0 // full
  }
};

const engine = new GradingEngine();

// DOM elements
const elLblActiveLotId = document.getElementById("lblActiveLotId");
const elLblActiveDisposition = document.getElementById("lblActiveDisposition");
const elLblRoutingState = document.getElementById("lblRoutingState");

const elLblGenealogyVendor = document.getElementById("lblGenealogyVendor");
const elLblGenealogyBatch = document.getElementById("lblGenealogyBatch");
const elLblGenealogyGrade = document.getElementById("lblGenealogyGrade");
const elLblGenealogyBin = document.getElementById("lblGenealogyBin");

const elBadgeDisposition = document.getElementById("badgeDisposition");
const elValLotMass = document.getElementById("valLotMass");
const elValMoisture = document.getElementById("valMoisture");
const elValInfusion = document.getElementById("valInfusion");

const elSelGrade = document.getElementById("selGrade");
const elSelDecisionReason = document.getElementById("selDecisionReason");
const elBtnReleaseLot = document.getElementById("btnReleaseLot");
const elBtnHoldLot = document.getElementById("btnHoldLot");
const elBtnRejectLot = document.getElementById("btnRejectLot");
const elBtnRouteMaterial = document.getElementById("btnRouteMaterial");
const elRoutingFaultAlert = document.getElementById("routingFaultAlert");

const elBadgeInterlockStatus = document.getElementById("badgeInterlockStatus");
const elBinsContainer = document.getElementById("binsContainer");
const elLblUnroutedMass = document.getElementById("lblUnroutedMass");
const elBtnAcknowledgeFault = document.getElementById("btnAcknowledgeFault");
const elEventLogContainer = document.getElementById("eventLogContainer");

function render() {
  const snapshot = engine.getSnapshot();
  const lot = snapshot.activeLot;
  const bins = snapshot.bins;

  // Header & summary
  elLblActiveLotId.textContent = lot.finishedLotId;
  elLblActiveDisposition.textContent = lot.disposition;
  elLblRoutingState.textContent = lot.routingState;
  elLblUnroutedMass.textContent = formatKg(lot.unroutedMassKg);

  // Genealogy
  elLblGenealogyVendor.textContent = `${lot.vendorId} (Lot ${lot.vendorLotId})`;
  elLblGenealogyBatch.textContent = `Batch ${lot.batchId} (${lot.netMassKg} kg net)`;
  elLblGenealogyGrade.textContent = `${lot.grade.replace(/_/g, " ")} (Score: ${lot.infusionScore})`;
  const targetBinObj = bins.find(b => b.binId === lot.targetBinId);
  elLblGenealogyBin.textContent = targetBinObj ? targetBinObj.name : lot.targetBinId;

  // Metrics
  elValLotMass.textContent = formatKg(lot.netMassKg);
  elValMoisture.textContent = `${lot.moisturePercent.toFixed(1)}%`;
  elValInfusion.textContent = `${lot.infusionScore.toFixed(1)} / 10`;

  // Disposition badge
  if (lot.disposition === "RELEASED") {
    elBadgeDisposition.className = "status-badge normal";
    elBadgeDisposition.textContent = "RELEASED FOR PACKING";
    elRoutingFaultAlert.classList.remove("active");
  } else if (lot.disposition === "ON_HOLD") {
    elBadgeDisposition.className = "status-badge held";
    elBadgeDisposition.textContent = "ON QUALITY HOLD";
  } else if (lot.disposition === "REJECTED") {
    elBadgeDisposition.className = "status-badge fault";
    elBadgeDisposition.textContent = "REJECTED";
  } else {
    elBadgeDisposition.className = "status-badge warning";
    elBadgeDisposition.textContent = "PENDING SIGN-OFF";
  }

  // Interlock badge & fault alert
  if (snapshot.faultLATCH) {
    elBadgeInterlockStatus.className = "status-badge fault";
    elBadgeInterlockStatus.textContent = "INTERLOCK TRIPPED";
    elRoutingFaultAlert.textContent = `INTERLOCK FAULT: ${snapshot.faultReason}`;
    elRoutingFaultAlert.classList.add("active");
  } else if (lot.routingState === "HOLD_LOCKED") {
    elBadgeInterlockStatus.className = "status-badge held";
    elBadgeInterlockStatus.textContent = "ROUTING LOCKED (HOLD)";
    elRoutingFaultAlert.textContent = "ROUTING LOCKED: Lot is on Hold or Rejected. Sign-off required.";
    elRoutingFaultAlert.classList.add("active");
  } else if (lot.routingState === "ROUTED") {
    elBadgeInterlockStatus.className = "status-badge normal";
    elBadgeInterlockStatus.textContent = "ROUTED COMPLETE";
    elRoutingFaultAlert.classList.remove("active");
  } else {
    elBadgeInterlockStatus.className = "status-badge normal";
    elBadgeInterlockStatus.textContent = "PERMISSIVE CLEAR";
    elRoutingFaultAlert.classList.remove("active");
  }

  // Bins rendering
  elBinsContainer.innerHTML = bins.map(bin => {
    const isSelected = bin.binId === lot.targetBinId;
    const fillPercent = Math.min(100, Math.round((bin.currentOccupancyKg / bin.capacityKg) * 100));
    const isFull = fillPercent >= 100 || bin.isLocked;

    return `
      <div class="bin-card ${isSelected ? "selected" : ""} ${isFull ? "full" : ""}" data-bin="${bin.binId}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.85rem;">${bin.name}</strong>
          <span class="status-badge ${isFull ? "fault" : (isSelected ? "running" : "idle")}" style="font-size:0.65rem;">
            ${bin.isLocked ? "LOCKED" : (fillPercent >= 100 ? "FULL" : "READY")}
          </span>
        </div>
        <div style="font-size:0.75rem; color:var(--color-text-muted);">
          Occupancy: <strong class="font-mono">${bin.currentOccupancyKg.toFixed(1)} / ${bin.capacityKg} kg</strong> (${fillPercent}%)
        </div>
        <div class="bin-fill-track">
          <div class="bin-fill-bar ${isFull ? "full" : ""}" style="width:${fillPercent}%;"></div>
        </div>
        <div style="display:flex; gap:4px; margin-top:2px;">
          <button class="btn btn-secondary btn-select-bin" data-bin="${bin.binId}" style="flex:1; font-size:0.7rem; padding:2px 6px;">
            ${isSelected ? "Selected" : "Select Bin"}
          </button>
          <button class="btn btn-secondary btn-toggle-bin" data-bin="${bin.binId}" style="font-size:0.7rem; padding:2px 6px;">
            ${isFull ? "Empty" : "Fill"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Attach dynamic bin card button listeners
  document.querySelectorAll(".btn-select-bin").forEach(btn => {
    btn.addEventListener("click", (e) => {
      engine.selectTargetBin(e.target.dataset.bin);
      render();
    });
  });

  document.querySelectorAll(".btn-toggle-bin").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const bId = e.target.dataset.bin;
      const bin = engine.bins.find(b => b.binId === bId);
      if (bin) {
        if (bin.currentOccupancyKg >= bin.capacityKg) {
          engine.setBinOccupancy(bId, 0.0);
        } else {
          engine.setBinOccupancy(bId, bin.capacityKg);
        }
        render();
      }
    });
  });

  // Event Log
  elEventLogContainer.innerHTML = "";
  snapshot.eventLedger.forEach(ev => {
    const row = document.createElement("div");
    row.className = "event-entry";
    row.innerHTML = `
      <span class="event-time">${ev.timestamp}</span>
      <span class="event-tag ${ev.type.toLowerCase()}">${ev.type}</span>
      <span class="event-msg">${escapeHtml(ev.message)}</span>
    `;
    elEventLogContainer.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Event Listeners
elSelGrade.addEventListener("change", (e) => {
  engine.setGrade(e.target.value);
  render();
});

elBtnReleaseLot.addEventListener("click", () => {
  engine.setDisposition("RELEASED", elSelDecisionReason.value);
  render();
});

elBtnHoldLot.addEventListener("click", () => {
  engine.setDisposition("ON_HOLD", elSelDecisionReason.value);
  render();
});

elBtnRejectLot.addEventListener("click", () => {
  engine.setDisposition("REJECTED", elSelDecisionReason.value);
  render();
});

elBtnRouteMaterial.addEventListener("click", () => {
  engine.routeMaterial();
  render();
});

elBtnAcknowledgeFault.addEventListener("click", () => {
  engine.acknowledgeFault();
  render();
});

// Scenario pill selector
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;
    if (SCENARIOS[scenarioKey]) {
      const sc = SCENARIOS[scenarioKey];
      engine.reset();
      engine.inspectLot(sc.finishedLotId);
      engine.setGrade(sc.grade);
      engine.selectTargetBin(sc.targetBinId);
      if (sc.bin1Occupancy !== undefined) {
        engine.setBinOccupancy("BIN-01", sc.bin1Occupancy);
      }
      engine.setDisposition(sc.disposition, sc.decisionReason);
      render();
    }
  });
});

// Reset demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="NOMINAL-RELEASE-BIN1"]')?.classList.add("active");
  engine.reset();
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["Timestamp", "FinishedLotID", "BatchID", "VendorLotID", "Grade", "RoutedKg", "DestinationBin", "Disposition", "Status"];
  const rows = snapshot.routingHistory.map(r => [
    r.timestamp, r.finishedLotId, r.batchId, r.vendorLotId, r.grade, r.routedKg, r.destinationBin, r.disposition, r.status
  ]);
  if (rows.length === 0) {
    rows.push([
      new Date().toISOString(), snapshot.activeLot.finishedLotId, snapshot.activeLot.batchId, snapshot.activeLot.vendorLotId, snapshot.activeLot.grade, snapshot.activeLot.unroutedMassKg, snapshot.activeLot.targetBinId, snapshot.activeLot.disposition, "PENDING_ROUTING"
    ]);
  }
  exportToCsv(`grading-routing-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`grading-routing-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.reset();
render();
