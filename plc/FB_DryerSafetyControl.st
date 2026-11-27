(*
 ==============================================================================
  Function Block: FB_DryerSafetyControl
  Standard: IEC 61131-3 Structured Text
  Enforces fan-proof interlocks, thermal runaway trip, and 3-phase safety
  reset discipline: Acknowledge -> Clear Airflow Proof -> Deliberate Restart.
 ==============================================================================
*)
FUNCTION_BLOCK FB_DryerSafetyControl
VAR_INPUT
    bFanProof AT %I3.0      : BOOL;         (* %I3.0  - Differential pressure switch (1=OK) *)
    bAckPb AT %I3.1         : BOOL;         (* %I3.1  - Operator acknowledge momentary PB *)
    bRestartPb AT %I3.2     : BOOL;         (* %I3.2  - Deliberate restart momentary PB *)
    bStartPb AT %I3.3       : BOOL;         (* %I3.3  - Operator batch start PB *)
    bStopPb AT %I3.4        : BOOL := TRUE; (* %I3.4  - Operator batch stop NC contact (0=Stop) *)
    nTempPvRaw AT %IW60     : INT;          (* %IW60  - Raw PT100 ADC count (0..27648) *)
    rTempSpDegC             : REAL := 95.0; (* Engineering setpoint (50.0..130.0 degC) *)
    tTargetDuration         : TIME := T#60M;(* Target batch drying time *)
END_VAR

VAR_OUTPUT
    rHeatCmdPercent         : REAL;         (* 0.0 .. 100.0 % *)
    nHeatCmdRaw AT %QW60    : WORD;         (* %QW60  - SCR thyristor firing command (0..27648) *)
    bAlarmSiren AT %Q3.0    : BOOL;         (* %Q3.0  - Audible trip horn (silenced on ACK) *)
    bAlarmBeacon AT %Q3.1   : BOOL;         (* %Q3.1  - Safety trip red strobe beacon *)
    bBatchRunning AT %Q3.2  : BOOL;         (* %Q3.2  - Dryer running pilot lamp *)
    bBatchComplete          : BOOL;         (* Cycle finished *)
    rMeasuredTempDegC       : REAL;         (* Scaled chamber temperature (0.0..150.0 degC) *)
    bThermalRunawayTrip     : BOOL;         (* Over-temperature thermal runaway flag *)
    eState                  : (STATE_IDLE, STATE_RUNNING, STATE_SAFETY_TRIP, STATE_COMPLETE) := STATE_IDLE;
END_VAR

VAR
    bAlarmLatched AT %M0.0  : BOOL := FALSE;(* %M0.0  - Latched safety trip memory *)
    bAlarmAcked AT %M0.1    : BOOL := FALSE;(* %M0.1  - Operator acknowledgement memory *)
    bBatchActiveMem AT %M0.2: BOOL := FALSE;(* %M0.2  - Active batch latch memory *)
    tonBatchTimer           : TON;          (* Batch drying cycle timer *)
    rError                  : REAL;
    rKp                     : REAL := 5.0;  (* Proportional gain *)
    rRunawayLimitDegC       : REAL := 140.0;(* Thermal runaway trip threshold (degC) *)
END_VAR

VAR_TEMP
    rClampedSpDegC          : REAL;
    rRawTempClamped         : REAL;
    bSafetyFaultActive      : BOOL;
    bProofHealthy           : BOOL;
END_VAR

(* 1. Input Scaling: 0..27648 to 0.0..150.0 degC *)
rRawTempClamped := INT_TO_REAL(LIMIT(0, nTempPvRaw, 27648));
rMeasuredTempDegC := (rRawTempClamped / 27648.0) * 150.0;
rClampedSpDegC := LIMIT(50.0, rTempSpDegC, 130.0);

(* 2. Evaluate Physical Safety Interlocks & Thermal Runaway *)
bThermalRunawayTrip := (rMeasuredTempDegC >= rRunawayLimitDegC) OR (nTempPvRaw < 0) OR (nTempPvRaw > 27648);
bProofHealthy := bFanProof AND NOT bThermalRunawayTrip;
bSafetyFaultActive := NOT bProofHealthy;

IF bSafetyFaultActive AND (eState <> STATE_SAFETY_TRIP) AND ((eState = STATE_RUNNING) OR bBatchActiveMem) THEN
    (* Immediate Safety Trip: Fail-safe hardware cut *)
    bAlarmLatched   := TRUE;
    bAlarmAcked     := FALSE;
    rHeatCmdPercent := 0.0;
    bBatchRunning   := FALSE;
    eState          := STATE_SAFETY_TRIP;
END_IF;

(* 3. Alarm Acknowledgment Discipline (Silences Siren Only) *)
IF bAlarmLatched AND bAckPb THEN
    bAlarmAcked := TRUE;
END_IF;

(* 4. State Machine Execution *)
CASE eState OF
    STATE_IDLE:
        rHeatCmdPercent := 0.0;
        bBatchRunning   := FALSE;
        bBatchComplete  := FALSE;
        bBatchActiveMem := FALSE;
        tonBatchTimer(IN := FALSE, PT := tTargetDuration);

        (* Deliberate restart on an inactive/stopped batch clears alarm without energizing heat *)
        IF bAlarmLatched AND bRestartPb AND bAlarmAcked AND bProofHealthy THEN
            bAlarmLatched := FALSE;
            bAlarmAcked   := FALSE;
        END_IF;

        IF bStartPb AND bProofHealthy AND NOT bAlarmLatched AND bStopPb THEN
            bBatchActiveMem := TRUE;
            bBatchRunning   := TRUE;
            eState          := STATE_RUNNING;
        END_IF;

    STATE_RUNNING:
        IF NOT bStopPb THEN
            (* Fail-safe NC stop command de-energizes heaters immediately *)
            rHeatCmdPercent := 0.0;
            bBatchRunning   := FALSE;
            bBatchActiveMem := FALSE;
            tonBatchTimer(IN := FALSE, PT := tTargetDuration);
            eState          := STATE_IDLE;
        ELSE
            bBatchRunning   := TRUE;
            bBatchActiveMem := TRUE;

            (* Proportional Heating Control with Saturation *)
            rError := rClampedSpDegC - rMeasuredTempDegC;
            rHeatCmdPercent := LIMIT(0.0, rError * rKp, 100.0);

            (* Cycle Timer: Only accumulates while running with healthy proof *)
            tonBatchTimer(IN := TRUE, PT := tTargetDuration);
            IF tonBatchTimer.Q AND (rMeasuredTempDegC >= 80.0) THEN
                rHeatCmdPercent := 0.0;
                bBatchRunning   := FALSE;
                bBatchActiveMem := FALSE;
                bBatchComplete  := TRUE;
                eState          := STATE_COMPLETE;
            END_IF;
        END_IF;

    STATE_SAFETY_TRIP:
        (* Hard safety lock: Heat output MUST remain 0.0% *)
        rHeatCmdPercent := 0.0;
        bBatchRunning   := FALSE;
        tonBatchTimer(IN := FALSE, PT := tTargetDuration);

        IF NOT bStopPb THEN
            (* Operator stopped batch while faulted; cannot restart into running *)
            bBatchActiveMem := FALSE;
            eState          := STATE_IDLE;
        ELSIF bRestartPb AND bAlarmAcked AND bProofHealthy AND bBatchActiveMem THEN
            (* 3-Phase Reset Complete: Acked -> Proof Healthy -> Deliberate Restart *)
            bAlarmLatched := FALSE;
            bAlarmAcked   := FALSE;
            bBatchRunning := TRUE;
            eState        := STATE_RUNNING;
        END_IF;

    STATE_COMPLETE:
        rHeatCmdPercent := 0.0;
        bBatchRunning   := FALSE;
        bBatchComplete  := TRUE;
        bBatchActiveMem := FALSE;
        tonBatchTimer(IN := FALSE, PT := tTargetDuration);

        IF NOT bStopPb THEN
            eState := STATE_IDLE;
        END_IF;
END_CASE;

(* 5. Alarm Annunciation Logic *)
bAlarmSiren  := bAlarmLatched AND NOT bAlarmAcked;
bAlarmBeacon := bAlarmLatched;

(* 6. Output Command Scaling: 0.0..100.0% to 0..27648 *)
nHeatCmdRaw := REAL_TO_WORD((LIMIT(0.0, rHeatCmdPercent, 100.0) / 100.0) * 27648.0);

END_FUNCTION_BLOCK
