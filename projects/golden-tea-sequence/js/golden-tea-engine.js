/**
 * Golden Tea Sequence Domain Engine & Fixture Adapter
 * Enforces leaf eligibility, Withering -> Rolling -> Oxidation -> Drying flow,
 * shared dryer mutual exclusion, waiting states, and batch mass accounting.
 */

export const DEFAULT_OXIDATION_PROFILES = [
  {
    profileId: "OX-LIGHT-01",
    name: "Light Golden Flush",
    oxidationMin: 60,
    tempC: 24.0,
    targetRh: 0.90,
    liquorColor: "Bright Golden Yellow",
    yieldFraction: 0.25
  },
  {
    profileId: "OX-MED-02",
    name: "Classic Amber Golden",
    oxidationMin: 90,
    tempC: 25.0,
    targetRh: 0.90,
    liquorColor: "Deep Golden Amber",
    yieldFraction: 0.25
  },
  {
    profileId: "OX-DEEP-03",
    name: "Deep Muscatel Golden",
    oxidationMin: 120,
    tempC: 26.0,
    targetRh: 0.92,
    liquorColor: "Coppery Red Gold",
    yieldFraction: 0.24
  }
];

export class GoldenTeaEngine {
  constructor(profiles = DEFAULT_OXIDATION_PROFILES) {
    this.profiles = profiles;
    this.reset();
  }

  reset() {
    this.selectedProfile = this.profiles[1]; // OX-MED-02
    this.activeBatch = {
      batchId: "B-O01",
      lotId: "L-O01",
      isLeafEligible: true,
      freshKg: 40.0,
      expectedOutputKg: 10.0,
      actualOutputKg: 0.0,
      currentStage: "IDLE", // IDLE, WITHERING, ROLLER, OXIDATION, WAITING_FOR_DRYER, DRYER, COMPLETED
      waitingReason: null,
      totalElapsedMin: 0
    };

    this.sharedDryer = {
      state: "FREE", // FREE, RESERVED_GOLDEN, BUSY_GOLDEN, RESERVED_GREEN, BUSY_GREEN
      ownerBatchId: null,
      tempC: 95.0,
      durationMin: 60
    };

    this.totalFinishedGoldenKg = 0.0;
    this.completedBatches = [];
    this.eventLedger = [];
    this.logEvent("Golden tea sequence engine initialized to IDLE", "INFO");
  }

  selectProfile(profileId) {
    const found = this.profiles.find(p => p.profileId === profileId);
    if (!found) return false;
    this.selectedProfile = found;
    this.activeBatch.expectedOutputKg = Math.round(this.activeBatch.freshKg * found.yieldFraction * 100) / 100;
    this.logEvent(`Oxidation profile selected: ${found.name} (${found.oxidationMin} min @ ${found.tempC}°C / ${Math.round(found.targetRh * 100)}% RH)`, "INFO");
    return true;
  }

  setLeafEligible(isEligible) {
    this.activeBatch.isLeafEligible = Boolean(isEligible);
    if (!isEligible) {
      this.logEvent("Quality Gate: Lot classified as INELIGIBLE for Golden Tea (coarse / non-bud grade)", "WARN");
    } else {
      this.logEvent("Quality Gate: Lot classified as GOLDEN_ELIGIBLE (tender shoot grade verified)", "INFO");
    }
  }

  loadScenario(scenario) {
    this.reset();
    if (scenario.profileId) this.selectProfile(scenario.profileId);
    this.activeBatch.batchId = scenario.batchId || "B-O01";
    this.activeBatch.lotId = scenario.lotId || "L-O01";
    this.activeBatch.freshKg = scenario.freshKg || 40.0;
    this.activeBatch.expectedOutputKg = Math.round(this.activeBatch.freshKg * this.selectedProfile.yieldFraction * 100) / 100;
    this.setLeafEligible(scenario.leafEligible !== false);

    if (scenario.dryerInitialState === "BUSY_GREEN") {
      this.setDryerExternalLock(true, scenario.dryerOwner || "B-G01");
    } else {
      this.setDryerExternalLock(false);
    }

    this.logEvent(`Loaded scenario: ${scenario.scenarioId} (${scenario.description})`, "INFO");
  }

  setDryerExternalLock(isLockedByGreen, greenBatchId = "B-G01") {
    if (isLockedByGreen) {
      this.sharedDryer.state = "BUSY_GREEN";
      this.sharedDryer.ownerBatchId = greenBatchId;
      this.logEvent(`Shared Dryer occupied by Green Tea Batch ${greenBatchId} (%I2.0 locked)`, "WARN");

      // If active golden batch was waiting or in dryer, hold it
      if (this.activeBatch.currentStage === "DRYER") {
        this.activeBatch.currentStage = "WAITING_FOR_DRYER";
        this.activeBatch.waitingReason = `Shared dryer seized by Green Tea Batch ${greenBatchId}`;
      }
    } else {
      this.sharedDryer.state = "FREE";
      this.sharedDryer.ownerBatchId = null;
      this.logEvent("Shared Dryer released to FREE state (%I2.0 cleared)", "INFO");

      if (this.activeBatch.currentStage === "WAITING_FOR_DRYER") {
        this.logEvent("Dryer freed! Advancing waiting Golden Tea batch into Shared Dryer", "ACTION");
        this.transitionToDryer();
      }
    }
  }

  startBatch() {
    if (!this.activeBatch.isLeafEligible) {
      this.logEvent(`START INHIBITED: Lot ${this.activeBatch.lotId} does not meet Golden Tea tender shoot qualification!`, "ALARM");
      return { success: false, reason: "LEAF_INELIGIBLE" };
    }

    this.activeBatch.currentStage = "WITHERING";
    this.activeBatch.waitingReason = null;
    this.activeBatch.totalElapsedMin = 0;
    this.logEvent(`Batch ${this.activeBatch.batchId} START: Loaded ${this.activeBatch.freshKg} kg into Withering Trays.`, "ACTION");
    return { success: true };
  }

  stepLine() {
    const stage = this.activeBatch.currentStage;
    switch (stage) {
      case "IDLE":
        return this.startBatch().success;

      case "WITHERING":
        // Withering finishes (120m) -> Shared Roller
        this.activeBatch.totalElapsedMin += 120;
        this.activeBatch.currentStage = "ROLLER";
        this.logEvent(`Withering complete (120m, 65% moisture). Transferred Batch ${this.activeBatch.batchId} to Shared Roller.`, "INFO");
        return true;

      case "ROLLER":
        // Rolling finishes (30m) -> Oxidation Racks
        this.activeBatch.totalElapsedMin += 30;
        this.activeBatch.currentStage = "OXIDATION";
        this.logEvent(`Rolling complete (30m). Transferred Batch ${this.activeBatch.batchId} to Oxidation Racks for fermentation.`, "INFO");
        return true;

      case "OXIDATION":
        // Oxidation finishes -> Shared Dryer handoff request
        this.activeBatch.totalElapsedMin += this.selectedProfile.oxidationMin;
        this.logEvent(`Oxidation complete (${this.selectedProfile.oxidationMin}m). Requesting Shared Dryer reservation...`, "INFO");

        if (this.sharedDryer.state === "FREE") {
          this.transitionToDryer();
          return true;
        } else {
          this.activeBatch.currentStage = "WAITING_FOR_DRYER";
          this.activeBatch.waitingReason = `Shared Dryer is occupied by Batch ${this.sharedDryer.ownerBatchId} (Mutual Exclusion active)`;
          this.logEvent(`DRYER CONTENTION: Batch ${this.activeBatch.batchId} held on oxidation racks. Reason: ${this.activeBatch.waitingReason}`, "ALARM");
          return false;
        }

      case "WAITING_FOR_DRYER":
        if (this.sharedDryer.state === "FREE") {
          this.transitionToDryer();
          return true;
        } else {
          this.logEvent(`Cannot advance: Dryer still occupied by ${this.sharedDryer.ownerBatchId}`, "WARN");
          return false;
        }

      case "DRYER":
        // Drying finishes (60m) -> Output completion
        this.activeBatch.totalElapsedMin += this.sharedDryer.durationMin;
        this.completeBatch();
        return true;

      case "COMPLETED":
        this.logEvent("Batch is already completed. Reset to start another.", "INFO");
        return false;
    }
  }

  transitionToDryer() {
    this.sharedDryer.state = "BUSY_GOLDEN";
    this.sharedDryer.ownerBatchId = this.activeBatch.batchId;
    this.activeBatch.currentStage = "DRYER";
    this.activeBatch.waitingReason = null;
    this.logEvent(`Batch ${this.activeBatch.batchId} RESERVED & OCCUPIED Shared Dryer (60 min @ 95°C). Green tea locked out.`, "ACTION");
  }

  completeBatch() {
    this.sharedDryer.state = "FREE";
    this.sharedDryer.ownerBatchId = null;
    this.activeBatch.currentStage = "COMPLETED";
    this.activeBatch.actualOutputKg = this.activeBatch.expectedOutputKg;
    this.totalFinishedGoldenKg = Math.round((this.totalFinishedGoldenKg + this.activeBatch.actualOutputKg) * 100) / 100;

    const record = {
      timestamp: new Date().toISOString(),
      batchId: this.activeBatch.batchId,
      lotId: this.activeBatch.lotId,
      profileId: this.selectedProfile.profileId,
      profileName: this.selectedProfile.name,
      freshKg: this.activeBatch.freshKg,
      finishedKg: this.activeBatch.actualOutputKg,
      liquorColor: this.selectedProfile.liquorColor,
      totalDurationMin: this.activeBatch.totalElapsedMin,
      status: "RELEASED_TO_INSPECTION"
    };

    this.completedBatches.unshift(record);
    this.logEvent(`Batch ${this.activeBatch.batchId} COMPLETED: Finished Golden Tea released (+${this.activeBatch.actualOutputKg} kg). Dryer freed. Total factory golden tea: ${this.totalFinishedGoldenKg} kg.`, "INFO");
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
      selectedProfile: { ...this.selectedProfile },
      sharedDryer: { ...this.sharedDryer },
      totalFinishedGoldenKg: this.totalFinishedGoldenKg,
      completedBatches: [...this.completedBatches],
      eventLedger: [...this.eventLedger]
    };
  }
}
