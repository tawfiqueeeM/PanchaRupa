import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DataPlatformEngine } from "../js/data-platform-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanDatasetPath = path.resolve(__dirname, "../fixtures/clean_factory_dataset.json");
const cleanData = JSON.parse(fs.readFileSync(cleanDatasetPath, "utf-8"));

const invalidDatasetPath = path.resolve(__dirname, "../fixtures/invalid_factory_dataset.json");
const invalidData = JSON.parse(fs.readFileSync(invalidDatasetPath, "utf-8"));

test("DataPlatformEngine - Clean dataset ingestion passes with zero validation errors", () => {
  const engine = new DataPlatformEngine();
  const report = engine.loadDataset(cleanData);

  assert.equal(report.isValid, true, "Clean dataset must be valid");
  assert.equal(report.errors.length, 0, "No errors expected");
  assert.equal(report.entityCounts.deliveries, 1);
  assert.equal(report.entityCounts.batches, 2);
  assert.equal(report.entityCounts.lots, 2);
});

test("DataPlatformEngine - Ingestion of invalid dataset detects duplicate keys and orphan foreign keys", () => {
  const engine = new DataPlatformEngine();
  const report = engine.loadDataset(invalidData);

  assert.equal(report.isValid, false, "Invalid dataset must be flagged invalid");
  assert.ok(report.errors.length >= 4, "Must detect multiple distinct data errors");

  // Duplicate key check
  const dupErr = report.errors.find(e => e.type === "DUPLICATE_KEY");
  assert.ok(dupErr, "Must detect DUPLICATE_KEY");
  assert.equal(dupErr.value, "B-G01", "Duplicate key must be B-G01");

  // Orphan foreign key check
  const orphanErr = report.errors.find(e => e.type === "ORPHAN_FOREIGN_KEY");
  assert.ok(orphanErr, "Must detect ORPHAN_FOREIGN_KEY");
  assert.equal(orphanErr.value, "DEL-NON-EXISTENT", "Orphan reference must be DEL-NON-EXISTENT");
});

test("DataPlatformEngine - Ingestion detects invalid measurement units and negative weights", () => {
  const engine = new DataPlatformEngine();
  const report = engine.loadDataset(invalidData);

  const unitErr = report.errors.find(e => e.type === "INVALID_UNIT");
  assert.ok(unitErr, "Must detect INVALID_UNIT");
  assert.equal(unitErr.value, "psi", "Invalid unit must be psi");

  const negErr = report.errors.find(e => e.type === "NEGATIVE_OR_ZERO_VALUE");
  assert.ok(negErr, "Must detect NEGATIVE_OR_ZERO_VALUE");

  const outOfBoundsErr = report.errors.find(e => e.type === "OUT_OF_BOUNDS_VALUE");
  assert.ok(outOfBoundsErr, "Must detect OUT_OF_BOUNDS_VALUE for 115% moisture");
});

test("DataPlatformEngine - Complete lot genealogy trace traversal", () => {
  const engine = new DataPlatformEngine();
  engine.loadDataset(cleanData);

  const trace = engine.getLotTrace("LOT-G01-REL");
  assert.ok(trace, "Lot trace must be generated");
  assert.equal(trace.lot.lotId, "LOT-G01-REL");
  assert.equal(trace.batch.batchId, "B-G01");
  assert.equal(trace.delivery.deliveryId, "DEL-2026-001");
  assert.ok(trace.inspections.length > 0, "Must include inspections");
  assert.ok(trace.packagingRuns.length > 0, "Must include packaging runs");
  assert.ok(trace.orders.length > 0, "Must include sales orders");
  assert.equal(trace.orders[0].orderId, "ORD-BULK-01");
});
