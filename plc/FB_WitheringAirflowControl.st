(*
 ==============================================================================
  Function Block: FB_WitheringAirflowControl
  Standard: IEC 61131-3 Structured Text
  Psychrometric humidity compensation, capacitive sensor out-of-range fault
  detection (5% - 95%), and automatic VFD cutoff at 65% target moisture.
 ==============================================================================
*)
FUNCTION_BLOCK FB_WitheringAirflowControl
VAR_INPUT
    nMoistureRaw AT %IW70       : INT;          (* %IW70 - Capacitive leaf moisture probe (0..27648) *)
    nAmbientTempRaw AT %IW72    : INT;          (* %IW72 - Ambient temperature transmitter (0..27648) *)
    nAmbientRhRaw AT %IW74      : INT;          (* %IW74 - Ambient relative humidity (0..27648) *)
    bFanFeedback AT %I3.0       : BOOL;         (* %I3.0 - VFD run contact feedback *)
    bStart                      : BOOL;         (* Operator start command *)
    bStop                       : BOOL;         (* Operator stop command *)
    rTargetMoisture             : REAL := 65.0; (* Target withered moisture % *)
END_VAR

VAR_OUTPUT
    nFanSpeedRef AT %QW64       : WORD;         (* %QW64 - VFD speed reference (0..27648 = 0..100%) *)
    rFanSpeedPct                : REAL;         (* Commanded fan speed percentage (0.0..100.0%) *)
    bSensorFault AT %Q3.3       : BOOL;         (* %Q3.3 - Sensor out-of-range fault lamp *)
    bTargetReached AT %Q3.4     : BOOL;         (* %Q3.4 - Target moisture reached amber lamp *)
    rLeafMoisturePct            : REAL;         (* Scaled leaf moisture (0.0..100.0%) *)
    rAmbientTempC               : REAL;         (* Scaled ambient temperature (0.0..50.0 degC) *)
    rAmbientRhPct               : REAL;         (* Scaled ambient RH (0.0..100.0%) *)
    bFanRunCmd                  : BOOL;         (* VFD run command *)
END_VAR

VAR
    bActive AT %M1.0            : BOOL := FALSE;(* %M1.0 - Withering active latch *)
END_VAR

VAR_TEMP
    rClampedTarget              : REAL;
    bRawOutOfRange              : BOOL;
    rCompensatedSpeed           : REAL;
END_VAR

(* 1. Scale Analog Inputs *)
rLeafMoisturePct := (INT_TO_REAL(LIMIT(0, nMoistureRaw, 27648)) / 27648.0) * 100.0;
rAmbientTempC    := (INT_TO_REAL(LIMIT(0, nAmbientTempRaw, 27648)) / 27648.0) * 50.0;
rAmbientRhPct    := (INT_TO_REAL(LIMIT(0, nAmbientRhRaw, 27648)) / 27648.0) * 100.0;
rClampedTarget   := LIMIT(40.0, rTargetMoisture, 75.0);

(* 2. Capacitive Sensor Out-of-Range Plausibility Check (5.0% - 95.0%) *)
bRawOutOfRange := (nMoistureRaw < 0) OR (nMoistureRaw > 27648);
IF bRawOutOfRange OR (rLeafMoisturePct < 5.0) OR (rLeafMoisturePct > 95.0) THEN
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

(* 4. Automatic VFD Cutoff at Target Moisture & Psychrometric Compensation *)
IF bSensorFault THEN
    (* Inhibit auto-target declaration and force VFD off on invalid probe *)
    bTargetReached := FALSE;
    rFanSpeedPct   := 0.0;
    bFanRunCmd     := FALSE;
ELSIF rLeafMoisturePct <= rClampedTarget THEN
    (* Target moisture (65%) reached: automatic VFD cutoff *)
    bTargetReached := TRUE;
    rFanSpeedPct   := 0.0;
    bFanRunCmd     := FALSE;
ELSE
    bTargetReached := FALSE;
    IF bActive THEN
        (* Psychrometric Compensation based on Ambient RH *)
        IF rAmbientRhPct >= 80.0 THEN
            rCompensatedSpeed := 100.0;
        ELSIF rAmbientRhPct >= 65.0 THEN
            rCompensatedSpeed := 75.0;
        ELSE
            rCompensatedSpeed := 50.0;
        END_IF;
        rFanSpeedPct := rCompensatedSpeed;
        bFanRunCmd   := TRUE;
    ELSE
        rFanSpeedPct := 0.0;
        bFanRunCmd   := FALSE;
    END_IF;
END_IF;

(* 5. Output to Inverter Reference (0..27648) *)
nFanSpeedRef := REAL_TO_WORD((LIMIT(0.0, rFanSpeedPct, 100.0) / 100.0) * 27648.0);

END_FUNCTION_BLOCK
