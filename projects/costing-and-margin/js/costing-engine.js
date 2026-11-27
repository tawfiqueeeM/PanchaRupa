/**
 * Costing, Overhead Allocation & Margin Analysis Domain Engine
 * Implements absorption manufacturing costing bridge, segregation of freight,
 * zero-output period variance handling, and break-even analytics.
 */

export class CostingEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.volumeKg = 1000.0;
    this.leafPricePerKg = 25.0;
    this.netYieldPct = 25.0;
    this.bulkSharePct = 90.0;
    this.retailSharePct = 10.0;
    this.bulkPricePerKg = 240.0;
    this.retailPricePerKg = 450.0;
    this.recurringCashBdt = 61000.0;
    this.depreciationBdt = 10833.33;
    this.outboundFreightBdt = 9000.0;
    this.costing = null;
    this.auditLog = [];
    this.log("Costing and margin engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.volumeKg = Number(scenario.volumeKg ?? 1000.0);
    this.leafPricePerKg = Number(scenario.leafPricePerKg ?? 25.0);
    this.netYieldPct = Number(scenario.netYieldPct ?? 25.0);
    this.bulkSharePct = Number(scenario.bulkSharePct ?? 90.0);
    this.retailSharePct = Number(scenario.retailSharePct ?? 10.0);
    this.bulkPricePerKg = Number(scenario.bulkPricePerKg ?? 240.0);
    this.retailPricePerKg = Number(scenario.retailPricePerKg ?? 450.0);
    this.recurringCashBdt = Number(scenario.recurringCashBdt ?? 61000.0);
    this.depreciationBdt = Number(scenario.depreciationBdt ?? 10833.33);
    this.outboundFreightBdt = Number(scenario.outboundFreightBdt ?? 9000.0);

    this.costing = this.computeCosting();
    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.costing;
  }

  updateVolume(volumeKg) {
    this.volumeKg = Math.max(0, Math.min(2500, Number(volumeKg)));
    this.costing = this.computeCosting();
    this.log(`Updated volume to ${this.volumeKg} kg`, "ACTION");
    return this.costing;
  }

  updateLeafPrice(price) {
    this.leafPricePerKg = Math.max(10, Math.min(60, Number(price)));
    this.costing = this.computeCosting();
    this.log(`Updated fresh leaf price to BDT ${this.leafPricePerKg}/kg`, "ACTION");
    return this.costing;
  }

  updateYield(yieldPct) {
    this.netYieldPct = Math.max(15, Math.min(35, Number(yieldPct)));
    this.costing = this.computeCosting();
    this.log(`Updated net yield to ${this.netYieldPct}%`, "ACTION");
    return this.costing;
  }

  updateChannelSplit(bulkPct) {
    this.bulkSharePct = Math.max(0, Math.min(100, Number(bulkPct)));
    this.retailSharePct = 100.0 - this.bulkSharePct;
    this.costing = this.computeCosting();
    this.log(`Updated channel split to ${this.bulkSharePct}% Bulk / ${this.retailSharePct}% Retail`, "ACTION");
    return this.costing;
  }

  computeCosting() {
    const bulkKg = Math.round((this.volumeKg * (this.bulkSharePct / 100)) * 10) / 10;
    const retailKg = Math.round((this.volumeKg * (this.retailSharePct / 100)) * 10) / 10;

    const fixedOverheadBdt = this.recurringCashBdt + this.depreciationBdt;

    if (this.volumeKg === 0) {
      return {
        volumeKg: 0,
        bulkKg: 0,
        retailKg: 0,
        freshLeafKg: 0,
        leafCostBdt: 0,
        packagingCostBdt: 0,
        recurringCashBdt: this.recurringCashBdt,
        depreciationBdt: this.depreciationBdt,
        totalManufacturingCostBdt: Math.round(fixedOverheadBdt * 100) / 100,
        unitManufacturingCostBdt: null, // "N/A (Zero Output)"
        unitManufacturingCostStr: "N/A (Zero Output)",
        isZeroOutput: true,
        outboundFreightBdt: 0,
        grossRevenueBdt: 0,
        netIncomeBdt: -Math.round(fixedOverheadBdt * 100) / 100,
        grossMarginPct: null,
        breakEvenVolumeKg: null,
        unabsorbedPeriodVarianceBdt: Math.round(fixedOverheadBdt * 100) / 100
      };
    }

    // Active production
    const freshLeafKg = Math.round((this.volumeKg / (this.netYieldPct / 100)) * 10) / 10;
    const leafCostBdt = Math.round(freshLeafKg * this.leafPricePerKg * 100) / 100;
    const packagingCostBdt = Math.round((bulkKg * 2.00 + retailKg * 80.00) * 100) / 100;

    const totalManufacturingCostBdt = Math.round((leafCostBdt + packagingCostBdt + this.recurringCashBdt + this.depreciationBdt) * 100) / 100;
    const unitManufacturingCostBdt = Math.round((totalManufacturingCostBdt / this.volumeKg) * 100) / 100;

    const grossRevenueBdt = Math.round((bulkKg * this.bulkPricePerKg + retailKg * this.retailPricePerKg) * 100) / 100;
    const netIncomeBdt = Math.round((grossRevenueBdt - totalManufacturingCostBdt - this.outboundFreightBdt) * 100) / 100;
    const grossMarginPct = grossRevenueBdt > 0 ? Math.round((netIncomeBdt / grossRevenueBdt) * 1000) / 10 : 0;

    // Break-even analysis
    const avgRevenuePerKg = grossRevenueBdt / this.volumeKg;
    const varCostPerKg = (leafCostBdt + packagingCostBdt) / this.volumeKg;
    const contributionPerKg = avgRevenuePerKg - varCostPerKg;
    const totalFixedCosts = fixedOverheadBdt + this.outboundFreightBdt;
    const breakEvenVolumeKg = contributionPerKg > 0 ? Math.round(totalFixedCosts / contributionPerKg) : null;

    return {
      volumeKg: this.volumeKg,
      bulkKg,
      retailKg,
      freshLeafKg,
      leafCostBdt,
      packagingCostBdt,
      recurringCashBdt: this.recurringCashBdt,
      depreciationBdt: this.depreciationBdt,
      totalManufacturingCostBdt,
      unitManufacturingCostBdt,
      unitManufacturingCostStr: `BDT ${unitManufacturingCostBdt.toFixed(2)}`,
      isZeroOutput: false,
      outboundFreightBdt: this.outboundFreightBdt,
      grossRevenueBdt,
      netIncomeBdt,
      grossMarginPct,
      breakEvenVolumeKg,
      unabsorbedPeriodVarianceBdt: 0
    };
  }

  log(message, type = "INFO") {
    this.auditLog.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      message,
      type
    });
    if (this.auditLog.length > 50) this.auditLog.pop();
  }
}
