/**
 * Inventory & Fulfillment Management Domain Engine
 * Enforces quality disposition gating (RELEASED vs ON_HOLD), prevents over-allocation,
 * and models the distinct three-stage lifecycle: RESERVED -> DISPATCHED -> SETTLED.
 */

export class InventoryEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.lots = [];
    this.orders = [];
    this.exceptions = [];
    this.auditLog = [];
    this.log("Inventory & fulfillment engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.lots = JSON.parse(JSON.stringify(scenario.lots || []));
    this.orders = JSON.parse(JSON.stringify(scenario.orders || []));
    this.exceptions = [];

    // Validate scenario orders against lots
    this.orders.forEach(ord => {
      const lot = this.lots.find(l => l.lotId === ord.lotId);
      if (!lot) {
        this.exceptions.push({
          type: "MISSING_LOT",
          orderId: ord.orderId,
          reason: `Referenced lot ${ord.lotId} not found in warehouse`
        });
        return;
      }

      if (lot.disposition !== "RELEASED") {
        this.exceptions.push({
          type: "HELD_LOT_VIOLATION",
          orderId: ord.orderId,
          lotId: lot.lotId,
          disposition: lot.disposition,
          reason: `Cannot reserve from lot ${lot.lotId}: current quality disposition is ${lot.disposition}!`
        });
        return;
      }

      // If order is already reserved in fixture, track on lot
      if (ord.lifecycleState === "RESERVED") {
        lot.reservedKg = Math.round((lot.reservedKg + ord.allocatedKg) * 10) / 10;
      }
    });

    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.getSnapshot();
  }

  reserveLot(orderId, lotId, allocatedKg, channel = "AUCTION_BULK", customer = "Market Order", format = "Tea Sack", unitCount = 1) {
    const alloc = Number(allocatedKg);
    if (!Number.isFinite(alloc) || alloc <= 0) {
      const reason = `Validation Block: Allocation quantity must be a finite positive number (received ${allocatedKg})`;
      this.exceptions.push({ type: "INVALID_QUANTITY", orderId, lotId, reason });
      this.log(reason, "ALARM");
      return { success: false, reason };
    }

    const lot = this.lots.find(l => l.lotId === lotId);
    if (!lot) {
      this.log(`Reservation failed: Lot ${lotId} not found`, "ALARM");
      return { success: false, reason: "LOT_NOT_FOUND" };
    }

    if (lot.disposition !== "RELEASED") {
      const reason = `Quality Gate Block: Lot ${lot.lotId} is ${lot.disposition}. Reservation prohibited!`;
      this.exceptions.push({ type: "HELD_LOT_VIOLATION", orderId, lotId, reason });
      this.log(reason, "ALARM");
      return { success: false, reason };
    }

    const availableKg = Math.round((lot.totalKg - lot.reservedKg - lot.dispatchedKg) * 10) / 10;
    if (alloc > availableKg) {
      const reason = `Over-allocation Block: Requested ${alloc} kg exceeds available unreserved mass (${availableKg} kg) on lot ${lot.lotId}`;
      this.exceptions.push({ type: "EXCESS_ALLOCATION", orderId, lotId, reason });
      this.log(reason, "ALARM");
      return { success: false, reason };
    }

    lot.reservedKg = Math.round((lot.reservedKg + alloc) * 10) / 10;
    const newOrder = {
      orderId,
      channel,
      customer,
      lotId,
      allocatedKg: alloc,
      format,
      unitCount,
      lifecycleState: "RESERVED",
      settlementDays: channel === "AUCTION_BULK" ? 14 : 7,
      settlementStatus: "PENDING"
    };
    this.orders.push(newOrder);

    this.log(`Reserved ${alloc} kg from ${lot.lotId} for ${orderId} (${format})`, "ACTION");
    return { success: true, order: newOrder };
  }

  dispatchOrder(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return { success: false, reason: "ORDER_NOT_FOUND" };

    if (order.lifecycleState !== "RESERVED") {
      return { success: false, reason: `Invalid lifecycle transition from ${order.lifecycleState} to DISPATCHED` };
    }

    const lot = this.lots.find(l => l.lotId === order.lotId);
    if (!lot || lot.disposition !== "RELEASED") {
      return { success: false, reason: `Lot ${order.lotId} not eligible for dispatch` };
    }

    // Move mass from reserved to dispatched
    lot.reservedKg = Math.max(0, Math.round((lot.reservedKg - order.allocatedKg) * 10) / 10);
    lot.dispatchedKg = Math.round((lot.dispatchedKg + order.allocatedKg) * 10) / 10;
    order.lifecycleState = "DISPATCHED";

    this.log(`DISPATCH CONFIRMED: Order ${order.orderId} (${order.allocatedKg} kg, ${order.format}) shipped from ${order.lotId}`, "ACTION");
    return { success: true, order };
  }

  settleOrder(orderId, isDelayed = false) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return { success: false, reason: "ORDER_NOT_FOUND" };

    if (order.lifecycleState !== "DISPATCHED") {
      return { success: false, reason: `Order must be DISPATCHED before settlement (currently ${order.lifecycleState})` };
    }

    if (isDelayed) {
      order.lifecycleState = "DISPATCHED"; // Remains open receivable
      order.settlementStatus = "OVERDUE_DELAYED";
      order.isOverdue = true;
      order.settlementDays += 21;
      this.log(`FINANCIAL DELAY: Order ${order.orderId} settlement delayed (+21 days, Status: OVERDUE_DELAYED). Receivable remains OPEN.`, "WARN");
      return { success: true, order };
    }

    // Normal or overdue settlement collection
    order.lifecycleState = "SETTLED";
    order.settlementStatus = "SETTLED";
    order.isOverdue = false;

    this.log(`FINANCIAL SETTLEMENT: Order ${order.orderId} fully settled and closed (Cycle: ${order.settlementDays} days)`, "ACTION");
    return { success: true, order };
  }

  getSnapshot() {
    let totalStock = 0;
    let totalReserved = 0;
    let totalDispatched = 0;

    const enrichedLots = this.lots.map(l => {
      totalStock += l.totalKg;
      totalReserved += l.reservedKg;
      totalDispatched += l.dispatchedKg;
      const availableKg = Math.max(0, Math.round((l.totalKg - l.reservedKg - l.dispatchedKg) * 10) / 10);
      return {
        ...l,
        availableKg
      };
    });

    // Breakdown by channel
    let bulkKg = 0;
    let retailKg = 0;
    this.orders.forEach(o => {
      if (o.channel === "AUCTION_BULK") bulkKg += o.allocatedKg;
      else if (o.channel === "RETAIL_BOTTLES") retailKg += o.allocatedKg;
    });

    const isFeasible = this.exceptions.length === 0;

    return {
      totalStockKg: Math.round(totalStock * 10) / 10,
      totalReservedKg: Math.round(totalReserved * 10) / 10,
      totalDispatchedKg: Math.round(totalDispatched * 10) / 10,
      totalAvailableKg: Math.max(0, Math.round((totalStock - totalReserved - totalDispatched) * 10) / 10),
      channelBreakdown: {
        bulkAuctionKg: Math.round(bulkKg * 10) / 10,
        retailBottlesKg: Math.round(retailKg * 10) / 10
      },
      isFeasible,
      lots: enrichedLots,
      orders: [...this.orders],
      exceptions: [...this.exceptions],
      auditLog: [...this.auditLog]
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
