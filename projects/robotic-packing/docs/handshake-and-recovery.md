# Robotic Packing Cell — Handshake & Recovery Specifications

## 1. PLC ↔ Robot Controller Discrete I/O Handshake

| Tag Name | Direction | Signal Type | Description |
|---|---|---|---|
| `DI_ROBOT_READY` | Input from Robot | `%I5.0` | Robot controller in automatic cycle & drives enabled |
| `DO_CONVEYOR_RUN` | Output to Infeed | `%Q5.0` | Index infeed conveyor to feed next bottle |
| `DI_BOTTLE_AT_PICK`| Input from Sensor | `%I5.1` | Optical proximity sensor detects bottle at pick datum |
| `DO_TRIGGER_PICK` | Output to Robot | `%Q5.1` | PLC signals robot to descend and grip bottle |
| `DI_GRIPPER_CLOSED`| Input from Robot | `%I5.2` | Vacuum switch / mechanical jaw confirmed gripped |
| `DO_PLACE_CARTON` | Output to Robot | `%Q5.2` | PLC coordinates arm move to carton target pocket |
| `DI_PLACE_COMPLETE`| Input from Robot | `%I5.3` | Bottle deposited into carton; arm retracted |
| `DI_GRIPPER_FAULT` | Input from Robot | `%I5.4` | Vacuum lost mid-trajectory / gripper collision |
| `DO_PURGE_HOME` | Output to Robot | `%Q5.4` | Command arm to drop part in reject chute & return home |

---

## 2. Handshake Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant PLC as Line PLC
    participant Conveyor as Infeed Conveyor
    participant Arm as Delta Robot Controller
    participant Carton as Carton Indexer

    PLC->>Conveyor: DO_CONVEYOR_RUN = TRUE
    Conveyor-->>PLC: DI_BOTTLE_AT_PICK = TRUE (Bottle in datum)
    PLC->>Conveyor: DO_CONVEYOR_RUN = FALSE (Stop belt)
    PLC->>Arm: DO_TRIGGER_PICK = TRUE
    Arm->>Arm: Move to pick coordinate & energize vacuum
    Arm-->>PLC: DI_GRIPPER_CLOSED = TRUE
    PLC->>Arm: DO_PLACE_CARTON = TRUE (Target Pocket #N)
    alt Nominal Transfer
        Arm->>Arm: Trajectory to carton pocket
        Arm->>Carton: Release vacuum & place bottle
        Arm-->>PLC: DI_PLACE_COMPLETE = TRUE
        PLC->>PLC: Increment carton pocket count (+1)
    else Vacuum Lost Mid-Trajectory
        Arm-->>PLC: DI_GRIPPER_FAULT = TRUE
        Arm->>Arm: Freeze trajectory (INTERRUPTED_HOLD)
        PLC->>PLC: Alarm beacon. Inhibit conveyor & carton index
        Note over PLC,Arm: Operator presses Purge & Home (DO_PURGE_HOME)
        PLC->>Arm: DO_PURGE_HOME = TRUE
        Arm->>Arm: Move to Purge Chute, drop part, return to Home
        Arm-->>PLC: DI_ROBOT_READY = TRUE (Count not incremented)
    end
```

---

## 3. Carton Packing Matrix

- **50g Format:** 12 bottles (3 rows x 4 columns). Upon pocket 12 completion:
  `DO_CARTON_DISCHARGE` pulses; carton conveyor indexes fresh empty carton.
- **100g Format:** 6 bottles (2 rows x 3 columns). Upon pocket 6 completion:
  `DO_CARTON_DISCHARGE` pulses; carton conveyor indexes fresh empty carton.
