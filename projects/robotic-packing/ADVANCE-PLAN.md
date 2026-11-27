# Advance Work Plan — Robotic Packing Cell (Project 15 / Order 6)

## Lead Departments & Work Groups
- **Lead:** Dept 1 Production Engineering & Dept 3 Controls and Electrical
- **Contributors:** Dept 5 HMI and Simulation, Dept 6 Testing and Portfolio
- **Git Branch:** `subproject/15-robotic-packing`
- **Source Path:** `projects/robotic-packing/`
- **Demo Route:** `demos/robotic-packing/` (served at `/demos/robotic-packing/index.html`)

## Requirements & Scope
1. **Robotic Pick-and-Place Handshake:**
   - Simulated PLC-to-Robot controller handshake over discrete I/O:
     - `DI_ROBOT_READY` (%I5.0), `DO_CONVEYOR_RUN` (%Q5.0), `DI_BOTTLE_AT_PICK` (%I5.1), `DO_ROBOT_TRIGGER_PICK` (%Q5.1), `DI_GRIPPER_CONFIRMED` (%I5.2), `DO_ROBOT_PLACE` (%Q5.2), `DI_PLACE_COMPLETE` (%I5.3).
   - Infeed conveyor delivers bottles; robot executes pick → transit → place into carton pocket.
2. **Format Changeover (50 g vs 100 g):**
   - Format 50 g: 12 bottles per shipping carton (3x4 matrix).
   - Format 100 g: 6 bottles per shipping carton (2x3 matrix).
   - Dynamic pocket indexing and carton completion handshake.
3. **Interrupted Pick & Recovery State Machine:**
   - Interruption trigger: Vacuum sensor loss or safety barrier breach during bottle transfer.
   - Immediate interlock: Robot arm halts in mid-air (`ARM_INTERRUPTED_HOLD`), gripper warning active (`DI_GRIPPER_FAULT`).
   - Guided recovery workflow:
     1. Operator commands "Purge & Home" (`CMD_PURGE_AND_HOME`).
     2. Arm discharges dropped/damaged bottle into defect purge tray.
     3. Arm returns to calibrated zero (`SAFE_HOME_POSITION`).
     4. Fault latches clear; infeed conveyor resumes normal indexing.
     5. Exact counts preserved: Carton bottle count does NOT increment for purged bottles; purged bottle is accurately recorded in quarantine ledger.
4. **Count Display & Mass Verification:**
   - Bottles Picked, Bottles in Current Carton, Completed Cartons Dispatched, Purged Bottles Count.
5. **Scenarios:**
   - **Nominal 50 g Pack Run:** Complete 12-bottle carton packing without interruptions.
   - **Nominal 100 g Pack Run:** Complete 6-bottle carton packing without interruptions.
   - **Interrupted Pick Fault:** Vacuum loss injected at bottle #5; arm halts; recovery executes; next bottle cleanly placed as #5.
   - **Reset:** Full deterministic restoration.
6. **Exports:**
   - Export robot cycle event history and carton completion manifest as CSV and JSON.

## Permitted Paths
- `projects/robotic-packing/**`
- `demos/robotic-packing/**`

## Proposed Engine Contract for Codex
- **State Model:**
  ```typescript
  interface RoboticPackingState {
    format: 'FORMAT_50G' | 'FORMAT_100G';
    bottlesPerCarton: number;
    armState: 'IDLE' | 'MOVING_TO_PICK' | 'GRIPPING' | 'TRANSIT_TO_CARTON' | 'PLACING' | 'INTERRUPTED_HOLD' | 'PURGING_TO_HOME';
    interrupted: boolean;
    interruptionReason: string | null;
    counts: {
      bottlesProcessed: number;
      bottlesInCurrentCarton: number;
      cartonsCompleted: number;
      bottlesPurged: number;
    };
    cartonSlots: Array<{ slotIndex: number; filled: boolean; bottleId: string | null }>;
  }
  ```
- **Replacement Point:** `projects/robotic-packing/js/robotic-packing-engine.js`.
