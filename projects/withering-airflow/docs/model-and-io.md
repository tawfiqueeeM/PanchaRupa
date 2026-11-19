# Withering Airflow & Moisture Control — Model & I/O Specifications

## 1. Instrumentation & I/O Mapping

| Tag Name | Address | Signal Type | Range / Scaling | Description |
|---|---|---|---|---|
| `AI_MOISTURE_PROBE` | `%IW70` | `INT` | 0–1000 (0.1% res, 0–100.0%) | Capacitive leaf moisture sensor probe |
| `AI_AMBIENT_TEMP` | `%IW72` | `INT` | 0–500 (0.1°C res, 0–50.0°C) | Withering room ambient temperature transmitter |
| `AI_AMBIENT_RH` | `%IW74` | `INT` | 0–1000 (0.1% res, 0–100.0%) | Withering room relative humidity transmitter |
| `AO_FAN_SPEED` | `%QW64`| `WORD` | 0–27648 (0–100% VFD speed) | Withering tray ventilation fan inverter reference |
| `DI_FAN_RUN_FEEDBACK`| `%I3.0`| `BOOL` | TRUE = Fan Rotating | Differential pressure switch / run contact feedback |
| `DO_SENSOR_FAULT` | `%Q3.1` | `BOOL` | TRUE = Alarm Light | Sensor out-of-range alarm (< 5% or > 95% or NaN) |
| `DO_TARGET_REACHED` | `%Q3.2` | `BOOL` | TRUE = Complete Lamp | Target moisture reached (65.0%) signal |

---

## 2. Simplified Moisture Dynamics Model

Withering follows thin-layer moisture loss kinetics:

$$\frac{dM}{dt} = -k \cdot (M(t) - M_e)$$

Where:
- $M(t)$ = instantaneous leaf moisture content (% wet basis).
- $M_e$ = equilibrium moisture content dictated by ambient RH:
  $$M_e = 55.0 + 15.0 \cdot \text{RH}$$
- $k$ = effective mass transfer drying rate coefficient ($\text{hr}^{-1}$), parameterized by fan airflow:
  $$k = k_{\text{base}} \cdot \left(0.3 + 0.7 \cdot \frac{\text{FanSpeed}}{100}\right) \cdot \left(\frac{T_{\text{ambient}}}{25}\right)$$
- Fan electrical energy:
  $$E_{\text{fan}} = P_{\text{rated}} \cdot \left(\frac{\text{FanSpeed}}{100}\right)^3 \cdot \Delta t$$
  (Affinity laws: power scales cubically with fan speed).

---

## 3. Sensor Validity Rules

If `AI_MOISTURE_PROBE` reading drops below 5.0% or exceeds 95.0%, or generates NaN / communication timeout:
1. `DO_SENSOR_FAULT` trips TRUE immediately.
2. Status flags `SENSOR_FAULT_INVALID_READING`.
3. Auto-shutdown on moisture target is inhibited to prevent under-withering or burning leaf.
