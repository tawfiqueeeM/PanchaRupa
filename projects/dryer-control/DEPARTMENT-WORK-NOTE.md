# Department Work Note — Tea Dryer Control (Project 02 / Order 8)

## Contributing Departments
- **Lead: Dept 3 Controls and Electrical**
  - Designed the tea dryer temperature regulation loop and safety interlocking architecture.
  - Specified thermocouple scaling (`AI_DRYER_TEMP_PV`, `%IW60`) and SCR power controller heating command (`AO_HEAT_COMMAND`, `%QW60`).
  - Implemented the hard safety interlock: if the circulating fan differential pressure switch (`DI_FAN_PROOF`, `%I3.0`) opens during heating, the heat command MUST immediately drop to 0.0% within one PLC scan.
  - Enforced the strict three-phase safety reset discipline:
    1. Alarm silencing via Acknowledge (`%I3.1`) CANNOT restore heating.
    2. Physical airflow must be re-established (`DI_FAN_PROOF = TRUE`).
    3. Operator must deliberately press the Restart pushbutton (`%I3.2`) to re-arm the burner.
- **Dept 1 Production Engineering**
  - Formulated batch drying schedules: 60 min at 95°C for green and golden tea routes, ensuring leaf moisture drops to the 3–5% target without leaf case-hardening.
- **Dept 5 HMI & Simulation**
  - Designed real-time thermal cockpit at `/demos/dryer-control/` with hero temperature display, dynamic heat duty cycle meter, alarm banner, trending table, and CSV/JSON export.
- **Dept 6 Testing & Portfolio**
  - Authored automated unit test assertions in `projects/dryer-control/tests/dryer.test.js` validating thermal ramp, fan loss cutoff, acknowledgement isolation, and deliberate restart re-arming.
