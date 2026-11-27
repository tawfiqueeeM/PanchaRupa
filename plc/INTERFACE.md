# IEC 61131-3 Industrial Automation Contract (`plc/INTERFACE.md`)

## 1. Scope & Execution Boundary
This interface contract defines the formal IEC 61131-3 Structured Text (`.st`) function blocks and hardware register mapping for PanchaRupa Virtual Tea Factory. It standardizes the physical and safety interlock behavior matching the domain engines in `projects/dryer-control/` and `projects/withering-airflow/`.

- **Target Platforms:** Siemens S7-1200 / S7-1500 (TIA Portal v17+), Beckhoff TwinCAT 3, CODESYS V3.5, and Schneider Modicon.
- **Scan Cycle Requirement:** Cyclic task execution every `10ms` for safety interlocks, `100ms` for PID temperature loops.
- **Safety Interlock Philosophy:** Fail-safe hardware de-energization (`0V` = Safe Trip). Software resets cannot bypass physical interlocks.

---

## 2. Hardware I/O & Memory Register Map

| Tag Name | IEC Address | Data Type | Physical Range | Engineering Units | Description |
|---|---|---|---|---|---|
| `DI_DRYER_FAN_PROOF` | `%I3.0` | `BOOL` | 0 or 24V DC | Boolean (1=OK) | Dryer differential pressure air-proving switch |
| `DI_DRYER_PB_ACK` | `%I3.1` | `BOOL` | 24V DC Momentary | Pushbutton Pulse | Operator alarm acknowledge pushbutton |
| `DI_DRYER_PB_RESTART`| `%I3.2` | `BOOL` | 24V DC Momentary | Pushbutton Pulse | Operator deliberate burner restart pushbutton |
| `DI_DRYER_START` | `%I3.3` | `BOOL` | 24V DC Momentary | Start Pulse | Operator batch start command |
| `DI_DRYER_STOP` | `%I3.4` | `BOOL` | 24V DC NC Contact | Stop Command | Operator batch stop command (Fail-safe NC) |
| `AI_DRYER_TEMP_PV` | `%IW60` | `INT` | 0 – 27648 | 0.0 – 150.0 °C | PT100 RTD sensor input via analog module |
| `DO_DRYER_SIREN` | `%Q3.0` | `BOOL` | 24V DC Relay | 1 = Active | Audible trip horn (silenced on ACK) |
| `DO_DRYER_BEACON` | `%Q3.1` | `BOOL` | 24V DC Relay | 1 = Red Strobe | Safety trip beacon (active until restarted) |
| `DO_DRYER_RUNNING` | `%Q3.2` | `BOOL` | 24V DC Relay | 1 = Operating | Dryer running pilot lamp |
| `AO_DRYER_HEAT_CMD` | `%QW60` | `WORD` | 0 – 27648 | 0.0 – 100.0 % | SCR thyristor power controller firing command |
| `AI_WITHER_MOISTURE`| `%IW70` | `INT` | 0 – 27648 | 0.0 – 100.0 % | Capacitive leaf moisture transmitter probe |
| `AI_WITHER_AMB_TEMP`| `%IW72` | `INT` | 0 – 27648 | 0.0 – 50.0 °C | Withering room ambient temperature |
| `AI_WITHER_AMB_RH` | `%IW74` | `INT` | 0 – 27648 | 0.0 – 100.0 % | Withering room ambient relative humidity |
| `AO_WITHER_FAN_VFD` | `%QW64` | `WORD` | 0 – 27648 | 0 – 100 % Speed | Inverter speed reference (0–50 Hz) |
| `DO_WITHER_FAULT` | `%Q3.3` | `BOOL` | 24V DC Relay | 1 = Fault Lamp | Withering sensor out-of-range alarm |
| `DO_WITHER_TARGET` | `%Q3.4` | `BOOL` | 24V DC Relay | 1 = Amber Lamp | Withering moisture target (65%) reached |

---

## 3. Function Block 1: `FB_DryerSafetyControl`

```structured-text
(*
 ==============================================================================
  Function Block: FB_DryerSafetyControl
  Standard: IEC 61131-3 Structured Text
  Enforces 3-phase safety discipline: Acknowledge -> Verify Proof -> Deliberate Restart
 ==============================================================================
*)
FUNCTION_BLOCK FB_DryerSafetyControl
VAR_INPUT
    bFanProof           : BOOL;         (* %I3.0 - Differential pressure switch *)
    bAckPb              : BOOL;         (* %I3.1 - Operator acknowledge momentary PB *)
    bRestartPb          : BOOL;         (* %I3.2 - Deliberate restart momentary PB *)
    bStartPb            : BOOL;         (* %I3.3 - Operator batch start PB *)
    bStopPb             : BOOL;         (* %I3.4 - Operator batch stop NC button *)
    nTempPvRaw          : INT;          (* %IW60 - Raw ADC count (0..27648) *)
    rTempSpDegC         : REAL := 95.0; (* Engineering setpoint (50.0..130.0 °C) *)
    tTargetDuration     : TIME := T#60M;(* Target batch drying time *)
END_VAR

VAR_OUTPUT
    rHeatCmdPercent     : REAL;         (* 0.0 .. 100.0 % *)
    nHeatCmdRaw         : WORD;         (* %QW60 - Output to SCR driver (0..27648) *)
    bAlarmSiren         : BOOL;         (* %Q3.0 - Audible siren *)
    bAlarmBeacon        : BOOL;         (* %Q3.1 - Red flashing beacon *)
    bBatchRunning       : BOOL;         (* %Q3.2 - Batch active indicator *)
    bBatchComplete      : BOOL;         (* Cycle finished *)
    rMeasuredTempDegC   : REAL;         (* Scaled chamber temperature *)
    eState              : (STATE_IDLE, STATE_RUNNING, STATE_SAFETY_TRIP, STATE_COMPLETE);
END_VAR

VAR
    bAlarmLatched       : BOOL := FALSE;
    bAlarmAcked         : BOOL := FALSE;
    tonBatchTimer       : TON;
    rError              : REAL;
    rKp                 : REAL := 5.0;  (* Proportional gain *)
END_VAR

(* 1. Input Scaling: 0..27648 to 0.0..150.0 °C *)
rMeasuredTempDegC := (INT_TO_REAL(LIMIT(0, nTempPvRaw, 27648)) / 27648.0) * 150.0;

(* 2. Safety Interlock & Fan Proof Verification *)
IF NOT bFanProof AND (eState = STATE_RUNNING) THEN
    (* Immediate Safety Trip: Hardware cut *)
    bAlarmLatched := TRUE;
    bAlarmAcked   := FALSE;
    eState        := STATE_SAFETY_TRIP;
END_IF;

(* 3. Alarm Acknowledgment Discipline *)
IF bAlarmLatched AND bAckPb THEN
    bAlarmAcked := TRUE;
END_IF;

(* 4. State Machine Execution *)
CASE eState OF
    STATE_IDLE:
        rHeatCmdPercent := 0.0;
        bBatchRunning   := FALSE;
        bBatchComplete  := FALSE;
        tonBatchTimer(IN := FALSE);

        IF bStartPb AND bFanProof THEN
            eState := STATE_RUNNING;
        END_IF;

    STATE_RUNNING:
        bBatchRunning := TRUE;

        (* Stop Command handling *)
        IF NOT bStopPb THEN
            eState := STATE_IDLE;
        END_IF;

        (* Proportional Heating Control with Saturation *)
        rError := rTempSpDegC - rMeasuredTempDegC;
        rHeatCmdPercent := LIMIT(0.0, rError * rKp, 100.0);

        (* Cycle Timer *)
        tonBatchTimer(IN := TRUE, PT := tTargetDuration);
        IF tonBatchTimer.Q AND (rMeasuredTempDegC >= 80.0) THEN
            eState := STATE_COMPLETE;
        END_IF;

    STATE_SAFETY_TRIP:
        (* Hard safety lock: Heat output MUST be 0.0% *)
        rHeatCmdPercent := 0.0;
        bBatchRunning   := FALSE;

        (* Deliberate Restart Evaluation *)
        IF bRestartPb AND bAlarmAcked AND bFanProof THEN
            bAlarmLatched := FALSE;
            bAlarmAcked   := FALSE;
            eState        := STATE_RUNNING;
        END_IF;

    STATE_COMPLETE:
        rHeatCmdPercent := 0.0;
        bBatchRunning   := FALSE;
        bBatchComplete  := TRUE;

        IF NOT bStopPb THEN
            eState := STATE_IDLE;
        END_IF;
END_CASE;

(* 5. Alarm Annunciation Logic *)
bAlarmSiren  := bAlarmLatched AND NOT bAlarmAcked;
bAlarmBeacon := bAlarmLatched;

(* 6. Output Command Scaling: 0.0..100.0% to 0..27648 *)
nHeatCmdRaw := REAL_TO_WORD((rHeatCmdPercent / 100.0) * 27648.0);

END_FUNCTION_BLOCK
```

---

## 4. Function Block 2: `FB_WitheringAirflowControl`

```structured-text
(*
 ==============================================================================
  Function Block: FB_WitheringAirflowControl
  Standard: IEC 61131-3 Structured Text
  Psychrometric airflow modulation & automatic target 65% moisture cutoff
 ==============================================================================
*)
FUNCTION_BLOCK FB_WitheringAirflowControl
VAR_INPUT
    nMoistureRaw        : INT;          (* %IW70 - Raw count (0..27648) *)
    nAmbientTempRaw     : INT;          (* %IW72 - Raw count (0..27648) *)
    nAmbientRhRaw       : INT;          (* %IW74 - Raw count (0..27648) *)
    bFanFeedback        : BOOL;         (* %I3.0 - VFD run feedback *)
    bStart              : BOOL;
    bStop               : BOOL;
    rTargetMoisture     : REAL := 65.0; (* Standard withering target % *)
END_VAR

VAR_OUTPUT
    nFanSpeedRef        : WORD;         (* %QW64 - 0..27648 to VFD *)
    rFanSpeedPct        : REAL;
    bSensorFault        : BOOL;         (* %Q3.3 - Out-of-bounds probe *)
    bTargetReached      : BOOL;         (* %Q3.4 - Target moisture achieved *)
    rLeafMoisturePct    : REAL;
    rAmbientTempC       : REAL;
    rAmbientRhPct       : REAL;
    bFanRunCmd          : BOOL;
END_VAR

VAR
    bActive             : BOOL := FALSE;
END_VAR

(* 1. Scale Analog Inputs *)
rLeafMoisturePct := (INT_TO_REAL(LIMIT(0, nMoistureRaw, 27648)) / 27648.0) * 100.0;
rAmbientTempC    := (INT_TO_REAL(LIMIT(0, nAmbientTempRaw, 27648)) / 27648.0) * 50.0;
rAmbientRhPct    := (INT_TO_REAL(LIMIT(0, nAmbientRhRaw, 27648)) / 27648.0) * 100.0;

(* 2. Sensor Sanity Plausibility Check *)
IF (rLeafMoisturePct < 5.0) OR (rLeafMoisturePct > 95.0) THEN
    bSensorFault := TRUE;
ELSE
    bSensorFault := FALSE;
END_IF;

(* 3. Start / Stop Commands *)
IF bStart AND NOT bSensorFault THEN
    bActive := TRUE;
ELSIF bStop OR bSensorFault THEN
    bActive := FALSE;
END_IF;

(* 4. Automatic Withering Cutoff Gate *)
IF rLeafMoisturePct <= rTargetMoisture THEN
    bTargetReached := TRUE;
    rFanSpeedPct   := 20.0; (* Low cooling purge *)
ELSE
    bTargetReached := FALSE;
    (* Psychrometric Compensation: If Ambient RH > 80%, increase airflow to 100% *)
    IF rAmbientRhPct >= 80.0 THEN
        rFanSpeedPct := 100.0;
    ELSIF rAmbientRhPct >= 65.0 THEN
        rFanSpeedPct := 75.0;
    ELSE
        rFanSpeedPct := 50.0;
    END_IF;
END_IF;

IF NOT bActive THEN
    rFanSpeedPct := 0.0;
    bFanRunCmd   := FALSE;
ELSE
    bFanRunCmd   := TRUE;
END_IF;

(* 5. Output to Inverter Reference *)
nFanSpeedRef := REAL_TO_WORD((rFanSpeedPct / 100.0) * 27648.0);

END_FUNCTION_BLOCK
```

---

## 5. Hardware Safety Verification Protocol
Prior to production signoff, field technicians must verify:
1. Physical disconnection of `%I3.0` during heating forces `%QW60` to `0` within `10ms`.
2. Toggling `%I3.1` (ACK) alone leaves `%QW60` locked at `0`.
3. Pulsing `%I3.2` (Restart) re-arms heat command only when `%I3.0` is physically healthy (`TRUE`).
