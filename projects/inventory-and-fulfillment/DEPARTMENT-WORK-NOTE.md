# Department Work Note — Inventory Reservation & Fulfillment (Dept 7)

## 1. Department Overview
- **Subproject:** 13 / Row 13 — Inventory & Fulfillment
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/11-inventory-and-fulfilment`
- **Scope:** Warehouse inventory allocation, DAY-40 pack split benchmark (36 kg bulk auction + 4 kg retail bottles), quality disposition gating (`RELEASED` vs `ON_HOLD` quarantine), over-allocation prevention, and three-stage lifecycle progression (`RESERVED` -> `DISPATCHED` -> `SETTLED`).

## 2. Implemented Capabilities
1. **Multi-Format Channel Allocation:**
   - Auction Bulk: 36.0 kg (90% of DAY-40 production) packaged in multi-wall lined tea sacks.
   - Retail Bottles: 4.0 kg (10% of DAY-40 production) split into 40 × 50g bottles (2.0 kg) and 20 × 100g bottles (2.0 kg).
2. **Quality Disposition Gating:**
   - Strictly enforces that only lots with `RELEASED` QA disposition can be allocated or dispatched.
   - Lots in `ON_HOLD` or `REJECTED` status are quarantined; reservation attempts are rejected with `HELD_LOT_VIOLATION`.
3. **Over-Allocation Prevention:**
   - Evaluates uncommitted lot balance: $\text{Available} = \text{Total} - \text{Reserved} - \text{Dispatched}$.
   - Requests exceeding available unreserved mass fail with `EXCESS_ALLOCATION` exceptions.
4. **Three-Stage Traceable Lifecycle:**
   - `RESERVED`: Inventory committed to sales order.
   - `DISPATCHED`: Stock physically shipped from dock; moves mass to dispatched ledger.
   - `SETTLED`: Payment cleared (supports simulated auction broker settlement delay).
5. **Interactive UI & Exports:**
   - Real-time lot inventory utilization bars.
   - Order lifecycle progression triggers (Dispatch, Settle, Delay).
   - Export to formatted JSON and CSV.
