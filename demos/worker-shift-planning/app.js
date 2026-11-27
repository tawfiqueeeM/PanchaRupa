import { ShiftEngine } from "../../projects/worker-shift-planning/js/shift-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new ShiftEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/worker-shift-planning/fixtures/shift_scenarios.json");
    if (res.ok) {
      scenariosData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load scenarios JSON", err);
  }

  // DOM Elements
  const scenarioSelect = document.getElementById("scenarioSelect");
  const rosterModeSelect = document.getElementById("rosterModeSelect");
  const btnReset = document.getElementById("btnReset");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnExportCsv = document.getElementById("btnExportCsv");

  const rosterStatusPill = document.getElementById("rosterStatusPill");
  const kpiFeasibility = document.getElementById("kpiFeasibility");
  const kpiFeasibilitySub = document.getElementById("kpiFeasibilitySub");
  const kpiCoverage = document.getElementById("kpiCoverage");
  const kpiCoverageSub = document.getElementById("kpiCoverageSub");
  const kpiUncovered = document.getElementById("kpiUncovered");
  const kpiUncoveredSub = document.getElementById("kpiUncoveredSub");
  const kpiCrew = document.getElementById("kpiCrew");
  const kpiCrewSub = document.getElementById("kpiCrewSub");

  const shiftAlertBanner = document.getElementById("shiftAlertBanner");
  const shiftAlertMsg = document.getElementById("shiftAlertMsg");

  const workerListContainer = document.getElementById("workerListContainer");
  const timelineContainer = document.getElementById("timelineContainer");
  const violationsTableBody = document.getElementById("violationsTableBody");

  const ALL_SKILLS = ["LEAF_INTAKE", "WITHERING", "FIXATION", "ROLLING", "OXIDATION", "DRYING", "PACKING"];

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        rosterModeSelect.value = engine.rosterMode;
        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const evalRes = engine.evaluation;

    // 1. KPI Cards
    if (evalRes.isFeasible) {
      rosterStatusPill.className = "status-indicator ok";
      rosterStatusPill.textContent = "● 100% COVERED";
      kpiFeasibility.textContent = "FEASIBLE";
      kpiFeasibility.style.color = "var(--color-status-success)";
      kpiFeasibilitySub.textContent = "Zero uncovered station minutes";
      shiftAlertBanner.style.display = "none";
    } else {
      rosterStatusPill.className = "status-indicator alarm";
      rosterStatusPill.textContent = "⚠ DEFICIT / CONFLICT";
      kpiFeasibility.textContent = "INFEASIBLE";
      kpiFeasibility.style.color = "var(--color-status-danger)";
      kpiFeasibilitySub.textContent = `${evalRes.uncoveredTasks.length} gaps, ${evalRes.violations.length} conflicts`;
      shiftAlertBanner.style.display = "block";

      const errs = [];
      evalRes.uncoveredTasks.forEach(u => errs.push(`Uncovered ${u.station} (${u.reason})`));
      evalRes.violations.forEach(v => errs.push(`${v.type}: ${v.reason}`));
      shiftAlertMsg.textContent = errs.join(" | ");
    }

    kpiCoverage.textContent = `${evalRes.coveragePct}%`;
    kpiCoverageSub.textContent = `${evalRes.coveredTaskMin} / ${evalRes.totalTaskMin} min`;

    kpiUncovered.textContent = `${evalRes.uncoveredTaskMin} min`;
    if (evalRes.uncoveredTaskMin > 0) {
      kpiUncovered.style.color = "var(--color-status-danger)";
      kpiUncoveredSub.textContent = "Production capacity curtailed";
    } else {
      kpiUncovered.style.color = "var(--color-status-success)";
      kpiUncoveredSub.textContent = "All stations fully staffed";
    }

    const presentWorkers = engine.workers.filter(w => w.isPresent);
    kpiCrew.textContent = `${presentWorkers.length} / ${engine.workers.length}`;
    kpiCrewSub.textContent = `${engine.rosterMode} roster active`;

    // 2. Render Workers List
    renderWorkers(evalRes);

    // 3. Render Shift Timeline
    renderTimeline(evalRes);

    // 4. Render Violations Table
    renderViolations(evalRes);
  }

  function renderWorkers(evalRes) {
    let html = "";
    evalRes.workerStats.forEach(w => {
      const worker = engine.workers.find(wk => wk.id === w.id);
      html += `
        <div class="worker-row">
          <div class="worker-row-header">
            <div>
              <span class="worker-name">${w.name}</span>
              <span style="font-size:0.75rem; color:var(--color-text-muted); margin-left:6px;">(${w.id} • ${w.type})</span>
            </div>
            <label style="font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" class="worker-presence-chk" data-id="${w.id}" ${w.isPresent ? "checked" : ""}>
              ${w.isPresent ? "Present" : "Absent"}
            </label>
          </div>
          <div style="font-size:0.75rem; color:var(--color-text-muted);">
            Worked: <strong>${w.totalHoursWorked} hrs</strong> (${w.assignedTasksCount} tasks)
          </div>
          <div style="font-size:0.75rem; font-weight:600; margin-top:2px;">Skills Certification:</div>
          <div class="skill-tag-container">
      `;

      ALL_SKILLS.forEach(sk => {
        const hasSkill = worker.skills.includes(sk);
        html += `
          <span class="skill-tag ${hasSkill ? 'active' : ''}" data-worker-id="${w.id}" data-skill="${sk}" title="Click to toggle certification">
            ${sk.replace("_", " ")}
          </span>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });
    workerListContainer.innerHTML = html;

    // Attach listeners
    workerListContainer.querySelectorAll(".worker-presence-chk").forEach(chk => {
      chk.addEventListener("change", (e) => {
        engine.setWorkerPresence(e.target.dataset.id, e.target.checked);
        updateUI();
      });
    });

    workerListContainer.querySelectorAll(".skill-tag").forEach(tag => {
      tag.addEventListener("click", (e) => {
        engine.toggleWorkerSkill(e.target.dataset.workerId, e.target.dataset.skill);
        updateUI();
      });
    });
  }

  function renderTimeline(evalRes) {
    const totalShiftMin = 540; // 08:00 to 17:00 (9 hours)
    let html = "";

    engine.tasks.forEach(task => {
      const isUncovered = evalRes.uncoveredTasks.some(u => u.taskId === task.taskId);
      const workerClass = isUncovered ? "uncovered" : (task.assignedWorkerId ? task.assignedWorkerId.toLowerCase() : "uncovered");
      
      const leftPct = (task.startMin / totalShiftMin) * 100;
      const widthPct = ((task.endMin - task.startMin) / totalShiftMin) * 100;

      const worker = engine.workers.find(w => w.id === task.assignedWorkerId);
      const workerLabel = isUncovered ? "UNCOVERED" : (worker ? worker.name : "UNASSIGNED");

      html += `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; margin-bottom:2px;">
            <span>${task.station.replace("_", " ")} (${task.requiredSkill})</span>
            <span style="font-family:var(--font-mono); color:var(--color-text-muted);">
              ${minToTimeStr(task.startMin)} - ${minToTimeStr(task.endMin)}
            </span>
          </div>
          <div class="timeline-track" style="height:30px;">
            <div class="task-block ${workerClass}" style="left:${leftPct}%; width:${widthPct}%;" title="${task.station}: ${workerLabel}">
              ${task.taskId}: ${workerLabel}
            </div>
          </div>
        </div>
      `;
    });

    timelineContainer.innerHTML = html;
  }

  function renderViolations(evalRes) {
    let rows = "";

    evalRes.uncoveredTasks.forEach(u => {
      rows += `
        <tr>
          <td><span class="log-badge ALARM">UNCOVERED</span></td>
          <td style="font-weight:600;">${u.station}</td>
          <td>${u.reason} (${u.durationMin} minutes unstaffed)</td>
        </tr>
      `;
    });

    evalRes.violations.forEach(v => {
      rows += `
        <tr>
          <td><span class="log-badge WARN">${v.type}</span></td>
          <td style="font-weight:600;">${v.station || v.workerName}</td>
          <td>${v.reason}</td>
        </tr>
      `;
    });

    if (evalRes.uncoveredTasks.length === 0 && evalRes.violations.length === 0) {
      rows = `
        <tr>
          <td colspan="3" style="text-align:center; color:var(--color-status-success); font-weight:600; padding:12px;">
            ✓ All stations and shifts satisfy skill qualifications and single-assignment invariants.
          </td>
        </tr>
      `;
    }

    violationsTableBody.innerHTML = rows;
  }

  function minToTimeStr(mins) {
    const totalMinutes = 8 * 60 + mins;
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  // Event Handlers
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  rosterModeSelect.addEventListener("change", (e) => {
    engine.setRosterMode(e.target.value);
    updateUI();
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  // Export Handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      evaluation: engine.evaluation,
      workers: engine.workers,
      tasks: engine.tasks,
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `worker_shift_roster_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    let csv = "WorkerId,WorkerName,Type,IsPresent,TotalHoursWorked,AssignedTasksCount\n";
    engine.evaluation.workerStats.forEach(w => {
      csv += `${w.id},"${w.name}",${w.type},${w.isPresent},${w.totalHoursWorked},${w.assignedTasksCount}\n`;
    });
    csv += "\nTaskId,Station,RequiredSkill,StartMin,EndMin,AssignedWorkerId,Status\n";
    engine.tasks.forEach(t => {
      const isUncovered = engine.evaluation.uncoveredTasks.some(u => u.taskId === t.taskId);
      csv += `${t.taskId},${t.station},${t.requiredSkill},${t.startMin},${t.endMin},${t.assignedWorkerId || "NONE"},${isUncovered ? "UNCOVERED" : "STAFFED"}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `worker_shift_roster_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("NOMINAL-FULL-CREW");
});
