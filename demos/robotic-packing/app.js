import { RoboticPackingEngine, FORMAT_CONFIGS } from "../../projects/robotic-packing/js/robotic-packing-engine.js";
import { exportToCsv, exportToJson } from "../../shared/js/ui-utils.js";

const SCENARIOS = {
  "NOMINAL-50G-CARTON": {
    scenarioId: "NOMINAL-50G-CARTON",
    description: "Nominal 50g Retail Carton Run (12 bottles)",
    formatId: "FORMAT_50G"
  },
  "NOMINAL-100G-CARTON": {
    scenarioId: "NOMINAL-100G-CARTON",
    description: "Nominal 100g Retail Carton Run (6 bottles)",
    formatId: "FORMAT_100G"
  },
  "INTERRUPTED-PICK-FAULT": {
    scenarioId: "INTERRUPTED-PICK-FAULT",
    description: "Vacuum loss fault during pick transit",
    formatId: "FORMAT_50G",
    injectFault: true
  }
};

const engine = new RoboticPackingEngine();

// DOM elements
const elLblCellState = document.getElementById("lblCellState");
const elLblFormatName = document.getElementById("lblFormatName");
const elLblCartonsCompleted = document.getElementById("lblCartonsCompleted");
const elBadgeRobotReady = document.getElementById("badgeRobotReady");

const elValArmMotion = document.getElementById("valArmMotion");
const elValVacuumStatus = document.getElementById("valVacuumStatus");
const elRegConveyorRun = document.getElementById("regConveyorRun");
const elRegBottleDatum = document.getElementById("regBottleDatum");
const elRegTriggerPick = document.getElementById("regTriggerPick");
const elRegGripperFault = document.getElementById("regGripperFault");
const elInterruptedAlert = document.getElementById("interruptedAlert");

const elLblCartonPocketProgress = document.getElementById("lblCartonPocketProgress");
const elBadgeCartonStatus = document.getElementById("badgeCartonStatus");
const elCartonGridVisual = document.getElementById("cartonGridVisual");
const elLblPurgedCount = document.getElementById("lblPurgedCount");

const elSelFormat = document.getElementById("selFormat");
const elBtnStepPick = document.getElementById("btnStepPick");
const elBtnAutoPack = document.getElementById("btnAutoPack");
const elBtnInjectInterruption = document.getElementById("btnInjectInterruption");
const elBtnRecoverPurge = document.getElementById("btnRecoverPurge");

const elValBottlesProcessed = document.getElementById("valBottlesProcessed");
const elValCartonsCompleted = document.getElementById("valCartonsCompleted");
const elValBottlesPurged = document.getElementById("valBottlesPurged");
const elCartonsTableBody = document.getElementById("cartonsTableBody");
const elEventLogContainer = document.getElementById("eventLogContainer");

let autoPackTimer = null;

function render() {
  const snapshot = engine.getSnapshot();
  const counts = snapshot.counts;
  const fmt = snapshot.format;

  // Header & summary
  elLblCellState.textContent = snapshot.armState;
  elLblFormatName.textContent = `${fmt.name} (${fmt.bottlesPerCarton} pk)`;
  elLblCartonsCompleted.textContent = counts.cartonsCompleted;

  // Arm & Handshake
  elValArmMotion.textContent = snapshot.armState;
  if (snapshot.armState === "INTERRUPTED_HOLD") {
    elBadgeRobotReady.className = "status-badge fault";
    elBadgeRobotReady.textContent = "FAULT HOLD (%I5.4)";
    elInterruptedAlert.classList.add("active");
    elValVacuumStatus.textContent = "VACUUM LOSS (%I5.4)";
    elValVacuumStatus.style.color = "#ef4444";
    elRegGripperFault.textContent = "TRUE";
    elRegConveyorRun.textContent = "FALSE";
  } else {
    elBadgeRobotReady.className = "status-badge normal";
    elBadgeRobotReady.textContent = "READY (%I5.0)";
    elInterruptedAlert.classList.remove("active");
    elValVacuumStatus.textContent = snapshot.armState === "GRIPPING" || snapshot.armState === "TRANSIT" ? "VACUUM ON (%I5.2)" : "IDLE";
    elValVacuumStatus.style.color = snapshot.armState === "GRIPPING" || snapshot.armState === "TRANSIT" ? "#4ade80" : "#94a3b8";
    elRegGripperFault.textContent = "FALSE";
    elRegConveyorRun.textContent = snapshot.armState === "INDEXING" ? "TRUE" : "FALSE";
  }

  elRegBottleDatum.textContent = snapshot.armState === "INDEXING" || snapshot.armState === "GRIPPING" ? "TRUE" : "FALSE";
  elRegTriggerPick.textContent = snapshot.armState === "GRIPPING" ? "TRUE" : "FALSE";

  // Carton Grid
  elCartonGridVisual.className = `carton-grid-visual ${fmt.formatId === "FORMAT_50G" ? "cols-4" : "cols-3"}`;
  elLblCartonPocketProgress.textContent = `(${counts.bottlesInCurrentCarton} / ${fmt.bottlesPerCarton} bottles)`;
  elBadgeCartonStatus.textContent = counts.bottlesInCurrentCarton >= fmt.bottlesPerCarton ? "FULL / DISCHARGING" : "FILLING";

  elCartonGridVisual.innerHTML = snapshot.cartonSlots.map(slot => `
    <div class="carton-pocket ${slot.filled ? "filled" : ""}">
      <span style="font-size:1.1rem;">${slot.filled ? "🍾" : "🔲"}</span>
      <span>P-${slot.slotIndex}</span>
      <span style="font-size:0.65rem;">${slot.filled ? slot.bottleId : "Empty"}</span>
    </div>
  `).join("");

  elLblPurgedCount.textContent = `${counts.bottlesPurged} bottles`;

  // Counts grid
  elValBottlesProcessed.textContent = counts.bottlesProcessed;
  elValCartonsCompleted.textContent = counts.cartonsCompleted;
  elValBottlesPurged.textContent = counts.bottlesPurged;

  // Format sync
  elSelFormat.value = fmt.formatId;

  // Completed cartons table
  if (snapshot.completedCartons.length === 0) {
    elCartonsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted);">No sealed cartons yet.</td></tr>';
  } else {
    elCartonsTableBody.innerHTML = snapshot.completedCartons.map(c => `
      <tr>
        <td class="font-mono" style="font-weight:700;">${c.cartonId}</td>
        <td>${c.formatId}</td>
        <td class="font-mono" style="color:#15803d; font-weight:700;">${c.bottlesPacked} bottles</td>
        <td><span class="status-badge ${c.status === "SEALED_AND_DISPATCHED" ? "normal" : "alarm"}">${c.status === "SEALED_AND_DISPATCHED" ? "SEALED" : "REWORK"}</span></td>
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
  engine.switchFormat(e.target.value);
  render();
});

elBtnStepPick.addEventListener("click", () => {
  engine.stepCycle();
  render();
});

elBtnAutoPack.addEventListener("click", () => {
  if (autoPackTimer) {
    clearInterval(autoPackTimer);
    autoPackTimer = null;
    elBtnAutoPack.textContent = "⏩ Auto-Pack Carton";
    return;
  }

  elBtnAutoPack.textContent = "⏸️ Pause Auto-Pack";
  autoPackTimer = setInterval(() => {
    const res = engine.stepCycle();
    render();
    if (!res.success || engine.armState === "INTERRUPTED_HOLD") {
      clearInterval(autoPackTimer);
      autoPackTimer = null;
      elBtnAutoPack.textContent = "⏩ Auto-Pack Carton";
    }
  }, 600);
});

elBtnInjectInterruption.addEventListener("click", () => {
  engine.injectInterruption();
  render();
});

elBtnRecoverPurge.addEventListener("click", () => {
  engine.executeRecoveryPurge();
  render();
});

// Scenario pill selector
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;
    if (SCENARIOS[scenarioKey]) {
      if (autoPackTimer) {
        clearInterval(autoPackTimer);
        autoPackTimer = null;
        elBtnAutoPack.textContent = "⏩ Auto-Pack Carton";
      }
      engine.reset();
      engine.switchFormat(SCENARIOS[scenarioKey].formatId);
      if (SCENARIOS[scenarioKey].injectFault) {
        engine.injectInterruption();
      }
      render();
    }
  });
});

// Reset Demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  if (autoPackTimer) {
    clearInterval(autoPackTimer);
    autoPackTimer = null;
    elBtnAutoPack.textContent = "⏩ Auto-Pack Carton";
  }
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="NOMINAL-50G-CARTON"]')?.classList.add("active");
  engine.reset();
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["Timestamp", "CartonID", "Format", "BottlesPacked", "Status"];
  const rows = snapshot.completedCartons.map(c => [
    c.timestamp, c.cartonId, c.formatId, c.bottlesPacked, c.status
  ]);
  if (rows.length === 0) {
    rows.push([
      new Date().toISOString(), "CTN-IN-PROCESS", snapshot.format.formatId, snapshot.counts.bottlesInCurrentCarton, "PACKING_IN_PROGRESS"
    ]);
  }
  exportToCsv(`robotic-cartons-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`robotic-packing-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.reset();
render();
