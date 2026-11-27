/**
 * Green Tea Sequence Domain Engine & Fixture Adapter
 * Enforces Drum -> Roller -> Dryer progression, recipe parameters,
 * resource contention interlocks, waiting reasons, and batch retention.
 */

export const DEFAULT_RECIPES = [
  {
    recipeId: "GT-STD-01",
    name: "Standard Green Tea",
    drumTempC: 230,
    drumDurationMin: 35,
    rollerDurationMin: 30,
    dryerTempC: 95,
    dryerDurationMin: 60,
    yieldFraction: 0.25
  },
  {
    recipeId: "GT-DEL-02",
    name: "Spring Delicate Flush",
    drumTempC: 210,
    drumDurationMin: 25,
    rollerDurationMin: 20,
    dryerTempC: 90,
    dryerDurationMin: 50,
    yieldFraction: 0.26
  },
  {
    recipeId: "GT-ROAST-03",
    name: "High Roast Green Tea",
    drumTempC: 245,
    drumDurationMin: 40,
    rollerDurationMin: 35,
    dryerTempC: 105,
    dryerDurationMin: 65,
    yieldFraction: 0.24
  }
];

export class GreenTeaEngine {
  constructor(recipes = DEFAULT_RECIPES) {
    this.recipes = recipes;
    this.reset();
  }

  reset() {
    this.selectedRecipe = this.recipes[0];
    this.activeBatch = {
      batchId: "B-G01",
      recipeId: this.selectedRecipe.recipeId,
      productName: this.selectedRecipe.name,
      freshLeafKg: 120.0,
      expectedOutputKg: 30.0,
      actualOutputKg: 0.0,
      currentStage: "IDLE", // IDLE, DRUM, WAITING_FOR_ROLLER, ROLLER, WAITING_FOR_DRYER, DRYER, COMPLETED
      waitingReason: null,
      stageElapsedMin: 0,
      totalElapsedMin: 0
    };

    this.stations = {
      drum: { status: "IDLE", tempC: this.selectedRecipe.drumTempC, occupiedBy: null },
      roller: { isAvailable: true, status: "IDLE", blockReason: null, occupiedBy: null },
      dryer: { isAvailable: true, status: "IDLE", tempC: this.selectedRecipe.dryerTempC, blockReason: null, occupiedBy: null }
    };

    this.totalFinishedKg = 0.0;
    this.completedBatches = [];
    this.eventLedger = [];
    this.logEvent("Green tea sequence engine initialized to IDLE", "INFO");
  }

  selectRecipe(recipeId) {
    const found = this.recipes.find(r => r.recipeId === recipeId);
    if (!found) return false;
    this.selectedRecipe = found;
    this.activeBatch.recipeId = found.recipeId;
    this.activeBatch.productName = found.name;
    this.activeBatch.expectedOutputKg = Math.round(this.activeBatch.freshLeafKg * found.yieldFraction * 100) / 100;
    this.stations.drum.tempC = found.drumTempC;
    this.stations.dryer.tempC = found.dryerTempC;
    this.logEvent(`Recipe selected: ${found.name} (${found.recipeId}) - Drum:${found.drumTempC}°C, Roll:${found.rollerDurationMin}m, Dry:${found.dryerTempC}°C`, "INFO");
    return true;
  }

  loadScenario(scenario) {
    this.reset();
    if (scenario.recipeId) this.selectRecipe(scenario.recipeId);
    this.activeBatch.batchId = scenario.batchId || "B-G01";
    this.activeBatch.freshLeafKg = scenario.freshLeafKg || 120.0;
    this.activeBatch.expectedOutputKg = Math.round(this.activeBatch.freshLeafKg * this.selectedRecipe.yieldFraction * 100) / 100;

    if (scenario.rollerInitiallyAvailable !== undefined) {
      this.stations.roller.isAvailable = scenario.rollerInitiallyAvailable;
      this.stations.roller.blockReason = scenario.rollerBlockReason || null;
    }
    if (scenario.dryerInitiallyAvailable !== undefined) {
      this.stations.dryer.isAvailable = scenario.dryerInitiallyAvailable;
      this.stations.dryer.blockReason = scenario.dryerBlockReason || null;
    }

    this.logEvent(`Loaded scenario: ${scenario.scenarioId} (${scenario.description})`, "INFO");
  }

  setRollerAvailable(isAvailable, reason = null) {
    this.stations.roller.isAvailable = Boolean(isAvailable);
    this.stations.roller.blockReason = isAvailable ? null : (reason || "Roller occupied by another batch");
    
    if (isAvailable && this.activeBatch.currentStage === "WAITING_FOR_ROLLER") {
      this.logEvent("Roller resource released! Transitioning waiting batch into Shared Roller.", "ACTION");
      this.transitionToRoller();
    } else if (!isAvailable) {
      this.logEvent(`Roller resource locked: ${this.stations.roller.blockReason}`, "WARN");
    }
  }

  setDryerAvailable(isAvailable, reason = null) {
    this.stations.dryer.isAvailable = Boolean(isAvailable);
    this.stations.dryer.blockReason = isAvailable ? null : (reason || "Dryer occupied by another batch");

    if (isAvailable && this.activeBatch.currentStage === "WAITING_FOR_DRYER") {
      this.logEvent("Dryer resource released! Transitioning waiting batch into Shared Final Dryer.", "ACTION");
      this.transitionToDryer();
    } else if (!isAvailable) {
      this.logEvent(`Dryer resource locked: ${this.stations.dryer.blockReason}`, "WARN");
    }
  }

  startBatch(newBatchId = null, newFreshLeafKg = null) {
    if (this.activeBatch.currentStage === "COMPLETED") {
      if (!newBatchId || newBatchId === this.activeBatch.batchId) {
        this.logEvent(`Cannot restart completed batch ${this.activeBatch.batchId}: Batch is already finished. Reset demo or supply a distinct batch ID.`, "WARN");
        return false;
      }
      this.activeBatch.batchId = newBatchId;
      this.activeBatch.freshLeafKg = newFreshLeafKg || 120.0;
    } else if (this.activeBatch.currentStage !== "IDLE") {
      this.logEvent("Cannot start new batch: line is currently active.", "WARN");
      return false;
    }

    this.activeBatch.currentStage = "DRUM";
    this.activeBatch.waitingReason = null;
    this.activeBatch.stageElapsedMin = 0;
    this.activeBatch.totalElapsedMin = 0;
    this.stations.drum.status = "RUNNING";
    this.stations.drum.occupiedBy = this.activeBatch.batchId;

    this.logEvent(`Batch ${this.activeBatch.batchId} START: Loaded ${this.activeBatch.freshLeafKg} kg into Heated Drum for fixation.`, "ACTION");
    return true;
  }

  stepLine() {
    const stage = this.activeBatch.currentStage;
    switch (stage) {
      case "IDLE":
        return this.startBatch();

      case "DRUM":
        // Drum cycle finishes
        this.activeBatch.totalElapsedMin += this.selectedRecipe.drumDurationMin;
        this.stations.drum.status = "COMPLETE";
        this.stations.drum.occupiedBy = null;
        this.logEvent(`Heated drum fixation complete for Batch ${this.activeBatch.batchId} (${this.selectedRecipe.drumDurationMin} min). Requesting Roller handoff...`, "INFO");

        if (this.stations.roller.isAvailable) {
          this.transitionToRoller();
        } else {
          this.activeBatch.currentStage = "WAITING_FOR_ROLLER";
          this.activeBatch.waitingReason = this.stations.roller.blockReason || "Roller occupied by Golden Tea Batch B-O01";
          this.logEvent(`HANDOFF BLOCKED: Batch ${this.activeBatch.batchId} retained in drum hopper. Reason: ${this.activeBatch.waitingReason}`, "ALARM");
        }
        return true;

      case "WAITING_FOR_ROLLER":
        if (this.stations.roller.isAvailable) {
          this.transitionToRoller();
          return true;
        } else {
          this.logEvent(`Cannot advance: Roller still unavailable. Reason: ${this.activeBatch.waitingReason}`, "WARN");
          return false;
        }

      case "ROLLER":
        // Rolling cycle finishes
        this.activeBatch.totalElapsedMin += this.selectedRecipe.rollerDurationMin;
        this.stations.roller.status = "COMPLETE";
        this.stations.roller.occupiedBy = null;
        this.logEvent(`Rolling cycle complete for Batch ${this.activeBatch.batchId} (${this.selectedRecipe.rollerDurationMin} min). Requesting Dryer handoff...`, "INFO");

        if (this.stations.dryer.isAvailable) {
          this.transitionToDryer();
        } else {
          this.activeBatch.currentStage = "WAITING_FOR_DRYER";
          this.activeBatch.waitingReason = this.stations.dryer.blockReason || "Dryer reserved for Golden Tea Batch B-O01";
          this.logEvent(`HANDOFF BLOCKED: Batch ${this.activeBatch.batchId} retained in roller tray. Reason: ${this.activeBatch.waitingReason}`, "ALARM");
        }
        return true;

      case "WAITING_FOR_DRYER":
        if (this.stations.dryer.isAvailable) {
          this.transitionToDryer();
          return true;
        } else {
          this.logEvent(`Cannot advance: Dryer still unavailable. Reason: ${this.activeBatch.waitingReason}`, "WARN");
          return false;
        }

      case "DRYER":
        // Final drying finishes -> Complete handoff and increment output
        this.activeBatch.totalElapsedMin += this.selectedRecipe.dryerDurationMin;
        this.stations.dryer.status = "COMPLETE";
        this.stations.dryer.occupiedBy = null;
        this.completeBatch();
        return true;

      case "COMPLETED":
        this.logEvent("Batch is already completed. Reset or load another scenario.", "INFO");
        return false;
    }
  }

  transitionToRoller() {
    this.activeBatch.currentStage = "ROLLER";
    this.activeBatch.waitingReason = null;
    this.activeBatch.stageElapsedMin = 0;
    this.stations.roller.status = "RUNNING";
    this.stations.roller.occupiedBy = this.activeBatch.batchId;
    this.logEvent(`Batch ${this.activeBatch.batchId} entering Shared Roller. Duration: ${this.selectedRecipe.rollerDurationMin} min.`, "ACTION");
  }

  transitionToDryer() {
    this.activeBatch.currentStage = "DRYER";
    this.activeBatch.waitingReason = null;
    this.activeBatch.stageElapsedMin = 0;
    this.stations.dryer.status = "RUNNING";
    this.stations.dryer.occupiedBy = this.activeBatch.batchId;
    this.logEvent(`Batch ${this.activeBatch.batchId} entering Shared Final Dryer. Duration: ${this.selectedRecipe.dryerDurationMin} min @ ${this.selectedRecipe.dryerTempC}°C.`, "ACTION");
  }

  completeBatch() {
    this.activeBatch.currentStage = "COMPLETED";
    this.activeBatch.waitingReason = null;
    this.activeBatch.actualOutputKg = this.activeBatch.expectedOutputKg;
    this.totalFinishedKg = Math.round((this.totalFinishedKg + this.activeBatch.actualOutputKg) * 100) / 100;

    const record = {
      timestamp: new Date().toISOString(),
      batchId: this.activeBatch.batchId,
      recipeId: this.activeBatch.recipeId,
      productName: this.activeBatch.productName,
      freshLeafKg: this.activeBatch.freshLeafKg,
      finishedKg: this.activeBatch.actualOutputKg,
      totalDurationMin: this.activeBatch.totalElapsedMin,
      status: "RELEASED_TO_INSPECTION"
    };

    this.completedBatches.unshift(record);
    this.logEvent(`Batch ${this.activeBatch.batchId} COMPLETED: Handoff verified. Output counter incremented (+${this.activeBatch.actualOutputKg} kg). Total factory finished: ${this.totalFinishedKg} kg.`, "INFO");
  }

  logEvent(message, type = "INFO") {
    const entry = {
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      message,
      type
    };
    this.eventLedger.unshift(entry);
    if (this.eventLedger.length > 50) this.eventLedger.pop();
  }

  getSnapshot() {
    return {
      activeBatch: { ...this.activeBatch },
      selectedRecipe: { ...this.selectedRecipe },
      stations: {
        drum: { ...this.stations.drum },
        roller: { ...this.stations.roller },
        dryer: { ...this.stations.dryer }
      },
      totalFinishedKg: this.totalFinishedKg,
      completedBatches: [...this.completedBatches],
      eventLedger: [...this.eventLedger]
    };
  }
}
