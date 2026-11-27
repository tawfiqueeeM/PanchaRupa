#!/usr/bin/env python3
"""Verification script for the PanchaRupa Virtual Tea Factory database layer.

Initializes an in-memory SQLite database from db/schema.sql, seeds test records
mapped from projects/*/fixtures/*.json, executes both recursive CTE queries
from db/queries.sql, asserts foreign-key and CHECK constraint enforcement on
invalid inserts, and exits 0 on success.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent
REPO_ROOT = DB_DIR.parent
SCHEMA_PATH = DB_DIR / "schema.sql"
QUERIES_PATH = DB_DIR / "queries.sql"
CLEAN_FIXTURE_PATH = REPO_ROOT / "projects" / "factory-data" / "fixtures" / "clean_factory_dataset.json"
INVALID_FIXTURE_PATH = REPO_ROOT / "projects" / "factory-data" / "fixtures" / "invalid_factory_dataset.json"
PROCUREMENT_FIXTURE_PATH = REPO_ROOT / "projects" / "leaf-procurement" / "fixtures" / "procurement_scenarios.json"
INVENTORY_FIXTURE_PATH = REPO_ROOT / "projects" / "inventory-and-fulfillment" / "fixtures" / "inventory_scenarios.json"

PACK_FORMAT_MAP = {
    "BULK_SACK": "BULK_50KG_SACK",
    "RETAIL_50G": "RETAIL_50G_JAR",
    "RETAIL_100G": "RETAIL_100G_BOTTLE",
}

CHANNEL_MAP = {
    "AUCTION_BULK": "TEA_AUCTION_SREEMANGAL",
    "RETAIL_BOTTLES": "LOCAL_RETAIL",
}


def load_sql_queries(path: Path) -> list[str]:
    """Split a SQL file into individual non-empty statements."""
    raw = path.read_text(encoding="utf-8")
    statements: list[str] = []
    current: list[str] = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(current))
            current = []
    if current:
        statements.append("\n".join(current))
    return statements


def seed_database(conn: sqlite3.Connection) -> None:
    """Seed the in-memory database from canonical project fixtures."""
    clean_data = json.loads(CLEAN_FIXTURE_PATH.read_text(encoding="utf-8"))
    procurement_data = json.loads(PROCUREMENT_FIXTURE_PATH.read_text(encoding="utf-8"))
    inventory_data = json.loads(INVENTORY_FIXTURE_PATH.read_text(encoding="utf-8"))

    # Map supplier metadata from leaf-procurement fixture
    supplier_names: dict[str, str] = {}
    for scenario in procurement_data.get("scenarios", []):
        for prod in scenario.get("products", []):
            sid = prod.get("supplierId")
            sname = prod.get("supplierName")
            if sid and sname and sid != "NONE":
                supplier_names[sid] = sname

    # Seed suppliers referenced by deliveries
    for sid in {d["supplierId"] for d in clean_data["deliveries"]}:
        conn.execute(
            """
            INSERT INTO suppliers (supplier_id, supplier_name, village, contact_phone, rating_grade, active_status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (sid, supplier_names.get(sid, sid), "Tetulia, Panchagarh", "+8801700000002", "GRADE_A", True),
        )

    # Seed deliveries and SUPPLIER -> DELIVERY genealogy edges
    for d in clean_data["deliveries"]:
        conn.execute(
            """
            INSERT INTO deliveries (
                delivery_id, supplier_id, delivery_time, gross_weight_kg, tare_weight_kg,
                moisture_pct, fine_leaf_ratio_pct, leaf_quality_grade, dock_operator_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                d["deliveryId"],
                d["supplierId"],
                d["timestamp"],
                d["grossWeightKg"],
                d["tareWeightKg"],
                76.5,
                82.0,
                "SUPER_FINE",
                "OP-DOCK-01",
                "ACCEPTED",
            ),
        )
        conn.execute(
            """
            INSERT INTO genealogy_edges (
                edge_id, parent_entity_type, parent_entity_id,
                child_entity_type, child_entity_id, transformation_step
            ) VALUES (?, 'SUPPLIER', ?, 'DELIVERY', ?, 'INTAKE_DELIVERY')
            """,
            (f"EDGE-{d['supplierId']}-{d['deliveryId']}", d["supplierId"], d["deliveryId"]),
        )

    # Seed batches and DELIVERY -> BATCH genealogy edges
    for b in clean_data["batches"]:
        conn.execute(
            """
            INSERT INTO batches (
                batch_id, delivery_id, product_type, fresh_leaf_allocated_kg,
                recipe_code, started_at, completed_at, primary_roller_id, dryer_chamber_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                b["batchId"],
                b["deliveryId"],
                b["product"],
                b["freshLeafUsedKg"],
                "RCP-GREEN-01" if b["product"] == "GREEN_TEA" else "RCP-GOLDEN-01",
                b["timestamp"],
                "2026-04-10T14:00:00Z",
                "ROLLER-01",
                "DRYER-01",
                b["status"],
            ),
        )
        conn.execute(
            """
            INSERT INTO genealogy_edges (
                edge_id, parent_entity_type, parent_entity_id,
                child_entity_type, child_entity_id, transformation_step
            ) VALUES (?, 'DELIVERY', ?, 'BATCH', ?, 'PROCESSING_BATCH')
            """,
            (f"EDGE-{b['deliveryId']}-{b['batchId']}", b["deliveryId"], b["batchId"]),
        )

    # Seed inspections
    for insp in clean_data["inspections"]:
        disposition = "PASSED" if insp["disposition"] == "RELEASED" else insp["disposition"]
        conn.execute(
            """
            INSERT INTO inspections (
                inspection_id, batch_id, inspector_id, moisture_content_pct,
                liquor_color_rating, aroma_profile, appearance_grade, disposition
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                insp["inspectionId"],
                insp["batchId"],
                "QC-LEAD-01",
                insp["moisturePct"],
                "BRIGHT_GOLDEN",
                "FLORAL_SWEET",
                "WHOLE_LEAF_TIPS",
                disposition,
            ),
        )

    # Seed lots and BATCH -> LOT genealogy edges
    lot_alloc_totals: dict[str, float] = {}
    inv_orders = inventory_data["scenarios"][0]["orders"]
    inv_order_by_id = {o["orderId"]: o for o in inv_orders}
    for o in clean_data["orders"]:
        inv_match = inv_order_by_id.get(o["orderId"])
        if inv_match:
            lot_alloc_totals[inv_match["lotId"]] = lot_alloc_totals.get(inv_match["lotId"], 0.0) + inv_match["allocatedKg"]

    for lot in clean_data["lots"]:
        allocated = lot_alloc_totals.get(lot["lotId"], 0.0)
        conn.execute(
            """
            INSERT INTO lots (
                lot_id, batch_id, grade_code, net_weight_kg, allocated_weight_kg,
                warehouse_bin, lot_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lot["lotId"],
                lot["batchId"],
                "FTGFOP1",
                lot["totalKg"],
                allocated,
                lot["storageBin"],
                lot["disposition"],
            ),
        )
        conn.execute(
            """
            INSERT INTO genealogy_edges (
                edge_id, parent_entity_type, parent_entity_id,
                child_entity_type, child_entity_id, transformation_step
            ) VALUES (?, 'BATCH', ?, 'LOT', ?, 'GRADING_LOT')
            """,
            (f"EDGE-{lot['batchId']}-{lot['lotId']}", lot["batchId"], lot["lotId"]),
        )

    # Seed packaging and LOT -> PACKAGING genealogy edges
    pkg_lot_map: dict[str, str] = {}
    pkg_kg_map: dict[str, float] = {}
    for pkg in clean_data["packaging"]:
        pack_format = PACK_FORMAT_MAP[pkg["format"]]
        nominal_g = (pkg["packedKg"] * 1000.0) / pkg["unitCount"]
        pkg_lot_map[pkg["packId"]] = pkg["lotId"]
        pkg_kg_map[pkg["packId"]] = pkg["packedKg"]
        conn.execute(
            """
            INSERT INTO packaging (
                packaging_id, lot_id, pack_format, units_packed,
                unit_nominal_weight_g, total_packed_kg, underfill_reject_count,
                pack_operator_or_cell_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pkg["packId"],
                pkg["lotId"],
                pack_format,
                pkg["unitCount"],
                nominal_g,
                pkg["packedKg"],
                0,
                "PACK-CELL-01",
            ),
        )
        conn.execute(
            """
            INSERT INTO genealogy_edges (
                edge_id, parent_entity_type, parent_entity_id,
                child_entity_type, child_entity_id, transformation_step
            ) VALUES (?, 'LOT', ?, 'PACKAGING', ?, 'PACKAGING_RUN')
            """,
            (f"EDGE-{pkg['lotId']}-{pkg['packId']}", pkg["lotId"], pkg["packId"]),
        )

    # Seed orders, order_allocations, and PACKAGING -> ORDER genealogy edges
    for order in clean_data["orders"]:
        pack_id = order["packId"]
        lot_id = pkg_lot_map[pack_id]
        alloc_kg = pkg_kg_map[pack_id]
        channel = CHANNEL_MAP[order["channel"]]
        conn.execute(
            """
            INSERT INTO orders (
                order_id, customer_name, channel, requested_ship_date,
                total_order_amount_bdt, order_status
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                order["orderId"],
                order["customer"],
                channel,
                "2026-04-12",
                alloc_kg * 1200.0,
                order["lifecycleState"],
            ),
        )
        alloc_id = f"ALLOC-{order['orderId']}"
        conn.execute(
            """
            INSERT INTO order_allocations (
                allocation_id, order_id, lot_id, packaging_id,
                allocated_quantity_kg, status
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (alloc_id, order["orderId"], lot_id, pack_id, alloc_kg, "DELIVERED"),
        )
        conn.execute(
            """
            INSERT INTO genealogy_edges (
                edge_id, parent_entity_type, parent_entity_id,
                child_entity_type, child_entity_id, transformation_step
            ) VALUES (?, 'PACKAGING', ?, 'ORDER', ?, 'ORDER_DISPATCH')
            """,
            (f"EDGE-{pack_id}-{order['orderId']}", pack_id, order["orderId"]),
        )


def verify_queries(conn: sqlite3.Connection) -> None:
    """Execute both recursive CTE queries and assert expected traceability results."""
    queries = load_sql_queries(QUERIES_PATH)
    assert len(queries) == 2, f"Expected 2 queries in {QUERIES_PATH}, found {len(queries)}"
    backward_sql, forward_sql = queries

    # 1. Backward Trace: PCK-RET-50G -> SUPPLIER_02 (Tetulia Green Cooperative)
    backward_rows = conn.execute(backward_sql, {"target_packaging_id": "PCK-RET-50G"}).fetchall()
    assert len(backward_rows) == 1, f"Expected 1 backward trace row, got {len(backward_rows)}"
    b_row = backward_rows[0]
    assert b_row["packaging_id"] == "PCK-RET-50G"
    assert b_row["lot_id"] == "LOT-G01-REL"
    assert b_row["batch_id"] == "B-G01"
    assert b_row["delivery_id"] == "DEL-2026-001"
    assert b_row["supplier_id"] == "SUPPLIER_02"
    assert b_row["supplier_name"] == "Tetulia Green Cooperative"
    assert b_row["trace_depth"] == 4

    # 2. Forward Recall Trace: DEL-2026-001 -> ORD-BULK-01 (DISPATCHED)
    forward_rows = conn.execute(forward_sql, {"suspect_delivery_id": "DEL-2026-001"}).fetchall()
    assert len(forward_rows) == 1, f"Expected 1 forward recall row, got {len(forward_rows)}"
    f_row = forward_rows[0]
    assert f_row["delivery_id"] == "DEL-2026-001"
    assert f_row["batch_id"] == "B-G01"
    assert f_row["lot_id"] == "LOT-G01-REL"
    assert f_row["packaging_id"] == "PCK-BULK-01"
    assert f_row["order_id"] == "ORD-BULK-01"
    assert f_row["order_status"] == "DISPATCHED"
    assert f_row["trace_depth"] == 4


def verify_constraints(conn: sqlite3.Connection) -> None:
    """Assert foreign-key and CHECK constraints reject invalid records from invalid_factory_dataset.json."""
    invalid_data = json.loads(INVALID_FIXTURE_PATH.read_text(encoding="utf-8"))

    # 1. Foreign key violation: orphan batch referencing non-existent delivery
    orphan_batch = next(b for b in invalid_data["batches"] if b["batchId"] == "B-ORPHAN-99")
    try:
        conn.execute(
            """
            INSERT INTO batches (
                batch_id, delivery_id, product_type, fresh_leaf_allocated_kg,
                recipe_code, started_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                orphan_batch["batchId"],
                orphan_batch["deliveryId"],
                orphan_batch["product"],
                orphan_batch["freshLeafUsedKg"],
                "RCP-GOLDEN-01",
                orphan_batch["timestamp"],
                orphan_batch["status"],
            ),
        )
        raise AssertionError("Expected IntegrityError for orphan batch foreign key")
    except sqlite3.IntegrityError:
        conn.rollback()

    # 2. Foreign key violation: delivery referencing non-existent supplier
    try:
        conn.execute(
            """
            INSERT INTO deliveries (
                delivery_id, supplier_id, delivery_time, gross_weight_kg, tare_weight_kg,
                moisture_pct, fine_leaf_ratio_pct, leaf_quality_grade, dock_operator_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "DEL-INVALID-SUP",
                "SUPPLIER_UNKNOWN",
                "2026-04-10T08:00:00Z",
                100.0,
                10.0,
                75.0,
                80.0,
                "STANDARD",
                "OP-DOCK-01",
                "ACCEPTED",
            ),
        )
        raise AssertionError("Expected IntegrityError for invalid supplier foreign key")
    except sqlite3.IntegrityError:
        conn.rollback()

    # 3. CHECK constraint violation: negative gross weight (gross_weight_kg <= tare_weight_kg)
    bad_delivery = invalid_data["deliveries"][0]
    try:
        conn.execute(
            """
            INSERT INTO deliveries (
                delivery_id, supplier_id, delivery_time, gross_weight_kg, tare_weight_kg,
                moisture_pct, fine_leaf_ratio_pct, leaf_quality_grade, dock_operator_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "DEL-BAD-WEIGHT",
                bad_delivery["supplierId"],
                bad_delivery["timestamp"],
                bad_delivery["grossWeightKg"],
                bad_delivery["tareWeightKg"],
                75.0,
                80.0,
                "STANDARD",
                "OP-DOCK-01",
                "ACCEPTED",
            ),
        )
        raise AssertionError("Expected IntegrityError for chk_gross_gt_tare CHECK constraint")
    except sqlite3.IntegrityError:
        conn.rollback()

    # 4. CHECK constraint violation: moisture_content_pct > 100.0
    bad_inspection = invalid_data["inspections"][0]
    try:
        conn.execute(
            """
            INSERT INTO inspections (
                inspection_id, batch_id, inspector_id, moisture_content_pct,
                liquor_color_rating, aroma_profile, appearance_grade, disposition
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "QC-BAD-MOISTURE",
                bad_inspection["batchId"],
                "QC-LEAD-01",
                bad_inspection["moisturePct"],
                "BRIGHT_GOLDEN",
                "FLORAL_SWEET",
                "WHOLE_LEAF_TIPS",
                "PASSED",
            ),
        )
        raise AssertionError("Expected IntegrityError for moisture_content_pct CHECK constraint")
    except sqlite3.IntegrityError:
        conn.rollback()


def main() -> int:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
        conn.executescript(schema_sql)

        seed_database(conn)
        conn.commit()

        verify_queries(conn)
        verify_constraints(conn)
        print("OK: schema initialized, fixtures seeded, recursive CTE queries and FK/CHECK constraints verified.")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
