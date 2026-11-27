#!/usr/bin/env python3
"""
IEC 61131-3 Structured Text Verification Harness (plc/plc_verify.py)

1. Parses and validates FB_DryerSafetyControl.st and FB_WitheringAirflowControl.st
   for standard IEC 61131-3 structure, variable sections (VAR_INPUT, VAR_OUTPUT,
   VAR, VAR_TEMP), balanced control blocks, and exact %I/%Q/%M hardware/memory
   address bindings.
2. Executes the parsed Structured Text logic scan-by-scan in a deterministic
   IEC 61131-3 runtime and runs step-by-step assertions mirroring:
   - projects/dryer-control/tests/dryer.test.js
   - projects/withering-airflow/tests/withering.test.js
"""

from __future__ import annotations

import math
import re
import sys
from pathlib import Path
from typing import Any


PLC_DIR = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# IEC 61131-3 Comment Stripping & Structural Validator
# ---------------------------------------------------------------------------

def strip_iec_comments(source: str) -> str:
    return re.sub(r"\(\*[\s\S]*?\*\)", "", source)


def parse_iec_time_ms(literal: str) -> float:
    m = re.fullmatch(r"T#(\d+(?:\.\d+)?)(MS|S|M|H)", literal.strip(), re.IGNORECASE)
    if not m:
        raise ValueError(f"Unsupported IEC TIME literal: {literal}")
    val = float(m.group(1))
    unit = m.group(2).upper()
    scale = {"MS": 1.0, "S": 1000.0, "M": 60_000.0, "H": 3_600_000.0}[unit]
    return val * scale


def parse_default_value(type_spec: str, raw_default: str | None) -> Any:
    t = type_spec.strip().upper()
    if raw_default is None:
        if t == "BOOL":
            return False
        if t in ("INT", "WORD", "DINT"):
            return 0
        if t == "REAL":
            return 0.0
        if t == "TIME":
            return 0.0
        if t.startswith("(") and t.endswith(")"):
            first_enum = t[1:-1].split(",")[0].strip()
            return first_enum
        return None

    val = raw_default.strip()
    if t == "BOOL":
        return val.upper() == "TRUE"
    if t in ("INT", "WORD", "DINT"):
        return int(val)
    if t == "REAL":
        return float(val)
    if t == "TIME":
        return parse_iec_time_ms(val)
    if t.startswith("(") and t.endswith(")"):
        return val
    return val


def parse_and_validate_st(path: Path, expected_fb_name: str, required_addresses: set[str]) -> dict[str, Any]:
    raw_text = path.read_text(encoding="utf-8")
    clean = strip_iec_comments(raw_text)

    fb_match = re.search(rf"\bFUNCTION_BLOCK\s+{re.escape(expected_fb_name)}\b", clean)
    if not fb_match:
        raise AssertionError(f"{path.name}: Missing FUNCTION_BLOCK {expected_fb_name}")
    if not re.search(r"\bEND_FUNCTION_BLOCK\b", clean):
        raise AssertionError(f"{path.name}: Missing END_FUNCTION_BLOCK")

    # Validate required VAR sections
    required_sections = ("VAR_INPUT", "VAR_OUTPUT", "VAR", "VAR_TEMP")
    section_pattern = re.compile(
        r"\b(VAR_INPUT|VAR_OUTPUT|VAR_TEMP|VAR)\b([\s\S]*?)\bEND_VAR\b"
    )
    sections_found: dict[str, str] = {}
    last_var_end = fb_match.end()

    for m in section_pattern.finditer(clean):
        sec_name = m.group(1)
        sections_found[sec_name] = m.group(2)
        last_var_end = max(last_var_end, m.end())

    for sec in required_sections:
        if sec not in sections_found:
            raise AssertionError(f"{path.name}: Missing required section {sec} ... END_VAR")

    # Extract variable declarations and %I/%Q/%M addresses
    variables: dict[str, dict[str, Any]] = {}
    addresses_found: dict[str, str] = {}
    enums: dict[str, str] = {}

    decl_re = re.compile(
        r"^\s*([A-Za-z_][A-Za-z0-9_]*)(?:\s+AT\s+(%[IQM][XBWD]?\d+(?:\.\d+)?))?\s*:\s*([^:;]+?)(?:\s*:=\s*([^;]+?))?\s*;\s*$",
        re.MULTILINE,
    )

    for sec_name, sec_body in sections_found.items():
        for dm in decl_re.finditer(sec_body):
            var_name, addr, type_spec, default_raw = dm.groups()
            type_clean = type_spec.strip()
            if type_clean.startswith("(") and type_clean.endswith(")"):
                for item in type_clean[1:-1].split(","):
                    enum_sym = item.strip()
                    enums[enum_sym] = enum_sym
            variables[var_name] = {
                "section": sec_name,
                "address": addr,
                "type": type_clean,
                "default": parse_default_value(type_clean, default_raw),
            }
            if addr:
                addresses_found[addr] = var_name

    missing_addrs = required_addresses - set(addresses_found.keys())
    if missing_addrs:
        raise AssertionError(
            f"{path.name}: Missing required IEC addresses: {sorted(missing_addrs)}"
        )

    # Extract body between last END_VAR and END_FUNCTION_BLOCK
    end_fb_match = re.search(r"\bEND_FUNCTION_BLOCK\b", clean)
    body = clean[last_var_end:end_fb_match.start()].strip()

    # Validate balanced IF / END_IF and CASE / END_CASE
    if_count = len(re.findall(r"\bIF\b", body))
    endif_count = len(re.findall(r"\bEND_IF\s*;", body))
    if if_count != endif_count:
        raise AssertionError(
            f"{path.name}: Unbalanced IF ({if_count}) vs END_IF; ({endif_count})"
        )

    case_count = len(re.findall(r"\bCASE\b", body))
    endcase_count = len(re.findall(r"\bEND_CASE\s*;", body))
    if case_count != endcase_count:
        raise AssertionError(
            f"{path.name}: Unbalanced CASE ({case_count}) vs END_CASE; ({endcase_count})"
        )

    return {
        "name": expected_fb_name,
        "variables": variables,
        "addresses": addresses_found,
        "enums": enums,
        "body": body,
    }


# ---------------------------------------------------------------------------
# Deterministic IEC 61131-3 Structured Text Runtime
# ---------------------------------------------------------------------------

class TonTimer:
    """IEC 61131-3 On-Delay Timer (TON)."""

    def __init__(self) -> None:
        self.IN = False
        self.PT = 0.0
        self.ET = 0.0
        self.Q = False

    def step(self, in_sig: bool, pt_ms: float, dt_ms: float) -> None:
        self.PT = pt_ms
        if not in_sig:
            self.IN = False
            self.ET = 0.0
            self.Q = False
        else:
            self.IN = True
            self.ET = min(pt_ms, self.ET + dt_ms)
            self.Q = self.ET >= pt_ms


class STFunctionBlockInstance:
    """Executes parsed IEC 61131-3 ST function block scan-by-scan."""

    def __init__(self, parsed: dict[str, Any]) -> None:
        self.parsed = parsed
        self.mem: dict[str, Any] = {}
        self.timers: dict[str, TonTimer] = {}
        self.enums: dict[str, str] = parsed["enums"]
        self.reset()

    def reset(self) -> None:
        self.mem.clear()
        self.timers.clear()
        for name, meta in self.parsed["variables"].items():
            if meta["type"].upper() == "TON":
                self.timers[name] = TonTimer()
            else:
                self.mem[name] = meta["default"]

    def _eval_expr(self, expr: str) -> Any:
        py_expr = expr.strip()

        # Replace IEC timer member access e.g. tonBatchTimer.Q
        for tname, timer in self.timers.items():
            py_expr = re.sub(rf"\b{tname}\.Q\b", repr(timer.Q), py_expr)
            py_expr = re.sub(rf"\b{tname}\.ET\b", repr(timer.ET), py_expr)

        # Replace IEC TIME literals
        py_expr = re.sub(
            r"\bT#\d+(?:\.\d+)?(?:MS|S|M|H)\b",
            lambda m: repr(parse_iec_time_ms(m.group(0))),
            py_expr,
            flags=re.IGNORECASE,
        )

        # Replace IEC boolean & logical operators
        py_expr = re.sub(r"\bTRUE\b", "True", py_expr)
        py_expr = re.sub(r"\bFALSE\b", "False", py_expr)
        py_expr = re.sub(r"\bAND\b", "and", py_expr)
        py_expr = re.sub(r"\bOR\b", "or", py_expr)
        py_expr = re.sub(r"\bNOT\b", "not", py_expr)

        # Replace <> and single = comparisons (careful not to touch <=, >=)
        py_expr = py_expr.replace("<>", "!=")
        py_expr = re.sub(r"(?<![<>!])=(?!=)", "==", py_expr)

        env: dict[str, Any] = {
            "LIMIT": lambda mn, v, mx: max(mn, min(mx, v)),
            "INT_TO_REAL": lambda v: float(int(v)),
            "REAL_TO_WORD": lambda v: max(0, min(65535, int(round(float(v))))),
        }
        env.update(self.enums)
        env.update(self.mem)
        return eval(py_expr, {"__builtins__": {}}, env)

    def _tokenize_lines(self, body: str) -> list[str]:
        # Split into individual statement lines cleanly
        lines = []
        for raw_line in body.splitlines():
            s = raw_line.strip()
            if s:
                lines.append(s)
        return lines

    def _exec_block(self, lines: list[str], idx: int, dt_ms: float) -> int:
        while idx < len(lines):
            line = lines[idx]

            if re.match(r"^(ELSE|ELSIF\b|END_IF;|END_CASE;)", line):
                return idx

            # Check CASE branch label (e.g., STATE_IDLE:)
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*\s*:$", line):
                return idx

            # IF ... THEN
            m_if = re.match(r"^IF\s+(.+?)\s+THEN$", line)
            if m_if:
                idx = self._exec_if(lines, idx, dt_ms)
                continue

            # CASE ... OF
            m_case = re.match(r"^CASE\s+(.+?)\s+OF$", line)
            if m_case:
                idx = self._exec_case(lines, idx, dt_ms)
                continue

            # Timer call: tonBatchTimer(IN := TRUE, PT := tTargetDuration);
            m_timer = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*\((.+)\)\s*;$", line)
            if m_timer and m_timer.group(1) in self.timers:
                tname = m_timer.group(1)
                args_str = m_timer.group(2)
                in_val = False
                pt_val = self.timers[tname].PT
                for part in args_str.split(","):
                    k, v = [p.strip() for p in part.split(":=")]
                    if k.upper() == "IN":
                        in_val = bool(self._eval_expr(v))
                    elif k.upper() == "PT":
                        pt_val = float(self._eval_expr(v))
                self.timers[tname].step(in_val, pt_val, dt_ms)
                idx += 1
                continue

            # Assignment: var := expr;
            m_assign = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:=\s*(.+);$", line)
            if m_assign:
                lhs, rhs = m_assign.group(1), m_assign.group(2)
                self.mem[lhs] = self._eval_expr(rhs)
                idx += 1
                continue

            raise RuntimeError(f"Unrecognized ST statement: {line}")

        return idx

    def _exec_if(self, lines: list[str], idx: int, dt_ms: float) -> int:
        taken = False
        while idx < len(lines):
            line = lines[idx]
            m_if = re.match(r"^(?:IF|ELSIF)\s+(.+?)\s+THEN$", line)
            if m_if:
                cond = bool(self._eval_expr(m_if.group(1))) if not taken else False
                idx += 1
                if cond and not taken:
                    taken = True
                    idx = self._exec_block(lines, idx, dt_ms)
                else:
                    idx = self._skip_block(lines, idx)
                continue
            if line == "ELSE":
                idx += 1
                if not taken:
                    taken = True
                    idx = self._exec_block(lines, idx, dt_ms)
                else:
                    idx = self._skip_block(lines, idx)
                continue
            if line == "END_IF;":
                return idx + 1
            raise RuntimeError(f"Unexpected token inside IF: {line}")
        raise RuntimeError("Unterminated IF block")

    def _exec_case(self, lines: list[str], idx: int, dt_ms: float) -> int:
        m_case = re.match(r"^CASE\s+(.+?)\s+OF$", lines[idx])
        case_val = self._eval_expr(m_case.group(1))
        idx += 1
        while idx < len(lines):
            line = lines[idx]
            if line == "END_CASE;":
                return idx + 1
            m_label = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:$", line)
            if m_label:
                label = m_label.group(1)
                idx += 1
                if case_val == label:
                    idx = self._exec_block(lines, idx, dt_ms)
                else:
                    idx = self._skip_block(lines, idx)
                continue
            raise RuntimeError(f"Unexpected token inside CASE: {line}")
        raise RuntimeError("Unterminated CASE block")

    def _skip_block(self, lines: list[str], idx: int) -> int:
        depth_if = 0
        depth_case = 0
        while idx < len(lines):
            line = lines[idx]
            if depth_if == 0 and depth_case == 0:
                if re.match(r"^(ELSE|ELSIF\b|END_IF;|END_CASE;)", line):
                    return idx
                if re.match(r"^[A-Za-z_][A-Za-z0-9_]*\s*:$", line):
                    return idx
            if re.match(r"^IF\b", line):
                depth_if += 1
            elif line == "END_IF;":
                depth_if -= 1
            elif re.match(r"^CASE\b", line):
                depth_case += 1
            elif line == "END_CASE;":
                depth_case -= 1
            idx += 1
        return idx

    def scan(self, dt_ms: float = 10.0, **inputs: Any) -> dict[str, Any]:
        for k, v in inputs.items():
            if k not in self.mem:
                raise KeyError(f"Unknown FB variable: {k}")
            self.mem[k] = v
        lines = self._tokenize_lines(self.parsed["body"])
        self._exec_block(lines, 0, dt_ms)
        return dict(self.mem)


# ---------------------------------------------------------------------------
# Plant Physics Helpers (Mirroring JS Domain Engines for Closed-Loop Tests)
# ---------------------------------------------------------------------------

def degc_to_raw(deg_c: float) -> int:
    return int(round((deg_c / 150.0) * 27648.0))


def pct_to_raw(pct: float) -> int:
    return int(round((pct / 100.0) * 27648.0))


def temp_c_to_wither_raw(temp_c: float) -> int:
    return int(round((temp_c / 50.0) * 27648.0))


def step_dryer_plant(
    fb: STFunctionBlockInstance,
    measured_temp_c: float,
    ambient_temp_c: float = 25.0,
    dt_min: float = 1.0,
    **inputs: Any,
) -> tuple[dict[str, Any], float]:
    """Run one 1-minute closed-loop scan + thermal plant step."""
    out = fb.scan(dt_ms=dt_min * 60_000.0, nTempPvRaw=degc_to_raw(measured_temp_c), **inputs)
    heat_pct = out["rHeatCmdPercent"]
    setpoint_c = out["rTempSpDegC"]
    if out["eState"] == "STATE_RUNNING" and heat_pct > 0.0:
        target_eq = ambient_temp_c + (heat_pct / 100.0) * (setpoint_c + 10.0 - ambient_temp_c)
        d_t = (target_eq - measured_temp_c) * 0.15 * dt_min
        measured_temp_c = round((measured_temp_c + d_t) * 10.0) / 10.0
    else:
        cooling_rate = 0.08 * dt_min
        measured_temp_c = max(
            ambient_temp_c,
            round((measured_temp_c - (measured_temp_c - ambient_temp_c) * cooling_rate) * 10.0) / 10.0,
        )
    return out, measured_temp_c


# ---------------------------------------------------------------------------
# Verification Suites
# ---------------------------------------------------------------------------

def verify_dryer_suite(dryer_parsed: dict[str, Any]) -> None:
    print("Running FB_DryerSafetyControl verification suite...")

    # 1. Nominal heat ramp and batch start
    fb = STFunctionBlockInstance(dryer_parsed)
    temp_c = 25.0
    out, temp_c = step_dryer_plant(
        fb, temp_c, bFanProof=True, bStartPb=True, bStopPb=True, rTempSpDegC=95.0
    )
    assert out["eState"] == "STATE_RUNNING", f"Expected STATE_RUNNING, got {out['eState']}"
    assert out["bBatchRunning"] is True

    for _ in range(10):
        out, temp_c = step_dryer_plant(fb, temp_c, bFanProof=True, bStartPb=False, bStopPb=True)
    assert temp_c > 25.0, "Temperature must rise above ambient"
    assert out["rHeatCmdPercent"] > 0.0, "Heat command must modulate"
    assert out["nHeatCmdRaw"] > 0, "%QW60 must be non-zero while heating"

    # 2. Fan proof loss forces heat command to 0.0% immediately
    fb.reset()
    temp_c = 25.0
    out, temp_c = step_dryer_plant(fb, temp_c, bFanProof=True, bStartPb=True, bStopPb=True)
    for _ in range(5):
        out, temp_c = step_dryer_plant(fb, temp_c, bFanProof=True, bStartPb=False, bStopPb=True)
    assert out["rHeatCmdPercent"] > 0.0

    out = fb.scan(dt_ms=10.0, bFanProof=False, bStopPb=True)
    assert out["rHeatCmdPercent"] == 0.0, "Heat command must drop to 0% immediately on lost proof"
    assert out["nHeatCmdRaw"] == 0, "%QW60 must drop to 0"
    assert out["eState"] == "STATE_SAFETY_TRIP"
    assert out["bAlarmLatched"] is True
    assert out["bAlarmSiren"] is True
    assert out["bAlarmBeacon"] is True

    # 3. Strict 3-phase safety reset: Acknowledge -> Clear Proof -> Deliberate Restart
    out = fb.scan(dt_ms=10.0, bAckPb=True, bRestartPb=False, bFanProof=False)
    assert out["bAlarmAcked"] is True
    assert out["bAlarmLatched"] is True, "Alarm remains latched after ACK"
    assert out["bAlarmSiren"] is False, "Siren silenced on ACK"
    assert out["bAlarmBeacon"] is True, "Beacon remains active until deliberate restart"
    assert out["rHeatCmdPercent"] == 0.0, "Acknowledgement alone CANNOT restore heat command"

    # Premature restart while fan proof missing must fail
    out = fb.scan(dt_ms=10.0, bAckPb=False, bRestartPb=True, bFanProof=False)
    assert out["eState"] == "STATE_SAFETY_TRIP"
    assert out["rHeatCmdPercent"] == 0.0

    # Restoring physical fan proof alone must NOT re-energize heat
    out = fb.scan(dt_ms=10.0, bRestartPb=False, bFanProof=True)
    assert out["eState"] == "STATE_SAFETY_TRIP"
    assert out["rHeatCmdPercent"] == 0.0

    # Deliberate restart with ACK + healthy fan proof re-arms heating
    out = fb.scan(dt_ms=10.0, bRestartPb=True, bFanProof=True)
    assert out["eState"] == "STATE_RUNNING"
    assert out["bAlarmLatched"] is False
    assert out["bAlarmBeacon"] is False
    out, temp_c = step_dryer_plant(fb, temp_c, bRestartPb=False, bFanProof=True)
    assert out["rHeatCmdPercent"] > 0.0, "Heating resumed post-deliberate restart"

    # 4. Thermal runaway trip (>= 140.0 degC)
    out = fb.scan(dt_ms=10.0, bRestartPb=False, bFanProof=True, nTempPvRaw=degc_to_raw(142.0))
    assert out["bThermalRunawayTrip"] is True
    assert out["eState"] == "STATE_SAFETY_TRIP"
    assert out["rHeatCmdPercent"] == 0.0
    assert out["nHeatCmdRaw"] == 0
    # Cannot restart while still over-temperature even after ACK
    out = fb.scan(dt_ms=10.0, bAckPb=True, bRestartPb=True, nTempPvRaw=degc_to_raw(141.0))
    assert out["eState"] == "STATE_SAFETY_TRIP"
    # Once cooled below 140.0 degC and deliberate restart pulsed, recovers
    out = fb.scan(dt_ms=10.0, bAckPb=False, bRestartPb=True, nTempPvRaw=degc_to_raw(90.0))
    assert out["eState"] == "STATE_RUNNING"
    assert out["bThermalRunawayTrip"] is False

    # 5. Regression R06: Dryer does not complete batch during permanent unheated fault trip
    fb.reset()
    temp_c = 25.0
    step_dryer_plant(fb, temp_c, bFanProof=True, bStartPb=True, bStopPb=True)
    out = fb.scan(dt_ms=10.0, bFanProof=False, bStartPb=False, bStopPb=True)
    for _ in range(60):
        out, temp_c = step_dryer_plant(fb, temp_c, bFanProof=False, bStopPb=True)
    assert out["bBatchComplete"] is False, "Batch must NOT complete when unheated"
    assert out["eState"] == "STATE_SAFETY_TRIP"
    assert temp_c == 25.0
    assert out["bAlarmLatched"] is True

    # 6. Regression R06: deliberateRestart cannot energize an inactive stopped batch
    fb.reset()
    fb.scan(dt_ms=10.0, bFanProof=True, bStartPb=True, bStopPb=True, nTempPvRaw=degc_to_raw(25.0))
    fb.scan(dt_ms=10.0, bFanProof=False, bStartPb=False, bStopPb=True)
    fb.scan(dt_ms=10.0, bAckPb=True)
    fb.scan(dt_ms=10.0, bAckPb=False, bStopPb=False)  # Stop command
    fb.scan(dt_ms=10.0, bFanProof=True, bStopPb=True, bRestartPb=True)  # Attempt restart
    assert fb.mem["eState"] == "STATE_IDLE"
    assert fb.mem["bBatchRunning"] is False
    assert fb.mem["rHeatCmdPercent"] == 0.0

    # 7. Regression R06: Nominal 60-minute cycle completes with operating temperature
    fb.reset()
    temp_c = 25.0
    out, temp_c = step_dryer_plant(fb, temp_c, bFanProof=True, bStartPb=True, bStopPb=True)
    for _ in range(60):
        out, temp_c = step_dryer_plant(fb, temp_c, bFanProof=True, bStartPb=False, bStopPb=True)
    assert out["bBatchComplete"] is True, "Nominal batch completes after 60 min"
    assert out["eState"] == "STATE_COMPLETE"
    assert out["rMeasuredTempDegC"] >= 80.0
    assert temp_c >= 70.0
    assert out["rHeatCmdPercent"] == 0.0
    assert out["nHeatCmdRaw"] == 0

    print("  [PASS] All FB_DryerSafetyControl assertions passed.")


def verify_withering_suite(wither_parsed: dict[str, Any]) -> None:
    print("Running FB_WitheringAirflowControl verification suite...")

    fb = STFunctionBlockInstance(wither_parsed)

    # 1. Psychrometric humidity compensation (above 65% target moisture)
    # Dry Autumn (50% RH) -> 50% fan speed
    out = fb.scan(
        dt_ms=10.0,
        nMoistureRaw=pct_to_raw(78.0),
        nAmbientTempRaw=temp_c_to_wither_raw(22.0),
        nAmbientRhRaw=pct_to_raw(50.0),
        bFanFeedback=True,
        bStart=True,
        bStop=False,
    )
    assert out["bSensorFault"] is False
    assert out["bTargetReached"] is False
    assert out["bFanRunCmd"] is True
    assert out["rFanSpeedPct"] == 50.0, f"Expected 50% speed at 50% RH, got {out['rFanSpeedPct']}"

    # Spring Nominal (66% RH >= 65% threshold) -> 75% fan speed
    out = fb.scan(dt_ms=10.0, bStart=False, nAmbientRhRaw=pct_to_raw(66.0))
    assert out["rFanSpeedPct"] == 75.0, f"Expected 75% speed at 66% RH, got {out['rFanSpeedPct']}"

    # Monsoon Humid (88% RH) -> 100% fan speed
    out = fb.scan(dt_ms=10.0, nAmbientRhRaw=pct_to_raw(88.0))
    assert out["rFanSpeedPct"] == 100.0, f"Expected 100% speed at 88% RH, got {out['rFanSpeedPct']}"
    assert out["nFanSpeedRef"] == 27648, "%QW64 must be 27648 at 100% speed"

    # 2. Sensor fault injection and out-of-range detection (5% - 95%)
    # Below 5% (e.g. 0% / open-loop negative)
    out = fb.scan(dt_ms=10.0, nMoistureRaw=-100)
    assert out["bSensorFault"] is True, "Negative raw ADC must trigger %Q3.3 sensor fault"
    assert out["bFanRunCmd"] is False
    assert out["rFanSpeedPct"] == 0.0
    assert out["nFanSpeedRef"] == 0
    assert out["bTargetReached"] is False, "Target reached must be inhibited during sensor fault"

    out = fb.scan(dt_ms=10.0, nMoistureRaw=pct_to_raw(4.5))
    assert out["bSensorFault"] is True, "Moisture < 5.0% must trigger sensor fault"

    # Above 95%
    out = fb.scan(dt_ms=10.0, nMoistureRaw=pct_to_raw(96.0))
    assert out["bSensorFault"] is True, "Moisture > 95.0% must trigger sensor fault"

    # Restore valid sensor reading and restart
    out = fb.scan(dt_ms=10.0, nMoistureRaw=pct_to_raw(75.0), bStart=True)
    assert out["bSensorFault"] is False
    assert out["bFanRunCmd"] is True
    assert out["rFanSpeedPct"] > 0.0

    # 3. Regression R08 & Automatic VFD Cutoff at 65% target moisture
    fb.reset()
    out = fb.scan(
        dt_ms=10.0,
        nMoistureRaw=pct_to_raw(50.0),
        nAmbientTempRaw=temp_c_to_wither_raw(25.0),
        nAmbientRhRaw=pct_to_raw(65.0),
        bStart=True,
        bStop=False,
    )
    assert out["bSensorFault"] is False
    assert out["bTargetReached"] is True, "Target (<= 65%) must be immediately recognized as reached"
    assert out["rFanSpeedPct"] == 0.0, "VFD must cut off at <= 65% moisture"
    assert out["nFanSpeedRef"] == 0, "%QW64 must be 0 on VFD cutoff"
    assert out["bFanRunCmd"] is False

    # Stepping further at 65.0% boundary keeps VFD cut off
    out = fb.scan(dt_ms=10.0, nMoistureRaw=pct_to_raw(65.0), bStart=False)
    assert out["bTargetReached"] is True
    assert out["rFanSpeedPct"] == 0.0
    assert out["nFanSpeedRef"] == 0

    print("  [PASS] All FB_WitheringAirflowControl assertions passed.")


def main() -> int:
    dryer_path = PLC_DIR / "FB_DryerSafetyControl.st"
    wither_path = PLC_DIR / "FB_WitheringAirflowControl.st"

    dryer_required_addrs = {
        "%I3.0", "%I3.1", "%I3.2", "%I3.3", "%I3.4", "%IW60",
        "%Q3.0", "%Q3.1", "%Q3.2", "%QW60",
        "%M0.0", "%M0.1", "%M0.2",
    }
    wither_required_addrs = {
        "%IW70", "%IW72", "%IW74", "%I3.0",
        "%QW64", "%Q3.3", "%Q3.4",
        "%M1.0",
    }

    dryer_parsed = parse_and_validate_st(
        dryer_path, "FB_DryerSafetyControl", dryer_required_addrs
    )
    print(f"[PASS] Parsed & validated {dryer_path.name} (IEC 61131-3 structure + addresses)")

    wither_parsed = parse_and_validate_st(
        wither_path, "FB_WitheringAirflowControl", wither_required_addrs
    )
    print(f"[PASS] Parsed & validated {wither_path.name} (IEC 61131-3 structure + addresses)")

    verify_dryer_suite(dryer_parsed)
    verify_withering_suite(wither_parsed)

    print("\nALL IEC 61131-3 PLC VERIFICATION CHECKS PASSED.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
