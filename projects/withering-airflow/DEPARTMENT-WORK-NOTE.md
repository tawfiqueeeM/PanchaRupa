# Department Work Note — Withering Airflow (Project 03 / Order 3)

## Contributing Departments
- **Lead: Dept 1 Production Engineering**
  - Formulated thin-layer withering kinetics: fresh leaf initial moisture (70–82%), target withered leaf moisture (60–68%), equilibrium moisture dependency on ambient relative humidity ($M_e = 55 + 15 \cdot \text{RH}$).
  - Provided tray loading density assumption: 4.5 kg fresh leaf / m².
  - Established airflow sensitivity: higher fan velocity increases convective mass transfer coefficient $k$ while power consumption follows the fan cubic affinity law ($P \propto \text{RPM}^3$).
- **Dept 3 Controls & Electrical**
  - Defined instrumentation interface: capacitive moisture probe (`AI_MOISTURE_PROBE`, `%IW70`), VFD inverter frequency reference (`AO_FAN_SPEED`, `%QW64`), differential pressure run feedback (`DI_FAN_RUN_FEEDBACK`, `%I3.0`), and sensor fault detection interlock (`DO_SENSOR_FAULT`, `%Q3.1`).
- **Dept 5 HMI & Simulation**
  - Designed interactive withering chamber dashboard at `/demos/withering-airflow/` with real-time digital gauges, dynamic fan RPM and power readout, animated spinning fan icon, ambient scenario selector, dual-run comparison table, sensor fault alert banner, and CSV/JSON export.
- **Dept 6 Testing & Portfolio**
  - Authored automated unit test assertions in `projects/withering-airflow/tests/withering.test.js` validating airflow trajectory differences, monsoon ambient deceleration, sensor fault isolation, and cubic power scaling.
