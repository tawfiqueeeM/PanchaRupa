# Skills Matrix & Shift Roster Rules

## 1. Workstations and Skill Qualifications
Each factory processing stage requires specific operational certifications:
1. `LEAF_INTAKE`: Weight scale validation, moisture probe sampling, defect grading.
2. `WITHERING`: Fan speed modulation, bed flipping, airflow moisture monitoring.
3. `FIXATION`: Rotary drum thermal management, high-heat de-enzyming.
4. `ROLLING`: Pressure regulation, leaf cellular rupture, timing control.
5. `OXIDATION`: Relative humidity maintenance, ambient scent monitoring.
6. `DRYING`: Thermal setpoint maintenance, burner monitoring, safety interlocks.
7. `PACKING`: Dosing calibration, robotic checkweigher supervision, lot labeling.

## 2. Workforce Roster Profiles
- **Lead Tea Master (`W-01`, Fixed):**
  - Fully cross-trained across all thermal and biochemical steps: Withering, Fixation, Rolling, Oxidation, Drying.
- **Process Operator (`W-02`, Fixed):**
  - Specialized machine operator: Fixation, Rolling, Drying, Maintenance.
- **Packaging Specialist (`W-03`, Fixed):**
  - Downstream specialist: Leaf Intake, Robotic Packaging, Manual Bottling.
- **Seasonal Assistant (`W-04`, Seasonal):**
  - Auxiliary labor: Leaf Intake, Withering, Manual Packing.

## 3. Operational Invariants
1. **Concurrency Invariant:** A worker cannot be physically present at two stations simultaneously:
   $$\forall w \in \text{Workers}, \quad \text{Assignments}(w, t_1) \cap \text{Assignments}(w, t_2) = \emptyset \quad \forall t_1 \ne t_2$$
2. **Skill Invariant:** A task can only be assigned to a worker whose `skills` set includes `requiredSkill`.
3. **Availability Invariant:** An absent worker (`isPresent = false`) cannot be assigned to any shift tasks. Any unstaffed tasks are recorded as `UNCOVERED_WORK` with calculated lost operator-hours.
