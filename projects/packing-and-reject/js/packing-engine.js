/**
 * Packing & Reject Weighing Domain Engine & Fixture Adapter
 * Simulates coarse/fine dosing, dynamic checkweighing, reject lane diversion,
 * strict single-dispatch channel gating, and mass conservation.
 */

export const DEFAULT_FORMATS = [
  {
    formatId: "RETAIL_50G",
    name: "50g Retail Bottle",
    targetNetG: 50.0,
    toleranceG: 1.5,
    minWeightG: 48.5,
    maxWeightG: 51.5,
    channel: "RETAIL"
  },
  {
    formatId: "RETAIL_100G",
    name: "100g Retail Bottle",
    targetNetG: 100.0,
    toleranceG: 2.0,
    minWeightG: 98.0,
    maxWeightG: 102.0,
    channel: "RETAIL"
  },
  {
    formatId: "BULK_25KG",
    name: "25kg Bulk Auction Bag",
    targetNetG: 25000.0,
    toleranceG: 100.0,
    minWeightG: 24900.0,
    maxWeightG: 25100.0,
    channel: "AUCTION"
  }
];

export class PackingEngine {
  constructor(formats = DEFAULT_FORMATS) {
    this.formats = formats;
    this.serialCounter = 1;
    this.reset();
  }

  reset() {
    this.selectedFormat = this.formats[0]; // RETAIL_50G
    this.activePack = {
      packId: `PK-${String(this.serialCounter).padStart(4, "0")}`,
      sourceLotId: "F-G01",
      formatId: this.selectedFormat.formatId,
      formatName: this.selectedFormat.name,
      targetNetG: this.selectedFormat.targetNetG,
      actualNetG: 0.0,
      dosingState: "EMPTY", // EMPTY, COARSE_DONE, FINE_DONE
      checkweighStatus: "PENDING", // PENDING, PASSED, REJECTED_UNDERFILL, REJECTED_OVERFILL
      dispatchStatus: "NOT_DISPATCHED", // NOT_DISPATCHED, DISPATCHED, REJECTED_QUARANTINE
      rejectPusherActive: false
    };

    this.massLedger = {
      totalDosedG: 0.0,
      totalDispatchedG: 0.0,
      totalRejectedG: 0.0,
      countDispatched: 0,
      countRejected: 0
    };

    this.dispatchedHistory = [];
    this.rejectHistory = [];
    this.eventLedger = [];
    this.logEvent("Packing engine initialized for container PK-0001", "INFO");
  }

  selectFormat(formatId) {
    const fmt = this.formats.find(f => f.formatId === formatId);
    if (!fmt) return false;
    this.selectedFormat = fmt;
    this.activePack.formatId = fmt.formatId;
    this.activePack.formatName = fmt.name;
    this.activePack.targetNetG = fmt.targetNetG;
    this.activePack.actualNetG = 0.0;
    this.activePack.dosingState = "EMPTY";
    this.activePack.checkweighStatus = "PENDING";
    this.activePack.dispatchStatus = "NOT_DISPATCHED";
    this.activePack.rejectPusherActive = false;
    this.logEvent(`Packaging format changed to ${fmt.name} (Target: ${fmt.targetNetG}g ±${fmt.toleranceG}g)`, "INFO");
    return true;
  }

  loadScenario(scenario) {
    if (scenario.formatId) this.selectFormat(scenario.formatId);
    if (scenario.sourceLotId) this.activePack.sourceLotId = scenario.sourceLotId;

    if (scenario.simulatedWeightG !== undefined) {
      this.activePack.actualNetG = scenario.simulatedWeightG;
      this.activePack.dosingState = "FINE_DONE";
      this.checkweigh();
    }
    this.logEvent(`Loaded scenario: ${scenario.scenarioId} (${scenario.description})`, "INFO");
  }

  runCoarseDosing() {
    const target = this.selectedFormat.targetNetG;
    // Coarse dosing fills ~85% of target with slight random variation
    const coarseWeight = Math.round(target * 0.85 * 10) / 10;
    this.activePack.actualNetG = coarseWeight;
    this.activePack.dosingState = "COARSE_DONE";
    this.activePack.checkweighStatus = "PENDING";
    this.logEvent(`Coarse dosing complete: Delivered ${coarseWeight}g (~85% of target) via %Q4.0`, "ACTION");
    return coarseWeight;
  }

  runFineDosing(customFinalWeight = null) {
    let finalWeight = customFinalWeight;
    if (finalWeight === null || finalWeight === undefined) {
      // Nominal precision dosing lands within ±0.3% of target
      const target = this.selectedFormat.targetNetG;
      const variation = (Math.random() * 0.4 - 0.2) * (this.selectedFormat.toleranceG / 2);
      finalWeight = Math.round((target + variation) * 10) / 10;
    }

    this.activePack.actualNetG = Number(finalWeight) || 0;
    this.activePack.dosingState = "FINE_DONE";
    this.logEvent(`Fine trickle dosing complete: Final net mass on cell = ${this.activePack.actualNetG}g via %Q4.1`, "ACTION");
    this.checkweigh();
    return this.activePack.actualNetG;
  }

  injectUnderfill() {
    const target = this.selectedFormat.targetNetG;
    // Inject a clear underfill ~15% below lower tolerance
    const underfillWeight = Math.round((this.selectedFormat.minWeightG - target * 0.12) * 10) / 10;
    this.activePack.actualNetG = underfillWeight;
    this.activePack.dosingState = "FINE_DONE";
    this.logEvent(`FAULT INJECTED: Underfilled container at ${underfillWeight}g (Min allowed: ${this.selectedFormat.minWeightG}g)`, "WARN");
    this.checkweigh();
  }

  checkweigh() {
    const weight = this.activePack.actualNetG;
    const fmt = this.selectedFormat;

    if (weight < fmt.minWeightG) {
      this.activePack.checkweighStatus = "REJECTED_UNDERFILL";
      this.activePack.rejectPusherActive = true;
      this.logEvent(`CHECKWEIGHER REJECT: Pack ${this.activePack.packId} is UNDERFILLED (${weight}g < ${fmt.minWeightG}g). Diverting to Reject Bin (%Q4.2 pulsed).`, "ALARM");
    } else if (weight > fmt.maxWeightG) {
      this.activePack.checkweighStatus = "REJECTED_OVERFILL";
      this.activePack.rejectPusherActive = true;
      this.logEvent(`CHECKWEIGHER REJECT: Pack ${this.activePack.packId} is OVERFILLED (${weight}g > ${fmt.maxWeightG}g). Diverting to Reject Bin (%Q4.2 pulsed).`, "ALARM");
    } else {
      this.activePack.checkweighStatus = "PASSED";
      this.activePack.rejectPusherActive = false;
      this.logEvent(`CHECKWEIGHER PASS: Pack ${this.activePack.packId} within tolerance (${weight}g in [${fmt.minWeightG}, ${fmt.maxWeightG}]g). Accept conveyor active (%Q4.3).`, "INFO");
    }

    return this.activePack.checkweighStatus;
  }

  dispatch() {
    if (this.activePack.dispatchStatus === "DISPATCHED") {
      this.logEvent(`DISPATCH REJECTED: Pack ${this.activePack.packId} has already been dispatched! Duplicate dispatch prevented.`, "WARN");
      return { success: false, reason: "ALREADY_DISPATCHED" };
    }

    if (this.activePack.checkweighStatus.startsWith("REJECTED")) {
      this.activePack.dispatchStatus = "REJECTED_QUARANTINE";
      const rejectRecord = {
        timestamp: new Date().toISOString(),
        packId: this.activePack.packId,
        sourceLotId: this.activePack.sourceLotId,
        formatId: this.activePack.formatId,
        actualNetG: this.activePack.actualNetG,
        targetNetG: this.activePack.targetNetG,
        reason: this.activePack.checkweighStatus,
        status: "QUARANTINED"
      };
      this.rejectHistory.unshift(rejectRecord);
      this.massLedger.totalRejectedG += this.activePack.actualNetG;
      this.massLedger.countRejected += 1;
      this.massLedger.totalDosedG += this.activePack.actualNetG;

      this.logEvent(`INTERLOCK ACTION: Rejected pack ${this.activePack.packId} strictly excluded from shipping manifest. Preserved in quarantine ledger with source lot ${this.activePack.sourceLotId}.`, "ALARM");
      
      this.prepareNextContainer();
      return { success: false, reason: "CANNOT_DISPATCH_REJECTED" };
    }

    if (this.activePack.checkweighStatus !== "PASSED") {
      this.logEvent("DISPATCH BLOCKED: Pack has not passed checkweigh inspection.", "WARN");
      return { success: false, reason: "CHECKWEIGH_PENDING" };
    }

    // Success dispatch
    this.activePack.dispatchStatus = "DISPATCHED";
    const dispatchRecord = {
      timestamp: new Date().toISOString(),
      packId: this.activePack.packId,
      sourceLotId: this.activePack.sourceLotId,
      formatId: this.activePack.formatId,
      channel: this.selectedFormat.channel,
      actualNetG: this.activePack.actualNetG,
      targetNetG: this.activePack.targetNetG,
      status: "DISPATCHED_TO_CHANNEL"
    };

    this.dispatchedHistory.unshift(dispatchRecord);
    this.massLedger.totalDispatchedG += this.activePack.actualNetG;
    this.massLedger.countDispatched += 1;
    this.massLedger.totalDosedG += this.activePack.actualNetG;

    this.logEvent(`DISPATCH SUCCESS: Pack ${this.activePack.packId} entered ${this.selectedFormat.channel} channel exactly once. Mass: ${this.activePack.actualNetG}g.`, "INFO");

    this.prepareNextContainer();
    return { success: true };
  }

  prepareNextContainer() {
    this.serialCounter += 1;
    this.activePack = {
      packId: `PK-${String(this.serialCounter).padStart(4, "0")}`,
      sourceLotId: this.activePack.sourceLotId,
      formatId: this.selectedFormat.formatId,
      formatName: this.selectedFormat.name,
      targetNetG: this.selectedFormat.targetNetG,
      actualNetG: 0.0,
      dosingState: "EMPTY",
      checkweighStatus: "PENDING",
      dispatchStatus: "NOT_DISPATCHED",
      rejectPusherActive: false
    };
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
      activePack: { ...this.activePack },
      selectedFormat: { ...this.selectedFormat },
      massLedger: { ...this.massLedger },
      dispatchedHistory: [...this.dispatchedHistory],
      rejectHistory: [...this.rejectHistory],
      eventLedger: [...this.eventLedger]
    };
  }
}
