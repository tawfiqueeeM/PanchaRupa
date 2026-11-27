import { LeafIntakeEngine } from "../../projects/leaf-intake/js/leaf-intake-engine.js";
import { exportToCsv, exportToJson, formatKg } from "../../shared/js/ui-utils.js";

// Scenario fixture definitions
const SCENARIOS = {
  "DAY-40-NOMINAL": {
    scenarioId: "DAY-40-NOMINAL",
    description: "DAY-40 Nominal Green Leaf Receipt (Vendor V-01)",
    vendorId: "V-01",
    lotId: "L-001",
    grossKg: 125.0,
    tareKg: 5.0,
    teaType: "GREEN",
    destination: "DRUM_INFEED_HOPPER",
    bufferInitiallyClear: true
  },
  "DAY-40-GOLDEN": {
    scenarioId: "DAY-40-GOLDEN",
    description: "DAY-40 Golden-eligible Leaf Receipt (Vendor V-02)",
    vendorId: "V-02",
    lotId: "L-O01",
    grossKg: 44.0,
    tareKg: 4.0,
    teaType: "GOLDEN",
    destination: "WITHERING_TRAYS",
    bufferInitiallyClear: true
  },
  "ABNORMAL-BUFFER-BLOCKED": {
    scenarioId: "ABNORMAL-BUFFER-BLOCKED",
    description: "Downstream Hopper Full / Buffer Sensor Blocked",
    vendorId: "V-01",
    lotId: "L-001",
    grossKg: 125.0,
    tareKg: 5.0,
    teaType: "GREEN",
    destination: "DRUM_INFEED_HOPPER",
    bufferInitiallyClear: false
  },
  "ABNORMAL-REJECTED": {
    scenarioId: "ABNORMAL-REJECTED",
    description: "Quality Rejection (High Moisture / Degradation)",
    vendorId: "V-03",
    lotId: "L-009",
    grossKg: 60.0,
    tareKg: 5.0,
    teaType: "GREEN",
    destination: "QUARANTINE_BIN",
    rejectionReason: "HIGH_MOISTURE",
    bufferInitiallyClear: true
  }
};

const engine = new LeafIntakeEngine();

// DOM elements
const elReadoutNetKg = document.getElementById("readoutNetKg");
const elReadoutGrossKg = document.getElementById("readoutGrossKg");
const elReadoutTareKg = document.getElementById("readoutTareKg");
const elValidationBanner = document.getElementById("validationBanner");
const elInpVendorId = document.getElementById("inpVendorId");
const elInpLotId = document.getElementById("inpLotId");
const elInpGrossKg = document.getElementById("inpGrossKg");
const elInpTareKg = document.getElementById("inpTareKg");
const elSelTeaType = document.getElementById("selTeaType");
const elBtnAcceptLot = document.getElementById("btnAcceptLot");
const elBtnRejectLot = document.getElementById("btnRejectLot");
const elRejectReasonGroup = document.getElementById("rejectReasonGroup");
const elSelRejectReason = document.getElementById("selRejectReason");

const elBufferCard = document.getElementById("bufferCard");
const elBufferSensorPill = document.getElementById("bufferSensorPill");
const elBtnToggleBuffer = document.getElementById("btnToggleBuffer");
const elValTransferCmd = document.getElementById("valTransferCmd");
const elValInterlockState = document.getElementById("valInterlockState");
const elProgressBar = document.getElementById("progressBar");
const elInterlockNotice = document.getElementById("interlockNotice");
const elInterlockBadge = document.getElementById("interlockBadge");
const elBtnJogTransfer = document.getElementById("btnJogTransfer");
const elBtnAutoTransfer = document.getElementById("btnAutoTransfer");
const elLblActiveLotId = document.getElementById("lblActiveLotId");
const elLblAssignedStation = document.getElementById("lblAssignedStation");
const elLblDestinationDetail = document.getElementById("lblDestinationDetail");

const elRegGross = document.getElementById("regGross");
const elRegTare = document.getElementById("regTare");
const elRegBufferClear = document.getElementById("regBufferClear");
const elRegBufferClearDesc = document.getElementById("regBufferClearDesc");
const elRegMotorRun = document.getElementById("regMotorRun");
const elRegMotorRunDesc = document.getElementById("regMotorRunDesc");
const elRegAlarmBeacon = document.getElementById("regAlarmBeacon");
const elRegAlarmBeaconDesc = document.getElementById("regAlarmBeaconDesc");

const elEventLogContainer = document.getElementById("eventLogContainer");
const elDispatchedTableBody = document.getElementById("dispatchedTableBody");

let autoTransferTimer = null;

function render() {
  const snapshot = engine.getSnapshot();
  const lot = snapshot.activeLot;
  const buffer = snapshot.destinationBuffer;
  const interlock = snapshot.transferInterlock;

  // Header and summary labels
  elLblActiveLotId.textContent = lot.lotId;
  elLblAssignedStation.textContent = buffer.targetStation;
  elLblDestinationDetail.textContent = `Target: ${buffer.targetStation.replace(/_/g, " ")} (Capacity: 250 kg)`;

  // Scale readouts
  elReadoutNetKg.textContent = formatKg(lot.netKg);
  elReadoutGrossKg.textContent = `${lot.grossKg.toFixed(1)} kg`;
  elReadoutTareKg.textContent = `${lot.tareKg.toFixed(1)} kg`;

  // Validation
  const validation = engine.validateWeights();
  if (!validation.isValid) {
    elValidationBanner.textContent = validation.errors.join(" ");
    elValidationBanner.classList.add("active");
  } else {
    elValidationBanner.classList.remove("active");
  }

  // Inputs sync
  elInpVendorId.value = lot.vendorId;
  elInpLotId.value = lot.lotId;
  elInpGrossKg.value = lot.grossKg;
  elInpTareKg.value = lot.tareKg;
  elSelTeaType.value = lot.teaType;

  // Rejection display
  if (lot.disposition === "REJECTED") {
    elRejectReasonGroup.style.display = "block";
    if (lot.rejectionReason) elSelRejectReason.value = lot.rejectionReason;
  } else {
    elRejectReasonGroup.style.display = "none";
  }

  // Buffer indicator card
  if (buffer.isClear) {
    elBufferCard.className = "card buffer-indicator-card clear";
    elBufferSensorPill.className = "status-badge normal";
    elBufferSensorPill.textContent = "CLEAR (%I0.3)";
  } else {
    elBufferCard.className = "card buffer-indicator-card blocked";
    elBufferSensorPill.className = "status-badge fault";
    elBufferSensorPill.textContent = "BLOCKED (%I0.3)";
  }

  // Interlock badge & notice
  if (!buffer.isClear || interlock.interlockTripped) {
    elInterlockBadge.className = "status-badge fault";
    elInterlockBadge.textContent = "INTERLOCK TRIPPED";
    elInterlockNotice.classList.add("active");
  } else {
    elInterlockBadge.className = "status-badge normal";
    elInterlockBadge.textContent = "PERMISSIVE OK";
    elInterlockNotice.classList.remove("active");
  }

  // Input and button gating
  const isCompleted = lot.transferStatus === "COMPLETED";
  const isInTransit = lot.transferStatus === "IN_TRANSIT";
  const isLocked = isCompleted || isInTransit;

  elInpGrossKg.disabled = isLocked;
  elInpTareKg.disabled = isLocked;
  elInpVendorId.disabled = isLocked;
  elInpLotId.disabled = isLocked;
  elSelTeaType.disabled = isLocked;

  elBtnAcceptLot.disabled = isCompleted || lot.disposition === "ACCEPTED";
  elBtnRejectLot.disabled = isCompleted || lot.disposition === "REJECTED";
  elBtnJogTransfer.disabled = isCompleted || lot.disposition !== "ACCEPTED" || !buffer.isClear;
  elBtnAutoTransfer.disabled = isCompleted || lot.disposition !== "ACCEPTED" || !buffer.isClear;

  if (isCompleted && autoTransferTimer) {
    clearInterval(autoTransferTimer);
    autoTransferTimer = null;
    elBtnAutoTransfer.textContent = "▶ Auto Transfer (100%)";
  }

  // Transfer command & progress
  if (interlock.commandActive) {
    elValTransferCmd.textContent = "RUNNING (%Q0.0)";
    elValTransferCmd.style.color = "#15803d";
  } else {
    elValTransferCmd.textContent = "OFF (%Q0.0)";
    elValTransferCmd.style.color = "#475569";
  }

  elValInterlockState.textContent = lot.transferStatus;
  elProgressBar.style.width = `${interlock.progressPercent}%`;
  if (!buffer.isClear && interlock.progressPercent < 100) {
    elProgressBar.classList.add("blocked");
  } else {
    elProgressBar.classList.remove("blocked");
  }

  // PLC Registers
  elRegGross.textContent = Math.round(lot.grossKg * 10);
  elRegTare.textContent = Math.round(lot.tareKg * 10);
  elRegBufferClear.textContent = buffer.isClear ? "TRUE" : "FALSE";
  elRegBufferClearDesc.textContent = buffer.isClear ? "Hopper sensor clear" : "Hopper full / obstructed";
  elRegMotorRun.textContent = interlock.commandActive ? "TRUE" : "FALSE";
  elRegMotorRunDesc.textContent = interlock.commandActive ? "Drive energized (%Q0.0)" : "Contactor de-energized";
  elRegAlarmBeacon.textContent = (!buffer.isClear || interlock.interlockTripped) ? "TRUE" : "FALSE";
  elRegAlarmBeaconDesc.textContent = (!buffer.isClear || interlock.interlockTripped) ? "Interlock alarm active" : "Normal";

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

  // Dispatched table
  if (snapshot.history.length === 0) {
    elDispatchedTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No lots dispatched yet.</td></tr>';
  } else {
    elDispatchedTableBody.innerHTML = snapshot.history.map(item => `
      <tr>
        <td class="font-mono" style="font-weight:700;">${item.lotId}</td>
        <td>${item.vendorId}</td>
        <td><span class="status-badge ${item.teaType === "GOLDEN" ? "warning" : "normal"}">${item.teaType}</span></td>
        <td class="font-mono">${item.netKg.toFixed(2)}</td>
        <td class="font-mono" style="font-size:0.75rem;">${item.destination}</td>
        <td><span class="status-badge normal">DELIVERED</span></td>
      </tr>
    `).join("");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Event Listeners
elInpGrossKg.addEventListener("input", (e) => {
  engine.setGrossWeight(parseFloat(e.target.value) || 0);
  render();
});

elInpTareKg.addEventListener("input", (e) => {
  engine.setTareWeight(parseFloat(e.target.value) || 0);
  render();
});

elInpVendorId.addEventListener("input", (e) => {
  engine.activeLot.vendorId = e.target.value.trim();
  render();
});

elInpLotId.addEventListener("input", (e) => {
  engine.activeLot.lotId = e.target.value.trim();
  render();
});

elSelTeaType.addEventListener("change", (e) => {
  engine.activeLot.teaType = e.target.value;
  engine.destinationBuffer.targetStation = e.target.value === "GOLDEN" ? "WITHERING_TRAYS" : "DRUM_INFEED_HOPPER";
  render();
});

elBtnAcceptLot.addEventListener("click", () => {
  engine.acceptLot();
  render();
});

elBtnRejectLot.addEventListener("click", () => {
  const reason = elSelRejectReason.value || "HIGH_MOISTURE";
  engine.rejectLot(reason);
  render();
});

elSelRejectReason.addEventListener("change", (e) => {
  if (engine.activeLot.disposition === "REJECTED") {
    engine.activeLot.rejectionReason = e.target.value;
    render();
  }
});

elBtnToggleBuffer.addEventListener("click", () => {
  const newStatus = !engine.destinationBuffer.isClear;
  engine.setBufferClear(newStatus);
  if (autoTransferTimer) {
    clearInterval(autoTransferTimer);
    autoTransferTimer = null;
  }
  render();
});

elBtnJogTransfer.addEventListener("click", () => {
  engine.jogTransfer(25);
  render();
});

elBtnAutoTransfer.addEventListener("click", () => {
  if (autoTransferTimer) {
    clearInterval(autoTransferTimer);
    autoTransferTimer = null;
  }

  const startRes = engine.startTransfer();
  render();
  if (!startRes.success) return;

  autoTransferTimer = setInterval(() => {
    const res = engine.jogTransfer(15);
    render();
    if (!res.success || engine.transferInterlock.progressPercent >= 100) {
      clearInterval(autoTransferTimer);
      autoTransferTimer = null;
      render();
    }
  }, 300);
});

// Scenario selector buttons
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;
    if (SCENARIOS[scenarioKey]) {
      if (autoTransferTimer) {
        clearInterval(autoTransferTimer);
        autoTransferTimer = null;
      }
      engine.loadScenario(SCENARIOS[scenarioKey]);
      render();
    }
  });
});

// Reset Demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  if (autoTransferTimer) {
    clearInterval(autoTransferTimer);
    autoTransferTimer = null;
  }
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="DAY-40-NOMINAL"]')?.classList.add("active");
  engine.loadScenario(SCENARIOS["DAY-40-NOMINAL"]);
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["Timestamp", "VendorID", "LotID", "TeaType", "GrossKg", "TareKg", "NetKg", "Destination", "Status"];
  const rows = snapshot.history.map(h => [
    h.timestamp,
    h.vendorId,
    h.lotId,
    h.teaType,
    h.grossKg,
    h.tareKg,
    h.netKg,
    h.destination,
    h.status
  ]);
  if (rows.length === 0) {
    rows.push([
      new Date().toISOString(),
      snapshot.activeLot.vendorId,
      snapshot.activeLot.lotId,
      snapshot.activeLot.teaType,
      snapshot.activeLot.grossKg,
      snapshot.activeLot.tareKg,
      snapshot.activeLot.netKg,
      snapshot.destinationBuffer.targetStation,
      snapshot.activeLot.disposition
    ]);
  }
  exportToCsv(`leaf-intake-events-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`leaf-intake-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.loadScenario(SCENARIOS["DAY-40-NOMINAL"]);
render();
