import { WitheringEngine, AMBIENT_SCENARIOS } from "../../projects/withering-airflow/js/withering-engine.js";
import { exportToCsv, exportToJson } from "../../shared/js/ui-utils.js";

const engine = new WitheringEngine();

// DOM elements
const elLblActiveBatch = document.getElementById("lblActiveBatch");
const elLblFanSpeedDisplay = document.getElementById("lblFanSpeedDisplay");
const elLblSensorStatus = document.getElementById("lblSensorStatus");
const elBadgeTargetReached = document.getElementById("badgeTargetReached");
const elSensorFaultAlert = document.getElementById("sensorFaultAlert");

const elGaugeMoisture = document.getElementById("gaugeMoisture");
const elGaugeFan = document.getElementById("gaugeFan");
const elLblFanRpm = document.getElementById("lblFanRpm");
const elGaugeAmbient = document.getElementById("gaugeAmbient");
const elLblAmbientProfile = document.getElementById("lblAmbientProfile");
const elGaugeKwh = document.getElementById("gaugeKwh");
const elLblElapsedHours = document.getElementById("lblElapsedHours");
const elFanSpinIcon = document.getElementById("fanSpinIcon");

const elRngFanSpeed = document.getElementById("rngFanSpeed");
const elLblFanSpeedVal = document.getElementById("lblFanSpeedVal");
const elInpInitialMoisture = document.getElementById("inpInitialMoisture");
const elInpTargetMoisture = document.getElementById("inpTargetMoisture");
const elSelAmbientScenario = document.getElementById("selAmbientScenario");

const elBtnStepHour = document.getElementById("btnStepHour");
const elBtnAutoSim = document.getElementById("btnAutoSim");
const elBtnToggleSensorFault = document.getElementById("btnToggleSensorFault");
const elComparisonTableBody = document.getElementById("comparisonTableBody");
const elEventLogContainer = document.getElementById("eventLogContainer");

let autoSimTimer = null;

function render() {
  const snapshot = engine.getSnapshot();

  // Header & summary
  elLblFanSpeedDisplay.textContent = `${snapshot.fanSpeedPercent}%`;
  elLblFanSpeedVal.textContent = `${snapshot.fanSpeedPercent}%`;
  elRngFanSpeed.value = snapshot.fanSpeedPercent;
  elInpInitialMoisture.value = snapshot.initialMoisture;
  elInpTargetMoisture.value = snapshot.targetMoisture;
  elSelAmbientScenario.value = snapshot.ambientKey;

  // Sensor health
  if (!snapshot.sensorValid || snapshot.sensorFault) {
    elLblSensorStatus.textContent = "FAULT (%IW70 INVALID)";
    elLblSensorStatus.style.color = "#dc2626";
    elSensorFaultAlert.classList.add("active");
    elGaugeMoisture.textContent = "ERR (-99.9%)";
    elGaugeMoisture.style.color = "#ef4444";
  } else {
    elLblSensorStatus.textContent = "HEALTHY";
    elLblSensorStatus.style.color = "#15803d";
    elSensorFaultAlert.classList.remove("active");
    elGaugeMoisture.textContent = `${snapshot.currentMoisture.toFixed(1)}%`;
    elGaugeMoisture.style.color = snapshot.currentMoisture <= snapshot.targetMoisture ? "#22c55e" : "#38bdf8";
  }

  // Target reached badge
  if (snapshot.targetReached) {
    elBadgeTargetReached.style.display = "inline-flex";
  } else {
    elBadgeTargetReached.style.display = "none";
  }

  // Fan gauge
  elGaugeFan.textContent = `${snapshot.fanSpeedPercent}%`;
  const rpm = Math.round((snapshot.fanSpeedPercent / 100) * 1440);
  const powerKw = snapshot.fanRatedPowerKw * Math.pow(snapshot.fanSpeedPercent / 100, 3);
  elLblFanRpm.textContent = `${rpm.toLocaleString()} RPM (${powerKw.toFixed(2)} kW)`;

  // Fan animation speed
  if (snapshot.fanSpeedPercent > 0) {
    const duration = Math.max(0.15, 2.0 - (snapshot.fanSpeedPercent / 100) * 1.8);
    elFanSpinIcon.style.animationDuration = `${duration}s`;
    elFanSpinIcon.style.display = "inline-block";
  } else {
    elFanSpinIcon.style.display = "none";
  }

  // Ambient gauge
  elGaugeAmbient.textContent = `${snapshot.ambient.tempC}°C / ${Math.round(snapshot.ambient.rh * 100)}% RH`;
  elLblAmbientProfile.textContent = snapshot.ambient.name;

  // Energy & hours
  elGaugeKwh.textContent = `${snapshot.cumulativeFanKwh.toFixed(2)} kWh`;
  elLblElapsedHours.textContent = `${snapshot.elapsedHours.toFixed(1)} hrs elapsed`;

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

function updateComparisonTable() {
  const tempEngineA = new WitheringEngine();
  tempEngineA.setInitialMoisture(engine.initialMoisture);
  tempEngineA.setTargetMoisture(engine.targetMoisture);
  tempEngineA.setAmbientScenario(engine.ambientKey);
  tempEngineA.setFanSpeed(40);
  const runA = tempEngineA.simulateFullRun(12, 1.0);

  const tempEngineB = new WitheringEngine();
  tempEngineB.setInitialMoisture(engine.initialMoisture);
  tempEngineB.setTargetMoisture(engine.targetMoisture);
  tempEngineB.setAmbientScenario(engine.ambientKey);
  tempEngineB.setFanSpeed(85);
  const runB = tempEngineB.simulateFullRun(12, 1.0);

  let html = "";
  for (let i = 0; i < runA.length; i += 2) {
    const a = runA[i];
    const b = runB[i];
    html += `
      <tr>
        <td class="font-mono">${a.elapsedHours.toFixed(1)} h</td>
        <td class="font-mono">${a.moisturePercent.toFixed(1)}% ${a.targetReached ? "✅" : ""}</td>
        <td class="font-mono">${a.fanKwh.toFixed(2)} kWh</td>
        <td class="font-mono" style="font-weight:700;">${b.moisturePercent.toFixed(1)}% ${b.targetReached ? "✅" : ""}</td>
        <td class="font-mono">${b.fanKwh.toFixed(2)} kWh</td>
      </tr>
    `;
  }
  elComparisonTableBody.innerHTML = html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Event Listeners
elRngFanSpeed.addEventListener("input", (e) => {
  engine.setFanSpeed(parseFloat(e.target.value));
  render();
});

elInpInitialMoisture.addEventListener("change", (e) => {
  engine.setInitialMoisture(parseFloat(e.target.value));
  updateComparisonTable();
  render();
});

elInpTargetMoisture.addEventListener("change", (e) => {
  engine.setTargetMoisture(parseFloat(e.target.value));
  updateComparisonTable();
  render();
});

elSelAmbientScenario.addEventListener("change", (e) => {
  engine.setAmbientScenario(e.target.value);
  updateComparisonTable();
  render();
});

elBtnToggleSensorFault.addEventListener("click", () => {
  engine.setSensorFault(!engine.sensorFault);
  render();
});

elBtnStepHour.addEventListener("click", () => {
  engine.stepTime(1.0);
  render();
});

elBtnAutoSim.addEventListener("click", () => {
  if (autoSimTimer) {
    clearInterval(autoSimTimer);
    autoSimTimer = null;
    elBtnAutoSim.textContent = "▶️ Run to Target (65%)";
    return;
  }

  elBtnAutoSim.textContent = "⏸️ Pause Simulation";
  autoSimTimer = setInterval(() => {
    engine.stepTime(0.5);
    render();
    if (engine.targetReached || engine.elapsedHours >= 20) {
      clearInterval(autoSimTimer);
      autoSimTimer = null;
      elBtnAutoSim.textContent = "▶️ Run to Target (65%)";
    }
  }, 250);
});

// Scenario buttons
document.querySelectorAll(".scenario-pill").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
    e.target.classList.add("active");
    const scenarioKey = e.target.dataset.scenario;

    if (autoSimTimer) {
      clearInterval(autoSimTimer);
      autoSimTimer = null;
      elBtnAutoSim.textContent = "▶️ Run to Target (65%)";
    }

    if (scenarioKey === "SPRING-NOMINAL") {
      engine.reset();
      engine.setAmbientScenario("SPRING-NOMINAL");
      engine.setFanSpeed(60);
    } else if (scenarioKey === "MONSOON-HUMID") {
      engine.reset();
      engine.setAmbientScenario("MONSOON-HUMID");
      engine.setFanSpeed(75);
    } else if (scenarioKey === "SENSOR-FAULT") {
      engine.reset();
      engine.setSensorFault(true);
    } else if (scenarioKey === "COMPARE-RUNS") {
      engine.reset();
      engine.setFanSpeed(85);
    }

    updateComparisonTable();
    render();
  });
});

// Reset button
document.getElementById("btnResetDemo").addEventListener("click", () => {
  if (autoSimTimer) {
    clearInterval(autoSimTimer);
    autoSimTimer = null;
    elBtnAutoSim.textContent = "▶️ Run to Target (65%)";
  }
  document.querySelectorAll(".scenario-pill").forEach(p => p.classList.remove("active"));
  document.querySelector('.scenario-pill[data-scenario="SPRING-NOMINAL"]')?.classList.add("active");
  engine.reset();
  updateComparisonTable();
  render();
});

// Exports
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const snapshot = engine.getSnapshot();
  const headers = ["ElapsedHours", "MoisturePercent", "SensorReading", "SensorValid", "FanSpeedPercent", "CumulativeFanKwh", "TargetReached"];
  const rows = snapshot.trajectory.map(p => [
    p.elapsedHours,
    p.moisturePercent,
    p.sensorReading,
    p.sensorValid,
    p.fanSpeedPercent,
    p.cumulativeFanKwh,
    p.targetReached
  ]);
  exportToCsv(`withering-trajectory-${Date.now()}.csv`, headers, rows);
});

document.getElementById("btnExportJson").addEventListener("click", () => {
  exportToJson(`withering-state-${Date.now()}.json`, engine.getSnapshot());
});

// Initial boot
engine.reset();
updateComparisonTable();
render();
