# Golden Tea Sequence & Shared-Dryer Arbitration Logic

## 1. Process Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operator / Recipe System
    participant Gate as Eligibility Gate
    participant Wither as Withering Trays
    participant Roller as Shared Roller
    participant Ox as Oxidation Racks
    participant Dryer as Shared Final Dryer
    participant Out as Finished Stock Ledger

    Op->>Gate: Load Batch B-O01 (40 kg)
    alt Leaf Not Eligible (%I4.0 = FALSE)
        Gate-->>Op: Reject start: LEAF_INELIGIBLE
    else Leaf Eligible (%I4.0 = TRUE)
        Gate->>Wither: Transfer to Withering Trays (120 min)
        Wither->>Roller: Handoff to Shared Roller (30 min)
        Roller->>Ox: Handoff to Oxidation Racks (90 min @ 25°C / 90% RH)
        Ox->>Dryer: Request Reservation for B-O01
        alt Dryer Free (State: FREE)
            Dryer->>Dryer: Lock State = BUSY_GOLDEN (Owner: B-O01)
            Ox->>Dryer: Transfer fermented leaf into Dryer (60 min @ 95°C)
            Dryer->>Out: Final Discharge (+10.0 kg Finished Golden Tea)
            Dryer->>Dryer: Release lock (State = FREE)
        else Dryer Occupied by Green Batch B-G01
            Dryer-->>Ox: Deny transfer: DRYER_BUSY_GREEN
            Ox->>Ox: Hold B-O01 in fermentation rack (State: WAITING_FOR_DRYER)
            Note over Ox,Dryer: Batch ID B-O01 retained. Mutual exclusion enforced.
            Dryer-->>Ox: Signal Dryer Freed (State: FREE)
            Ox->>Dryer: Resume transfer
        end
    end
```

---

## 2. Shared-Dryer State Transition Table

| Current State | Event / Trigger | Next State | Allowed Actions |
|---|---|---|---|
| `FREE` | Golden batch requests reservation | `RESERVED_GOLDEN` | Dryer heater preheats to 95°C |
| `RESERVED_GOLDEN` | Golden leaf transferred into dryer | `BUSY_GOLDEN` | Green tea requests denied / held |
| `BUSY_GOLDEN` | Drying cycle finishes & discharged | `FREE` | Unlocks next waiting batch |
| `FREE` | Green batch requests reservation | `RESERVED_GREEN` | Golden tea requests denied / held |
| `BUSY_GREEN` | Golden batch requests reservation | `BUSY_GREEN` | Golden batch placed in `WAITING_FOR_DRYER` |
| `BUSY_GREEN` | Green cycle finishes & discharged | `FREE` | Unlocks waiting Golden batch |

---

## 3. Mutual Exclusion Interlock Rules

1. `Dryer_Owner_Batch_ID` register holds the active batch identifier.
2. `DO_DRYER_INFEED_GATE` can only open if `Dryer_State == FREE` or `Dryer_Owner_Batch_ID == Active_Batch_ID`.
3. Simultaneous entry of green and golden tea is mechanically and electronically locked out to prevent catastrophic product cross-contamination.
