# Tea Auction Rules, Venue Costing & Decision Logic

## 1. Venue Parameter Profiles
- **Panchagarh Auction Centre:**
  - Freight from factory: BDT 1.50 / kg
  - Transit time: 0 days (local delivery)
  - Broker commission: 1.25%
  - Warehouse handling: BDT 0.50 / kg
  - Settlement cycle: 7 calendar days
- **Sreemangal Auction Centre:**
  - Freight from factory: BDT 6.00 / kg
  - Transit time: 2 days
  - Broker commission: 1.50%
  - Warehouse handling: BDT 1.00 / kg
  - Settlement cycle: 14 calendar days
- **Chattogram Auction Centre:**
  - Freight from factory: BDT 10.00 / kg
  - Transit time: 4 days
  - Broker commission: 1.75%
  - Warehouse handling: BDT 1.50 / kg
  - Settlement cycle: 21 calendar days

## 2. Mathematical Formulations
1. **Net Realization Formula:**
   $$\text{NetRealization}_{v} = P_{v} - \text{Freight}_{v} - (P_{v} \times \text{Commission}_{v}) - \text{WarehouseFee}_{v}$$
2. **Freight & Fee Break-Even Premium:**
   The price premium $\Delta P$ required by a distant venue $v$ over local Panchagarh ($P_{\text{local}}$):
   $$\text{NetRealization}_{v} \ge \text{NetRealization}_{\text{Panchagarh}}$$
   Solving for required hammer price $P_{v}$:
   $$P_{v} = \frac{\text{NetRealization}_{\text{Panchagarh}} + \text{Freight}_{v} + \text{WarehouseFee}_{v}}{1 - \text{Commission}_{v}}$$
3. **Reserve Price Gate:**
   - If $\text{NetRealization} \ge \text{ReservePrice}$: `SOLD_SETTLE`
   - If $\text{NetRealization} < \text{ReservePrice}$:
     - If deficit $\le \text{BDT } 10/\text{kg}$: `RELIST` (re-enter next auction sale catalog)
     - If deficit $> \text{BDT } 10/\text{kg}$: `WITHDRAW_HOLD` (pull lot from venue)
