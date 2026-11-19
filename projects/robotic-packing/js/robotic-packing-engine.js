/**
 * Robotic Packing Cell Domain Engine & Fixture Adapter
 * Simulates delta pick-and-place robot handshake, vacuum gripper state,
 * format changeover (50g/100g), interrupted pick fault, safe purge recovery,
 * and precise carton counting.
 */

export const FORMAT_CONFIGS = {
  "FORMAT_50G": {
    formatId: "FORMAT_50G",
    name: "50g Retail Bottle",
    bottlesPerCarton: 12,
    cols: 4,
    rows: 3
  },
  "FORMAT_100G": {
    formatId: "FORMAT_100G",
    name: "100g Retail Bottle",
    bottlesPerCarton: 6,
    cols: 3,
    rows: 2
  }
};

export class RoboticPackingEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.selectedFormat = FORMAT_CONFIGS["FORMAT_50G"];
    this.armState = "IDLE"; // IDLE, INDEXING, GRIPPING, TRANSIT, PLACED, INTERRUPTED_HOLD, PURGING
    this.interrupted = false;
    this.interruptionReason = null;
    this.currentBottleId = null;

    this.counts = {
      bottlesProcessed: 0,
      bottlesInCurrentCarton: 0,
      cartonsCompleted: 0,
      bottlesPurged: 0
    };

    this.cartonSlots = this.generateCartonSlots(this.selectedFormat.bottlesPerCarton);
    this.cartonSerial = 1;
    this.bottleSerial = 1;

    this.eventLedger = [];
    this.completedCartons = [];
    this.logEvent("Robotic packing cell initialized: Ready at HOME position (%I5.0=TRUE)", "INFO");
  }

  generateCartonSlots(capacity) {
    const slots = [];
    for (let i = 0; i < capacity; i++) {
      slots.push({
        slotIndex: i + 1,
        filled: false,
        bottleId: null
      });
    }
    return slots;
  }

  switchFormat(formatId) {
    if (!FORMAT_CONFIGS[formatId]) return false;
    this.selectedFormat = FORMAT_CONFIGS[formatId];
    this.counts.bottlesInCurrentCarton = 0;
    this.cartonSlots = this.generateCartonSlots(this.selectedFormat.bottlesPerCarton);
    this.logEvent(`Format changeover: Switched to ${this.selectedFormat.name} (${this.selectedFormat.bottlesPerCarton} bottles/carton)`, "INFO");
    return true;
  }

  injectInterruption(reason = "Vacuum pressure loss mid-trajectory (%I5.4 TRIPPED)") {
    this.interrupted = true;
    this.interruptionReason = reason;
    this.logEvent(`INTERRUPTION ARMED: Next transfer will simulate vacuum loss: ${reason}`, "WARN");
  }

  stepCycle() {
    if (this.armState === "INTERRUPTED_HOLD") {
      this.logEvent("Robot is HALTED in fault hold! Must execute 'Purge & Home' recovery before resuming.", "ALARM");
      return { success: false, reason: "ROBOT_HALTED" };
    }

    // Generate incoming bottle
    const bottleId = `BT-${this.selectedFormat.formatId === "FORMAT_50G" ? "50" : "100"}-${String(this.bottleSerial).padStart(4, "0")}`;
    this.currentBottleId = bottleId;
    this.bottleSerial += 1;

    this.armState = "INDEXING";
    this.logEvent(`Infeed conveyor indexed bottle ${bottleId} to pick datum (%Q5.0=TRUE, %I5.1=TRUE)`, "ACTION");

    this.armState = "GRIPPING";
    this.logEvent(`Delta arm descended; vacuum gripper confirmed (%I5.2=TRUE)`, "INFO");

    this.armState = "TRANSIT";

    // Check if interrupted pick should trip
    if (this.interrupted) {
      this.armState = "INTERRUPTED_HOLD";
      this.logEvent(`FAULT TRIP: ${this.interruptionReason}! Arm frozen in trajectory (%I5.4=TRUE, %Q5.0=FALSE).`, "ALARM");
      return { success: false, reason: "INTERRUPTED_PICK" };
    }

    // Nominal placement
    this.armState = "PLACED";
    const slotIdx = this.counts.bottlesInCurrentCarton;
    this.cartonSlots[slotIdx].filled = true;
    this.cartonSlots[slotIdx].bottleId = bottleId;

    this.counts.bottlesProcessed += 1;
    this.counts.bottlesInCurrentCarton += 1;

    this.logEvent(`Bottle ${bottleId} deposited in pocket #${slotIdx + 1} of Carton C-${String(this.cartonSerial).padStart(3, "0")} (%I5.3=TRUE)`, "INFO");

    // Check carton completion
    if (this.counts.bottlesInCurrentCarton >= this.selectedFormat.bottlesPerCarton) {
      this.completeCarton();
    } else {
      this.armState = "IDLE";
    }

    return { success: true, bottleId, cartonProgress: this.counts.bottlesInCurrentCarton };
  }

  completeCarton() {
    const cartonId = `CTN-${this.selectedFormat.formatId === "FORMAT_50G" ? "50G" : "100G"}-${String(this.cartonSerial).padStart(3, "0")}`;
    const record = {
      timestamp: new Date().toISOString(),
      cartonId,
      formatId: this.selectedFormat.formatId,
      bottlesPacked: this.selectedFormat.bottlesPerCarton,
      status: "SEALED_AND_DISPATCHED"
    };

    this.completedCartons.unshift(record);
    this.counts.cartonsCompleted += 1;
    this.counts.bottlesInCurrentCarton = 0;
    this.cartonSerial += 1;
    this.cartonSlots = this.generateCartonSlots(this.selectedFormat.bottlesPerCarton);
    this.armState = "IDLE";

    this.logEvent(`CARTON COMPLETE: ${cartonId} filled with ${this.selectedFormat.bottlesPerCarton} bottles. Case sealer indexed.`, "ACTION");
  }

  executeRecoveryPurge() {
    if (this.armState !== "INTERRUPTED_HOLD" && !this.interrupted) {
      this.logEvent("Recovery command ignored: Robot arm is not in an interrupted hold state.", "INFO");
      return false;
    }

    this.armState = "PURGING";
    this.counts.bottlesPurged += 1;
    const purgedId = this.currentBottleId || "UNKNOWN";

    this.logEvent(`SAFE RECOVERY INITIATED: Diverting dropped bottle ${purgedId} to defect purge bin (%Q5.4 pulsed)`, "WARN");

    // Clear fault and re-home
    this.interrupted = false;
    this.interruptionReason = null;
    this.armState = "IDLE";
    this.currentBottleId = null;

    this.logEvent(`RECOVERY COMPLETE: Robot returned to SAFE_HOME_POSITION (%I5.0=TRUE). Carton pocket count retained (${this.counts.bottlesInCurrentCarton}/${this.selectedFormat.bottlesPerCarton}). Ready for next bottle.`, "ACTION");
    return true;
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
      format: { ...this.selectedFormat },
      armState: this.armState,
      interrupted: this.interrupted,
      interruptionReason: this.interruptionReason,
      currentBottleId: this.currentBottleId,
      counts: { ...this.counts },
      cartonSlots: [...this.cartonSlots],
      completedCartons: [...this.completedCartons],
      eventLedger: [...this.eventLedger]
    };
  }
}
