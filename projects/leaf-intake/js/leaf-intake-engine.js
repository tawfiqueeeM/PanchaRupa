/**
 * Leaf Intake Domain Engine & Fixture Adapter
 * Encapsulates receipt validation, scale tare/gross calculation,
 * quality gate disposition, and downstream buffer interlock logic.
 */

export class LeafIntakeEngine {
  constructor(options = {}) {
    this.scenarios = options.scenarios || [];
    this.reset();
  }

  reset() {
    this.activeLot = {
      vendorId: "V-01",
      lotId: "L-001",
      grossKg: 125.0,
      tareKg: 5.0,
      netKg: 120.0,
      teaType: "GREEN",
      disposition: "PENDING", // PENDING, ACCEPTED, REJECTED
      rejectionReason: null,
      transferStatus: "READY" // READY, IN_TRANSIT, BLOCKED, COMPLETED
    };

    this.destinationBuffer = {
      targetStation: "DRUM_INFEED_HOPPER", // DRUM_INFEED_HOPPER or WITHERING_TRAYS
      isClear: true,
      sensorTag: "DI_BUFFER_CLEAR"
    };

    this.transferInterlock = {
      commandActive: false,
      progressPercent: 0,
      interlockTripped: false,
      tripReason: null
    };

    this.eventLedger = [];
    this.dispatchedHistory = [];
    this.logEvent("Engine initialized to default baseline", "INFO");
  }

  loadScenario(scenario) {
    this.reset();
    this.activeLot.vendorId = scenario.vendorId;
    this.activeLot.lotId = scenario.lotId;
    this.activeLot.grossKg = scenario.grossKg;
    this.activeLot.tareKg = scenario.tareKg;
    this.activeLot.teaType = scenario.teaType;
    this.activeLot.netKg = Math.max(0, scenario.grossKg - scenario.tareKg);
    this.destinationBuffer.isClear = scenario.bufferInitiallyClear !== false;
    this.destinationBuffer.targetStation = scenario.destination || (scenario.teaType === "GOLDEN" ? "WITHERING_TRAYS" : "DRUM_INFEED_HOPPER");

    if (scenario.rejectionReason) {
      this.rejectLot(scenario.rejectionReason);
    } else {
      this.activeLot.disposition = "PENDING";
    }

    this.logEvent(`Loaded scenario: ${scenario.scenarioId} (${scenario.description})`, "INFO");
  }

  setGrossWeight(gross) {
    this.activeLot.grossKg = Number(gross) || 0;
    this.computeNet();
  }

  setTareWeight(tare) {
    this.activeLot.tareKg = Number(tare) || 0;
    this.computeNet();
  }

  computeNet() {
    if (this.activeLot.grossKg <= this.activeLot.tareKg) {
      this.activeLot.netKg = 0;
    } else {
      this.activeLot.netKg = Math.round((this.activeLot.grossKg - this.activeLot.tareKg) * 100) / 100;
    }
  }

  validateWeights() {
    const errors = [];
    if (this.activeLot.tareKg <= 0) {
      errors.push("Tare weight must be greater than zero.");
    }
    if (this.activeLot.grossKg <= this.activeLot.tareKg) {
      errors.push("Gross weight must be strictly greater than Tare weight.");
    }
    if (this.activeLot.netKg > 250) {
      errors.push("Net weight exceeds hopper capacity limit of 250 kg.");
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  acceptLot() {
    const validation = this.validateWeights();
    if (!validation.isValid) {
      this.logEvent(`Acceptance rejected: ${validation.errors.join(", ")}`, "ALARM");
      return { success: false, errors: validation.errors };
    }

    this.activeLot.disposition = "ACCEPTED";
    this.activeLot.rejectionReason = null;
    this.activeLot.transferStatus = "READY";
    this.destinationBuffer.targetStation = this.activeLot.teaType === "GOLDEN" ? "WITHERING_TRAYS" : "DRUM_INFEED_HOPPER";
    
    this.logEvent(`Lot ${this.activeLot.lotId} ACCEPTED: Net ${this.activeLot.netKg} kg assigned to ${this.destinationBuffer.targetStation}`, "ACTION");
    return { success: true };
  }

  rejectLot(reason) {
    const validation = this.validateWeights();
    if (this.activeLot.tareKg <= 0 || this.activeLot.grossKg <= 0) {
      return { success: false, errors: ["Cannot reject unmeasured lot."] };
    }

    this.activeLot.disposition = "REJECTED";
    this.activeLot.rejectionReason = reason || "QUALITY_NON_COMPLIANT";
    this.activeLot.transferStatus = "QUARANTINED";
    this.transferInterlock.commandActive = false;
    
    this.logEvent(`Lot ${this.activeLot.lotId} REJECTED: Reason=${this.activeLot.rejectionReason}. Diverted to Quarantine Bin.`, "WARN");
    return { success: true };
  }

  setBufferClear(isClear) {
    this.destinationBuffer.isClear = Boolean(isClear);
    
    // Interlock: If buffer becomes blocked while transfer is active, trip immediately!
    if (!this.destinationBuffer.isClear) {
      if (this.transferInterlock.commandActive) {
        this.transferInterlock.commandActive = false;
        this.transferInterlock.interlockTripped = true;
        this.transferInterlock.tripReason = "DOWNSTREAM_BUFFER_FULL";
        this.activeLot.transferStatus = "BLOCKED";
        this.logEvent("INTERLOCK TRIP: Destination buffer sensor blocked! Transfer motor dropped.", "ALARM");
      } else {
        this.logEvent("Sensor update: Downstream buffer reported BLOCKED (DI_BUFFER_CLEAR=FALSE)", "WARN");
      }
    } else {
      this.transferInterlock.interlockTripped = false;
      this.transferInterlock.tripReason = null;
      if (this.activeLot.disposition === "ACCEPTED" && this.activeLot.transferStatus === "BLOCKED") {
        this.activeLot.transferStatus = "READY";
      }
      this.logEvent("Sensor update: Downstream buffer sensor restored CLEAR (DI_BUFFER_CLEAR=TRUE)", "INFO");
    }
  }

  startTransfer() {
    if (this.activeLot.disposition !== "ACCEPTED") {
      this.logEvent("Cannot start transfer: Lot is not in ACCEPTED state.", "WARN");
      return { success: false, reason: "LOT_NOT_ACCEPTED" };
    }
    if (!this.destinationBuffer.isClear) {
      this.transferInterlock.commandActive = false;
      this.transferInterlock.interlockTripped = true;
      this.transferInterlock.tripReason = "BUFFER_BLOCKED";
      this.activeLot.transferStatus = "BLOCKED";
      this.logEvent("Transfer inhibited: Downstream buffer is blocked.", "ALARM");
      return { success: false, reason: "BUFFER_BLOCKED" };
    }

    this.transferInterlock.commandActive = true;
    this.transferInterlock.interlockTripped = false;
    this.activeLot.transferStatus = "IN_TRANSIT";
    this.logEvent(`Transfer command energized: Conveying ${this.activeLot.netKg} kg to ${this.destinationBuffer.targetStation}`, "ACTION");
    return { success: true };
  }

  jogTransfer(stepDelta = 25) {
    if (!this.transferInterlock.commandActive) {
      const res = this.startTransfer();
      if (!res.success) return res;
    }

    if (!this.destinationBuffer.isClear) {
      this.transferInterlock.commandActive = false;
      this.transferInterlock.interlockTripped = true;
      this.activeLot.transferStatus = "BLOCKED";
      return { success: false, reason: "BUFFER_BLOCKED" };
    }

    this.transferInterlock.progressPercent = Math.min(100, this.transferInterlock.progressPercent + stepDelta);

    if (this.transferInterlock.progressPercent >= 100) {
      this.completeTransfer();
    }
    return { success: true, progress: this.transferInterlock.progressPercent };
  }

  completeTransfer() {
    this.transferInterlock.commandActive = false;
    this.transferInterlock.progressPercent = 100;
    this.activeLot.transferStatus = "COMPLETED";

    const record = {
      timestamp: new Date().toISOString(),
      vendorId: this.activeLot.vendorId,
      lotId: this.activeLot.lotId,
      teaType: this.activeLot.teaType,
      grossKg: this.activeLot.grossKg,
      tareKg: this.activeLot.tareKg,
      netKg: this.activeLot.netKg,
      disposition: this.activeLot.disposition,
      destination: this.destinationBuffer.targetStation,
      status: "DELIVERED"
    };

    this.dispatchedHistory.unshift(record);
    this.logEvent(`Transfer COMPLETE: Lot ${this.activeLot.lotId} delivered to ${this.destinationBuffer.targetStation} (Mass: ${this.activeLot.netKg} kg)`, "INFO");
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
      destinationBuffer: { ...this.destinationBuffer },
      transferInterlock: { ...this.transferInterlock },
      history: [...this.dispatchedHistory],
      eventLedger: [...this.eventLedger]
    };
  }
}
