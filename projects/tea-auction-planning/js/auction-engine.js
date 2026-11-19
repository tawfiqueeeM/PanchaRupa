/**
 * Tea Auction Planning & Venue Optimization Domain Engine
 * Evaluates net price realization across Panchagarh, Sreemangal, and Chattogram,
 * calculates freight break-even premiums, and enforces reserve price Hold/Relist gates.
 */

export class AuctionEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.lot = {
      lotId: "LOT-AUC-2026-01",
      product: "GREEN_TEA",
      quantityKg: 1000.0,
      reservePriceBdt: 200.0
    };
    this.venues = [];
    this.analysis = null;
    this.auditLog = [];
    this.log("Tea auction planning engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.lot = { ...this.lot, ...(scenario.lot || {}) };
    this.venues = JSON.parse(JSON.stringify(scenario.venues || []));
    this.analysis = this.evaluateVenues();
    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.analysis;
  }

  updateLotQuantity(kg) {
    this.lot.quantityKg = Math.max(100, Math.min(5000, Number(kg)));
    this.analysis = this.evaluateVenues();
    this.log(`Updated lot quantity to ${this.lot.quantityKg} kg`, "ACTION");
    return this.analysis;
  }

  updateReservePrice(price) {
    this.lot.reservePriceBdt = Math.max(100, Math.min(400, Number(price)));
    this.analysis = this.evaluateVenues();
    this.log(`Updated reserve price to BDT ${this.lot.reservePriceBdt}/kg`, "ACTION");
    return this.analysis;
  }

  updateVenueHammerPrice(venueId, price) {
    const venue = this.venues.find(v => v.venueId === venueId);
    if (!venue) return false;
    venue.expectedHammerPriceBdt = Math.max(100, Math.min(500, Number(price)));
    this.analysis = this.evaluateVenues();
    this.log(`Updated expected hammer price for ${venue.name} to BDT ${venue.expectedHammerPriceBdt}/kg`, "ACTION");
    return true;
  }

  evaluateVenues() {
    const qty = this.lot.quantityKg;
    const reserve = this.lot.reservePriceBdt;

    let localNetRealizationPerKg = 0;
    const panchagarh = this.venues.find(v => v.venueId === "PANCHAGARH");
    if (panchagarh) {
      const gross = panchagarh.expectedHammerPriceBdt;
      const freight = panchagarh.freightPerKg;
      const commission = gross * (panchagarh.brokerCommissionPct / 100);
      const wh = panchagarh.warehouseFeePerKg;
      localNetRealizationPerKg = gross - freight - commission - wh;
    }

    let bestNetRealization = -Infinity;
    let recommendedVenueId = null;

    const evaluatedVenues = this.venues.map(v => {
      const grossProceedsBdt = Math.round(qty * v.expectedHammerPriceBdt * 100) / 100;
      const freightCostBdt = Math.round(qty * v.freightPerKg * 100) / 100;
      const brokerFeeBdt = Math.round(grossProceedsBdt * (v.brokerCommissionPct / 100) * 100) / 100;
      const warehouseCostBdt = Math.round(qty * v.warehouseFeePerKg * 100) / 100;
      const totalDeductionsBdt = Math.round((freightCostBdt + brokerFeeBdt + warehouseCostBdt) * 100) / 100;

      const netRealizationTotalBdt = Math.round((grossProceedsBdt - totalDeductionsBdt) * 100) / 100;
      const netRealizationPerKg = Math.round((netRealizationTotalBdt / qty) * 100) / 100;

      // Decision rule based on reserve price
      let decision = "SOLD_SETTLE";
      let decisionReason = "Hammer price meets or exceeds reserve price target.";
      if (netRealizationPerKg < reserve) {
        const deficit = reserve - netRealizationPerKg;
        if (deficit <= 10.0) {
          decision = "RELIST";
          decisionReason = `Net realization (BDT ${netRealizationPerKg.toFixed(2)}) is within BDT 10/kg of reserve (BDT ${reserve.toFixed(2)}). Re-enter next sale.`;
        } else {
          decision = "WITHDRAW_HOLD";
          decisionReason = `Net realization (BDT ${netRealizationPerKg.toFixed(2)}) falls far below reserve (BDT ${reserve.toFixed(2)}). Withdraw to warehouse.`;
        }
      }

      // Freight Break-Even against Panchagarh
      let breakEvenHammerPrice = 0;
      let breakEvenPremiumRequired = 0;
      if (v.venueId !== "PANCHAGARH" && localNetRealizationPerKg > 0) {
        const commRate = v.brokerCommissionPct / 100;
        breakEvenHammerPrice = Math.round(((localNetRealizationPerKg + v.freightPerKg + v.warehouseFeePerKg) / (1 - commRate)) * 100) / 100;
        breakEvenPremiumRequired = Math.round((breakEvenHammerPrice - (panchagarh ? panchagarh.expectedHammerPriceBdt : 0)) * 100) / 100;
      }

      if (netRealizationPerKg > bestNetRealization) {
        bestNetRealization = netRealizationPerKg;
        recommendedVenueId = v.venueId;
      }

      return {
        ...v,
        grossProceedsBdt,
        freightCostBdt,
        brokerFeeBdt,
        warehouseCostBdt,
        totalDeductionsBdt,
        netRealizationTotalBdt,
        netRealizationPerKg,
        decision,
        decisionReason,
        breakEvenHammerPrice,
        breakEvenPremiumRequired
      };
    });

    return {
      lot: { ...this.lot },
      venues: evaluatedVenues,
      recommendedVenueId,
      bestNetRealizationPerKg: bestNetRealization
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
