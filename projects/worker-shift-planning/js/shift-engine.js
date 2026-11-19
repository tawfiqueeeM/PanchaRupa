/**
 * Worker Shift Planning & Skills Engine
 * Evaluates skill coverage, worker presence, double-booking conflicts,
 * and fixed vs seasonal rosters for the PanchaRupa Virtual Tea Factory.
 */

export class ShiftEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.rosterMode = "SEASONAL"; // "FIXED" or "SEASONAL"
    this.workers = [];
    this.tasks = [];
    this.evaluation = null;
    this.auditLog = [];
    this.log("Shift planning engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.rosterMode = scenario.rosterMode || "SEASONAL";
    this.workers = JSON.parse(JSON.stringify(scenario.workers || []));
    this.tasks = JSON.parse(JSON.stringify(scenario.shiftTasks || []));
    this.evaluation = this.evaluateRoster();
    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.evaluation;
  }

  setWorkerPresence(workerId, isPresent) {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) return false;
    worker.isPresent = Boolean(isPresent);
    this.evaluation = this.evaluateRoster();
    this.log(`Worker ${worker.name} (${workerId}) presence set to ${worker.isPresent ? "PRESENT" : "ABSENT"}`, "ACTION");
    return true;
  }

  setRosterMode(mode) {
    if (mode !== "FIXED" && mode !== "SEASONAL") return;
    this.rosterMode = mode;
    this.workers.forEach(w => {
      if (w.type === "SEASONAL") {
        w.isPresent = (mode === "SEASONAL");
      }
    });
    this.evaluation = this.evaluateRoster();
    this.log(`Roster mode switched to ${mode}`, "ACTION");
  }

  toggleWorkerSkill(workerId, skill) {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) return false;
    const idx = worker.skills.indexOf(skill);
    if (idx >= 0) {
      worker.skills.splice(idx, 1);
    } else {
      worker.skills.push(skill);
    }
    this.evaluation = this.evaluateRoster();
    this.log(`Updated skills for ${worker.name}: [${worker.skills.join(", ")}]`, "ACTION");
    return true;
  }

  evaluateRoster() {
    const violations = [];
    const uncoveredTasks = [];
    const workerAssignments = {};

    this.workers.forEach(w => {
      workerAssignments[w.id] = [];
    });

    let totalTaskMin = 0;
    let coveredTaskMin = 0;

    this.tasks.forEach(task => {
      const duration = task.endMin - task.startMin;
      totalTaskMin += duration;

      const worker = this.workers.find(w => w.id === task.assignedWorkerId);

      if (!worker) {
        uncoveredTasks.push({
          taskId: task.taskId,
          station: task.station,
          startMin: task.startMin,
          endMin: task.endMin,
          durationMin: duration,
          reason: "UNASSIGNED"
        });
        return;
      }

      if (!worker.isPresent) {
        uncoveredTasks.push({
          taskId: task.taskId,
          station: task.station,
          startMin: task.startMin,
          endMin: task.endMin,
          durationMin: duration,
          reason: `WORKER_ABSENT (${worker.name})`
        });
        return;
      }

      if (!worker.skills.includes(task.requiredSkill)) {
        violations.push({
          type: "SKILL_MISMATCH",
          taskId: task.taskId,
          workerId: worker.id,
          workerName: worker.name,
          station: task.station,
          requiredSkill: task.requiredSkill,
          reason: `${worker.name} lacks required certification for ${task.requiredSkill}`
        });
        uncoveredTasks.push({
          taskId: task.taskId,
          station: task.station,
          startMin: task.startMin,
          endMin: task.endMin,
          durationMin: duration,
          reason: `SKILL_DEFICIT (${worker.name} lacks ${task.requiredSkill})`
        });
        return;
      }

      // Valid task assignment candidate
      coveredTaskMin += duration;
      workerAssignments[worker.id].push(task);
    });

    // Check for double-booking concurrency conflicts
    this.workers.forEach(worker => {
      const assigned = workerAssignments[worker.id] || [];
      for (let i = 0; i < assigned.length; i++) {
        for (let j = i + 1; j < assigned.length; j++) {
          const t1 = assigned[i];
          const t2 = assigned[j];

          // Overlap: start1 < end2 && start2 < end1
          if (t1.startMin < t2.endMin && t2.startMin < t1.endMin) {
            violations.push({
              type: "DOUBLE_BOOKING_CONFLICT",
              workerId: worker.id,
              workerName: worker.name,
              task1: t1.taskId,
              task2: t2.taskId,
              station1: t1.station,
              station2: t2.station,
              overlapStartMin: Math.max(t1.startMin, t2.startMin),
              overlapEndMin: Math.min(t1.endMin, t2.endMin),
              reason: `${worker.name} double-booked across ${t1.station} and ${t2.station} simultaneously`
            });
          }
        }
      }
    });

    const isFeasible = uncoveredTasks.length === 0 && violations.length === 0;
    const coveragePct = totalTaskMin > 0 ? Math.round((coveredTaskMin / totalTaskMin) * 100) : 100;

    return {
      rosterMode: this.rosterMode,
      totalTaskMin,
      coveredTaskMin,
      uncoveredTaskMin: totalTaskMin - coveredTaskMin,
      coveragePct,
      isFeasible,
      violations,
      uncoveredTasks,
      workerStats: this.calculateWorkerStats(workerAssignments)
    };
  }

  calculateWorkerStats(workerAssignments) {
    return this.workers.map(w => {
      const assigned = workerAssignments[w.id] || [];
      const totalMinutes = assigned.reduce((sum, t) => sum + (t.endMin - t.startMin), 0);
      return {
        id: w.id,
        name: w.name,
        type: w.type,
        isPresent: w.isPresent,
        skillsCount: w.skills.length,
        assignedTasksCount: assigned.length,
        totalHoursWorked: Math.round((totalMinutes / 60) * 10) / 10
      };
    });
  }

  log(message, type = "INFO") {
    this.auditLog.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      message,
      type
    });
    if (this.auditLog.length > 50) this.auditLog.pop();
  }
}
