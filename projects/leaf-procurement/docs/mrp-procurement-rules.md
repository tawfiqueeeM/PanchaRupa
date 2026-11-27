# Material Requirements Planning (MRP) & Leaf Procurement Rules

## 1. Mathematical Formulas
1. **Net Requirements:**
   $$\text{NetDemand}_{p} = \max(0, \text{GrossDemand}_{p} - \text{ReleasedStock}_{p})$$
2. **Fresh Leaf Conversion:**
   $$\text{FreshLeafRequired}_{p} = \frac{\text{NetDemand}_{p}}{\eta_{p}}$$
   where $\eta_{p}$ is the product-specific dry-to-wet conversion yield (nominal $25.0\%$, range $20.0\% - 28.0\%$).
3. **Plucking Grade Eligibility:**
   - Green Tea: `STANDARD_FINE` (Two leaves and a bud, fine shoot plucking).
   - Golden Tea: `GOLDEN_TENDER_BUD` (Tender apical bud and single first leaf with dense silver/golden pubescence). Only certified organic / clonal clonal gardens qualify.
4. **Winter Operating Policy:**
   - Months: January and February.
   - Fresh leaf plucking is completely suspended across North Bengal / Panchagarh tea estates due to winter bush dormancy.
   - Fresh leaf procurement is strictly $0.0\text{ kg}$; customer demand is fulfilled entirely from released finished goods buffer.

## 2. Supplier Profiles
- `SUPPLIER_01 - Kazi Tea Estate`: Certified for both Standard and Golden Tender buds; lead time 24h.
- `SUPPLIER_02 - Tetulia Green Cooperative`: Certified for Standard Fine Green only; lead time 18h.
- `SUPPLIER_03 - Dahal Organic Valley`: Premium clonal estate, high-elevation Golden specialist; lead time 36h.
