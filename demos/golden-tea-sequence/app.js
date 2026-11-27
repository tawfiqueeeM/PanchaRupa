import { GoldenTeaEngine } from "../../projects/golden-tea-sequence/js/golden-tea-engine.js";
import { exportToCsv, exportToJson, formatKg } from "../../shared/js/ui-utils.js";

const SCENARIOS = {
  "NOMINAL-DAY-40-GOLDEN": {
    scenarioId: "NOMINAL-DAY-40-GOLDEN",
    description: "Nominal Day-40 Golden Tea Batch (B-O01, 40 kg -> 10 kg)",
    batchId: "B-O01",
    lotId: "L-O01",
    freshKg: 40.0,
    leafEligible: true,
    profileId: "OX-MED-02",
    dryerInitialState: "FREE"
  },
  "INELIGIBLE-LEAF-FAULT": {
    scenarioId: "INELIGIBLE-LEAF-FAULT",
    description: "Ineligible Leaf Rejection (Coarse green leaf)",
    batchId: "B-O02",
    lotId: "L-G09",
    freshKg: 40.0,
    leafEligible: false,
    profileId: "OX-MED-02",
    dryerInitialState: "FREE"
  },
  "DRYER-SHARED-CONTENTION": {
    scenarioId: "DRYER-SHARED-CONTENTION",
    description: "Shared Dryer occupied by Green Tea Batch B-G01",
    batchId: "B-O01",
    lotId: "L-O01",
    freshKg: 40.0,
    leafEligible: true,
    profileId: "OX-MED-02",
    dryerInitialState: "BUSY_GREEN",
    dryerOwner: "B-G01"
  }
};

const engine = new GoldenTeaEngine();

// DOM elements
const elLblActiveBatch = document.getElementById("lblActiveBatch");
const elLblEligibilityStatus = document.getElementById("lblEligibilityStatus");
const elLblStageState = document.getElementById("lblStageState");
const elPipelineOverallBadge = document.getElementById("pipelineOverallBadge");

const elNodeWithering = document.getElementById("nodeWithering");
const elBadgeWithering = document.getElementById("badgeWithering");
const elValWitheringStatus = document.getElementById("valWitheringStatus");

const elNodeRoller = document.getElementById("nodeRoller");
const elBadgeRoller = document.getElementById("badgeRoller");
const elValRollerStatus = document.getElementById("valRollerStatus");

const elNodeOxidation = document.getElementById("nodeOxidation");
const elBadgeOxidation = document.getElementById("badgeOxidation");
const elValOxidationLiquor = document.getElementById("valOxidationLiquor");

const elNodeDryer = document.getElementById("nodeDryer");
const elBadgeDryer = document.getElementById("badgeDryer");
const elValDryerOwner = document.getElementById("valDryerOwner");

const elValReleasedGolden = document.getElementById("valReleasedGolden");
const elWaitingCallout = document.getElementById("waitingCallout");
const elWaitingCalloutMsg = document.getElementById("waitingCalloutMsg");

const elInpBatchId = document.getElementById("inpBatchId");
const elInpFreshKg = document.getElementById("inpFreshKg");
const elSelProfile = document.getElementById("selProfile");
const elBtnToggleEligibility = document.getElementById("btnToggleEligibility");
const elEligibilityErrorBanner = document.getElementById("eligibilityErrorBanner");

const elDryerLockCard = document.getElementById("dryerLockCard");
const elDryerStatePill = document.getElementById("dryerStatePill");
const elBadgeLockStatus = document.getElementById("badgeLockStatus");
const elLblDryerLockDesc = document.getElementById("lblDryerLockDesc");
const elBtnToggleGreenLock = document.getElementById("btnToggleGreenLock");

const elBtnStepLine = document.getElementById("btnStepLine");
const elBtnAutoRun = document.getElementById("btnAutoRun");
const elEventLogContainer = document.getElementById("eventLogContainer");

let autoRunTimer = null;

function render() {
  const snapshot = engine.getSnapshot();
  const batch = snapshot.activeBatch;
  const profile = snapshot.selectedProfile;
  const dryer = snapshot.sharedDryer;

  // Header & summary
  elLblActiveBatch.textContent = batch.batchId;
  elLblStageState.textContent = batch.currentStage;
  elValReleasedGolden.textContent = formatKg(snapshot.totalFinishedGoldenKg);

  if (batch.isLeafEligible) {
    elLblEligibilityStatus.textContent = "ELIGIBLE";
    elLblEligibilityStatus.style.color = "#15803d";
    elEligibilityErrorBanner.classList.remove("active");
  } else {
    elLblEligibilityStatus.textContent = "INELIGIBLE";
    elLblEligibilityStatus.style.color = "#dc2626";
    elEligibilityErrorBanner.classList.add("active");
  }

  // Withering Node
  if (batch.currentStage === "WITHERING") {
    elNodeWithering.className = "station-node active";
    elBadgeWithering.className = "status-badge running";
    elBadgeWithering.textContent = "ACTIVE";
    elValWitheringStatus.textContent = "WITHERING (120m)";
  } else if (batch.currentStage !== "IDLE") {
    elNodeWithering.className = "station-node";
    elBadgeWithering.className = "status-badge normal";
    elBadgeWithering.textContent = "COMPLETE";
    elValWitheringStatus.textContent = "DONE";
  } else {
    elNodeWithering.className = "station-node";
    elBadgeWithering.className = "status-badge idle";
    elBadgeWithering.textContent = "IDLE";
    elValWitheringStatus.textContent = "STANDBY";
  }

  // Roller Node
  if (batch.currentStage === "ROLLER") {
    elNodeRoller.className = "station-node active";
    elBadgeRoller.className = "status-badge running";
    elBadgeRoller.textContent = "ACTIVE";
    elValRollerStatus.textContent = "ROLLING (30m)";
  } else if (batch.currentStage === "OXIDATION" || batch.currentStage === "DRYER" || batch.currentStage === "COMPLETED" || batch.currentStage === "WAITING_FOR_DRYER") {
    elNodeRoller.className = "station-node";
    elBadgeRoller.className = "status-badge normal";
    elBadgeRoller.textContent = "COMPLETE";
    elValRollerStatus.textContent = "DONE";
  } else {
    elNodeRoller.className = "station-node";
    elBadgeRoller.className = "status-badge idle";
    elBadgeRoller.textContent = "IDLE";
    elValRollerStatus.textContent = "STANDBY";
  }

  // Oxidation Node
  elValOxidationLiquor.textContent = profile.liquorColor;
  if (batch.currentStage === "OXIDATION") {
    elNodeOxidation.className = "station-node active";
    elBadgeOxidation.className = "status-badge running";
    elBadgeOxidation.textContent = "ACTIVE";
  } else if (batch.currentStage === "WAITING_FOR_DRYER") {
    elNodeOxidation.className = "station-node waiting";
    elBadgeOxidation.className = "status-badge warning";
    elBadgeOxidation.textContent = "HOLDING";
  } else if (batch.currentStage === "DRYER" || batch.currentStage === "COMPLETED") {
    elNodeOxidation.className = "station-node";
    elBadgeOxidation.className = "status-badge normal";
    elBadgeOxidation.textContent = "COMPLETE";
  } else {
    elNodeOxidation.className = "station-node";
    elBadgeOxidation.className = "status-badge idle";
    elBadgeOxidation.textContent = "IDLE";
  }

  // Dryer Node & Lock Card
  elValDryerOwner.textContent = dryer.ownerBatchId || "None";
  if (dryer.state === "FREE") {
    elNodeDryer.className = "station-node";
    elBadgeDryer.className = "status-badge normal";
    elBadgeDryer.textContent = "FREE";

    elDryerLockCard.className = "dryer-lock-card";
    elDryerStatePill.className = "status-badge normal";
    elDryerStatePill.textContent = "DRYER FREE";
    elBadgeLockStatus.className = "status-badge normal";
    elBadgeLockStatus.textContent = "UNLOCKED";
    elLblDryerLockDesc.textContent = "Shared dryer is idle and available for reservation.";
    elBtnToggleGreenLock.textContent = "Lock Dryer with Green B-G01";
  } else if (dryer.state === "BUSY_GREEN") {
    elNodeDryer.className = "station-node locked";
    elBadgeDryer.className = "status-badge fault";
    elBadgeDryer.textContent = "BUSY (GREEN)";

    elDryerLockCard.className = "dryer-lock-card busy-green";
    elDryerStatePill.className = "status-badge fault";
    elDryerStatePill.textContent = "SEIZED BY GREEN B-G01";
    elBadgeLockStatus.className = "status-badge fault";
    elBadgeLockStatus.textContent = "LOCKED";
    elLblDryerLockDesc.textContent = "Occupied by Green Tea Batch B-G01. Golden tea transfer locked out.";
    elBtnToggleGreenLock.textContent = "Release Green B-G01 Lock";
  } else if (dryer.state === "BUSY_GOLDEN") {
    elNodeDryer.className = "station-node active";
    elBadgeDryer.className = "status-badge running";
    elBadgeDryer.textContent = "DRYING (GOLDEN)";

    elDryerLockCard.className = "dryer-lock-card busy-golden";
    elDryerStatePill.className = "status-badge running";
    elDryerStatePill.textContent = "OWNED BY B-O01";
    elBadgeLockStatus.className = "status-badge running";
    elBadgeLockStatus.textContent = "ACTIVE";
    elLblDryerLockDesc.textContent = "Currently drying Golden Tea batch B-O01. Green tea locked out.";
  }

  // Waiting reason callout
  if (batch.waitingReason) {
    elWaitingCallout.classList.add("active");
    elWaitingCalloutMsg.textContent = batch.waitingReason;
  } else {
    elWaitingCallout.classList.remove("active");
  }

  // Overall pipeline badge
  if (batch.currentStage === "COMPLETED") {
    elPipelineOverallBadge.className = "status-badge normal";
    elPipelineOverallBadge.textContent = "BATCH COMPLETE";
  } else if (batch.currentStage === "WAITING_FOR_DRYER") {
    elPipelineOverallBadge.className = "status-badge warning";
    elPipelineOverallBadge.textContent = "DRYER CONTENTION";
  } else if (batch.currentStage !== "IDLE") {
    elPipelineOverallBadge.className = "status-badge running";
    elPipelineOverallBadge.textContent = "PROCESSING";
  } else {
    elPipelineOverallBadge.className = "status-badge idle";
    elPipelineOverallBadge.textContent = "STANDBY";
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
elSelProfile.addEventListener("change", (e) => {
  engine.selectProfile(e.target.value);
  render();
});

elBtnToggleEligibility.addEventListener("click", () => {
  engine.setLeafEligible(!engine.activeBatch.isLeafEligible);
  render();
});

elBtnToggleGreenLock.addEventListener("click", () => {
  const isCurrentlyGreen = engine.sharedDryer.state === "BUSY_GREEN";
  engine.setDryerExternalLock(!isCurrentlyGreen, "B-G01");
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
    const ok = engine.stepLine();
    render();
    if (!ok || engine.activeBatch.currentStage === "COMPLETED" || engine.activeBatch.currentStage.startsWith("WAITING")) {
      clearInterval(autoRunTimer);
      autoRunTimer = null;
      elBtnAutoRun.textContent = "▶️ Auto-Run Sequence";
    }
  }, 900);
});

// Scenario buttons
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

// Reset demo button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  if (autoRunTimer) {
    clearInterval(autoRunTimer);
    autoRunTimer = null;
    elBtnAutoRun.textContent = "▶️ Auto-Run Sequence";
  }
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="NOMINAL-DAY-40-GOLDEN"]')?.classList.add("active");
  engine.loadScenario(SCENARIOS["NOMINAL-DAY-40-GOLDEN"]);
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["Timestamp", "BatchID", "Profile", "FreshKg", "FinishedKg", "LiquorColor", "DurationMin", "Status"];
  const rows = snapshot.completedBatches.map(b => [
    b.timestamp,
    b.batchId,
    b.profileId,
    b.freshKg,
    b.finishedKg,
    b.liquorColor,
    b.totalDurationMin,
    b.status
  ]);
  if (rows.length === 0) {
    rows.push([
      new Date().toISOString(),
      snapshot.activeBatch.batchId,
      snapshot.selectedProfile.profileId,
      snapshot.activeBatch.freshKg,
      snapshot.activeBatch.expectedOutputKg,
      snapshot.selectedProfile.liquorColor,
      snapshot.activeBatch.totalElapsedMin,
      snapshot.activeBatch.currentStage
    ]);
  }
  exportToCsv(`golden-tea-batches-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`golden-tea-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.loadScenario(SCENARIOS["NOMINAL-DAY-40-GOLDEN"]);
render();
