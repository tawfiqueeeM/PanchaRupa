# Green Tea Sequence — Control Narrative & Permissives

## 1. Process Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operator / Recipe System
    participant Drum as Heated Drum (Fixation)
    participant Roller as Shared Rolling Machine
    participant Dryer as Shared Final Dryer
    participant Out as Output / Quality Discharge

    Op->>Drum: Load Batch B-G01 (120 kg) & GT-STD-01 Recipe
    Drum->>Drum: De-enzyming heat cycle (230°C, 35 min)
    Drum-->>Roller: Request Handoff (Drum Complete)
    alt Roller Available (%I1.0 = TRUE)
        Roller->>Roller: Handoff accepted. Run rolling cycle (30 min)
    else Roller Unavailable (%I1.0 = FALSE)
        Drum->>Drum: Hold B-G01 in drum discharge hopper
        Note over Drum,Roller: Retain B-G01 identity, state = WAITING_FOR_ROLLER
        Roller-->>Drum: Signal Roller Released (%I1.0 = TRUE)
        Drum->>Roller: Handoff B-G01 to Roller
    end
    Roller-->>Dryer: Request Handoff (Rolling Complete)
    alt Dryer Available (%I2.0 = TRUE)
        Dryer->>Dryer: Handoff accepted. Run final drying (95°C, 60 min)
    else Dryer Unavailable (%I2.0 = FALSE)
        Roller->>Roller: Hold B-G01 in roller discharge tray
        Note over Roller,Dryer: Retain B-G01 identity, state = WAITING_FOR_DRYER
        Dryer-->>Roller: Signal Dryer Released (%I2.0 = TRUE)
        Roller->>Dryer: Handoff B-G01 to Dryer
    end
    Dryer->>Out: Final Discharge (Complete Handoff)
    Out->>Out: Increment released output (+30.0 kg finished tea)
```

---

## 2. Per-Station Permissives Matrix

| Station | Run Permissive Requirements | Interlock Hold Conditions | Tag Addresses |
|---|---|---|---|
| **Heated Drum** | `Recipe Selected` AND `Drum Infeed Gate Closed` AND `Heater Zone 1/2 >= 200°C` | E-stop tripped OR Door open | Permissive: `%M10.0`, Run: `%Q1.0` |
| **Shared Roller** | `Drum Cycle Complete` AND `Roller Available (%I1.0 = TRUE)` AND `Roller Bed Clean` | Roller occupied by Golden batch OR Maintenance lockout | Permissive: `%M10.1`, Run: `%Q1.1` |
| **Shared Dryer** | `Roller Cycle Complete` AND `Dryer Available (%I2.0 = TRUE)` AND `Airflow Proof OK` | Dryer running or reserved by another batch | Permissive: `%M10.2`, Run: `%Q1.2` |
| **Discharge Ledger**| `Dryer Cycle Complete` AND `Discharge Valve Confirmed Open` | Missing discharge handshake | Permissive: `%M10.3`, Increment: `%Q1.3` |

---

## 3. Waiting Reason & Batch Identity Preservation

- **Inviolable Rule:** No batch mass or identifier may be cleared or discarded due to downstream delay.
- While waiting for roller availability:
  - Batch register `REG_ACTIVE_BATCH_ID` retains `B-G01`.
  - Machine state register `REG_LINE_STATE` indicates `WAITING_FOR_ROLLER` (`Code: 104`).
  - HMI displays operator message: `HOLD: Shared roller occupied by Batch B-O01`.
- While waiting for dryer availability:
  - Batch register `REG_ACTIVE_BATCH_ID` retains `B-G01`.
  - Machine state register `REG_LINE_STATE` indicates `WAITING_FOR_DRYER` (`Code: 108`).
  - HMI displays operator message: `HOLD: Shared dryer reserved`.
