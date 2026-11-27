/**
 * Building Automation System (BMS / SD-anlegg) Domain Engine & Fixture Adapter
 * Simulates ventilation AHU scheduling, differential pressure proof loss,
 * warehouse climate/humidity excursions, Modbus power meter telemetry,
 * stale meter communication watchdog, and kWh/kg specific energy metrics.
 */

export class BmsEngine {
  constructor() {
    this.reset();
  }

  reset() {
    // Environmental & Ventilation
    this.ventilationCommand = true;
    this.ventilationProof = true;
    this.ventilationFlowM3h = 4500.0;
    
    // Storage Climate
    this.storageHumidityRh = 58.0;
    this.storageTempC = 22.5;
    this.storageRhThreshold = 65.0;
    this.dehumidifierActive = false;

    // Electrical Metering
    this.meterPollingActive = true;
    this.activePowerKw = 18.5;
    this.cumulativeEnergyKwh = 58.0;
    this.meterHeartbeat = 100;
    this.staleMeterElapsedSec = 0;
    this.staleMeterTimeoutSec = 15;

    // Production Linkage
    this.releasedTeaKg = 40.0; // Operations-day batch baseline
    this.kwhPerReleasedKg = 1.45;

    // Alarms
    this.alarms = {
      ventProofLoss: false,
      ventProofAcked: false,
      highHumidity: false,
      staleMeter: false
    };

    this.trendHistory = [];
    this.eventLedger = [];
    this.logEvent("BMS SD-anlegg supervisor online: Desigo CC / BACnet / Modbus emulated", "INFO");
    this.recordPoint();
  }

  setVentilationCommand(cmd) {
    this.ventilationCommand = Boolean(cmd);
    this.ventilationFlowM3h = this.ventilationCommand && this.ventilationProof ? 4500.0 : 0.0;
    this.logEvent(`AHU ventilation command set to ${this.ventilationCommand ? "RUN (ON)" : "STOP (OFF)"}`, "ACTION");
    this.checkAlarms();
  }

  setVentilationProof(proof) {
    this.ventilationProof = Boolean(proof);
    this.ventilationFlowM3h = this.ventilationCommand && this.ventilationProof ? 4500.0 : 0.0;
    if (!this.ventilationProof && this.ventilationCommand) {
      this.logEvent("AIRFLOW TRIP: Differential pressure switch DI_VENT_PROOF dropped FALSE while fan commanded RUN!", "ALARM");
    } else if (this.ventilationProof) {
      this.logEvent("Airflow sensor restored: Normal differential pressure detected", "INFO");
    }
    this.checkAlarms();
  }

  setStorageHumidity(rh) {
    this.storageHumidityRh = Math.max(20, Math.min(100, Number(rh) || 58.0));
    this.logEvent(`Warehouse humidity transmitter updated: ${this.storageHumidityRh.toFixed(1)}% RH`, "INFO");
    this.checkAlarms();
  }

  setMeterPolling(active) {
    this.meterPollingActive = Boolean(active);
    if (!this.meterPollingActive) {
      this.logEvent("Modbus RTU incomer meter polling FROZEN (simulating comms line severed)", "WARN");
    } else {
      this.staleMeterElapsedSec = 0;
      this.alarms.staleMeter = false;
      this.logEvent("Modbus RTU incomer meter communications restored", "INFO");
    }
  }

  checkAlarms() {
    // 1. Ventilation Proof
    if (this.ventilationCommand && !this.ventilationProof) {
      this.alarms.ventProofLoss = true;
    } else if (this.ventilationProof) {
      this.alarms.ventProofLoss = false;
      this.alarms.ventProofAcked = false;
    }

    // 2. High Humidity
    if (this.storageHumidityRh > this.storageRhThreshold) {
      this.alarms.highHumidity = true;
      this.dehumidifierActive = true;
    } else {
      this.alarms.highHumidity = false;
      this.dehumidifierActive = false;
    }

    // 3. Stale Meter
    if (this.staleMeterElapsedSec >= this.staleMeterTimeoutSec) {
      this.alarms.staleMeter = true;
    }
  }

  stepTime(dtMinutes = 5.0) {
    const dtHours = dtMinutes / 60.0;

    // Energy integration
    if (this.meterPollingActive) {
      this.meterHeartbeat = (this.meterHeartbeat + 1) % 65535;
      this.staleMeterElapsedSec = 0;
      this.alarms.staleMeter = false;

      // Adjust load depending on equipment
      let loadKw = 4.5; // Base building lighting + BMS
      if (this.ventilationCommand && this.ventilationProof) loadKw += 5.5; // Fan load
      if (this.dehumidifierActive) loadKw += 3.5;
      loadKw += 10.0; // Production active heating allowance

      this.activePowerKw = Math.round(loadKw * 10) / 10;
      this.cumulativeEnergyKwh = Math.round((this.cumulativeEnergyKwh + this.activePowerKw * dtHours) * 100) / 100;
    } else {
      this.staleMeterElapsedSec += dtMinutes * 60;
    }

    // Specific Energy Consumption
    if (this.releasedTeaKg > 0) {
      this.kwhPerReleasedKg = Math.round((this.cumulativeEnergyKwh / this.releasedTeaKg) * 100) / 100;
    } else {
      this.kwhPerReleasedKg = null;
    }

    this.checkAlarms();
    this.recordPoint();
  }

  acknowledgeVentAlarm() {
    if (!this.alarms.ventProofLoss) return false;
    this.alarms.ventProofAcked = true;
    this.logEvent("Operator acknowledged ventilation proof trip (%I7.1). Alarm beacon silenced.", "WARN");
    return true;
  }

  loadScenario(scenario) {
    this.reset();
    if (scenario.ventilationFanCommand !== undefined) this.setVentilationCommand(scenario.ventilationFanCommand);
    if (scenario.ventilationProofHealthy !== undefined) this.setVentilationProof(scenario.ventilationProofHealthy);
    if (scenario.storageHumidityRh !== undefined) this.setStorageHumidity(scenario.storageHumidityRh);
    if (scenario.storageTempC !== undefined) this.storageTempC = scenario.storageTempC;
    if (scenario.meterPollingActive !== undefined) this.setMeterPolling(scenario.meterPollingActive);
    if (scenario.shiftReleasedTeaKg !== undefined) {
      this.releasedTeaKg = scenario.shiftReleasedTeaKg;
      if (this.releasedTeaKg <= 0) {
        this.kwhPerReleasedKg = null;
      } else {
        this.kwhPerReleasedKg = Math.round((this.cumulativeEnergyKwh / this.releasedTeaKg) * 100) / 100;
      }
    }

    if (!scenario.meterPollingActive) {
      this.staleMeterElapsedSec = 20; // force immediate timeout
      this.alarms.staleMeter = true;
    }

    this.checkAlarms();
    this.logEvent(`Loaded BMS scenario: ${scenario.scenarioId} (${scenario.description})`, "INFO");
  }

  recordPoint() {
    this.trendHistory.push({
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      ventilationCommand: this.ventilationCommand,
      ventilationProof: this.ventilationProof,
      ventFlowM3h: this.ventilationFlowM3h,
      storageHumidityRh: this.storageHumidityRh,
      activePowerKw: this.activePowerKw,
      cumulativeEnergyKwh: this.cumulativeEnergyKwh,
      kwhPerReleasedKg: this.kwhPerReleasedKg,
      staleMeter: this.alarms.staleMeter
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
      ventilation: {
        command: this.ventilationCommand,
        proof: this.ventilationProof,
        flowM3h: this.ventilationFlowM3h
      },
      storageClimate: {
        humidityRh: this.storageHumidityRh,
        tempC: this.storageTempC,
        thresholdRh: this.storageRhThreshold,
        dehumidifierActive: this.dehumidifierActive
      },
      electricalMetering: {
        pollingActive: this.meterPollingActive,
        activePowerKw: this.activePowerKw,
        cumulativeEnergyKwh: this.cumulativeEnergyKwh,
        heartbeat: this.meterHeartbeat,
        staleSec: this.staleMeterElapsedSec
      },
      productionEnergy: {
        releasedTeaKg: this.releasedTeaKg,
        kwhPerReleasedKg: this.kwhPerReleasedKg
      },
      alarms: { ...this.alarms },
      trendHistory: [...this.trendHistory],
      eventLedger: [...this.eventLedger]
    };
  }
}
