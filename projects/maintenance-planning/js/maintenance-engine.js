/**
 * Maintenance Planning & Outage Impact Domain Engine
 * Models asset registers, runtime hours, MTBF health indices,
 * planned PM vs unplanned CM work orders, and production schedule impact.
 */

export class MaintenanceEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.assets = [];
    this.workOrders = [];
    this.auditLog = [];
    this.log("Maintenance planning engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.assets = JSON.parse(JSON.stringify(scenario.assets || []));
    this.workOrders = JSON.parse(JSON.stringify(scenario.workOrders || []));
    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.getSnapshot();
  }

  createWorkOrder({
    woId,
    type = "PREVENTATIVE",
    assetId,
    title,
    priority = "MEDIUM",
    startMin = 0,
    durationMinutes = 60,
    partsCostBdt = 0,
    laborHours = 2.0
  }) {
    const asset = this.assets.find(a => a.assetId === assetId);
    if (!asset) {
      this.log(`Failed to create WO: Asset ${assetId} not found`, "ALARM");
      return { success: false, reason: "ASSET_NOT_FOUND" };
    }

    const endMin = startMin + durationMinutes;

    // Calculate schedule and dispatch impact
    let queuedBatches = [];
    let dispatchDelayMin = 0;

    if (type === "CORRECTIVE") {
      asset.status = "TRIPPED_OUTAGE";
      // During active shift (08:00 to 17:00 / 0 to 540 min), shared assets halt downstream lines
      if (asset.criticality === "HIGH" && startMin < 540) {
        queuedBatches = ["B-G01", "B-GL01"];
        dispatchDelayMin = durationMinutes;
      }
    } else {
      if (asset.status !== "TRIPPED_OUTAGE") {
        asset.status = "MAINTENANCE_PLANNED";
      }
      // Preventative during pre-shift window creates 0 delay
      if (startMin <= 0) {
        dispatchDelayMin = 0;
      } else {
        dispatchDelayMin = Math.max(0, endMin - 540);
      }
    }

    const newWO = {
      woId,
      type,
      assetId,
      title: title || `${type} service on ${asset.name}`,
      priority,
      startMin,
      endMin,
      durationMinutes,
      status: "OPEN",
      partsCostBdt: Number(partsCostBdt),
      laborHours: Number(laborHours),
      queuedBatches,
      dispatchDelayMin
    };

    this.workOrders.push(newWO);
    this.log(`Created ${type} work order ${woId} on ${asset.name} (Duration: ${durationMinutes}m, Delay: ${dispatchDelayMin}m)`, "ACTION");
    return { success: true, workOrder: newWO };
  }

  recomputeAssetStatus(assetId) {
    const asset = this.assets.find(a => a.assetId === assetId);
    if (!asset) return null;
    const openOrders = this.workOrders.filter(w => w.assetId === assetId && w.status === "OPEN");
    if (openOrders.length === 0) {
      asset.status = "OPERATIONAL";
    } else if (openOrders.some(w => w.type === "CORRECTIVE")) {
      asset.status = "TRIPPED_OUTAGE";
    } else {
      asset.status = "MAINTENANCE_PLANNED";
    }
    return asset.status;
  }

  completeWorkOrder(woId) {
    const wo = this.workOrders.find(w => w.woId === woId);
    if (!wo) return { success: false, reason: "WO_NOT_FOUND" };

    wo.status = "COMPLETED";
    const asset = this.assets.find(a => a.assetId === wo.assetId);
    if (asset) {
      this.recomputeAssetStatus(asset.assetId);
      if (asset.status === "OPERATIONAL") {
        asset.runtimeHours = 0.0; // Reset after overhaul/repairs completed
      }
    }

    this.log(`Work order ${woId} marked COMPLETED. Asset ${asset ? asset.name : ''} status is now ${asset ? asset.status : 'UNKNOWN'}`, "ACTION");
    return { success: true, workOrder: wo };
  }

  getSnapshot() {
    let plannedDowntimeMin = 0;
    let unplannedDowntimeMin = 0;
    let totalPartsCostBdt = 0;
    let totalLaborHours = 0;
    let totalDispatchDelayMin = 0;
    const queuedBatchesSet = new Set();

    this.workOrders.forEach(wo => {
      totalPartsCostBdt += wo.partsCostBdt;
      totalLaborHours += wo.laborHours;
      totalDispatchDelayMin = Math.max(totalDispatchDelayMin, wo.dispatchDelayMin);

      if (wo.type === "PREVENTATIVE") {
        plannedDowntimeMin += wo.durationMinutes;
      } else {
        unplannedDowntimeMin += wo.durationMinutes;
      }

      (wo.queuedBatches || []).forEach(b => queuedBatchesSet.add(b));
    });

    const laborCostBdt = totalLaborHours * 250.0; // BDT 250/hr technician rate
    const totalMaintenanceSpendBdt = Math.round((totalPartsCostBdt + laborCostBdt) * 100) / 100;

    return {
      assets: [...this.assets],
      workOrders: [...this.workOrders],
      plannedDowntimeMin,
      unplannedDowntimeMin,
      totalDispatchDelayMin,
      totalMaintenanceSpendBdt,
      queuedBatchesCount: queuedBatchesSet.size,
      queuedBatches: Array.from(queuedBatchesSet),
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
