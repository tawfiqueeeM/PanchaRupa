/**
 * Tea Dryer Control Domain Engine & Fixture Adapter
 * Simulates thermal chamber dynamics, PID heating control,
 * circulating fan proof interlocks, and the 3-phase safety reset discipline
 * (Acknowledge -> Clear Proof -> Deliberate Restart).
 */

export class DryerEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.batchId = "B-D01";
    this.setpointC = 95.0;
    this.measuredTempC = 25.0; // Ambient start
    this.ambientTempC = 25.0;
    this.heatCommandPercent = 0.0;
    
    this.fanProof = true;
    this.heatEnabled = false;
    this.batchActive = false;
    this.batchElapsedMin = 0;
    this.targetDurationMin = 60;
    this.batchComplete = false;

    this.alarmLatched = false;
    this.alarmAcked = false;
    this.alarmReason = null;

    this.trendHistory = [];
    this.eventLedger = [];
    this.logEvent("Dryer control system initialized to IDLE at ambient 25.0°C", "INFO");
    this.recordTrend();
  }

  setSetpoint(degC) {
    this.setpointC = Math.max(50, Math.min(130, Number(degC) || 95.0));
    this.logEvent(`Temperature setpoint adjusted to ${this.setpointC.toFixed(1)}°C`, "INFO");
  }

  startBatch() {
    if (!this.fanProof) {
      this.logEvent("START INHIBITED: Cannot start dryer without verified circulating fan proof (%I3.0=FALSE)", "ALARM");
      return { success: false, reason: "FAN_PROOF_MISSING" };
    }

    this.batchActive = true;
    this.batchComplete = false;
    this.batchElapsedMin = 0;
    this.heatEnabled = true;
    this.logEvent(`Batch ${this.batchId} STARTED: Heating enabled to ${this.setpointC}°C`, "ACTION");
    return { success: true };
  }

  stopBatch() {
    this.batchActive = false;
    this.heatEnabled = false;
    this.heatCommandPercent = 0.0;
    this.logEvent("Dryer batch manually stopped. Heaters de-energized.", "INFO");
  }

  setFanProof(hasProof) {
    this.fanProof = Boolean(hasProof);

    if (!this.fanProof) {
      if (this.batchActive || this.heatEnabled) {
        // Immediate safety trip
        this.alarmLatched = true;
        this.alarmAcked = false;
        this.heatEnabled = false;
        this.heatCommandPercent = 0.0;
        this.alarmReason = "Circulating fan differential pressure switch lost (%I3.0 TRIPPED)";
        this.logEvent(`EMERGENCY TRIP: ${this.alarmReason}! Heaters forced to 0.0% immediately. Alarm siren active.`, "ALARM");
      } else {
        this.logEvent("Fan proof sensor dropped FALSE while idle.", "WARN");
      }
    } else {
      this.logEvent("Fan proof sensor restored TRUE (%I3.0=TRUE).", "INFO");
    }
  }

  acknowledgeAlarm() {
    if (!this.alarmLatched) return false;
    this.alarmAcked = true;
    this.logEvent("Operator ACKNOWLEDGED safety trip (%I3.1). Siren silenced. NOTE: Heaters remain locked at 0.0% until deliberate restart.", "WARN");
    return true;
  }

  deliberateRestart() {
    if (!this.alarmLatched) {
      this.logEvent("Restart command ignored: No latched alarm to reset.", "INFO");
      return false;
    }

    if (!this.alarmAcked) {
      this.logEvent("RESTART INHIBITED: Operator must acknowledge alarm first before restart.", "WARN");
      return false;
    }

    if (!this.fanProof) {
      this.logEvent("RESTART INHIBITED: Physical fan proof is still FALSE! Clear airflow obstruction first.", "ALARM");
      return false;
    }

    // Success reset
    this.alarmLatched = false;
    this.alarmAcked = false;
    this.alarmReason = null;
    this.heatEnabled = true;
    this.logEvent("DELIBERATE RESTART ACCEPTED (%I3.2): Burner safety loop re-armed. Heating resumed.", "ACTION");
    return true;
  }

  stepTime(dtMin = 1.0) {
    if (this.batchActive && !this.batchComplete) {
      this.batchElapsedMin += dtMin;
      if (this.batchElapsedMin >= this.targetDurationMin) {
        this.batchComplete = true;
        this.heatEnabled = false;
        this.heatCommandPercent = 0.0;
        this.logEvent(`BATCH COMPLETE: 60 min dry cycle completed. Heaters shut down. Cooling fan running.`, "ACTION");
      }
    }

    // Thermal simulation
    if (this.heatEnabled && this.fanProof && !this.alarmLatched) {
      const err = this.setpointC - this.measuredTempC;
      // Proportional heat command with saturation
      this.heatCommandPercent = Math.max(0, Math.min(100, Math.round((err * 5.0) * 10) / 10));
      // First order thermal response towards equilibrium
      const targetEq = this.ambientTempC + (this.heatCommandPercent / 100.0) * (this.setpointC + 10 - this.ambientTempC);
      const dT = (targetEq - this.measuredTempC) * 0.15 * dtMin;
      this.measuredTempC = Math.round((this.measuredTempC + dT) * 10) / 10;
    } else {
      // Natural convective cooling
      this.heatCommandPercent = 0.0;
      const coolingRate = 0.08 * dtMin;
      this.measuredTempC = Math.max(this.ambientTempC, Math.round((this.measuredTempC - (this.measuredTempC - this.ambientTempC) * coolingRate) * 10) / 10);
    }

    this.recordTrend();
  }

  recordTrend() {
    this.trendHistory.push({
      minute: Math.round(this.batchElapsedMin * 10) / 10,
      setpointC: this.setpointC,
      measuredTempC: this.measuredTempC,
      heatCommandPercent: this.heatCommandPercent,
      fanProof: this.fanProof,
      alarmLatched: this.alarmLatched,
      alarmAcked: this.alarmAcked
    });
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
      batchId: this.batchId,
      setpointC: this.setpointC,
      measuredTempC: this.measuredTempC,
      heatCommandPercent: this.heatCommandPercent,
      fanProof: this.fanProof,
      heatEnabled: this.heatEnabled,
      batchActive: this.batchActive,
      batchElapsedMin: this.batchElapsedMin,
      batchComplete: this.batchComplete,
      alarmLatched: this.alarmLatched,
      alarmAcked: this.alarmAcked,
      alarmReason: this.alarmReason,
      trendHistory: [...this.trendHistory],
      eventLedger: [...this.eventLedger]
    };
  }
}
