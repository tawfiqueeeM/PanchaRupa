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

test("DataPlatformEngine R20 - Removing batch deliveryId triggers validation failure (missing FK)", () => {
  const missingLink = structuredClone(cleanData);
  delete missingLink.batches[0].deliveryId;

  const engine = new DataPlatformEngine();
  const report = engine.loadDataset(missingLink);

  assert.equal(report.isValid, false, "Dataset with missing FK link must be invalid");
  const missingFkErr = report.errors.find(e => e.type === "MISSING_FOREIGN_KEY" && e.table === "batches" && e.field === "deliveryId");
  assert.ok(missingFkErr, "Must detect MISSING_FOREIGN_KEY for batches.deliveryId");
});

test("DataPlatformEngine R20 - Missing delivery weight/unit and negative lot inventory fail validation", () => {
  const badWeights = structuredClone(cleanData);
  delete badWeights.deliveries[0].grossWeightKg;
  delete badWeights.deliveries[0].netWeightKg;
  delete badWeights.deliveries[0].unit;
  badWeights.lots[0].totalKg = -30;

  const engine = new DataPlatformEngine();
  const report = engine.loadDataset(badWeights);

  assert.equal(report.isValid, false, "Dataset with missing weights and negative stock must be invalid");
  const unitErr = report.errors.find(e => e.type === "INVALID_UNIT" && e.table === "deliveries");
  assert.ok(unitErr, "Must detect missing/invalid unit on delivery");
  const weightErr = report.errors.find(e => e.type === "NEGATIVE_OR_ZERO_VALUE" && e.table === "deliveries");
  assert.ok(weightErr, "Must detect missing/invalid weight on delivery");
  const lotErr = report.errors.find(e => e.type === "NEGATIVE_OR_ZERO_VALUE" && e.table === "lots");
  assert.ok(lotErr, "Must detect negative stock on lots");
});

test("DataPlatformEngine R20 - Packaging allocation exceeding available lot stock fails validation (overdraw)", () => {
  const overdraw = structuredClone(cleanData);
  overdraw.packaging[0].packedKg = 999;

  const engine = new DataPlatformEngine();
  const report = engine.loadDataset(overdraw);

  assert.equal(report.isValid, false, "Dataset with 999kg packaging against 30kg lot must be invalid");
  const allocErr = report.errors.find(e => e.type === "ALLOCATION_EXCEEDS_LOT_STOCK");
  assert.ok(allocErr, "Must detect ALLOCATION_EXCEEDS_LOT_STOCK");
  assert.equal(allocErr.lotStock, 30.0);
  assert.ok(allocErr.value > 30.0);
});
