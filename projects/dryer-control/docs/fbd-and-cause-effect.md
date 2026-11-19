# Tea Dryer Control — Control Narrative & Alarm Cause-and-Effect

## 1. Process Instrumentation & Register Map

| Tag Name | Address | Type | Engineering Scale | Description |
|---|---|---|---|---|
| `AI_DRYER_TEMP_PV` | `%IW60` | `INT` | 0–1500 (0.1°C res, 0–150.0°C) | Dryer chamber thermocouple input |
| `AO_HEAT_COMMAND` | `%QW60` | `WORD` | 0–27648 (0.0–100.0% duty cycle) | SCR power controller firing angle command |
| `DI_FAN_PROOF` | `%I3.0` | `BOOL` | TRUE = Flow OK | Differential pressure air-proving switch |
| `DI_PB_ACK` | `%I3.1` | `BOOL` | Momentary PB | Operator alarm acknowledgement pushbutton |
| `DI_PB_RESTART` | `%I3.2` | `BOOL` | Momentary PB | Operator burner deliberate restart pushbutton |
| `DO_ALARM_SIREN` | `%Q3.0` | `BOOL` | TRUE = Audible Alert | Trip horn (silenced upon ACK) |
| `DO_ALARM_BEACON` | `%Q3.1` | `BOOL` | TRUE = Red Strobe | Safety trip beacon (active until fault cleared & restarted) |

---

## 2. Alarm Cause-and-Effect Matrix

| Initiating Event | Immediate Automatic Action | Alarm Indication | Reset Prerequisite 1 | Reset Prerequisite 2 | Restoration Action |
|---|---|---|---|---|---|
| `DI_FAN_PROOF` drops FALSE while batch is running | `AO_HEAT_COMMAND` immediately forced to 0.0%. Heating locked out. | Siren ON, Strobe ON, Latched Alarm | Operator presses `DI_PB_ACK` (silences siren; heat remains OFF) | Airflow restored (`DI_FAN_PROOF = TRUE`) | Operator must push `DI_PB_RESTART` to re-arm burner |
| Chamber temp exceeds high safety limit (> 125°C) | Emergency high-limit contactor drops | Strobe ON, High Temp trip | Operator ACK | Temperature cools below 105°C | Manual safety reset |

---

## 3. Structured Text (ST) Interlock Logic

```pascal
(* Fan Proof Interlock & Trip Latch *)
IF Batch_Running AND NOT DI_FAN_PROOF THEN
    Alarm_Latched := TRUE;
    Heat_Enabled := FALSE;
    AO_HEAT_COMMAND := 0;
    DO_ALARM_BEACON := TRUE;
    IF NOT Alarm_Acked THEN
        DO_ALARM_SIREN := TRUE;
    END_IF;
END_IF;

(* Operator Acknowledgement *)
IF DI_PB_ACK AND Alarm_Latched THEN
    Alarm_Acked := TRUE;
    DO_ALARM_SIREN := FALSE; (* Silence horn only *)
    (* Heat_Enabled remains FALSE! *)
END_IF;

(* Deliberate Restart Sequence *)
IF Alarm_Latched AND Alarm_Acked AND DI_FAN_PROOF AND DI_PB_RESTART THEN
    Alarm_Latched := FALSE;
    Alarm_Acked := FALSE;
    DO_ALARM_BEACON := FALSE;
    Heat_Enabled := TRUE; (* Re-arm heating *)
END_IF;
```
