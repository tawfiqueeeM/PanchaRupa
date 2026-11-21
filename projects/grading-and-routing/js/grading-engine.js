/**
 * Grading & Routing Domain Engine & Fixture Adapter
 * Enforces quality disposition (Hold/Release/Reject), destination bin capacity,
 * full-bin interlocks, source lot preservation, and genealogy tracking.
 */

export const DEFAULT_LOTS = [
  {
    finishedLotId: "F-G01",
    batchId: "B-G01",
    vendorLotId: "L-G01",
    vendorId: "V-01",
    productType: "GREEN",
    netMassKg: 30.0,
    moisturePercent: 3.8,
    infusionScore: 9.2,
    recommendedGrade: "GRADE_A"
  },
  {
    finishedLotId: "F-O01",
    batchId: "B-O01",
    vendorLotId: "L-O01",
    vendorId: "V-02",
    productType: "GOLDEN",
    netMassKg: 10.0,
    moisturePercent: 4.1,
    infusionScore: 9.5,
    recommendedGrade: "GRADE_A"
  }
];

export const DEFAULT_BINS = [
  {
    binId: "BIN-01",
    name: "Bin 1 (Premium Grade A)",
    assignedGrade: "GRADE_A",
    capacityKg: 50.0,
    currentOccupancyKg: 10.0,
    isLocked: false
  },
  {
    binId: "BIN-02",
    name: "Bin 2 (Standard Grade B)",
    assignedGrade: "GRADE_B",
    capacityKg: 50.0,
    currentOccupancyKg: 0.0,
    isLocked: false
  },
  {
    binId: "BIN-03",
    name: "Bin 3 (Secondary Grade C)",
    assignedGrade: "GRADE_C",
    capacityKg: 30.0,
    currentOccupancyKg: 0.0,
    isLocked: false
  }
];

export class GradingEngine {
  constructor(lots = DEFAULT_LOTS, bins = DEFAULT_BINS) {
    this.initialLots = lots;
    this.initialBins = bins;
    this.reset();
  }

  reset() {
    this.lots = JSON.parse(JSON.stringify(this.initialLots));
    this.bins = JSON.parse(JSON.stringify(this.initialBins));
    this.activeLot = {
      ...this.lots[0],
      grade: "GRADE_A",
      disposition: "PENDING", // PENDING, RELEASED, ON_HOLD, REJECTED
      decisionReason: null,
      targetBinId: "BIN-01",
      routingState: "IDLE", // IDLE, ROUTING, ROUTED, BLOCKED_FULL_BIN, HOLD_LOCKED
      unroutedMassKg: this.lots[0].netMassKg,
      routedMassKg: 0.0
    };

    this.faultLATCH = false;
    this.faultReason = null;
    this.eventLedger = [];
    this.routingHistory = [];
    this.logEvent("Grading & routing engine initialized for inspection of Lot F-G01", "INFO");
  }

  inspectLot(finishedLotId) {
    const found = this.lots.find(l => l.finishedLotId === finishedLotId);
    if (!found) return false;

    // Check if lot was previously routed in routingHistory to prevent reissue
    const pastRecord = this.routingHistory.find(r => r.finishedLotId === finishedLotId);
    if (pastRecord) {
      this.activeLot = {
        ...found,
        grade: pastRecord.grade,
        disposition: pastRecord.disposition,
        decisionReason: "PREVIOUSLY_ROUTED",
        targetBinId: pastRecord.destinationBin,
        routingState: "ROUTED",
        unroutedMassKg: 0.0,
        routedMassKg: pastRecord.routedKg
      };
      this.logEvent(`Inspecting Lot ${found.finishedLotId}: Previously routed to ${pastRecord.destinationBin} (${pastRecord.routedKg} kg).`, "INFO");
      return true;
    }

    this.activeLot = {
      ...found,
      grade: found.recommendedGrade,
      disposition: "PENDING",
      decisionReason: null,
      targetBinId: "BIN-01",
      routingState: "IDLE",
      unroutedMassKg: found.netMassKg,
      routedMassKg: 0.0
    };
    this.logEvent(`Inspecting Lot ${found.finishedLotId} (${found.netMassKg} kg, Moisture: ${found.moisturePercent}%, Liquor Score: ${found.infusionScore})`, "INFO");
    return true;
  }

  setGrade(grade) {
    this.activeLot.grade = grade;
    if (grade === "GRADE_A") this.activeLot.targetBinId = "BIN-01";
    if (grade === "GRADE_B") this.activeLot.targetBinId = "BIN-02";
    if (grade === "GRADE_C") this.activeLot.targetBinId = "BIN-03";
    this.logEvent(`Grade assigned: ${grade}. Recommended target bin: ${this.activeLot.targetBinId}`, "INFO");
  }

  setDisposition(disposition, reason = null) {
    this.activeLot.disposition = disposition;
    this.activeLot.decisionReason = reason || "QUALITY_SIGN_OFF";

    if (this.activeLot.routingState === "ROUTED") {
      this.logEvent(`DISPOSITION UPDATE: Lot ${this.activeLot.finishedLotId} disposition updated to ${disposition}. Routing remains ROUTED.`, "INFO");
      return;
    }

    if (disposition === "ON_HOLD") {
      this.activeLot.routingState = "HOLD_LOCKED";
      this.logEvent(`QUALITY HOLD: Lot ${this.activeLot.finishedLotId} placed on hold. Reason: ${this.activeLot.decisionReason}. Routing diverter locked.`, "WARN");
    } else if (disposition === "RELEASED") {
      this.activeLot.routingState = "IDLE";
      this.logEvent(`QUALITY RELEASE: Lot ${this.activeLot.finishedLotId} approved for packaging storage. Reason: ${this.activeLot.decisionReason}.`, "ACTION");
    } else if (disposition === "REJECTED") {
      this.activeLot.routingState = "HOLD_LOCKED";
      this.logEvent(`QUALITY REJECT: Lot ${this.activeLot.finishedLotId} rejected. Reason: ${this.activeLot.decisionReason}. Diverted to Quarantine Discard.`, "ALARM");
    }
  }

  selectTargetBin(binId) {
    const bin = this.bins.find(b => b.binId === binId);
    if (!bin) return false;
    this.activeLot.targetBinId = binId;
    this.logEvent(`Destination storage bin selected: ${bin.name}`, "INFO");
    return true;
  }

  setBinOccupancy(binId, currentKg) {
    const bin = this.bins.find(b => b.binId === binId);
    if (bin) {
      bin.currentOccupancyKg = Number(currentKg) || 0;
      this.logEvent(`Bin ${binId} occupancy updated to ${bin.currentOccupancyKg.toFixed(1)} kg / ${bin.capacityKg} kg`, "INFO");
    }
  }

  setBinLocked(binId, isLocked) {
    const bin = this.bins.find(b => b.binId === binId);
    if (bin) {
      bin.isLocked = Boolean(isLocked);
      this.logEvent(`Bin ${binId} locked status: ${bin.isLocked}`, "WARN");
    }
  }

  routeMaterial() {
    // Check 0: Terminal state / idempotency guard
    if (this.activeLot.routingState === "ROUTED" || this.activeLot.unroutedMassKg <= 0) {
      this.logEvent(`ROUTING IGNORED: Lot ${this.activeLot.finishedLotId} has already been fully routed (${this.activeLot.routedMassKg} kg). Duplicate route blocked.`, "WARN");
      return { success: false, reason: "ALREADY_ROUTED" };
    }

    // Check 1: Disposition gate
    if (this.activeLot.disposition !== "RELEASED") {
      this.activeLot.routingState = "HOLD_LOCKED";
      this.logEvent(`ROUTING INHIBITED: Lot ${this.activeLot.finishedLotId} is not in RELEASED state (Current: ${this.activeLot.disposition})`, "ALARM");
      return { success: false, reason: "LOT_NOT_RELEASED" };
    }

    const bin = this.bins.find(b => b.binId === this.activeLot.targetBinId);
    if (!bin) return { success: false, reason: "INVALID_BIN" };

    // Check 2: Bin available and not full
    const availableCapacity = bin.capacityKg - bin.currentOccupancyKg;
    if (bin.isLocked || availableCapacity < this.activeLot.unroutedMassKg) {
      this.activeLot.routingState = "BLOCKED_FULL_BIN";
      this.faultLATCH = true;
      this.faultReason = `Destination ${bin.name} capacity exceeded or locked! Required: ${this.activeLot.unroutedMassKg} kg, Available: ${availableCapacity.toFixed(1)} kg.`;
      
      this.logEvent(`INTERLOCK TRIP: ${this.faultReason} Conveyor drive stopped (%Q6.0=FALSE). Lot ${this.activeLot.finishedLotId} retained in surge hopper.`, "ALARM");
      return { success: false, reason: "BIN_FULL_OR_LOCKED" };
    }

    // Success routing
    this.activeLot.routingState = "ROUTED";
    bin.currentOccupancyKg = Math.round((bin.currentOccupancyKg + this.activeLot.unroutedMassKg) * 100) / 100;
    this.activeLot.routedMassKg = this.activeLot.unroutedMassKg;
    this.activeLot.unroutedMassKg = 0.0;

    const record = {
      timestamp: new Date().toISOString(),
      finishedLotId: this.activeLot.finishedLotId,
      batchId: this.activeLot.batchId,
      vendorLotId: this.activeLot.vendorLotId,
      grade: this.activeLot.grade,
      routedKg: this.activeLot.routedMassKg,
      destinationBin: bin.binId,
      disposition: this.activeLot.disposition,
      status: "STORED_READY_FOR_PACKING"
    };

    this.routingHistory.unshift(record);
    this.logEvent(`ROUTING COMPLETE: Successfully transferred ${this.activeLot.routedMassKg} kg from Lot ${this.activeLot.finishedLotId} into ${bin.name} (%Q6.0 completed).`, "ACTION");
    return { success: true };
  }

  acknowledgeFault() {
    this.faultLATCH = false;
    this.faultReason = null;
    if (this.activeLot.routingState === "BLOCKED_FULL_BIN") {
      this.activeLot.routingState = "IDLE";
    }
    this.logEvent("Operator acknowledged bin fault. Ready to select alternate bin or resume.", "INFO");
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
      activeLot: { ...this.activeLot },
      bins: this.bins.map(b => ({ ...b })),
      faultLATCH: this.faultLATCH,
      faultReason: this.faultReason,
      routingHistory: [...this.routingHistory],
      eventLedger: [...this.eventLedger]
    };
  }
}
