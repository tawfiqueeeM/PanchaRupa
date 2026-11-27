# Database Architecture & Lot Genealogy Contract (`db/INTERFACE.md`)

## 1. Scope & Execution Boundary
This contract governs the relational data layer for PanchaRupa Virtual Tea Factory. It standardizes table definitions, foreign key relationships, check constraints, indexes, and recursive genealogy queries matching the canonical domain model implemented in `projects/factory-data/`.

Any autonomous agent, migration script, or service implementing this database interface **must satisfy all schemas and test contracts defined herein**.

- **Primary Storage Engines:** SQLite 3.38+ (Local test fixtures & edge nodes) and PostgreSQL 14+ (Enterprise cloud / centralized SCADA).
- **Referential Integrity:** `PRAGMA foreign_keys = ON;` must be strictly enforced on every SQLite connection.
- **Genealogy Traceability:** 100% backward traceability (from consumer bottle/carton back to smallholder delivery receipt) and forward traceability (from fresh leaf receipt forward to distributed finished goods lots).

---

## 2. Canonical Relational DDL Schema

```sql
-- ============================================================================
-- PanchaRupa Virtual Tea Factory — Core Relational Schema
-- Compatible with SQLite 3.38+ and PostgreSQL 14+
-- ============================================================================

-- 1. Suppliers / Smallholder Tea Gardens
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id VARCHAR(32) PRIMARY KEY,
    supplier_name VARCHAR(128) NOT NULL,
    village VARCHAR(64) NOT NULL DEFAULT 'Panchagarh',
    contact_phone VARCHAR(32),
    rating_grade VARCHAR(8) CHECK (rating_grade IN ('GRADE_A', 'GRADE_B', 'GRADE_C')),
    active_status BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fresh Green Leaf Deliveries (Intake Scale)
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id VARCHAR(64) PRIMARY KEY,
    supplier_id VARCHAR(32) NOT NULL,
    delivery_time TIMESTAMP NOT NULL,
    gross_weight_kg DECIMAL(10,2) NOT NULL,
    tare_weight_kg DECIMAL(10,2) NOT NULL,
    net_weight_kg DECIMAL(10,2) GENERATED ALWAYS AS (gross_weight_kg - tare_weight_kg) STORED,
    moisture_pct DECIMAL(5,2) NOT NULL CHECK (moisture_pct >= 0.0 AND moisture_pct <= 100.0),
    fine_leaf_ratio_pct DECIMAL(5,2) NOT NULL CHECK (fine_leaf_ratio_pct >= 0.0 AND fine_leaf_ratio_pct <= 100.0),
    leaf_quality_grade VARCHAR(16) NOT NULL CHECK (leaf_quality_grade IN ('SUPER_FINE', 'STANDARD', 'COARSE', 'REJECTED')),
    dock_operator_id VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('ACCEPTED', 'QUARANTINED', 'REJECTED', 'TRANSFERRED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    CONSTRAINT chk_gross_gt_tare CHECK (gross_weight_kg > tare_weight_kg),
    CONSTRAINT chk_tare_non_negative CHECK (tare_weight_kg >= 0.0)
);

-- 3. Production Transformation Batches (Withering, Steaming, Rolling, Fermenting, Drying)
CREATE TABLE IF NOT EXISTS batches (
    batch_id VARCHAR(64) PRIMARY KEY,
    delivery_id VARCHAR(64) NOT NULL,
    product_type VARCHAR(32) NOT NULL CHECK (product_type IN ('GREEN_TEA', 'GOLDEN_TEA', 'CTC_BLACK')),
    fresh_leaf_allocated_kg DECIMAL(10,2) NOT NULL CHECK (fresh_leaf_allocated_kg > 0.0),
    recipe_code VARCHAR(32) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    primary_roller_id VARCHAR(32),
    dryer_chamber_id VARCHAR(32),
    status VARCHAR(32) NOT NULL CHECK (status IN ('PLANNED', 'IN_PROCESS', 'COMPLETED', 'FAULTED_ABORTED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id) ON DELETE RESTRICT
);

-- 4. Quality Control & Lab Inspection Gates
CREATE TABLE IF NOT EXISTS inspections (
    inspection_id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL,
    inspector_id VARCHAR(32) NOT NULL,
    inspected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    moisture_content_pct DECIMAL(5,2) NOT NULL CHECK (moisture_content_pct >= 0.0 AND moisture_content_pct <= 100.0),
    liquor_color_rating VARCHAR(16) NOT NULL CHECK (liquor_color_rating IN ('BRIGHT_GOLDEN', 'DEEP_AMBER', 'DULL_BROWN', 'CLOUDY')),
    aroma_profile VARCHAR(32) NOT NULL CHECK (aroma_profile IN ('FLORAL_SWEET', 'MUSCATEL', 'EARTHY', 'GRASSY', 'BURNT_SMOKY')),
    appearance_grade VARCHAR(16) NOT NULL CHECK (appearance_grade IN ('WHOLE_LEAF_TIPS', 'BROKEN_PEKOE', 'FANNINGS', 'DUST')),
    disposition VARCHAR(16) NOT NULL CHECK (disposition IN ('PASSED', 'QUALITY_HOLD', 'REJECTED')),
    quarantine_reason VARCHAR(255),
    CONSTRAINT fk_inspection_batch FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE RESTRICT
);

-- 5. Finished Tea Inventory Lots (Grading Output)
CREATE TABLE IF NOT EXISTS lots (
    lot_id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL,
    grade_code VARCHAR(16) NOT NULL CHECK (grade_code IN ('FTGFOP1', 'TGFOP', 'BOP', 'OF', 'DUST')),
    net_weight_kg DECIMAL(10,2) NOT NULL CHECK (net_weight_kg >= 0.0),
    allocated_weight_kg DECIMAL(10,2) NOT NULL DEFAULT 0.0 CHECK (allocated_weight_kg >= 0.0),
    available_weight_kg DECIMAL(10,2) GENERATED ALWAYS AS (net_weight_kg - allocated_weight_kg) STORED,
    warehouse_bin VARCHAR(32) NOT NULL,
    lot_status VARCHAR(16) NOT NULL CHECK (lot_status IN ('RELEASED', 'QUALITY_HOLD', 'QUARANTINED', 'DEPLETED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lot_batch FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE RESTRICT,
    CONSTRAINT chk_allocated_lte_net CHECK (allocated_weight_kg <= net_weight_kg)
);

-- 6. Packaging Executions (Bulk & Retail Packaging)
CREATE TABLE IF NOT EXISTS packaging (
    packaging_id VARCHAR(64) PRIMARY KEY,
    lot_id VARCHAR(64) NOT NULL,
    pack_format VARCHAR(32) NOT NULL CHECK (pack_format IN ('BULK_50KG_SACK', 'RETAIL_100G_BOTTLE', 'RETAIL_50G_JAR', 'GIFT_BOX_250G')),
    units_packed INTEGER NOT NULL CHECK (units_packed > 0),
    unit_nominal_weight_g DECIMAL(8,2) NOT NULL CHECK (unit_nominal_weight_g > 0.0),
    total_packed_kg DECIMAL(10,2) NOT NULL CHECK (total_packed_kg > 0.0),
    underfill_reject_count INTEGER NOT NULL DEFAULT 0 CHECK (underfill_reject_count >= 0),
    packed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pack_operator_or_cell_id VARCHAR(32) NOT NULL,
    CONSTRAINT fk_packaging_lot FOREIGN KEY (lot_id) REFERENCES lots(lot_id) ON DELETE RESTRICT
);

-- 7. Commercial Orders & Fulfillment
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_name VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('LOCAL_RETAIL', 'DHAKA_DISTRIBUTOR', 'TEA_AUCTION_CHATTOGRAM', 'TEA_AUCTION_SREEMANGAL', 'EXPORT')),
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_ship_date DATE NOT NULL,
    total_order_amount_bdt DECIMAL(12,2) NOT NULL CHECK (total_order_amount_bdt >= 0.0),
    order_status VARCHAR(32) NOT NULL CHECK (order_status IN ('PENDING_ALLOCATION', 'RESERVED', 'DISPATCHED', 'SETTLED', 'CANCELLED'))
);

-- 8. Order Item Allocations (Connecting Orders to Packaging / Lots)
CREATE TABLE IF NOT EXISTS order_allocations (
    allocation_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    lot_id VARCHAR(64) NOT NULL,
    packaging_id VARCHAR(64),
    allocated_quantity_kg DECIMAL(10,2) NOT NULL CHECK (allocated_quantity_kg > 0.0),
    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL CHECK (status IN ('RESERVED', 'LOADED_FOR_TRANSIT', 'DELIVERED')),
    CONSTRAINT fk_alloc_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_alloc_lot FOREIGN KEY (lot_id) REFERENCES lots(lot_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_pkg FOREIGN KEY (packaging_id) REFERENCES packaging(packaging_id) ON DELETE SET NULL
);

-- 9. Directed Genealogy Graph Edges (Explicit Fast Traversal)
CREATE TABLE IF NOT EXISTS genealogy_edges (
    edge_id VARCHAR(64) PRIMARY KEY,
    parent_entity_type VARCHAR(32) NOT NULL,
    parent_entity_id VARCHAR(64) NOT NULL,
    child_entity_type VARCHAR(32) NOT NULL,
    child_entity_id VARCHAR(64) NOT NULL,
    transformation_step VARCHAR(32) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. High-Performance Indexing Strategy
```sql
CREATE INDEX IF NOT EXISTS idx_deliveries_supplier ON deliveries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_delivery ON batches(delivery_id);
CREATE INDEX IF NOT EXISTS idx_inspections_batch ON inspections(batch_id);
CREATE INDEX IF NOT EXISTS idx_lots_batch ON lots(batch_id);
CREATE INDEX IF NOT EXISTS idx_lots_status_grade ON lots(lot_status, grade_code);
CREATE INDEX IF NOT EXISTS idx_packaging_lot ON packaging(lot_id);
CREATE INDEX IF NOT EXISTS idx_allocations_order ON order_allocations(order_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_parent ON genealogy_edges(parent_entity_type, parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_child ON genealogy_edges(child_entity_type, child_entity_id);
```

---

## 4. Recursive Lot Genealogy Traversal Queries

### 4.1. Full Backward Trace (Customer Bottle/Packaging -> Farm Plot Delivery)
```sql
-- Given a packaging_id (e.g. 'PKG-2026-0042'), return complete origin chain
SELECT 
    pkg.packaging_id,
    pkg.pack_format,
    pkg.packed_at,
    l.lot_id,
    l.grade_code,
    b.batch_id,
    b.product_type,
    b.started_at AS batch_started,
    i.inspection_id,
    i.disposition AS qc_disposition,
    d.delivery_id,
    d.delivery_time,
    d.gross_weight_kg,
    d.tare_weight_kg,
    d.moisture_pct,
    s.supplier_id,
    s.supplier_name,
    s.village
FROM packaging pkg
JOIN lots l ON pkg.lot_id = l.lot_id
JOIN batches b ON l.batch_id = b.batch_id
LEFT JOIN inspections i ON b.batch_id = i.batch_id
JOIN deliveries d ON b.delivery_id = d.delivery_id
JOIN suppliers s ON d.supplier_id = s.supplier_id
WHERE pkg.packaging_id = :target_packaging_id;
```

### 4.2. Full Forward Recall Trace (Contaminated Leaf Delivery -> Shipped Orders)
```sql
-- Given a suspected delivery_id (e.g. 'DEL-2026-0003'), locate all finished lots and customers
SELECT 
    d.delivery_id,
    d.supplier_id,
    b.batch_id,
    l.lot_id,
    l.grade_code,
    l.warehouse_bin,
    pkg.packaging_id,
    pkg.pack_format,
    oa.order_id,
    o.customer_name,
    o.channel,
    o.order_status
FROM deliveries d
JOIN batches b ON d.delivery_id = b.delivery_id
JOIN lots l ON b.batch_id = l.batch_id
LEFT JOIN packaging pkg ON l.lot_id = pkg.lot_id
LEFT JOIN order_allocations oa ON l.lot_id = oa.lot_id
LEFT JOIN orders o ON oa.order_id = o.order_id
WHERE d.delivery_id = :suspect_delivery_id;
```

---

## 5. Strict Ingestion Validation Assertions (Agent Contract)
Any agent implementing an ingestion pipeline must reject transactions and roll back if:
1. `tareWeightKg >= grossWeightKg` or `tareWeightKg < 0` (scale fault).
2. `batch.freshLeafAllocatedKg > delivery.netWeightKg` (overdraw of unassigned leaf).
3. `order_allocations.allocated_quantity_kg > lot.available_weight_kg` (inventory deficit).
4. Lot disposition is `QUALITY_HOLD` or `QUARANTINED` when allocating to an active customer order.
