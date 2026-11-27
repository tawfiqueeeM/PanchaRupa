# Department Work Note — Leaf Procurement & Material Requirements Planning (Dept 7)

## 1. Department Overview
- **Subproject:** 12 / Row 12 — Leaf Procurement
- **Lead Department:** Dept 7 Business Operations & Planning
- **Git Branch:** `subproject/08-procurement`
- **Scope:** Material Requirements Planning (MRP) calculations converting net finished tea demand to raw fresh leaf volume via processing yield, supplier quality eligibility certification (Standard vs Golden Tender Bud), winter harvest dormancy constraints (January–February), and supplier lead time / delivery slot synchronization.

## 2. Implemented Capabilities
1. **Material Requirements Planning (MRP) Logic:**
   - Evaluates Gross Demand and offsets existing unreserved Released Warehouse Stock: $\text{NetDemand} = \max(0, \text{Gross} - \text{Stock})$.
   - Converts net demand to fresh green leaf mass: $\text{FreshLeaf} = \frac{\text{NetDemand}}{\eta}$ (e.g. 20 kg net at 25% yield yields exactly 80 kg fresh leaf).
2. **Quality Eligibility Gate:**
   - Enforces plucking grade compatibility: Golden Tea requires `GOLDEN_TENDER_BUD` plucking from certified clonal gardens (e.g. Kazi Tea Estate); standard suppliers are rejected for Golden tea production.
3. **Winter Bush Dormancy Policy:**
   - In January and February, fresh leaf harvesting is suspended across Panchagarh tea estates ($0.0\text{ kg}$ fresh leaf intake). Customer orders must be fulfilled entirely from released inventory buffer.
4. **Logistics & Arrival Slot Synchronization:**
   - Tracks promised delivery arrival hours vs scheduled factory processing slots.
   - Arrivals scheduled after the production slot trigger `LOGISTICS_DELAY` exceptions with calculated delay hours, alerting operations to production line starvation.
5. **Interactive UI & Exports:**
   - Live MRP formulas, dynamic gross demand, stock buffer, and yield sliders.
   - Automated purchase order generation and export to formatted JSON and CSV.
