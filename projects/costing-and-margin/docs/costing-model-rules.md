# Costing Model Formulas, Allocations & Overhead Drivers

## 1. Mathematical Formulas
1. **Raw Material Cost:**
   $$\text{LeafCost} = \frac{\text{Volume}_{\text{released}}}{\eta} \times P_{\text{leaf}}$$
   At 1,000 kg volume, $\eta = 0.25$, and $P_{\text{leaf}} = \text{BDT } 25/\text{kg}$:
   $$\text{LeafCost} = 4,000\text{ kg} \times 25 = \text{BDT } 100,000.00 \quad (\text{BDT } 100.00/\text{kg})$$

2. **Packaging Cost:**
   - Bulk bags: BDT 50 per 25 kg bag $\implies \text{BDT } 2.00/\text{kg}$.
   - Retail packaging:
     - 50 g bottles: BDT 4.00 per bottle $\implies \text{BDT } 80.00/\text{kg}$.
     - 100 g bottles: BDT 8.00 per bottle $\implies \text{BDT } 80.00/\text{kg}$.
   - For 900 kg bulk (BDT 1,800) + 100 kg retail (800 × 50g @ BDT 4 + 600 × 100g @ BDT 8 = BDT 8,000):
     $$\text{PackagingTotal} = \text{BDT } 1,800 + \text{BDT } 8,000 = \text{BDT } 9,800.00 \quad (\text{BDT } 9.80/\text{kg})$$

3. **Departmental Factory Overhead:**
   - Production Engineering: BDT 26,000
   - Capacity and Operations: BDT 8,000
   - Controls and Electrical: BDT 12,000
   - Quality and Traceability: BDT 6,000
   - Testing and Portfolio: BDT 2,000
   - Business Operations: BDT 7,000
   - Total Cash Overhead: **BDT 61,000.00** $(\text{BDT } 61.00/\text{kg}$ at 1,000 kg)

4. **Depreciation:**
   - Plant assets startup basis straight-line: **BDT 10,833.33** $(\text{BDT } 10.83/\text{kg}$ at 1,000 kg)

5. **Manufacturing Cost Total:**
   $$\text{MfgCost} = 100,000 + 9,800 + 61,000 + 10,833.33 = \text{BDT } 181,633.33 \implies \mathbf{BDT\ 181.63/\text{kg}}$$

6. **Selling Expense (Bulk Freight):**
   - Tracked separately as selling and distribution: BDT 9,000.00.

7. **Zero Output Handling:**
   - If $\text{Volume} = 0$:
     - Direct material = 0
     - Fixed overhead + depreciation = BDT 71,833.33 (Idle Capacity Period Variance)
     - Unit cost is marked `N/A (Zero Output)`, preventing division by zero.
