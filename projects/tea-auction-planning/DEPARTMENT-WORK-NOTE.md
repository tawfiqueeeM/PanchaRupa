# Department Work Note — Tea Auction Planning & Venue Optimization (Dept 7)

## 1. Department Overview
- **Subproject:** 17 / Row 17 — Tea Auction Planning
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/tea-auction-planning`
- **Scope:** Three-centre tea auction venue comparison (Panchagarh, Sreemangal, Chattogram), full deduction transaction bridge (haulage freight, broker commission, warehouse handling), net realization per kg, freight break-even price premiums for distant sales, reserve price decision gating (Settle vs Relist vs Withdraw), and settlement realization cycles (7d vs 14d vs 21d).

## 2. Implemented Capabilities
1. **Three-Centre Venue Cost Bridge:**
   - Evaluates Panchagarh (BDT 1.50/kg freight, 1.25% commission, 7d settlement), Sreemangal (BDT 6.00/kg freight, 1.50% commission, 14d settlement), and Chattogram (BDT 10.00/kg freight, 1.75% commission, 21d settlement).
   - Computes net realized Tk/kg and total proceeds after deducting freight, commission, and warehouse charges.
2. **Freight Break-Even Premium Analysis:**
   - Calculates the exact hammer bid a distant venue (Chattogram or Sreemangal) must achieve to justify transit costs and match local Panchagarh net returns.
3. **Reserve Price Decision Gating:**
   - `SOLD_SETTLE`: Net realization meets or exceeds reserve price target.
   - `RELIST`: Deficit is within BDT 10/kg; re-enters next sale catalogue.
   - `WITHDRAW_HOLD`: Severe price collapse (> BDT 10/kg below reserve); pulls lot into storage.
4. **Synthetic Data Policy:**
   - Incorporates realistic Bangladesh Tea Board (BTB) and Tea Traders Association of Bangladesh (TTAB) market mechanics without claiming false predictive forecast accuracy.
5. **Interactive UI & Exports:**
   - Real-time hammer price, lot mass, and reserve price sensitivity sliders.
   - Venue net realization comparison matrix.
   - Export to formatted JSON and CSV.
