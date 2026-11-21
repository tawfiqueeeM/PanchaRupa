/**
 * Factory Data Platform & Traceability Analytics Engine
 * Ingests relational factory events, enforces data dictionary integrity constraints
 * (PK uniqueness, FK orphans, unit validation, value bounds), and traverses lot genealogy.
 */

export class DataPlatformEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.dataset = {
      deliveries: [],
      batches: [],
      inspections: [],
      lots: [],
      packaging: [],
      orders: []
    };
    this.validationReport = null;
    this.auditLog = [];
    this.log("Factory data platform engine initialized", "INFO");
  }

  loadDataset(dataset) {
    this.dataset = JSON.parse(JSON.stringify(dataset || {}));
    this.validationReport = this.validateDataset(this.dataset);
    this.log(`Loaded dataset (${this.validationReport.isValid ? "VALID" : "INVALID - " + this.validationReport.errors.length + " errors"})`, "INFO");
    return this.validationReport;
  }

  validateDataset(data) {
    const errors = [];
    const entityCounts = {};

    const tables = ["deliveries", "batches", "inspections", "lots", "packaging", "orders"];
    tables.forEach(t => {
      data[t] = data[t] || [];
      entityCounts[t] = data[t].length;
    });

    // 1. Check Primary Key Uniqueness
    const pkDefs = {
      deliveries: "deliveryId",
      batches: "batchId",
      inspections: "inspectionId",
      lots: "lotId",
      packaging: "packId",
      orders: "orderId"
    };

    const pkSets = {};
    for (const [table, pkField] of Object.entries(pkDefs)) {
      pkSets[table] = new Set();
      const records = data[table] || [];
      records.forEach((rec, idx) => {
        const val = rec[pkField];
        if (!val) {
          errors.push({
            type: "MISSING_PRIMARY_KEY",
            table,
            field: pkField,
            index: idx,
            message: `Record at index ${idx} in '${table}' lacks required primary key '${pkField}'`
          });
        } else if (pkSets[table].has(val)) {
          errors.push({
            type: "DUPLICATE_KEY",
            table,
            field: pkField,
            value: val,
            index: idx,
            message: `Duplicate primary key '${val}' detected in table '${table}'`
          });
        } else {
          pkSets[table].add(val);
        }
      });
    }

    // 2. Check Referential Integrity (Foreign Key Constraints)
    (data.batches || []).forEach((b, idx) => {
      if (!b.deliveryId) {
        errors.push({
          type: "MISSING_FOREIGN_KEY",
          table: "batches",
          field: "deliveryId",
          index: idx,
          message: `Batch '${b.batchId}' lacks required foreign key 'deliveryId'`
        });
      } else if (!pkSets.deliveries.has(b.deliveryId)) {
        errors.push({
          type: "ORPHAN_FOREIGN_KEY",
          table: "batches",
          field: "deliveryId",
          value: b.deliveryId,
          parentTable: "deliveries",
          index: idx,
          message: `Batch '${b.batchId}' references non-existent delivery '${b.deliveryId}' in 'deliveries'`
        });
      }
    });

    (data.inspections || []).forEach((i, idx) => {
      if (!i.batchId) {
        errors.push({
          type: "MISSING_FOREIGN_KEY",
          table: "inspections",
          field: "batchId",
          index: idx,
          message: `Inspection '${i.inspectionId}' lacks required foreign key 'batchId'`
        });
      } else if (!pkSets.batches.has(i.batchId)) {
        errors.push({
          type: "ORPHAN_FOREIGN_KEY",
          table: "inspections",
          field: "batchId",
          value: i.batchId,
          parentTable: "batches",
          index: idx,
          message: `Inspection '${i.inspectionId}' references non-existent batch '${i.batchId}' in 'batches'`
        });
      }
    });

    (data.lots || []).forEach((l, idx) => {
      if (!l.batchId) {
        errors.push({
          type: "MISSING_FOREIGN_KEY",
          table: "lots",
          field: "batchId",
          index: idx,
          message: `Lot '${l.lotId}' lacks required foreign key 'batchId'`
        });
      } else if (!pkSets.batches.has(l.batchId)) {
        errors.push({
          type: "ORPHAN_FOREIGN_KEY",
          table: "lots",
          field: "batchId",
          value: l.batchId,
          parentTable: "batches",
          index: idx,
          message: `Lot '${l.lotId}' references non-existent batch '${l.batchId}' in 'batches'`
        });
      }
    });

    (data.packaging || []).forEach((p, idx) => {
      if (!p.lotId) {
        errors.push({
          type: "MISSING_FOREIGN_KEY",
          table: "packaging",
          field: "lotId",
          index: idx,
          message: `Packaging run '${p.packId}' lacks required foreign key 'lotId'`
        });
      } else if (!pkSets.lots.has(p.lotId)) {
        errors.push({
          type: "ORPHAN_FOREIGN_KEY",
          table: "packaging",
          field: "lotId",
          value: p.lotId,
          parentTable: "lots",
          index: idx,
          message: `Packaging run '${p.packId}' references non-existent lot '${p.lotId}' in 'lots'`
        });
      }
    });

    (data.orders || []).forEach((o, idx) => {
      if (!o.packId) {
        errors.push({
          type: "MISSING_FOREIGN_KEY",
          table: "orders",
          field: "packId",
          index: idx,
          message: `Order '${o.orderId}' lacks required foreign key 'packId'`
        });
      } else if (!pkSets.packaging.has(o.packId)) {
        errors.push({
          type: "ORPHAN_FOREIGN_KEY",
          table: "orders",
          field: "packId",
          value: o.packId,
          parentTable: "packaging",
          index: idx,
          message: `Order '${o.orderId}' references non-existent packaging run '${o.packId}' in 'packaging'`
        });
      }
    });

    // 3. Check Units & Physical Value Bounds
    (data.deliveries || []).forEach((d, idx) => {
      if (!d.unit || d.unit.toLowerCase() !== "kg") {
        errors.push({
          type: "INVALID_UNIT",
          table: "deliveries",
          field: "unit",
          value: d.unit !== undefined ? d.unit : "missing",
          expected: "kg",
          index: idx,
          message: `Invalid or missing unit '${d.unit}' on delivery '${d.deliveryId}': expected 'kg'`
        });
      }

      if (typeof d.grossWeightKg !== "number" || !Number.isFinite(d.grossWeightKg) || d.grossWeightKg <= 0 ||
          typeof d.netWeightKg !== "number" || !Number.isFinite(d.netWeightKg) || d.netWeightKg <= 0) {
        errors.push({
          type: "NEGATIVE_OR_ZERO_VALUE",
          table: "deliveries",
          field: "weight",
          value: d.grossWeightKg,
          index: idx,
          message: `Negative, zero, or missing weight '${d.grossWeightKg}' detected on delivery '${d.deliveryId}'`
        });
      }
    });

    (data.lots || []).forEach((l, idx) => {
      if (typeof l.totalKg !== "number" || !Number.isFinite(l.totalKg) || l.totalKg < 0) {
        errors.push({
          type: "NEGATIVE_OR_ZERO_VALUE",
          table: "lots",
          field: "totalKg",
          value: l.totalKg,
          index: idx,
          message: `Negative, missing, or invalid stock '${l.totalKg}' on lot '${l.lotId}'`
        });
      }
    });

    const lotPackSums = {};
    (data.packaging || []).forEach((p, idx) => {
      if (typeof p.packedKg !== "number" || !Number.isFinite(p.packedKg) || p.packedKg <= 0) {
        errors.push({
          type: "NEGATIVE_OR_ZERO_VALUE",
          table: "packaging",
          field: "packedKg",
          value: p.packedKg,
          index: idx,
          message: `Negative, missing, or zero packedKg '${p.packedKg}' on packaging run '${p.packId}'`
        });
      } else if (p.lotId) {
        lotPackSums[p.lotId] = (lotPackSums[p.lotId] || 0) + p.packedKg;
      }
    });

    // Check pack allocations against lot released quantity
    const lotsMap = new Map((data.lots || []).map(l => [l.lotId, l]));
    for (const [lotId, totalPacked] of Object.entries(lotPackSums)) {
      const lot = lotsMap.get(lotId);
      if (lot && typeof lot.totalKg === "number" && totalPacked > lot.totalKg) {
        errors.push({
          type: "ALLOCATION_EXCEEDS_LOT_STOCK",
          table: "packaging",
          field: "packedKg",
          value: totalPacked,
          lotStock: lot.totalKg,
          lotId,
          message: `Packaging allocation (${totalPacked} kg) exceeds available lot stock (${lot.totalKg} kg) for lot '${lotId}'`
        });
      }
    }

    (data.inspections || []).forEach((i, idx) => {
      if (typeof i.moisturePct !== "number" || !Number.isFinite(i.moisturePct) || i.moisturePct < 0 || i.moisturePct > 20.0) {
        errors.push({
          type: "OUT_OF_BOUNDS_VALUE",
          table: "inspections",
          field: "moisturePct",
          value: i.moisturePct,
          range: "0.0% - 20.0%",
          index: idx,
          message: `Moisture percentage '${i.moisturePct}%' out of valid physical range (0% - 20%) on '${i.inspectionId}'`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      entityCounts,
      totalRecords: Object.values(entityCounts).reduce((a, b) => a + b, 0)
    };
  }

  getLotTrace(lotId) {
    const lot = (this.dataset.lots || []).find(l => l.lotId === lotId);
    if (!lot) return null;

    const batch = (this.dataset.batches || []).find(b => b.batchId === lot.batchId);
    const delivery = batch ? (this.dataset.deliveries || []).find(d => d.deliveryId === batch.deliveryId) : null;
    const inspections = (this.dataset.inspections || []).filter(i => i.batchId === lot.batchId);
    const packagingRuns = (this.dataset.packaging || []).filter(p => p.lotId === lot.lotId);

    const packIds = new Set(packagingRuns.map(p => p.packId));
    const orders = (this.dataset.orders || []).filter(o => packIds.has(o.packId));

    return {
      lot,
      batch,
      delivery,
      inspections,
      packagingRuns,
      orders
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
