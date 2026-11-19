import { GreenTeaEngine, DEFAULT_RECIPES } from "../../projects/green-tea-sequence/js/green-tea-engine.js";
import { exportToCsv, exportToJson, formatKg } from "../../shared/js/ui-utils.js";

const SCENARIOS = {
  "NOMINAL-DAY-40": {
    scenarioId: "NOMINAL-DAY-40",
    description: "Nominal Day-40 Green Tea Batch (B-G01, 120 kg -> 30 kg)",
    batchId: "B-G01",
    recipeId: "GT-STD-01",
    freshLeafKg: 120.0,
    rollerInitiallyAvailable: true,
    dryerInitiallyAvailable: true
  },
  "ROLLER-CONTENTION": {
    scenarioId: "ROLLER-CONTENTION",
    description: "Drum completes but Roller is busy with Golden Tea Batch B-O01",
    batchId: "B-G01",
    recipeId: "GT-STD-01",
    freshLeafKg: 120.0,
    rollerInitiallyAvailable: false,
    rollerBlockReason: "Roller occupied by Golden Tea Batch B-O01",
    dryerInitiallyAvailable: true
  },
  "DRYER-CONTENTION": {
    scenarioId: "DRYER-CONTENTION",
    description: "Rolling completes but Final Dryer is reserved for Golden Tea batch",
    batchId: "B-G01",
    recipeId: "GT-STD-01",
    freshLeafKg: 120.0,
    rollerInitiallyAvailable: true,
    dryerInitiallyAvailable: false,
    dryerBlockReason: "Dryer reserved for Golden Tea Batch B-O01"
  }
};

const engine = new GreenTeaEngine();

// DOM elements
const elLblActiveBatch = document.getElementById("lblActiveBatch");
const elLblLineState = document.getElementById("lblLineState");
const elLblTotalFinished = document.getElementById("lblTotalFinished");
const elPipelineOverallBadge = document.getElementById("pipelineOverallBadge");

const elNodeDrum = document.getElementById("nodeDrum");
const elBadgeDrum = document.getElementById("badgeDrum");
const elValDrumTemp = document.getElementById("valDrumTemp");
const elValDrumCycle = document.getElementById("valDrumCycle");
const elLblDrumOccupant = document.getElementById("lblDrumOccupant");

const elNodeRoller = document.getElementById("nodeRoller");
const elBadgeRoller = document.getElementById("badgeRoller");
const elValRollerStatus = document.getElementById("valRollerStatus");
const elValRollerCycle = document.getElementById("valRollerCycle");
const elLblRollerOccupant = document.getElementById("lblRollerOccupant");
const elBtnToggleRoller = document.getElementById("btnToggleRoller");

const elNodeDryer = document.getElementById("nodeDryer");
const elBadgeDryer = document.getElementById("badgeDryer");
const elValDryerTemp = document.getElementById("valDryerTemp");
const elValDryerCycle = document.getElementById("valDryerCycle");
const elLblDryerOccupant = document.getElementById("lblDryerOccupant");
const elBtnToggleDryer = document.getElementById("btnToggleDryer");

const elValReleasedTotal = document.getElementById("valReleasedTotal");
const elWaitingCallout = document.getElementById("waitingCallout");
const elWaitingCalloutMsg = document.getElementById("waitingCalloutMsg");

const elBadgeActiveStage = document.getElementById("badgeActiveStage");
const elSelRecipe = document.getElementById("selRecipe");
const elInpBatchId = document.getElementById("inpBatchId");
const elInpFreshKg = document.getElementById("inpFreshKg");
const elValExpectedOutput = document.getElementById("valExpectedOutput");
const elValElapsedTime = document.getElementById("valElapsedTime");

const elBtnStepLine = document.getElementById("btnStepLine");
const elBtnAutoRun = document.getElementById("btnAutoRun");
const elEventLogContainer = document.getElementById("eventLogContainer");
const elCompletedTableBody = document.getElementById("completedTableBody");

let autoRunTimer = null;

function render() {
  const snapshot = engine.getSnapshot();
  const batch = snapshot.activeBatch;
  const recipe = snapshot.selectedRecipe;
  const stations = snapshot.stations;

  // Header & summary
  elLblActiveBatch.textContent = batch.batchId;
  elLblLineState.textContent = batch.currentStage;
  elLblTotalFinished.textContent = formatKg(snapshot.totalFinishedKg);
  elValReleasedTotal.textContent = formatKg(snapshot.totalFinishedKg);
  elBadgeActiveStage.textContent = batch.currentStage;

  // Drum station node
  elValDrumTemp.textContent = `${recipe.drumTempC}°C`;
  elValDrumCycle.textContent = `${recipe.drumDurationMin}m`;
  elBadgeDrum.textContent = stations.drum.status;
  elLblDrumOccupant.textContent = `Occupant: ${stations.drum.occupiedBy || "None"}`;

  if (batch.currentStage === "DRUM") {
    elNodeDrum.className = "station-node active";
    elBadgeDrum.className = "status-badge running";
  } else if (stations.drum.status === "COMPLETE") {
    elNodeDrum.className = "station-node";
    elBadgeDrum.className = "status-badge normal";
  } else {
    elNodeDrum.className = "station-node";
    elBadgeDrum.className = "status-badge idle";
  }

  // Roller station node
  elValRollerCycle.textContent = `${recipe.rollerDurationMin}m`;
  elLblRollerOccupant.textContent = `Occupant: ${stations.roller.occupiedBy || "None"}`;

  if (!stations.roller.isAvailable) {
    elNodeRoller.className = "station-node locked";
    elBadgeRoller.className = "status-badge fault";
    elBadgeRoller.textContent = "LOCKED (%I1.0)";
    elValRollerStatus.textContent = "BLOCKED";
  } else if (batch.currentStage === "ROLLER") {
    elNodeRoller.className = "station-node active";
    elBadgeRoller.className = "status-badge running";
    elBadgeRoller.textContent = "RUNNING";
    elValRollerStatus.textContent = "RUNNING";
  } else {
    elNodeRoller.className = "station-node";
    elBadgeRoller.className = "status-badge normal";
    elBadgeRoller.textContent = "AVAILABLE";
    elValRollerStatus.textContent = "READY";
  }

  // Dryer station node
  elValDryerTemp.textContent = `${recipe.dryerTempC}°C`;
  elValDryerCycle.textContent = `${recipe.dryerDurationMin}m`;
  elLblDryerOccupant.textContent = `Occupant: ${stations.dryer.occupiedBy || "None"}`;

  if (!stations.dryer.isAvailable) {
    elNodeDryer.className = "station-node locked";
    elBadgeDryer.className = "status-badge fault";
    elBadgeDryer.textContent = "RESERVED (%I2.0)";
  } else if (batch.currentStage === "DRYER") {
    elNodeDryer.className = "station-node active";
    elBadgeDryer.className = "status-badge running";
    elBadgeDryer.textContent = "RUNNING";
  } else {
    elNodeDryer.className = "station-node";
    elBadgeDryer.className = "status-badge normal";
    elBadgeDryer.textContent = "AVAILABLE";
  }

  // Waiting callout
  if (batch.waitingReason) {
    elWaitingCallout.classList.add("active");
    elWaitingCalloutMsg.textContent = `Batch ${batch.batchId} held: ${batch.waitingReason}`;
    if (batch.currentStage === "WAITING_FOR_ROLLER") elNodeDrum.className = "station-node waiting";
    if (batch.currentStage === "WAITING_FOR_DRYER") elNodeRoller.className = "station-node waiting";
  } else {
    elWaitingCallout.classList.remove("active");
  }

  // Overall status
  if (batch.currentStage === "COMPLETED") {
    elPipelineOverallBadge.className = "status-badge normal";
    elPipelineOverallBadge.textContent = "BATCH COMPLETE";
  } else if (batch.currentStage.startsWith("WAITING")) {
    elPipelineOverallBadge.className = "status-badge warning";
    elPipelineOverallBadge.textContent = "INTERLOCK HOLD";
  } else if (batch.currentStage !== "IDLE") {
    elPipelineOverallBadge.className = "status-badge running";
    elPipelineOverallBadge.textContent = "PROCESSING";
  } else {
    elPipelineOverallBadge.className = "status-badge idle";
    elPipelineOverallBadge.textContent = "STANDBY";
  }

  // Controls sync
  elSelRecipe.value = recipe.recipeId;
  elInpBatchId.value = batch.batchId;
  elInpFreshKg.value = batch.freshLeafKg;
  elValExpectedOutput.textContent = formatKg(batch.expectedOutputKg);
  elValElapsedTime.textContent = `${batch.totalElapsedMin} min`;

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

  // Completed batches table
  if (snapshot.completedBatches.length === 0) {
    elCompletedTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No batches released yet.</td></tr>';
  } else {
    elCompletedTableBody.innerHTML = snapshot.completedBatches.map(b => `
      <tr>
        <td class="font-mono" style="font-weight:700;">${b.batchId}</td>
        <td>${b.productName}</td>
        <td class="font-mono">${b.freshLeafKg.toFixed(1)}</td>
        <td class="font-mono" style="color:#15803d; font-weight:700;">${b.finishedKg.toFixed(2)}</td>
        <td class="font-mono">${b.totalDurationMin} min</td>
        <td><span class="status-badge normal">${b.status}</span></td>
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
elSelRecipe.addEventListener("change", (e) => {
  engine.selectRecipe(e.target.value);
  render();
});

elInpBatchId.addEventListener("input", (e) => {
  engine.activeBatch.batchId = e.target.value.trim();
  render();
});

elInpFreshKg.addEventListener("input", (e) => {
  const kg = parseFloat(e.target.value) || 0;
  engine.activeBatch.freshLeafKg = kg;
  engine.activeBatch.expectedOutputKg = Math.round(kg * engine.selectedRecipe.yieldFraction * 100) / 100;
  render();
});

elBtnToggleRoller.addEventListener("click", () => {
  const newState = !engine.stations.roller.isAvailable;
  engine.setRollerAvailable(newState, "Roller locked for maintenance / Golden Tea");
  render();
});

elBtnToggleDryer.addEventListener("click", () => {
  const newState = !engine.stations.dryer.isAvailable;
  engine.setDryerAvailable(newState, "Dryer locked / reserved");
  render();
});

elBtnStepLine.addEventListener("click", () => {
  engine.stepLine();
  render();
});

elBtnAutoRun.addEventListener("click", () => {
  if (autoRunTimer) {
    clearInterval(autoRunTimer);
    autoRunTimer = null;
    elBtnAutoRun.textContent = "▶️ Auto-Run Sequence";
    return;
  }

  elBtnAutoRun.textContent = "⏹️ Pause Auto-Run";
  autoRunTimer = setInterval(() => {
    const stepped = engine.stepLine();
    render();
    if (!stepped || engine.activeBatch.currentStage === "COMPLETED" || engine.activeBatch.currentStage.startsWith("WAITING")) {
      clearInterval(autoRunTimer);
      autoRunTimer = null;
      elBtnAutoRun.textContent = "▶️ Auto-Run Sequence";
    }
  }, 1000);
});

// Scenario pill switches
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;
    if (SCENARIOS[scenarioKey]) {
      if (autoRunTimer) {
        clearInterval(autoRunTimer);
        autoRunTimer = null;
        elBtnAutoRun.textContent = "▶️ Auto-Run Sequence";
      }
      engine.loadScenario(SCENARIOS[scenarioKey]);
      render();
    }
  });
});

// Reset Demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  if (autoRunTimer) {
    clearInterval(autoRunTimer);
    autoRunTimer = null;
    elBtnAutoRun.textContent = "▶️ Auto-Run Sequence";
  }
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="NOMINAL-DAY-40"]')?.classList.add("active");
  engine.loadScenario(SCENARIOS["NOMINAL-DAY-40"]);
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["Timestamp", "BatchID", "Recipe", "FreshKg", "FinishedKg", "DurationMin", "Status"];
  const rows = snapshot.completedBatches.map(b => [
    b.timestamp,
    b.batchId,
    b.recipeId,
    b.freshLeafKg,
    b.finishedKg,
    b.totalDurationMin,
    b.status
  ]);
  if (rows.length === 0) {
    rows.push([
      new Date().toISOString(),
      snapshot.activeBatch.batchId,
      snapshot.activeBatch.recipeId,
      snapshot.activeBatch.freshLeafKg,
      snapshot.activeBatch.expectedOutputKg,
      snapshot.activeBatch.totalElapsedMin,
      snapshot.activeBatch.currentStage
    ]);
  }
  exportToCsv(`green-tea-batches-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`green-tea-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.loadScenario(SCENARIOS["NOMINAL-DAY-40"]);
render();
