# Waste Classification & Sustainability Rules (Dept 4 & Dept 7)

## 1. Principles of Factory Mass Balance
In tea processing, substantial mass reduction occurs naturally through water vaporization. Sustainable accounting must strictly differentiate thermodynamic moisture loss from operational inefficiency and material waste.

### 1.1 Mass Balance Formula
$$M_{\text{input}} = M_{\text{moisture\_evaporated}} + M_{\text{prime\_tea}} + M_{\text{recoverable}} + M_{\text{non\_recoverable\_discard}}$$

Where:
1. **$M_{\text{input}}$ (kg):** Fresh green leaf received into the processing station.
2. **$M_{\text{moisture\_evaporated}}$ (kg):** Water vapor released during withering (typically reducing leaf from ~78% moisture to ~65% in green tea, or ~55% in orthodox) and drying (final made tea moisture ~3.0%-3.5%). This is **not waste**.
3. **$M_{\text{prime\_tea}}$ (kg):** Premium made tea meeting strict physical, sensory, and chemical specifications, released to saleable inventory.
4. **$M_{\text{recoverable}}$ (kg):** Off-grade tea, broken tea sweepings, or clean tea dust diverted to secondary commercial salvage (e.g. caffeine extraction, compost biomass credit @ BDT 45/kg).
5. **$M_{\text{non\_recoverable\_discard}}$ (kg):** Spoiled, contaminated, scorched, or stewed leaf unfit for human consumption, disposed of as factory refuse (incurring zero salvage and disposal overhead).
6. **$M_{\text{packaging\_waste}}$ (kg):** Non-organic material discarded during packaging (bent aluminum foil, crushed PET/glass bottles, torn paper cartons).

---

## 2. Intake Failure vs Queue Deterioration Analysis

### 2.1 Failure Profile Comparison

| Characteristic | Intake Failure (Case A) | Queue Deterioration (Case B) |
| :--- | :--- | :--- |
| **Origin Point** | Receiving bay / Weigher | Process buffer / Holding trough |
| **Root Cause** | Substandard plucked leaf (coarse mature leaves, waterlogging, grower field delay) | Equipment breakdown (e.g. Dryer heater failure, conveyor jam) |
| **Pre-failure Energy Invested** | Near zero (0 kWh) | High (withering fan kWh + rolling machine kWh expended) |
| **Material Degradation Mode** | Fibrous texture, low polyphenol index | Anaerobic fermentation, enzymatic stewing, overheating ($T > 42^\circ\text{C}$) |
| **Primary Remediation** | Supplier penalty / Rejection at gate / Downgrade price | Preventive maintenance, dynamic buffer venting, rescheduling |
| **Primary Accountability** | **Procurement** | **Maintenance** & **Scheduling** |

---

## 3. Financial & Environmental Accounting Formulas

### 3.1 Financial Impact Breakdown
$$\text{Cost}_{\text{net}} = \text{Cost}_{\text{leaf\_lost}} + \text{Cost}_{\text{pkg\_lost}} + \text{Cost}_{\text{energy\_wasted}} - \text{Credit}_{\text{salvage}}$$

- $\text{Cost}_{\text{leaf\_lost}} = M_{\text{discard\_leaf}} \times \text{Rate}_{\text{green\_leaf}}$ (or equivalent made tea valuation if processed past drying).
- $\text{Cost}_{\text{pkg\_lost}} = \sum (N_{\text{scrapped\_units}} \times \text{Cost}_{\text{packaging\_unit}})$.
- $\text{Cost}_{\text{energy\_wasted}} = E_{\text{wasted\_kWh}} \times \text{Electricity\_Tariff}$ (BDT 11.50 / kWh).
- $\text{Credit}_{\text{salvage}} = M_{\text{recoverable}} \times \text{Salvage\_Rate}$ (BDT 45.00 / kg).

### 3.2 Specific Energy Consumption (SEC) Denominator
$$\text{SEC}_{\text{effective}} = \frac{E_{\text{total\_kWh}}}{M_{\text{prime\_tea\_kg}}}$$
When batches are scrapped due to queue delay, the numerator includes wasted energy while the denominator is reduced, sharply inflating specific energy consumption per prime kilogram.

---

## 4. Root Cause Confidence & Departmental Routing Matrix

### 4.1 Confidence Tiers
- **`CONFIRMED`:** Corroborated by objective telemetry (temperature sensor $> 42^\circ\text{C}$, dwell time $> 120\text{ min}$, or optical camera score $< 60\%$).
- **`SUSPECTED`:** Physical symptoms present (sour odor, discoloration) but direct sensor log is intermittent or incomplete.
- **`UNKNOWN`:** Scrap logged without incident correlation; triggers investigation mandate.

### 4.2 Routing Responsibility Matrix

| Root Cause / Incident | Primary Department | Secondary Department | Decision Authority | Permitted Dispositions |
| :--- | :--- | :--- | :--- | :--- |
| **Supplier Low Grade Leaf** | Procurement | Quality | Quality | `REJECT`, `DOWNGRADE`, `ACCEPT_CONDITIONAL` |
| **Dryer Outage Queue Spoilage** | Maintenance | Scheduling, Building Controls | Quality | `SCRAP`, `DOWNGRADE`, `REPROCESS` |
| **Packaging Line Jam / Reject** | Packing | Maintenance | Quality | `SCRAP_PKG`, `REPACK_BULK` |
| **Storage Bin Moisture Ingress** | Building Controls | Warehouse | Quality | `HOLD`, `DRY_REWORK`, `SCRAP` |
