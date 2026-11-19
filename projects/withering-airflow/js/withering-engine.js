/**
 * Withering Airflow & Moisture Dynamics Engine
 * Simulates thin-layer leaf withering kinetics, fan power consumption,
 * ambient humidity sensitivity, and sensor fault validation.
 */

export const AMBIENT_SCENARIOS = {
  "SPRING-NOMINAL": {
    name: "Spring Nominal (25°C, 65% RH)",
    tempC: 25.0,
    rh: 0.65,
    baseRate: 0.085
  },
  "MONSOON-HUMID": {
    name: "Monsoon Humid (28°C, 88% RH)",
    tempC: 28.0,
    rh: 0.88,
    baseRate: 0.040
  },
  "DRY-AUTUMN": {
    name: "Autumn Dry (22°C, 50% RH)",
    tempC: 22.0,
    rh: 0.50,
    baseRate: 0.125
  }
};

export class WitheringEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.batchId = "B-W01";
    this.leafMassKg = 40.0;
    this.initialMoisture = 78.0; // %
    this.targetMoisture = 65.0;  // %
    this.currentMoisture = 78.0; // %
    this.fanSpeedPercent = 60.0; // % (0-100)
    this.fanRatedPowerKw = 0.75; // kW
    this.ambientKey = "SPRING-NOMINAL";
    
    this.elapsedHours = 0.0;
    this.cumulativeFanKwh = 0.0;
    this.targetReached = false;
    this.sensorFault = false;
    this.sensorReading = 78.0;

    this.trajectory = [];
    this.eventLedger = [];
    this.logEvent("Withering engine initialized with fresh green/golden leaf at 78.0% moisture", "INFO");
    this.recordStep();
  }

  setInitialMoisture(val) {
    const m = Math.max(50, Math.min(90, Number(val) || 78.0));
    this.initialMoisture = m;
    this.currentMoisture = m;
    this.sensorReading = this.sensorFault ? -99.9 : m;
    this.elapsedHours = 0;
    this.cumulativeFanKwh = 0;
    this.targetReached = false;
    this.trajectory = [];
    this.recordStep();
    this.logEvent(`Initial leaf moisture set to ${m.toFixed(1)}%`, "INFO");
  }

  setTargetMoisture(val) {
    this.targetMoisture = Math.max(50, Math.min(75, Number(val) || 65.0));
    this.logEvent(`Target withered moisture set to ${this.targetMoisture.toFixed(1)}%`, "INFO");
  }

  setFanSpeed(val) {
    this.fanSpeedPercent = Math.max(0, Math.min(100, Number(val) || 0));
    this.logEvent(`Fan speed command set to ${this.fanSpeedPercent.toFixed(0)}%`, "ACTION");
  }

  setAmbientScenario(key) {
    if (AMBIENT_SCENARIOS[key]) {
      this.ambientKey = key;
      this.logEvent(`Ambient scenario changed: ${AMBIENT_SCENARIOS[key].name}`, "INFO");
    }
  }

  setSensorFault(hasFault) {
    this.sensorFault = Boolean(hasFault);
    if (this.sensorFault) {
      this.sensorReading = -99.9; // Open-loop sensor disconnect error
      this.logEvent("SENSOR FAULT: Moisture probe AI_MOISTURE_PROBE (%IW70) reading -99.9% (Out of Range)", "ALARM");
    } else {
      this.sensorReading = Math.round(this.currentMoisture * 10) / 10;
      this.logEvent("Sensor probe restored: Normal reading resumed", "INFO");
    }
  }

  stepTime(dtHours = 0.5) {
    if (this.targetReached && this.currentMoisture <= this.targetMoisture) {
      return;
    }

    const amb = AMBIENT_SCENARIOS[this.ambientKey];
    const equilibriumMoisture = 55.0 + 15.0 * amb.rh;
    const fanFraction = this.fanSpeedPercent / 100.0;
    const dryingRateK = amb.baseRate * (0.3 + 0.7 * fanFraction) * (amb.tempC / 25.0);

    // Exponential thin-layer decay
    const deltaM = (this.currentMoisture - equilibriumMoisture) * (1 - Math.exp(-dryingRateK * dtHours));
    this.currentMoisture = Math.max(equilibriumMoisture, this.currentMoisture - deltaM);

    // Energy calculation (P ~ v^3)
    const fanPowerKw = this.fanRatedPowerKw * Math.pow(fanFraction, 3);
    const addedKwh = fanPowerKw * dtHours;
    this.cumulativeFanKwh += addedKwh;
    this.elapsedHours += dtHours;

    if (!this.sensorFault) {
      this.sensorReading = Math.round(this.currentMoisture * 10) / 10;
    }

    if (this.currentMoisture <= this.targetMoisture && !this.targetReached) {
      this.targetReached = true;
      this.logEvent(`TARGET REACHED: Leaf moisture reached ${this.currentMoisture.toFixed(1)}% at ${this.elapsedHours.toFixed(1)} hours (Total Fan: ${this.cumulativeFanKwh.toFixed(2)} kWh)`, "ACTION");
    }

    this.recordStep();
  }

  recordStep() {
    this.trajectory.push({
      elapsedHours: Math.round(this.elapsedHours * 100) / 100,
      moisturePercent: Math.round(this.currentMoisture * 100) / 100,
      sensorReading: this.sensorReading,
      sensorValid: !this.sensorFault && this.sensorReading >= 0 && this.sensorReading <= 100,
      fanSpeedPercent: this.fanSpeedPercent,
      cumulativeFanKwh: Math.round(this.cumulativeFanKwh * 1000) / 1000,
      targetReached: this.targetReached
    });
  }

  simulateFullRun(maxHours = 16, dt = 0.5) {
    const trajectory = [];
    let curM = this.initialMoisture;
    let elapsed = 0;
    let kwh = 0;
    let reached = false;

    const amb = AMBIENT_SCENARIOS[this.ambientKey];
    const equilibriumMoisture = 55.0 + 15.0 * amb.rh;
    const fanFraction = this.fanSpeedPercent / 100.0;
    const dryingRateK = amb.baseRate * (0.3 + 0.7 * fanFraction) * (amb.tempC / 25.0);
    const fanPowerKw = this.fanRatedPowerKw * Math.pow(fanFraction, 3);

    while (elapsed <= maxHours) {
      trajectory.push({
        elapsedHours: Math.round(elapsed * 10) / 10,
        moisturePercent: Math.round(curM * 10) / 10,
        fanKwh: Math.round(kwh * 100) / 100,
        targetReached: reached
      });

      if (curM <= this.targetMoisture && !reached) {
        reached = true;
      }

      const deltaM = (curM - equilibriumMoisture) * (1 - Math.exp(-dryingRateK * dt));
      curM = Math.max(equilibriumMoisture, curM - deltaM);
      kwh += fanPowerKw * dt;
      elapsed += dt;
    }

    return trajectory;
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
      initialMoisture: this.initialMoisture,
      targetMoisture: this.targetMoisture,
      currentMoisture: Math.round(this.currentMoisture * 100) / 100,
      sensorReading: this.sensorReading,
      sensorFault: this.sensorFault,
      sensorValid: !this.sensorFault && this.sensorReading >= 0 && this.sensorReading <= 100,
      fanSpeedPercent: this.fanSpeedPercent,
      fanRatedPowerKw: this.fanRatedPowerKw,
      ambient: AMBIENT_SCENARIOS[this.ambientKey],
      ambientKey: this.ambientKey,
      elapsedHours: Math.round(this.elapsedHours * 10) / 10,
      cumulativeFanKwh: Math.round(this.cumulativeFanKwh * 100) / 100,
      targetReached: this.targetReached,
      trajectory: [...this.trajectory],
      eventLedger: [...this.eventLedger]
    };
  }
}
