# Department Work Note — Costing, Overhead Allocation & Margin Analysis (Dept 7)

## 1. Department Overview
- **Subproject:** 14 / Row 14 — Costing and Margin
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/12-costing-and-finance`
- **Scope:** Full absorption manufacturing costing bridge, departmental overhead allocations (6 department cost pools), straight-line plant depreciation, bulk vs retail packaging cost differentiation, outbound freight segregation under selling expenses, break-even volume analysis, and zero-output period variance handling.

## 2. Implemented Capabilities
1. **Full Absorption Manufacturing Cost Bridge:**
   - 1,000 kg design month baseline:
     - Fresh leaf: 4,000 kg at BDT 25/kg = BDT 100,000.00 (BDT 100.00/kg).
     - Packaging materials: 36 bags of 25 kg (BDT 1,800) + 800 × 50g bottles (BDT 3,200) + 600 × 100g bottles (BDT 4,800) = BDT 9,800.00 (BDT 9.80/kg).
     - Departmental recurring factory cash budget: BDT 61,000.00 (BDT 61.00/kg across Production, Operations, Controls, Quality, Testing, Business).
     - Machinery depreciation: BDT 10,833.33 (BDT 10.83/kg).
     - **Manufacturing Cost Total**: BDT 181,633.33 $\implies$ **BDT 181.63 / released kg**.
2. **Freight Segregation:**
   - Outbound freight (BDT 9,000) is explicitly segregated from manufacturing unit cost and recognized as a selling expense.
3. **Zero-Output Handling:**
   - When production volume is 0 kg (e.g. winter dormancy or shutdown), unit cost is reported as `N/A (Zero Output)` without division by zero (`NaN`), and unabsorbed fixed overhead (BDT 71,833.33) is expensed as period variance.
4. **Commercial Sensitivity & Break-Even Modeling:**
   - Calculates break-even volume against total fixed costs and unit contribution margin.
   - Dynamic channel split sensitivity (Bulk auction vs Retail bottles).
5. **Interactive UI & Exports:**
   - Real-time sensitivity sliders for volume, leaf price, yield, and channel split.
   - Full cost bridge waterfall table.
   - Export to formatted JSON and CSV.
