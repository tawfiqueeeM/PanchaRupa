/**
 * Production Scheduling Domain Engine & Rescheduling Adapter
 * Implements discrete workstation constraint programming, shared machine
 * mutual exclusion (Roller, Dryer), changeover cleanup, outage injection,
 * and Before vs After comparison with visible infeasibility detection.
 */

export class SchedulingEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.shiftStartMin = 0;   // 08:00
    this.shiftEndMin = 540;   // 17:00 (9 hours / 540 min)
    this.orders = [];
    this.outages = [];
    this.schedule = null;
    this.baselineSchedule = null;
    this.history = [];
    this.auditLog = [];
    this.log("Scheduling engine initialized (Shift: 08:00 - 17:00)", "INFO");
  }

  loadScenario(scenario) {
    this.shiftStartMin = scenario.shiftStartMin ?? 0;
    this.shiftEndMin = scenario.shiftEndMin ?? 540;
    this.orders = JSON.parse(JSON.stringify(scenario.orders || []));
    this.outages = JSON.parse(JSON.stringify(scenario.outages || []));

    // Calculate baseline schedule (ignoring outages)
    this.baselineSchedule = this.computeSchedule(this.orders, []);
    
    // Calculate actual schedule (including active outages)
    this.schedule = this.computeSchedule(this.orders, this.outages);

    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.schedule;
  }

  setOutages(outages) {
    this.outages = JSON.parse(JSON.stringify(outages || []));
    this.schedule = this.computeSchedule(this.orders, this.outages);
    this.log(`Updated machine outages count: ${this.outages.length}`, "ACTION");
    return this.schedule;
  }

  updateOrderQuantity(batchId, quantityKg) {
    const order = this.orders.find(o => o.batchId === batchId);
    if (!order) return false;
    
    const factor = quantityKg / order.quantityKg;
    order.quantityKg = Math.max(5, Math.min(150, Number(quantityKg)));
    
    // Scale durations proportionally
    order.steps.forEach(step => {
      step.durationMin = Math.max(15, Math.round(step.durationMin * factor));
    });

    this.schedule = this.computeSchedule(this.orders, this.outages);
    this.log(`Updated batch ${batchId} quantity to ${order.quantityKg} kg, recomputed schedule`, "ACTION");
    return true;
  }

  computeSchedule(orders, outages) {
    const machineCalendars = {
      WITHERING_TROUGH: [],
      FIXATION_DRUM: [],
      SHARED_ROLLER: [],
      OXIDATION_CHAMBER: [],
      SHARED_DRYER: [],
      PACKING_LINE: []
    };

    // Insert machine outages first
    outages.forEach(outage => {
      if (machineCalendars[outage.machine]) {
        machineCalendars[outage.machine].push({
          type: "OUTAGE",
          outageId: outage.outageId,
          startMin: outage.startMin,
          endMin: outage.endMin,
          reason: outage.reason
        });
      }
    });

    const scheduledBatches = [];
    const batchAvailability = {};
    const lastProductOnMachine = {};

    orders.forEach(order => {
      batchAvailability[order.batchId] = this.shiftStartMin;
      scheduledBatches.push({
        batchId: order.batchId,
        product: order.product,
        quantityKg: order.quantityKg,
        targetTime: order.targetTime,
        steps: [],
        completionMin: 0,
        isLate: false,
        delayMin: 0
      });
    });

    // Schedule iteratively stage-by-stage across batches
    const maxSteps = Math.max(...orders.map(o => o.steps.length), 0);

    for (let stepIdx = 0; stepIdx < maxSteps; stepIdx++) {
      orders.forEach((order, oIdx) => {
        if (stepIdx >= order.steps.length) return;

        const stepDef = order.steps[stepIdx];
        const machine = stepDef.machine;
        const cal = machineCalendars[machine] || [];

        let earliestStart = batchAvailability[order.batchId];

        // Check changeover penalty on shared machines if product changes
        let cleanMin = 0;
        if (lastProductOnMachine[machine] && lastProductOnMachine[machine] !== order.product) {
          cleanMin = stepDef.cleanMin || 15;
        }

        const taskDuration = stepDef.durationMin;
        const totalDuration = cleanMin + taskDuration;

        // Find earliest non-overlapping slot on machine calendar
        let scheduledStart = earliestStart;
        let conflict = true;

        while (conflict) {
          conflict = false;
          const proposedEnd = scheduledStart + totalDuration;

          for (const slot of cal) {
            // Overlap condition: start < slot.end && end > slot.start
            if (scheduledStart < slot.endMin && proposedEnd > slot.startMin) {
              // Push start to after this slot
              scheduledStart = slot.endMin;
              conflict = true;
              break;
            }
          }
        }

        const taskStart = scheduledStart + cleanMin;
        const taskEnd = taskStart + taskDuration;

        // Record slot
        cal.push({
          type: "TASK",
          batchId: order.batchId,
          product: order.product,
          stepIndex: stepIdx,
          machine,
          cleanMin,
          cleanStartMin: scheduledStart,
          startMin: taskStart,
          endMin: taskEnd
        });

        // Keep calendar sorted
        cal.sort((a, b) => a.startMin - b.startMin);
        lastProductOnMachine[machine] = order.product;
        batchAvailability[order.batchId] = taskEnd;

        // Append to batch result
        scheduledBatches[oIdx].steps.push({
          stepIndex: stepIdx,
          machine,
          cleanMin,
          startMin: taskStart,
          endMin: taskEnd,
          durationMin: taskDuration,
          startTimeStr: this.minToTimeStr(taskStart),
          endTimeStr: this.minToTimeStr(taskEnd)
        });
        scheduledBatches[oIdx].completionMin = taskEnd;
      });
    }

    // Evaluate feasibility
    let makespanMin = 0;
    let anyInfeasible = false;
    const infeasibilities = [];

    scheduledBatches.forEach(b => {
      makespanMin = Math.max(makespanMin, b.completionMin);
      if (b.completionMin > this.shiftEndMin) {
        b.isLate = true;
        b.delayMin = b.completionMin - this.shiftEndMin;
        anyInfeasible = true;
        infeasibilities.push({
          batchId: b.batchId,
          completionMin: b.completionMin,
          completionTime: this.minToTimeStr(b.completionMin),
          delayMin: b.delayMin,
          reason: `Batch completion (${this.minToTimeStr(b.completionMin)}) exceeds shift cutoff (17:00 / ${this.shiftEndMin}m)`
        });
      }
    });

    return {
      shiftStartMin: this.shiftStartMin,
      shiftEndMin: this.shiftEndMin,
      batches: scheduledBatches,
      machineCalendars,
      makespanMin,
      makespanTime: this.minToTimeStr(makespanMin),
      isFeasible: !anyInfeasible,
      infeasibilities
    };
  }

  getComparison() {
    if (!this.baselineSchedule || !this.schedule) return null;

    const baselineMakespan = this.baselineSchedule.makespanMin;
    const revisedMakespan = this.schedule.makespanMin;
    const makespanDelta = revisedMakespan - baselineMakespan;

    const batchComparisons = this.schedule.batches.map(revBatch => {
      const baseBatch = this.baselineSchedule.batches.find(b => b.batchId === revBatch.batchId);
      const baseComp = baseBatch ? baseBatch.completionMin : 0;
      const delay = revBatch.completionMin - baseComp;
      return {
        batchId: revBatch.batchId,
        product: revBatch.product,
        baseCompletionTime: this.minToTimeStr(baseComp),
        revisedCompletionTime: this.minToTimeStr(revBatch.completionMin),
        delayMin: delay,
        wasFeasible: baseBatch ? !baseBatch.isLate : true,
        isFeasible: !revBatch.isLate
      };
    });

    return {
      baselineMakespanTime: this.minToTimeStr(baselineMakespan),
      revisedMakespanTime: this.minToTimeStr(revisedMakespan),
      makespanDeltaMin: makespanDelta,
      baselineFeasible: this.baselineSchedule.isFeasible,
      revisedFeasible: this.schedule.isFeasible,
      batchComparisons,
      activeOutages: this.outages
    };
  }

  minToTimeStr(mins) {
    const totalMinutes = 8 * 60 + mins; // starts at 08:00
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
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
