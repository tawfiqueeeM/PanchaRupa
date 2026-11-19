# Fulfillment Lifecycle & Inventory Reservation Rules

## 1. Inventory Channels & Formats
- **Auction Bulk Channel:**
  - Multi-wall paper tea sacks with food-grade foil liners.
  - Standard packaging: 25 kg to 40 kg per sack.
  - Typical trade terms: 14 to 21-day broker settlement cycle.
- **Retail Bottled Channel:**
  - Amber glass apothecary jars with tamper-evident induction seal.
  - Formats: 50 g (0.05 kg) and 100 g (0.10 kg).
  - Typical trade terms: Immediate payment / 7-day settlement.
- **DAY-40 Standard Benchmark:**
  - Total production: 40.0 kg released finished tea.
  - Channel allocation: 36.0 kg bulk (90%) and 4.0 kg retail (10%).
  - Retail format breakdown: $40 \times 0.05\text{ kg} = 2.0\text{ kg}$ + $20 \times 0.10\text{ kg} = 2.0\text{ kg}$ (Total 4.0 kg).

## 2. Invariants & Business Constraints
1. **Quality Disposition Gate:**
   - Any lot marked `ON_HOLD` or `REJECTED` by QA cannot be reserved or dispatched.
2. **Conservation of Mass & Over-Allocation Prevention:**
   $$\text{ReservedMass} + \text{DispatchedMass} \le \text{TotalLotMass}$$
   Any allocation request exceeding unreserved available mass must be rejected.
3. **Distinct Lifecycle Events:**
   - `RESERVED`: Inventory physically allocated; cannot be allocated to another order.
   - `DISPATCHED`: Stock leaves warehouse dock; Bill of Lading generated; inventory balance decremented.
   - `SETTLED`: Broker/customer remits funds; accounts receivable cleared.
