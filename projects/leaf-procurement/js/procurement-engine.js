/**
 * Leaf Procurement & Material Requirements Planning (MRP) Domain Engine
 * Computes net finished tea demand, converts to fresh green leaf via product yields,
 * checks supplier quality eligibility (Golden vs Green), tracks logistics arrival slots,
 * and enforces winter harvest dormancy constraints.
 */

export class ProcurementEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.month = "APRIL";
    this.isWinterDormancy = false;
    this.products = [];
    this.mrpResults = null;
    this.auditLog = [];
    this.log("Leaf procurement MRP engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.month = scenario.month || "APRIL";
    this.isWinterDormancy = Boolean(scenario.isWinterDormancy);
    this.products = JSON.parse(JSON.stringify(scenario.products || []));
    this.mrpResults = this.calculateMRP();
    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.mrpResults;
  }

  updateGrossDemand(productId, demandKg) {
    const prod = this.products.find(p => p.productId === productId);
    if (!prod) return false;
    prod.grossDemandKg = Math.max(0, Math.min(200, Number(demandKg)));
    this.mrpResults = this.calculateMRP();
    this.log(`Updated ${prod.productName} gross demand to ${prod.grossDemandKg} kg`, "ACTION");
    return true;
  }

  updateReleasedStock(productId, stockKg) {
    const prod = this.products.find(p => p.productId === productId);
    if (!prod) return false;
    prod.releasedStockKg = Math.max(0, Math.min(200, Number(stockKg)));
    this.mrpResults = this.calculateMRP();
    this.log(`Updated ${prod.productName} released stock buffer to ${prod.releasedStockKg} kg`, "ACTION");
    return true;
  }

  updateYield(productId, yieldPct) {
    const prod = this.products.find(p => p.productId === productId);
    if (!prod) return false;
    prod.assumedYieldPct = Math.max(15, Math.min(35, Number(yieldPct)));
    this.mrpResults = this.calculateMRP();
    this.log(`Updated ${prod.productName} dry-to-wet yield to ${prod.assumedYieldPct}%`, "ACTION");
    return true;
  }

  updateDeliveryTime(productId, arrivalHour) {
    const prod = this.products.find(p => p.productId === productId);
    if (!prod) return false;
    prod.estimatedArrivalHour = Number(arrivalHour);
    this.mrpResults = this.calculateMRP();
    this.log(`Updated ${prod.productName} estimated arrival slot to ${prod.estimatedArrivalHour}:00`, "ACTION");
    return true;
  }

  setWinterDormancy(isWinter) {
    this.isWinterDormancy = Boolean(isWinter);
    this.month = this.isWinterDormancy ? "JANUARY" : "APRIL";
    this.mrpResults = this.calculateMRP();
    this.log(`Winter dormancy status toggled to ${this.isWinterDormancy ? "ACTIVE (JAN/FEB)" : "OFF (PLUCKING SEASON)"}`, "ACTION");
  }

  calculateMRP() {
    let totalGrossDemand = 0;
    let totalStock = 0;
    let totalNetDemand = 0;
    let totalFreshLeafNeeded = 0;
    const shortages = [];
    const eligibilityExceptions = [];

    const calculatedProducts = this.products.map(p => {
      totalGrossDemand += p.grossDemandKg;
      totalStock += p.releasedStockKg;

      const netDemandKg = Math.max(0, Math.round((p.grossDemandKg - p.releasedStockKg) * 10) / 10);
      totalNetDemand += netDemandKg;

      let freshLeafNeededKg = 0;
      let isShortage = false;
      let delayHours = 0;
      let isEligible = true;

      if (this.isWinterDormancy) {
        freshLeafNeededKg = 0.0;
        if (netDemandKg > 0) {
          shortages.push({
            productId: p.productId,
            productName: p.productName,
            type: "WINTER_BUFFER_DEFICIT",
            netDemandKg,
            reason: `Winter bush dormancy in ${this.month}: cannot pluck fresh leaf. Unfulfilled deficit of ${netDemandKg} kg.`
          });
        }
      } else {
        // Active plucking season
        if (p.assumedYieldPct > 0) {
          freshLeafNeededKg = Math.round((netDemandKg / (p.assumedYieldPct / 100)) * 10) / 10;
        }
        totalFreshLeafNeeded += freshLeafNeededKg;

        // Supplier eligibility validation
        if (p.requiredGrade === "GOLDEN_TENDER_BUD" && p.supplierId === "SUPPLIER_02") {
          isEligible = false;
          eligibilityExceptions.push({
            productId: p.productId,
            supplierId: p.supplierId,
            supplierName: p.supplierName,
            reason: `${p.supplierName} is not certified for tender golden clonal bud plucking.`
          });
        }

        // Logistics delivery slot validation (applies only when net leaf delivery is needed)
        if (netDemandKg > 0 && freshLeafNeededKg > 0 && p.estimatedArrivalHour > p.scheduledSlotHour) {
          isShortage = true;
          delayHours = p.estimatedArrivalHour - p.scheduledSlotHour;
          shortages.push({
            productId: p.productId,
            productName: p.productName,
            type: "LOGISTICS_DELAY",
            delayHours,
            scheduledSlot: `${p.scheduledSlotHour}:00`,
            arrivalSlot: `${p.estimatedArrivalHour}:00`,
            impactedFreshLeafKg: freshLeafNeededKg,
            reason: `Fresh leaf delivery arrives at ${p.estimatedArrivalHour}:00 (${delayHours}h after scheduled production slot ${p.scheduledSlotHour}:00). Line starvation!`
          });
        }
      }

      return {
        ...p,
        netDemandKg,
        freshLeafNeededKg,
        isShortage,
        delayHours,
        isEligible
      };
    });

    const isFeasible = shortages.length === 0 && eligibilityExceptions.length === 0;

    return {
      month: this.month,
      isWinterDormancy: this.isWinterDormancy,
      totalGrossDemandKg: Math.round(totalGrossDemand * 10) / 10,
      totalReleasedStockKg: Math.round(totalStock * 10) / 10,
      totalNetDemandKg: Math.round(totalNetDemand * 10) / 10,
      totalFreshLeafNeededKg: Math.round(totalFreshLeafNeeded * 10) / 10,
      isFeasible,
      products: calculatedProducts,
      shortages,
      eligibilityExceptions
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
