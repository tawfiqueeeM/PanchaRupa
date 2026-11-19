import { PackingEngine, DEFAULT_FORMATS } from "../../projects/packing-and-reject/js/packing-engine.js";
import { exportToCsv, exportToJson } from "../../shared/js/ui-utils.js";

const SCENARIOS = {
  "NOMINAL-50G": {
    scenarioId: "NOMINAL-50G",
    description: "Nominal 50g retail bottle dosing (50.2g, Passed checkweigh)",
    formatId: "RETAIL_50G",
    sourceLotId: "F-G01",
    simulatedWeightG: 50.2
  },
  "NOMINAL-100G": {
    scenarioId: "NOMINAL-100G",
    description: "Nominal 100g retail bottle dosing (100.4g, Passed checkweigh)",
    formatId: "RETAIL_100G",
    sourceLotId: "F-G01",
    simulatedWeightG: 100.4
  },
  "NOMINAL-BULK-25KG": {
    scenarioId: "NOMINAL-BULK-25KG",
    description: "Nominal 25kg bulk auction bag dosing (25,020g, Passed checkweigh)",
    formatId: "BULK_25KG",
    sourceLotId: "F-G01",
    simulatedWeightG: 25020.0
  },
  "UNDERFILL-REJECT-FAULT": {
    scenarioId: "UNDERFILL-REJECT-FAULT",
    description: "Short fill fault on 50g bottle (42.5g) triggering pneumatic reject pusher",
    formatId: "RETAIL_50G",
    sourceLotId: "F-G01",
    simulatedWeightG: 42.5
  }
};

const engine = new PackingEngine();

// DOM elements
const elLblActivePackId = document.getElementById("lblActivePackId");
const elLblFormatSummary = document.getElementById("lblFormatSummary");
const elLblDispatchedMass = document.getElementById("lblDispatchedMass");
const elBadgeCheckweighState = document.getElementById("badgeCheckweighState");

const elScaleBezel = document.getElementById("scaleBezel");
const elReadoutScaleG = document.getElementById("readoutScaleG");
const elLblTargetSpec = document.getElementById("lblTargetSpec");
const elLblMinWeight = document.getElementById("lblMinWeight");
const elLblMaxWeight = document.getElementById("lblMaxWeight");
const elLblSourceLot = document.getElementById("lblSourceLot");

const elIndCoarse = document.getElementById("indCoarse");
const elIndFine = document.getElementById("indFine");
const elIndReject = document.getElementById("indReject");

const elSelFormat = document.getElementById("selFormat");
const elInpTargetG = document.getElementById("inpTargetG");
const elInpSourceLot = document.getElementById("inpSourceLot");

const elBtnCoarseDose = document.getElementById("btnCoarseDose");
const elBtnFineDose = document.getElementById("btnFineDose");
const elBtnInjectUnderfill = document.getElementById("btnInjectUnderfill");
const elBtnDispatchPack = document.getElementById("btnDispatchPack");
const elDispatchAlert = document.getElementById("dispatchAlert");

const elValTotalDosed = document.getElementById("valTotalDosed");
const elValTotalDispatched = document.getElementById("valTotalDispatched");
const elValCountDispatched = document.getElementById("valCountDispatched");
const elValTotalRejected = document.getElementById("valTotalRejected");
const elValCountRejected = document.getElementById("valCountRejected");

const elDispatchedTableBody = document.getElementById("dispatchedTableBody");
const elRejectTableBody = document.getElementById("rejectTableBody");
const elEventLogContainer = document.getElementById("eventLogContainer");

function render() {
  const snapshot = engine.getSnapshot();
  const pack = snapshot.activePack;
  const fmt = snapshot.selectedFormat;
  const ledger = snapshot.massLedger;

  // Header and summary
  elLblActivePackId.textContent = pack.packId;
  elLblFormatSummary.textContent = fmt.name;
  elLblDispatchedMass.textContent = `${ledger.totalDispatchedG.toFixed(1)} g`;

  // Scale specs & readout
  elLblTargetSpec.textContent = `Target: ${fmt.targetNetG}g ±${fmt.toleranceG}g`;
  elLblMinWeight.textContent = `${fmt.minWeightG}g`;
  elLblMaxWeight.textContent = `${fmt.maxWeightG}g`;
  elLblSourceLot.textContent = pack.sourceLotId;
  elInpTargetG.value = fmt.targetNetG;
  elInpSourceLot.value = pack.sourceLotId;
  elSelFormat.value = fmt.formatId;

  elReadoutScaleG.textContent = `${pack.actualNetG.toFixed(1)} g`;
  if (pack.checkweighStatus === "PASSED") {
    elReadoutScaleG.className = "scale-main-readout pass";
    elBadgeCheckweighState.className = "status-badge normal";
    elBadgeCheckweighState.textContent = "PASSED";
    elDispatchAlert.classList.remove("active");
  } else if (pack.checkweighStatus.startsWith("REJECTED")) {
    elReadoutScaleG.className = "scale-main-readout reject";
    elBadgeCheckweighState.className = "status-badge fault";
    elBadgeCheckweighState.textContent = pack.checkweighStatus;
  } else {
    elReadoutScaleG.className = "scale-main-readout";
    elBadgeCheckweighState.className = "status-badge idle";
    elBadgeCheckweighState.textContent = "EMPTY / FILLING";
    elDispatchAlert.classList.remove("active");
  }

  // Feeder Indicators
  elIndCoarse.className = pack.dosingState === "COARSE_DONE" ? "feeder-indicator active" : "feeder-indicator";
  elIndFine.className = pack.dosingState === "FINE_DONE" ? "feeder-indicator active" : "feeder-indicator";
  if (pack.rejectPusherActive) {
    elIndReject.className = "feeder-indicator active reject-pusher-active";
    elIndReject.style.background = "#dc2626";
    elIndReject.style.color = "#ffffff";
  } else {
    elIndReject.className = "feeder-indicator";
    elIndReject.style.background = "#1e293b";
    elIndReject.style.color = "#f87171";
  }

  // Mass Balance
  elValTotalDosed.textContent = `${ledger.totalDosedG.toFixed(1)} g`;
  elValTotalDispatched.textContent = `${ledger.totalDispatchedG.toFixed(1)} g`;
  elValCountDispatched.textContent = `${ledger.countDispatched} packs`;
  elValTotalRejected.textContent = `${ledger.totalRejectedG.toFixed(1)} g`;
  elValCountRejected.textContent = `${ledger.countRejected} rejected`;

  // Dispatched table
  if (snapshot.dispatchedHistory.length === 0) {
    elDispatchedTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No packs dispatched yet.</td></tr>';
  } else {
    elDispatchedTableBody.innerHTML = snapshot.dispatchedHistory.map(p => `
      <tr>
        <td class="font-mono" style="font-weight:700;">${p.packId}</td>
        <td class="font-mono">${p.sourceLotId}</td>
        <td>${p.formatId}</td>
        <td class="font-mono" style="color:#15803d; font-weight:700;">${p.actualNetG.toFixed(1)}</td>
        <td><span class="status-badge ${p.channel === "AUCTION" ? "warning" : "normal"}">${p.channel}</span></td>
        <td><span class="status-badge normal">DISPATCHED</span></td>
      </tr>
    `).join("");
  }

  // Rejected table
  if (snapshot.rejectHistory.length === 0) {
    elRejectTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted);">No rejected packs recorded.</td></tr>';
  } else {
    elRejectTableBody.innerHTML = snapshot.rejectHistory.map(r => `
      <tr>
        <td class="font-mono" style="font-weight:700;">${r.packId}</td>
        <td class="font-mono">${r.sourceLotId}</td>
        <td class="font-mono" style="color:#dc2626; font-weight:700;">${r.actualNetG.toFixed(1)}</td>
        <td><span class="status-badge fault">${r.reason}</span></td>
        <td><span class="status-badge held">QUARANTINE_BIN</span></td>
      </tr>
    `).join("");
  }

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
elSelFormat.addEventListener("change", (e) => {
  engine.selectFormat(e.target.value);
  render();
});

elInpSourceLot.addEventListener("input", (e) => {
  engine.activePack.sourceLotId = e.target.value.trim();
  render();
});

elBtnCoarseDose.addEventListener("click", () => {
  engine.runCoarseDosing();
  render();
});

elBtnFineDose.addEventListener("click", () => {
  engine.runFineDosing();
  render();
});

elBtnInjectUnderfill.addEventListener("click", () => {
  engine.injectUnderfill();
  render();
});

elBtnDispatchPack.addEventListener("click", () => {
  const res = engine.dispatch();
  if (!res.success) {
    elDispatchAlert.textContent = `DISPATCH BLOCKED: ${res.reason === "CANNOT_DISPATCH_REJECTED" ? "Defective pack diverted to Reject Bin. Excluded from shipping manifest." : "Container is empty or pending inspection."}`;
    elDispatchAlert.classList.add("active");
  } else {
    elDispatchAlert.classList.remove("active");
  }
  render();
});

// Scenario pill selector
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;
    if (SCENARIOS[scenarioKey]) {
      engine.loadScenario(SCENARIOS[scenarioKey]);
      render();
    }
  });
});

// Reset Demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="NOMINAL-50G"]')?.classList.add("active");
  engine.reset();
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["Timestamp", "PackID", "SourceLotID", "Format", "NetG", "ChannelOrStatus", "Classification"];
  const rows = [
    ...snapshot.dispatchedHistory.map(d => [
      d.timestamp, d.packId, d.sourceLotId, d.formatId, d.actualNetG, d.channel, "DISPATCHED"
    ]),
    ...snapshot.rejectHistory.map(r => [
      r.timestamp, r.packId, r.sourceLotId, r.formatId, r.actualNetG, r.reason, "QUARANTINED"
    ])
  ];
  if (rows.length === 0) {
    rows.push([
      new Date().toISOString(),
      snapshot.activePack.packId,
      snapshot.activePack.sourceLotId,
      snapshot.activePack.formatId,
      snapshot.activePack.actualNetG,
      snapshot.activePack.checkweighStatus,
      "IN_PROCESS"
    ]);
  }
  exportToCsv(`packing-ledger-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`packing-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.loadScenario(SCENARIOS["NOMINAL-50G"]);
render();
