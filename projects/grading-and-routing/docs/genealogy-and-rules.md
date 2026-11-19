# Grading, Quality Dispositions & Routing Interlocks

## 1. Upstream-to-Downstream Lot Genealogy Tree

```text
[Vendor Fresh Delivery]
   └── Vendor: V-01 (Kazi & Kazi Outgrower)
   └── Vendor Lot: L-G01 (125 kg Gross, 5 kg Tare, 120 kg Net)
         │
         ▼
[Processing Sequence]
   └── Batch ID: B-G01 (Standard Green Tea Recipe GT-STD-01)
   └── Heated Drum (35m) ──> Shared Roller (30m) ──> Shared Final Dryer (60m)
         │
         ▼
[Finished Dried Lot]
   └── Finished Lot ID: F-G01 (30.0 kg Net, Moisture: 3.8%)
         │
         ▼
[Quality Inspection & Grading Station]
   ├── Grade: GRADE_A (Whole leaf, liquor score 9.2/10)
   ├── Disposition: RELEASED (Sign-off: Quality Lead)
   └── Decision Reason: INFUSION_SCORE_EXCELLENT
         │
         ▼
[Storage Bin Routing Diverter]
   └── Destination: BIN-01 (Capacity 50.0 kg, Level sensor DI_BIN1_CLEAR)
         │
         ▼
[Final Product Allocation]
   ├── Bulk Bags: 28 kg to Auction Channel (Pallet O-G-B)
   └── Retail Bottles: 2 kg (20 x 50g bottles + 10 x 100g bottles)
```

---

## 2. Quality Disposition Truth Table

| Active Disposition | Permissive Tag `%M6.0` | Routing Conveyor `%Q6.0` | Interlock Action |
|---|---|---|---|
| `ON_HOLD` | `FALSE` | `DISABLED` | Diverter locked; material cannot leave surge hopper |
| `REJECTED` | `FALSE` | `DIVERT_QUARANTINE` | Allowed only into designated reject container |
| `RELEASED` | `TRUE` | `ENABLED (CONDITIONAL)` | Permitted to route IF destination bin sensor is CLEAR |

---

## 3. Bin Level Sensor & Conveyor Interlock

- Optical/radar high-level sensor (`DI_BIN_FULL`, `%I6.2`).
- If `DI_BIN_FULL == TRUE` during active routing:
  1. `DO_ROUTING_CONVEYOR` drops to `FALSE` within 1 scan cycle (20ms).
  2. Diverter flap closes.
  3. Upstream surge hopper retains unrouted mass and source lot ID `F-G01`.
  4. System latches alarm `ALARM_BIN_FULL_STOP`.
  5. Operator acknowledges fault and either selects alternate bin or empties bin before resuming.
