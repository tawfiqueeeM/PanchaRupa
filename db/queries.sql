-- ============================================================================
-- PanchaRupa Virtual Tea Factory — Recursive Lot Genealogy Queries
-- Compatible with SQLite 3.38+ and PostgreSQL 14+
-- ============================================================================

-- Query 1: Backward Trace (Packaging Barcode -> Smallholder Supplier)
-- Given :target_packaging_id, recursively traverse genealogy_edges upward
-- from PACKAGING -> LOT -> BATCH -> DELIVERY -> SUPPLIER and return full origin context.
WITH RECURSIVE backward_trace (
    parent_entity_type,
    parent_entity_id,
    child_entity_type,
    child_entity_id,
    transformation_step,
    depth
) AS (
    SELECT
        ge.parent_entity_type,
        ge.parent_entity_id,
        ge.child_entity_type,
        ge.child_entity_id,
        ge.transformation_step,
        1 AS depth
    FROM genealogy_edges ge
    WHERE ge.child_entity_type = 'PACKAGING'
      AND ge.child_entity_id = :target_packaging_id

    UNION ALL

    SELECT
        ge.parent_entity_type,
        ge.parent_entity_id,
        ge.child_entity_type,
        ge.child_entity_id,
        ge.transformation_step,
        bt.depth + 1 AS depth
    FROM genealogy_edges ge
    JOIN backward_trace bt
      ON ge.child_entity_type = bt.parent_entity_type
     AND ge.child_entity_id = bt.parent_entity_id
    WHERE bt.depth < 10
)
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
    d.net_weight_kg,
    d.moisture_pct,
    s.supplier_id,
    s.supplier_name,
    s.village,
    bt.depth AS trace_depth
FROM backward_trace bt
JOIN suppliers s ON s.supplier_id = bt.parent_entity_id
JOIN deliveries d ON d.supplier_id = s.supplier_id
JOIN batches b ON b.delivery_id = d.delivery_id
LEFT JOIN inspections i ON i.batch_id = b.batch_id
JOIN lots l ON l.batch_id = b.batch_id
JOIN packaging pkg ON pkg.lot_id = l.lot_id
WHERE bt.parent_entity_type = 'SUPPLIER'
  AND pkg.packaging_id = :target_packaging_id;

-- Query 2: Forward Recall Trace (Contaminated Delivery -> Dispatched Customer Shipments)
-- Given :suspect_delivery_id, recursively traverse genealogy_edges downward
-- from DELIVERY -> BATCH -> LOT -> PACKAGING -> ORDER_ALLOCATION -> ORDER
-- and return all dispatched customer shipments impacted by the delivery.
WITH RECURSIVE forward_trace (
    parent_entity_type,
    parent_entity_id,
    child_entity_type,
    child_entity_id,
    transformation_step,
    depth
) AS (
    SELECT
        ge.parent_entity_type,
        ge.parent_entity_id,
        ge.child_entity_type,
        ge.child_entity_id,
        ge.transformation_step,
        1 AS depth
    FROM genealogy_edges ge
    WHERE ge.parent_entity_type = 'DELIVERY'
      AND ge.parent_entity_id = :suspect_delivery_id

    UNION ALL

    SELECT
        ge.parent_entity_type,
        ge.parent_entity_id,
        ge.child_entity_type,
        ge.child_entity_id,
        ge.transformation_step,
        ft.depth + 1 AS depth
    FROM genealogy_edges ge
    JOIN forward_trace ft
      ON ge.parent_entity_type = ft.child_entity_type
     AND ge.parent_entity_id = ft.child_entity_id
    WHERE ft.depth < 10
)
SELECT
    d.delivery_id,
    d.supplier_id,
    s.supplier_name,
    b.batch_id,
    l.lot_id,
    l.grade_code,
    l.warehouse_bin,
    pkg.packaging_id,
    pkg.pack_format,
    oa.allocation_id,
    oa.allocated_quantity_kg,
    o.order_id,
    o.customer_name,
    o.channel,
    o.order_status,
    ft.depth AS trace_depth
FROM forward_trace ft
JOIN orders o ON o.order_id = ft.child_entity_id
JOIN order_allocations oa ON oa.order_id = o.order_id
JOIN lots l ON l.lot_id = oa.lot_id
JOIN batches b ON b.batch_id = l.batch_id
JOIN deliveries d ON d.delivery_id = b.delivery_id
JOIN suppliers s ON s.supplier_id = d.supplier_id
LEFT JOIN packaging pkg ON pkg.packaging_id = oa.packaging_id
WHERE ft.child_entity_type = 'ORDER'
  AND o.order_status = 'DISPATCHED'
  AND d.delivery_id = :suspect_delivery_id;
