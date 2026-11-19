import { BmsEngine } from "../../projects/virtual-factory/building-automation/js/bms-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new BmsEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/virtual-factory/building-automation/fixtures/bms_scenarios.json");
    if (res.ok) {
      scenariosData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load scenarios JSON, using fallback presets", err);
  }

  // DOM Elements
  const scenarioSelect = document.getElementById("scenarioSelect");
  const btnStepTime = document.getElementById("btnStepTime");
  const btnReset = document.getElementById("btnReset");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnExportCsv = document.getElementById("btnExportCsv");

  // AHU Card
  const ahuStatusBadge = document.getElementById("ahuStatusBadge");
  const ahuFlowVal = document.getElementById("ahuFlowVal");
  const ahuCmdReadout = document.getElementById("ahuCmdReadout");
  const ahuProofReadout = document.getElementById("ahuProofReadout");
  const ahuAlarmReadout = document.getElementById("ahuAlarmReadout");
  const btnToggleFan = document.getElementById("btnToggleFan");
  const btnToggleProof = document.getElementById("btnToggleProof");
  const btnAckAhu = document.getElementById("btnAckAhu");

  // Climate Card
  const climateStatusBadge = document.getElementById("climateStatusBadge");
  const humidityVal = document.getElementById("humidityVal");
  const tempVal = document.getElementById("tempVal");
  const dehumidifierReadout = document.getElementById("dehumidifierReadout");
  const humiditySlider = document.getElementById("humiditySlider");

  // Meter Card
  const meterStatusBadge = document.getElementById("meterStatusBadge");
  const activePowerVal = document.getElementById("activePowerVal");
  const cumEnergyVal = document.getElementById("cumEnergyVal");
  const heartbeatVal = document.getElementById("heartbeatVal");
  const staleWatchdogVal = document.getElementById("staleWatchdogVal");
  const btnToggleMeterPolling = document.getElementById("btnToggleMeterPolling");

  // KPI Card
  const kpiStatusBadge = document.getElementById("kpiStatusBadge");
  const specificEnergyVal = document.getElementById("specificEnergyVal");
  const kpiEnergyReadout = document.getElementById("kpiEnergyReadout");
  const kpiMassReadout = document.getElementById("kpiMassReadout");

  // System Badge & Log
  const systemSummaryStatus = document.getElementById("systemSummaryStatus");
  const logTableBody = document.getElementById("logTableBody");

  function updateUI() {
    const snap = engine.getSnapshot();

    // 1. AHU Card
    ahuFlowVal.textContent = Math.round(snap.ventilation.flowM3h).toLocaleString();
    ahuCmdReadout.textContent = snap.ventilation.command ? "RUN (1)" : "STOP (0)";
    ahuProofReadout.textContent = snap.ventilation.proof ? "HEALTHY (1)" : "LOST (0)";
    
    if (snap.alarms.ventProofLoss) {
      ahuStatusBadge.className = "status-indicator alarm";
      ahuStatusBadge.textContent = "ALARM - PROOF TRIP";
      ahuAlarmReadout.textContent = snap.alarms.ventProofAcked ? "ACKNOWLEDGED (TRIPPED)" : "ACTIVE TRIP (%I7.1 = 0)";
      ahuAlarmReadout.style.color = "var(--color-status-danger)";
      btnAckAhu.style.display = snap.alarms.ventProofAcked ? "none" : "inline-block";
      btnToggleProof.textContent = "Restore Proof Sensor";
    } else {
      ahuStatusBadge.className = snap.ventilation.command ? "status-indicator ok" : "status-indicator warn";
      ahuStatusBadge.textContent = snap.ventilation.command ? "RUNNING" : "STOPPED";
      ahuAlarmReadout.textContent = "NORMAL";
      ahuAlarmReadout.style.color = "var(--color-status-success)";
      btnAckAhu.style.display = "none";
      btnToggleProof.textContent = "Simulate Proof Loss";
    }

    // 2. Storage Climate
    humidityVal.textContent = snap.storageClimate.humidityRh.toFixed(1);
    tempVal.textContent = `${snap.storageClimate.tempC.toFixed(1)} °C`;
    dehumidifierReadout.textContent = snap.storageClimate.dehumidifierActive ? "ACTIVE ON (%Q7.4=1)" : "OFF (%Q7.4=0)";
    humiditySlider.value = Math.round(snap.storageClimate.humidityRh);

    if (snap.alarms.highHumidity) {
      climateStatusBadge.className = "status-indicator alarm";
      climateStatusBadge.textContent = "HIGH RH EXCURSION";
      dehumidifierReadout.style.color = "var(--color-status-danger)";
    } else {
      climateStatusBadge.className = "status-indicator ok";
      climateStatusBadge.textContent = "NOMINAL";
      dehumidifierReadout.style.color = "inherit";
    }

    // 3. Modbus Power Meter
    activePowerVal.textContent = snap.electricalMetering.activePowerKw.toFixed(1);
    cumEnergyVal.textContent = `${snap.electricalMetering.cumulativeEnergyKwh.toFixed(2)} kWh`;
    heartbeatVal.textContent = snap.electricalMetering.heartbeat;
    staleWatchdogVal.textContent = `${snap.electricalMetering.staleSec}s / 15s`;

    if (snap.alarms.staleMeter) {
      meterStatusBadge.className = "status-indicator alarm";
      meterStatusBadge.textContent = "STALE COMMS TIMEOUT";
      btnToggleMeterPolling.textContent = "Restore Modbus Link";
      btnToggleMeterPolling.className = "bms-btn primary";
    } else {
      meterStatusBadge.className = snap.electricalMetering.pollingActive ? "status-indicator ok" : "status-indicator warn";
      meterStatusBadge.textContent = snap.electricalMetering.pollingActive ? "ONLINE" : "OFFLINE";
      btnToggleMeterPolling.textContent = "Sever Modbus Link";
      btnToggleMeterPolling.className = "bms-btn";
    }

    // 4. Energy KPI
    specificEnergyVal.textContent = snap.productionEnergy.kwhPerReleasedKg.toFixed(2);
    kpiEnergyReadout.textContent = `${snap.electricalMetering.cumulativeEnergyKwh.toFixed(2)} kWh`;
    kpiMassReadout.textContent = `${snap.productionEnergy.releasedTeaKg.toFixed(1)} kg`;

    if (snap.productionEnergy.kwhPerReleasedKg > 2.0) {
      kpiStatusBadge.className = "status-indicator warn";
      kpiStatusBadge.textContent = "ELEVATED";
    } else {
      kpiStatusBadge.className = "status-indicator ok";
      kpiStatusBadge.textContent = "EXCELLENT";
    }

    // Overall System Status
    const hasAnyAlarm = snap.alarms.ventProofLoss || snap.alarms.highHumidity || snap.alarms.staleMeter;
    if (hasAnyAlarm) {
      systemSummaryStatus.className = "status-indicator alarm";
      systemSummaryStatus.textContent = "⚠ ALARMS ACTIVE";
    } else {
      systemSummaryStatus.className = "status-indicator ok";
      systemSummaryStatus.textContent = "● SYSTEM NOMINAL";
    }

    // Event Log
    logTableBody.innerHTML = snap.eventLedger.map(ev => `
      <tr>
        <td style="font-family:var(--font-mono); font-size:0.8rem;">${ev.timestamp}</td>
        <td><span class="log-badge ${ev.type}">${ev.type}</span></td>
        <td>${ev.message}</td>
      </tr>
    `).join("");
  }

  // Event Listeners
  btnStepTime.addEventListener("click", () => {
    engine.stepTime(5.0);
    updateUI();
  });

  btnReset.addEventListener("click", () => {
    engine.reset();
    updateUI();
  });

  btnToggleFan.addEventListener("click", () => {
    engine.setVentilationCommand(!engine.ventilationCommand);
    updateUI();
  });

  btnToggleProof.addEventListener("click", () => {
    engine.setVentilationProof(!engine.ventilationProof);
    updateUI();
  });

  btnAckAhu.addEventListener("click", () => {
    engine.acknowledgeVentAlarm();
    updateUI();
  });

  humiditySlider.addEventListener("input", (e) => {
    engine.setStorageHumidity(parseFloat(e.target.value));
    updateUI();
  });

  btnToggleMeterPolling.addEventListener("click", () => {
    engine.setMeterPolling(!engine.meterPollingActive);
    if (!engine.meterPollingActive) {
      engine.staleMeterElapsedSec = 20;
      engine.alarms.staleMeter = true;
    }
    updateUI();
  });

  scenarioSelect.addEventListener("change", (e) => {
    const selectedId = e.target.value;
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === selectedId);
      if (scen) {
        engine.loadScenario(scen);
        updateUI();
        return;
      }
    }

    // Fallback if fixture not fetched
    if (selectedId === "NOMINAL-OPS-DAY") {
      engine.reset();
    } else if (selectedId === "VENTILATION-PROOF-LOSS") {
      engine.reset();
      engine.setVentilationProof(false);
    } else if (selectedId === "HUMIDITY-EXCURSION-TRIP") {
      engine.reset();
      engine.setStorageHumidity(78.0);
    } else if (selectedId === "STALE-METER-TIMEOUT") {
      engine.reset();
      engine.setMeterPolling(false);
      engine.staleMeterElapsedSec = 20;
      engine.alarms.staleMeter = true;
    }
    updateUI();
  });

  // Export Handlers
  btnExportJson.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(engine.getSnapshot(), null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `bms_telemetry_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    const history = engine.trendHistory;
    if (history.length === 0) return;
    const headers = Object.keys(history[0]).join(",");
    const rows = history.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + "\n" + rows);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", csvContent);
    dlAnchorElem.setAttribute("download", `bms_telemetry_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  updateUI();
});
