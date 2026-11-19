# Building Management System (BMS / SD-anlegg) Points & Alarm Matrix

## 1. Supervisory BACnet & Modbus Point List

| Point Identifier | Protocol / Bus | Tag Address | Type | Eng Scale / State | Description |
|---|---|---|---|---|---|
| `AHU_FAN_CMD` | BACnet BO | `BO:101` | `BOOL` | 0=Stop, 1=Run | Factory ventilation AHU fan start/stop command |
| `AHU_FAN_PROOF`| BACnet BI | `BI:101` | `BOOL` | 0=No Flow, 1=Proof OK | Differential pressure airflow proof switch |
| `WH_TEMP` | BACnet AI | `AI:201` | `REAL` | 0.0–50.0 °C | Dry goods storage room ambient temperature |
| `WH_HUMIDITY` | BACnet AI | `AI:202` | `REAL` | 0.0–100.0 % RH | Dry goods storage room relative humidity sensor |
| `DEHUMID_CMD` | BACnet BO | `BO:201` | `BOOL` | 0=Off, 1=Dehumidify | Active desiccant / condenser dehumidifier booster |
| `MTR_POWER_KW` | Modbus RTU | `Reg: 30001`| `REAL` | 0.0–150.0 kW | Incomer multi-function active power meter |
| `MTR_ENERGY_KWH`| Modbus RTU | `Reg: 30003`| `REAL` | 0.0–999,999 kWh | Incomer cumulative active energy register |
| `MTR_HEARTBEAT`| Modbus RTU | `Reg: 30005`| `UINT` | Increments each poll | Modbus communication watchdog counter |

---

## 2. BMS Alarm Matrix

| Alarm Tag | Condition / Trigger | Severity | Action / Output | Reset Condition |
|---|---|---|---|---|
| `ALM_VENT_PROOF_LOSS` | `AHU_FAN_CMD == TRUE` AND `AHU_FAN_PROOF == FALSE` for > 5s | HIGH (Level 2) | Alarm banner active, strobe ON | Airflow restored + Operator ACK |
| `ALM_STORAGE_HIGH_RH`| `WH_HUMIDITY > 65.0%` for > 30s | MEDIUM (Level 3)| Activate `DEHUMID_CMD = TRUE`, alert warehouse | Humidity drops below 60.0% RH |
| `ALM_STALE_METER` | Modbus poll timeout > 15s (`MTR_HEARTBEAT` unchanged) | LOW / Diagnostic | Flag `METER_OFFLINE`, freeze energy KPI | Communication restored |

---

## 3. Specific Energy Consumption (SEC) KPI

$$\text{SEC} = \frac{\Delta \text{kWh}_{\text{factory}}}{\text{Released Mass}_{\text{tea}}\ (\text{kg})}$$

- **Baseline PanchaRupa Target:** $1.40 \text{ to } 1.60\text{ kWh / kg}$ released tea.
- **Components:** Withering ventilation (~25%), Heated drum electric elements (~30%), Final dryer heaters (~35%), Packaging & building lighting/ancillary (~10%).
