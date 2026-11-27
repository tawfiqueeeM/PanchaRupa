import { SchedulingEngine } from "../../projects/production-scheduling/js/scheduling-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new SchedulingEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/production-scheduling/fixtures/schedule_scenarios.json");
    if (res.ok) {
      scenariosData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load scenarios JSON", err);
  }

  // DOM Elements
  const scenarioSelect = document.getElementById("scenarioSelect");
  const btnReset = document.getElementById("btnReset");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnExportCsv = document.getElementById("btnExportCsv");

  const schedStatusPill = document.getElementById("schedStatusPill");
  const kpiFeasible = document.getElementById("kpiFeasible");
  const kpiFeasibleSub = document.getElementById("kpiFeasibleSub");
  const kpiMakespan = document.getElementById("kpiMakespan");
  const kpiMakespanSub = document.getElementById("kpiMakespanSub");
  const kpiOutages = document.getElementById("kpiOutages");
  const kpiOutagesSub = document.getElementById("kpiOutagesSub");
  const kpiBatches = document.getElementById("kpiBatches");

  const infeasibilityBanner = document.getElementById("infeasibilityBanner");
  const infeasibilityMsg = document.getElementById("infeasibilityMsg");

  const greenMassSlider = document.getElementById("greenMassSlider");
  const greenMassVal = document.getElementById("greenMassVal");
  const goldenMassSlider = document.getElementById("goldenMassSlider");
  const goldenMassVal = document.getElementById("goldenMassVal");
  const chkDryerOutage = document.getElementById("chkDryerOutage");

  const cmpBaseMakespan = document.getElementById("cmpBaseMakespan");
  const cmpRevMakespan = document.getElementById("cmpRevMakespan");
  const cmpDeltaMin = document.getElementById("cmpDeltaMin");
  const diffTableBody = document.getElementById("diffTableBody");

  const timelineContainer = document.getElementById("timelineContainer");

  const MACHINE_NAMES = [
    { id: "WITHERING_TROUGH", label: "Withering Trough" },
    { id: "FIXATION_DRUM", label: "Fixation Drum" },
    { id: "SHARED_ROLLER", label: "Shared Roller" },
    { id: "OXIDATION_CHAMBER", label: "Oxidation Chamber" },
    { id: "SHARED_DRYER", label: "Shared Dryer" },
    { id: "PACKING_LINE", label: "Packing Line" }
  ];

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        const gOrder = scen.orders.find(o => o.batchId === "B-G01");
        const glOrder = scen.orders.find(o => o.batchId === "B-GL01");
        if (gOrder) greenMassSlider.value = gOrder.quantityKg;
        if (glOrder) goldenMassSlider.value = glOrder.quantityKg;
        chkDryerOutage.checked = scen.outages.some(o => o.machine === "SHARED_DRYER");
        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const sched = engine.schedule;
    const comp = engine.getComparison();

    // 1. KPI cards
    if (sched.isFeasible) {
      schedStatusPill.className = "status-indicator ok";
      schedStatusPill.textContent = "● SCHEDULE FEASIBLE";
      kpiFeasible.textContent = "FEASIBLE";
      kpiFeasible.style.color = "var(--color-status-success)";
      kpiFeasibleSub.textContent = `Completed before 17:00 cutoff`;
      infeasibilityBanner.style.display = "none";
    } else {
      schedStatusPill.className = "status-indicator alarm";
      schedStatusPill.textContent = "⚠ INFEASIBLE";
      kpiFeasible.textContent = "INFEASIBLE";
      kpiFeasible.style.color = "var(--color-status-danger)";
      kpiFeasibleSub.textContent = `Deadline breached (+${sched.makespanMin - sched.shiftEndMin} min)`;
      infeasibilityBanner.style.display = "block";
      infeasibilityMsg.textContent = sched.infeasibilities.map(inf => inf.reason).join(" | ");
    }

    kpiMakespan.textContent = sched.makespanTime;
    kpiMakespanSub.textContent = `${sched.makespanMin} min elapsed (Shift: ${sched.shiftEndMin} min)`;

    kpiOutages.textContent = engine.outages.length;
    kpiOutagesSub.textContent = engine.outages.length > 0 ? "Active machine outage" : "All machines 100% available";

    const totalKg = sched.batches.reduce((sum, b) => sum + b.quantityKg, 0);
    kpiBatches.textContent = `${sched.batches.length} / ${totalKg.toFixed(1)} kg`;

    greenMassVal.textContent = `${greenMassSlider.value} kg`;
    goldenMassVal.textContent = `${goldenMassSlider.value} kg`;

    // 2. Comparison Card
    if (comp) {
      cmpBaseMakespan.textContent = comp.baselineMakespanTime;
      cmpRevMakespan.textContent = comp.revisedMakespanTime;
      
      if (comp.makespanDeltaMin > 0) {
        cmpDeltaMin.textContent = `+${comp.makespanDeltaMin} min`;
        cmpDeltaMin.style.color = "var(--color-status-danger)";
      } else {
        cmpDeltaMin.textContent = "+0 min";
        cmpDeltaMin.style.color = "var(--color-status-success)";
      }

      diffTableBody.innerHTML = comp.batchComparisons.map(b => `
        <tr>
          <td><strong style="font-family:var(--font-mono);">${b.batchId}</strong></td>
          <td style="font-family:var(--font-mono);">${b.baseCompletionTime}</td>
          <td style="font-family:var(--font-mono);">${b.revisedCompletionTime}</td>
          <td style="font-family:var(--font-mono); font-weight:700; color:${b.delayMin > 0 ? 'var(--color-status-danger)' : 'var(--color-status-success)'};">
            ${b.delayMin > 0 ? `+${b.delayMin}m` : '0m'}
          </td>
        </tr>
      `).join("");
    }

    // 3. Render Machine Gantt
    renderGantt(sched);
  }

  function renderGantt(sched) {
    const totalTimelineMin = 600; // 08:00 to 18:00 (10 hours * 60 min)
    const shiftCutoffPct = (540 / totalTimelineMin) * 100; // 17:00 marker

    let html = "";

    MACHINE_NAMES.forEach(mach => {
      const slots = sched.machineCalendars[mach.id] || [];

      html += `
        <div class="timeline-row">
          <div class="timeline-machine-label" title="${mach.label}">${mach.label}</div>
          <div class="timeline-track">
            <!-- 17:00 Shift Cutoff Marker -->
            <div class="shift-marker" style="left: ${shiftCutoffPct}%;">
              <span class="shift-marker-label">17:00 Cutoff</span>
            </div>
      `;

      slots.forEach(slot => {
        if (slot.type === "OUTAGE") {
          const leftPct = (slot.startMin / totalTimelineMin) * 100;
          const widthPct = ((slot.endMin - slot.startMin) / totalTimelineMin) * 100;
          html += `
            <div class="timeline-block outage" style="left: ${leftPct}%; width: ${widthPct}%;" title="OUTAGE: ${slot.reason} (${engine.minToTimeStr(slot.startMin)} - ${engine.minToTimeStr(slot.endMin)})">
              OUTAGE (${slot.endMin - slot.startMin}m)
            </div>
          `;
        } else if (slot.type === "TASK") {
          // If cleanMin > 0, render changeover block first
          if (slot.cleanMin > 0) {
            const cleanLeft = (slot.cleanStartMin / totalTimelineMin) * 100;
            const cleanWidth = (slot.cleanMin / totalTimelineMin) * 100;
            html += `
              <div class="timeline-block changeover" style="left: ${cleanLeft}%; width: ${cleanWidth}%;" title="Changeover sanitization: ${slot.cleanMin} min">
                Cln
              </div>
            `;
          }

          const taskLeft = (slot.startMin / totalTimelineMin) * 100;
          const taskWidth = ((slot.endMin - slot.startMin) / totalTimelineMin) * 100;
          const colorClass = slot.product === "GREEN_TEA" ? "green-tea" : "golden-tea";

          html += `
            <div class="timeline-block ${colorClass}" style="left: ${taskLeft}%; width: ${taskWidth}%;" title="${slot.batchId} (${slot.product}): ${engine.minToTimeStr(slot.startMin)} - ${engine.minToTimeStr(slot.endMin)}">
              ${slot.batchId}
            </div>
          `;
        }
      });

      html += `
          </div>
        </div>
      `;
    });

    timelineContainer.innerHTML = html;
  }

  // Event Handlers
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  greenMassSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    engine.updateOrderQuantity("B-G01", val);
    updateUI();
  });

  goldenMassSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    engine.updateOrderQuantity("B-GL01", val);
    updateUI();
  });

  chkDryerOutage.addEventListener("change", (e) => {
    if (e.target.checked) {
      engine.setOutages([
        {
          outageId: "OUT-DRY-01",
          machine: "SHARED_DRYER",
          startMin: 210,
          endMin: 330,
          reason: "SCR heating element breaker trip and cooling blower replacement"
        }
      ]);
    } else {
      engine.setOutages([]);
    }
    updateUI();
  });

  // Export handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      schedule: engine.schedule,
      comparison: engine.getComparison(),
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `production_schedule_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    const sched = engine.schedule;
    if (!sched || !sched.batches) return;
    let csv = "BatchId,Product,QuantityKg,StepIndex,Machine,CleanMin,StartTime,EndTime,DurationMin\n";
    sched.batches.forEach(b => {
      b.steps.forEach(s => {
        csv += `${b.batchId},${b.product},${b.quantityKg},${s.stepIndex},${s.machine},${s.cleanMin},${s.startTimeStr},${s.endTimeStr},${s.durationMin}\n`;
      });
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `production_schedule_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("DAY-40-NOMINAL");
});
