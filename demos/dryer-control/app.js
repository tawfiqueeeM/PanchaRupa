import { DryerEngine } from "../../projects/dryer-control/js/dryer-engine.js";
import { exportToCsv, exportToJson } from "../../shared/js/ui-utils.js";

const SCENARIOS = {
  "DRY-NORMAL": {
    scenarioId: "DRY-NORMAL",
    description: "Nominal Drying (95°C SP)",
    setpoint: 95.0,
    fanProof: true
  },
  "DRY-FAULT": {
    scenarioId: "DRY-FAULT",
    description: "Fan Proof Trip & 3-Phase Safety Reset",
    setpoint: 95.0,
    fanProof: false
  }
};

const engine = new DryerEngine();

// DOM elements
const elLblBatchId = document.getElementById("lblBatchId");
const elLblBatchElapsed = document.getElementById("lblBatchElapsed");
const elLblFanProofStatus = document.getElementById("lblFanProofStatus");
const elBadgeHeaterLoop = document.getElementById("badgeHeaterLoop");

const elReadoutTempPV = document.getElementById("readoutTempPV");
const elReadoutTempSP = document.getElementById("readoutTempSP");
const elReadoutHeatPercent = document.getElementById("readoutHeatPercent");
const elHeatMeterFill = document.getElementById("heatMeterFill");
const elInterlockAlertBox = document.getElementById("interlockAlertBox");

const elInpSetpoint = document.getElementById("inpSetpoint");
const elLblSetpointVal = document.getElementById("lblSetpointVal");
const elBtnStartBatch = document.getElementById("btnStartBatch");
const elBtnStepTime = document.getElementById("btnStepTime");

const elBtnInjectFanLoss = document.getElementById("btnInjectFanLoss");
const elBtnRestoreFanProof = document.getElementById("btnRestoreFanProof");
const elBtnAckAlarm = document.getElementById("btnAckAlarm");
const elBtnDeliberateRestart = document.getElementById("btnDeliberateRestart");

const elTrendTableBody = document.getElementById("trendTableBody");
const elEventLogContainer = document.getElementById("eventLogContainer");

function render() {
  const snapshot = engine.getSnapshot();

  // Header & summary
  elLblBatchId.textContent = snapshot.batchId;
  elLblBatchElapsed.textContent = `${snapshot.batchElapsedMin.toFixed(0)} min / 60 min`;
  
  if (snapshot.fanProof) {
    elLblFanProofStatus.textContent = "HEALTHY (%I3.0)";
    elLblFanProofStatus.style.color = "#15803d";
  } else {
    elLblFanProofStatus.textContent = "TRIPPED (%I3.0 LOSS)";
    elLblFanProofStatus.style.color = "#dc2626";
  }

  // Hero readouts
  elReadoutTempPV.textContent = `${snapshot.measuredTempC.toFixed(1)}°C`;
  elReadoutTempSP.textContent = `${snapshot.setpointC.toFixed(1)}°C`;
  elReadoutHeatPercent.textContent = `${snapshot.heatCommandPercent.toFixed(1)}%`;
  elHeatMeterFill.style.width = `${snapshot.heatCommandPercent}%`;

  elInpSetpoint.value = snapshot.setpointC;
  elLblSetpointVal.textContent = `${snapshot.setpointC.toFixed(1)}°C`;

  // Status badges & alert
  if (snapshot.alarmLatched) {
    elReadoutTempPV.className = "temp-big-val tripped";
    elBadgeHeaterLoop.className = "status-badge fault";
    elBadgeHeaterLoop.textContent = snapshot.alarmAcked ? "ALARM ACKED (WAITING RESTART)" : "SAFETY TRIP (SIREN ACTIVE)";
    elInterlockAlertBox.classList.add("active");
  } else if (snapshot.heatEnabled) {
    elReadoutTempPV.className = "temp-big-val heating";
    elBadgeHeaterLoop.className = "status-badge running";
    elBadgeHeaterLoop.textContent = "HEATING ACTIVE";
    elInterlockAlertBox.classList.remove("active");
  } else if (snapshot.batchComplete) {
    elReadoutTempPV.className = "temp-big-val";
    elBadgeHeaterLoop.className = "status-badge normal";
    elBadgeHeaterLoop.textContent = "BATCH COMPLETE (COOLING)";
    elInterlockAlertBox.classList.remove("active");
  } else {
    elReadoutTempPV.className = "temp-big-val";
    elBadgeHeaterLoop.className = "status-badge idle";
    elBadgeHeaterLoop.textContent = "STANDBY";
    elInterlockAlertBox.classList.remove("active");
  }

  // Trend Table
  const recentTrends = snapshot.trendHistory.slice(-10).reverse();
  elTrendTableBody.innerHTML = recentTrends.map(t => `
    <tr>
      <td class="font-mono">${t.minute.toFixed(1)} m</td>
      <td class="font-mono">${t.setpointC.toFixed(1)}°C</td>
      <td class="font-mono" style="font-weight:700;">${t.measuredTempC.toFixed(1)}°C</td>
      <td class="font-mono">${t.heatCommandPercent.toFixed(1)}%</td>
      <td><span class="status-badge ${t.fanProof ? "normal" : "fault"}">${t.fanProof ? "OK" : "LOSS"}</span></td>
      <td><span class="status-badge ${t.alarmLatched ? "fault" : "normal"}">${t.alarmLatched ? "LATCHED" : "CLEAR"}</span></td>
    </tr>
  `).join("");

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
elInpSetpoint.addEventListener("input", (e) => {
  engine.setSetpoint(parseFloat(e.target.value));
  render();
});

elBtnStartBatch.addEventListener("click", () => {
  engine.startBatch();
  render();
});

elBtnStepTime.addEventListener("click", () => {
  engine.stepTime(2.0);
  render();
});

elBtnInjectFanLoss.addEventListener("click", () => {
  engine.setFanProof(false);
  render();
});

elBtnRestoreFanProof.addEventListener("click", () => {
  engine.setFanProof(true);
  render();
});

elBtnAckAlarm.addEventListener("click", () => {
  engine.acknowledgeAlarm();
  render();
});

elBtnDeliberateRestart.addEventListener("click", () => {
  engine.deliberateRestart();
  render();
});

// Scenario pill selector
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;
    if (SCENARIOS[scenarioKey]) {
      engine.reset();
      engine.setSetpoint(SCENARIOS[scenarioKey].setpoint);
      if (scenarioKey === "DRY-FAULT") {
        engine.startBatch();
        for (let i = 0; i < 5; i++) engine.stepTime(1.0);
        engine.setFanProof(false);
      }
      render();
    }
  });
});

// Reset Demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="DRY-NORMAL"]')?.classList.add("active");
  engine.reset();
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["ElapsedMin", "SetpointC", "MeasuredTempC", "HeatCommandPercent", "FanProof", "AlarmLatched", "AlarmAcked"];
  const rows = snapshot.trendHistory.map(t => [
    t.minute, t.setpointC, t.measuredTempC, t.heatCommandPercent, t.fanProof, t.alarmLatched, t.alarmAcked
  ]);
  exportToCsv(`dryer-trends-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`dryer-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.reset();
render();
