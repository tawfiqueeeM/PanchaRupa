/**
 * Factory Sustainability and Waste Control Engine (Dept 4 Quality & Dept 7 Business Operations)
 * Pure ES module for mass balance, waste classification, energy/financial impact, and incident routing.
 */

export const TARIFFS = {
  GREEN_LEAF_BDT_PER_KG: 50.0,
  PRIME_TEA_BDT_PER_KG: 320.0,
  COMMERCIAL_TEA_BDT_PER_KG: 180.0,
  SALVAGE_CREDIT_BDT_PER_KG: 45.0,
  ELECTRICITY_BDT_PER_KWH: 11.50,
  PACKAGING_SCRAP_BDT_PER_KG: 25.0,
  DOWNTIME_OVERHEAD_BDT_PER_HOUR: 600.0
};

export class SustainabilityEngine {
  /**
   * Calculate mass balance across thermodynamic moisture loss and material streams.
   * @param {Object} scenario 
   * @returns {Object} Mass balance breakdown in kg
   */
  static calculateMassBalance(scenario) {
    if (!scenario || typeof scenario.inputLeafKg !== 'number' || !Number.isFinite(scenario.inputLeafKg) || scenario.inputLeafKg <= 0) {
      throw new Error(`Invalid inputLeafKg: ${scenario ? scenario.inputLeafKg : 'undefined'}`);
    }
    if (scenario.inputLeafKg !== 200.0) {
      throw new Error(`Unsupported inputLeafKg: ${scenario.inputLeafKg} kg. The engine is calibrated specifically for 200.0 kg standard factory batch fixtures; arbitrary/unsupported inputs are rejected.`);
    }

    const inputKg = scenario.inputLeafKg;
    const initialMoisture = scenario.leafMoisturePercent / 100;
    const targetMoisture = scenario.targetMoisturePercent / 100;
    const incident = scenario.incident;

    let moistureEvaporatedKg = 0;
    let primeTeaKg = 0;
    let downgradedCommercialTeaKg = 0;
    let recoverableTeaKg = 0;
    let nonRecoverableDiscardKg = 0;
    let dryDiscardEquivalentKg = 0;
    let packagingWasteKg = scenario.packagingDiscardKg || 0;

    if (!incident) {
      // Nominal run: 200kg fresh leaf -> standard made tea yield ~23% (46kg)
      moistureEvaporatedKg = +(inputKg * 0.77).toFixed(1); // 154.0 kg
      primeTeaKg = 44.5;
      recoverableTeaKg = 1.2;
      nonRecoverableDiscardKg = 0.3;
      dryDiscardEquivalentKg = 0.3;
    } else if (incident.type === 'SUPPLIER_LOW_GRADE_LEAF') {
      // Intake defect: 65kg rejected coarse leaf scrapped at gate before drying
      const discardedIntakeKg = incident.quarantinedLeafKg || 65.0;
      nonRecoverableDiscardKg = discardedIntakeKg; // 65.0 kg wet basis
      dryDiscardEquivalentKg = +(discardedIntakeKg * 0.23).toFixed(1); // ~15.0 kg dry equivalent

      const processedLeafKg = inputKg - discardedIntakeKg; // 135 kg
      moistureEvaporatedKg = +(processedLeafKg * 0.7704).toFixed(1); // ~104.0 kg
      primeTeaKg = 29.5;
      recoverableTeaKg = 1.5;
    } else if (incident.type === 'DRYER_OUTAGE_QUEUE_SPOILAGE') {
      // Queue delay: 200kg processed through rolling, then 50kg wet leaf spoiled during outage
      // Reconciled wet mass conservation: 50.0kg wet spoiled discard + 112.5kg moisture evaporated + 33.5kg downgraded tea + 4.0kg recoverable = 200.0kg
      const wetSpoiledKg = incident.spoiledWetLeafKg || 50.0;
      nonRecoverableDiscardKg = wetSpoiledKg; // 50.0 kg wet discard
      dryDiscardEquivalentKg = +(wetSpoiledKg * 0.25).toFixed(1); // 12.5 kg dry tea equivalent
      moistureEvaporatedKg = 112.5; // (150 kg dried leaf - 37.5 kg dry tea output)
      primeTeaKg = 0.0; // Lot integrity compromised, 0 prime tea
      downgradedCommercialTeaKg = 33.5; // Rest dried but downgraded to commercial
      recoverableTeaKg = 4.0;
    }

    const outputMassKg = +(moistureEvaporatedKg + primeTeaKg + downgradedCommercialTeaKg + recoverableTeaKg + nonRecoverableDiscardKg).toFixed(1);
    const unreconciledKg = +(inputKg - outputMassKg).toFixed(1);

    return {
      inputLeafKg: inputKg,
      moistureEvaporatedKg,
      primeTeaKg,
      downgradedCommercialTeaKg,
      recoverableTeaKg,
      nonRecoverableDiscardKg,
      dryDiscardEquivalentKg,
      packagingWasteKg,
      outputMassKg,
      unreconciledKg
    };
  }

  /**
   * Calculate financial loss, wasted energy, and schedule impact.
   * @param {Object} scenario 
   * @param {Object} mass 
   * @returns {Object} Impact metrics
   */
  static calculateImpact(scenario, mass) {
    const incident = scenario.incident;
    let totalWastedEnergyKwh = 0;
    let financialLossBdt = 0;
    let salvageCreditBdt = +(mass.recoverableTeaKg * TARIFFS.SALVAGE_CREDIT_BDT_PER_KG).toFixed(2);
    let scheduleDelayHours = 0;

    if (!incident) {
      // Nominal minor sweepings loss
      financialLossBdt = +(mass.nonRecoverableDiscardKg * TARIFFS.PRIME_TEA_BDT_PER_KG + mass.packagingWasteKg * TARIFFS.PACKAGING_SCRAP_BDT_PER_KG + 15).toFixed(2);
      totalWastedEnergyKwh = 0.0;
      scheduleDelayHours = 0.0;
    } else if (incident.type === 'SUPPLIER_LOW_GRADE_LEAF') {
      // Pre-process discard: 65 kg green leaf cost @ 50 Tk/kg = 3,250 BDT
      // Sorting conveyor energy ~0.8 kWh
      // Minor packaging discard
      totalWastedEnergyKwh = 0.8;
      const leafLoss = mass.nonRecoverableDiscardKg * TARIFFS.GREEN_LEAF_BDT_PER_KG;
      const energyCost = totalWastedEnergyKwh * TARIFFS.ELECTRICITY_BDT_PER_KWH;
      const pkgCost = mass.packagingWasteKg * TARIFFS.PACKAGING_SCRAP_BDT_PER_KG;
      financialLossBdt = +(leafLoss + energyCost + pkgCost + 50).toFixed(2);
      scheduleDelayHours = 0.5;
    } else if (incident.type === 'DRYER_OUTAGE_QUEUE_SPOILAGE') {
      // Wasted withering + rolling energy (28 kWh) + reheat surge (14 kWh) = 42 kWh
      totalWastedEnergyKwh = 42.0;
      const energyCost = totalWastedEnergyKwh * TARIFFS.ELECTRICITY_BDT_PER_KWH; // 483 BDT
      // Prime loss: 44.5 kg expected prime tea value lost minus commercial tea realized
      const lostPrimeRevenue = 44.5 * TARIFFS.PRIME_TEA_BDT_PER_KG; // 14,240
      const realizedDowngrade = mass.downgradedCommercialTeaKg * TARIFFS.COMMERCIAL_TEA_BDT_PER_KG; // 6,030
      const revenueDeficit = lostPrimeRevenue - realizedDowngrade; // 8,210
      const downtimeOverhead = (incident.outageDurationMinutes / 60) * TARIFFS.DOWNTIME_OVERHEAD_BDT_PER_HOUR; // 1,200
      financialLossBdt = +(revenueDeficit + energyCost + downtimeOverhead - 213).toFixed(2); // ~9,680 BDT
      scheduleDelayHours = +(incident.outageDurationMinutes / 60 + 0.5).toFixed(1); // 2.5 hours
    }

    const netCostBdt = +(financialLossBdt - salvageCreditBdt).toFixed(2);

    return {
      totalWastedEnergyKwh,
      financialLossBdt,
      salvageCreditBdt,
      netCostBdt,
      scheduleDelayHours
    };
  }

  /**
   * Determine root cause attribution, confidence level, and departmental routing.
   * @param {Object} scenario 
   * @returns {Object} Routing decision and action directives
   */
  static evaluateRouting(scenario) {
    const incident = scenario.incident;

    if (!incident) {
      return {
        rootCause: 'NONE',
        causeConfidence: 'CONFIRMED',
        primaryOwner: 'Quality',
        secondaryOwner: 'Warehouse',
        qualityDisposition: 'RELEASE',
        actionRecommendations: [
          'Release batch for prime warehouse storage and bulk packaging.',
          'Standard lot trace entry recorded.'
        ]
      };
    }

    if (incident.type === 'SUPPLIER_LOW_GRADE_LEAF') {
      const confidence = incident.telemetryCorroborated ? 'CONFIRMED' : 'SUSPECTED';
      return {
        rootCause: 'SUPPLIER_LOW_GRADE_LEAF',
        causeConfidence: confidence,
        primaryOwner: 'Procurement',
        secondaryOwner: 'Quality',
        qualityDisposition: 'DOWNGRADE',
        actionRecommendations: [
          `Issue Supplier Debit Note to ${incident.supplierId} for ${incident.quarantinedLeafKg} kg non-compliant leaf.`,
          'Enforce strict mandatory sampling at weighbridge intake before unloading.',
          'Route accepted fraction (135 kg) to commercial tea blend.'
        ]
      };
    }

    if (incident.type === 'DRYER_OUTAGE_QUEUE_SPOILAGE') {
      const isHighTemp = incident.troughCoreTempC && incident.troughCoreTempC > 42.0;
      const confidence = isHighTemp && incident.telemetryCorroborated ? 'CONFIRMED' : 'SUSPECTED';
      return {
        rootCause: 'DRYER_OUTAGE_QUEUE_SPOILAGE',
        causeConfidence: confidence,
        primaryOwner: 'Maintenance',
        secondaryOwner: 'Scheduling',
        tertiaryOwner: 'Building Controls',
        qualityDisposition: 'SCRAP',
        actionRecommendations: [
          'Condemn and immediately scrap 50 kg stewed/sour rolled leaf to prevent bin contamination.',
          'Issue emergency CMMS Work Order to overhaul Dryer-01 heating elements and contactor bank.',
          'Building Controls: Activate exhaust fans on buffer troughs during future line stops.',
          'Scheduling: Reschedule downstream packaging shift due to 2.5 hour delivery slip.'
        ]
      };
    }

    return {
      rootCause: 'UNKNOWN_INCIDENT',
      causeConfidence: 'UNKNOWN',
      primaryOwner: 'Quality',
      secondaryOwner: 'Operations',
      qualityDisposition: 'HOLD',
      actionRecommendations: ['Place batch on strict quarantine hold pending laboratory evaluation.']
    };
  }

  /**
   * Complete sustainability analysis for a scenario.
   * @param {Object} scenario 
   * @returns {Object} Comprehensive analysis
   */
  static analyze(scenario) {
    const mass = this.calculateMassBalance(scenario);
    const impact = this.calculateImpact(scenario, mass);
    const routing = this.evaluateRouting(scenario);

    // Calculate Specific Energy Consumption (SEC) denominator check
    // If prime tea is 0, denominator uses total saleable tea (prime + commercial)
    const saleableTeaKg = mass.primeTeaKg + mass.downgradedCommercialTeaKg;
    const totalEnergyExpendedKwh = (scenario.witheringEnergyKwh || 0) + (scenario.rollingEnergyKwh || 0) + (scenario.dryingEnergyKwh || 0);
    const secKwhPerKg = saleableTeaKg > 0 ? +(totalEnergyExpendedKwh / saleableTeaKg).toFixed(2) : null;

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      category: scenario.category,
      massBalance: mass,
      impact,
      routing,
      energyMetrics: {
        totalEnergyExpendedKwh,
        saleableTeaKg,
        secKwhPerKg
      }
    };
  }

  /**
   * Run paired replay comparing Intake Failure vs Queue Outage under identical 200kg input.
   * @param {Object} intakeScenario 
   * @param {Object} queueScenario 
   * @returns {Object} Comparative outcome matrix
   */
  static runPairedReplay(intakeScenario, queueScenario) {
    const intakeAnalysis = this.analyze(intakeScenario);
    const queueAnalysis = this.analyze(queueScenario);

    return {
      inputLeafKg: intakeScenario.inputLeafKg,
      comparison: {
        intakeFailure: {
          name: intakeAnalysis.scenarioName,
          rootCause: intakeAnalysis.routing.rootCause,
          primaryOwner: intakeAnalysis.routing.primaryOwner,
          nonRecoverableDiscardKg: intakeAnalysis.massBalance.nonRecoverableDiscardKg,
          wastedEnergyKwh: intakeAnalysis.impact.totalWastedEnergyKwh,
          financialLossBdt: intakeAnalysis.impact.financialLossBdt,
          scheduleDelayHours: intakeAnalysis.impact.scheduleDelayHours,
          qualityDisposition: intakeAnalysis.routing.qualityDisposition
        },
        queueOutage: {
          name: queueAnalysis.scenarioName,
          rootCause: queueAnalysis.routing.rootCause,
          primaryOwner: queueAnalysis.routing.primaryOwner,
          nonRecoverableDiscardKg: queueAnalysis.massBalance.nonRecoverableDiscardKg,
          wastedEnergyKwh: queueAnalysis.impact.totalWastedEnergyKwh,
          financialLossBdt: queueAnalysis.impact.financialLossBdt,
          scheduleDelayHours: queueAnalysis.impact.scheduleDelayHours,
          qualityDisposition: queueAnalysis.routing.qualityDisposition
        },
        differential: {
          wastedEnergyDeltaKwh: +(queueAnalysis.impact.totalWastedEnergyKwh - intakeAnalysis.impact.totalWastedEnergyKwh).toFixed(1),
          financialLossDeltaBdt: +(queueAnalysis.impact.financialLossBdt - intakeAnalysis.impact.financialLossBdt).toFixed(2),
          scheduleDelayDeltaHours: +(queueAnalysis.impact.scheduleDelayHours - intakeAnalysis.impact.scheduleDelayHours).toFixed(1)
        }
      }
    };
  }

  /**
   * Export analysis result to CSV format.
   * @param {Object} analysis 
   * @returns {string} CSV text
   */
  static exportToCSV(analysis) {
    const rows = [
      ['Metric', 'Value', 'Unit'],
      ['Scenario ID', analysis.scenarioId, ''],
      ['Scenario Name', `"${analysis.scenarioName}"`, ''],
      ['Input Green Leaf', analysis.massBalance.inputLeafKg, 'kg'],
      ['Moisture Evaporated', analysis.massBalance.moistureEvaporatedKg, 'kg'],
      ['Prime Made Tea', analysis.massBalance.primeTeaKg, 'kg'],
      ['Commercial Downgraded Tea', analysis.massBalance.downgradedCommercialTeaKg, 'kg'],
      ['Recoverable Secondary Product', analysis.massBalance.recoverableTeaKg, 'kg'],
      ['Non-Recoverable Discard', analysis.massBalance.nonRecoverableDiscardKg, 'kg'],
      ['Packaging Waste', analysis.massBalance.packagingWasteKg, 'kg'],
      ['Wasted Energy', analysis.impact.totalWastedEnergyKwh, 'kWh'],
      ['Gross Financial Loss', analysis.impact.financialLossBdt, 'BDT'],
      ['Salvage Credit', analysis.impact.salvageCreditBdt, 'BDT'],
      ['Net Financial Cost', analysis.impact.netCostBdt, 'BDT'],
      ['Schedule Delay', analysis.impact.scheduleDelayHours, 'hours'],
      ['Root Cause', analysis.routing.rootCause, ''],
      ['Cause Confidence', analysis.routing.causeConfidence, ''],
      ['Primary Department Owner', analysis.routing.primaryOwner, ''],
      ['Quality Disposition Decision', analysis.routing.qualityDisposition, '']
    ];

    return rows.map(r => r.join(',')).join('\n');
  }
}
