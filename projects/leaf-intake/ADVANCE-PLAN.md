# Advance Work Plan — Leaf Intake (Project 01)

## Lead Department & Work Groups
- **Lead:** Dept 1 Production Engineering
- **Contributors:** Dept 5 HMI and Simulation, Dept 6 Testing and Portfolio, Dept 4 Quality & Traceability
- **Git Branch:** `subproject/01-leaf-intake`
- **Source Path:** `projects/leaf-intake/`
- **Demo Route:** `demos/leaf-intake/` (served at `/demos/leaf-intake/index.html`)

## Requirements & Scope
1. **Intake Registration & Scale I/O:**
   - Record vendor delivery: Vendor ID (`V-01`, `V-02`, etc.), Vendor Lot ID (`L-001`, `L-G01`, `L-O01`).
   - Scale gross and tare input: Net mass = Gross - Tare. Validation checks: Gross > Tare, Tare > 0, Net within hopper physical bounds (max 250 kg/batch).
2. **Accept / Reject Quality Gate:**
   - Disposition selector: `ACCEPT` or `REJECT`.
   - If rejected: record mandatory reason code (`FOREIGN_MATTER`, `HIGH_MOISTURE`, `COARSE_STALK`, `FERMENTED_HEAT`). Rejected mass drops to quarantined discard buffer; does not enter production stream.
3. **Buffer Interlock & Traceable Transfer:**
   - Downstream destination assignment based on tea type: Green Grade -> `DRUM_INFEED_HOPPER`; Golden Eligible -> `WITHERING_TRAYS`.
   - Interlock check: Destination buffer status sensor (`DI_BUFFER_CLEAR`).
   - Transfer command (`DO_TRANSFER_CONVEYOR`): When destination buffer is BLOCKED (`DI_BUFFER_CLEAR = FALSE`), transfer command immediately drops to FALSE, jog button disabled, transfer state marked `WAITING_BUFFER_CLEAR`.
   - Re-clearing the buffer restores transfer eligibility without duplicating issued mass or altering the assigned batch ID.
4. **Scenarios:**
   - **Nominal (DAY-40 V-01):** Gross 125 kg, Tare 5 kg -> Net 120 kg, Green grade, Buffer clear -> Transfer successful -> Handed off to Drum Infeed.
   - **Abnormal / Fault:**
     1. Buffer Blocked fault: Transfer in progress drops when buffer sensor indicates downstream blockage; lot remains assigned and waiting.
     2. Scale Gross <= Tare validation error.
     3. Quality rejection with quarantine logging.
   - **Reset:** Full deterministic state restoration.
5. **Exports:**
   - Export current receipt and transfer events as CSV (`leaf-intake-events.csv`) and JSON.

## Permitted Paths
- `projects/leaf-intake/**`
- `demos/leaf-intake/**`

## Proposed Engine Contract for Codex
- **Inputs:** `registerReceipt({ vendorId, lotId, grossKg, tareKg, teaType })`
- **Actions:** `evaluateDisposition({ disposition, rejectionReason })`, `toggleBufferSensor(isClear)`, `jogTransfer()`, `executeTransfer()`, `resetScenario(scenarioId)`
- **State Model:**
  ```json
  {
    "activeLot": { "vendorId": "V-01", "lotId": "L-001", "grossKg": 125, "tareKg": 5, "netKg": 120, "teaType": "GREEN", "disposition": "ACCEPTED" },
    "downstreamBuffer": { "destination": "DRUM_INFEED_HOPPER", "isClear": true, "capacityKg": 150, "currentOccupancyKg": 0 },
    "transferInterlock": { "permissive": true, "transferCommandActive": false, "state": "READY_TO_TRANSFER" },
    "dispatchedLots": []
  }
  ```
- **Replacement Point:** `projects/leaf-intake/js/leaf-intake-engine.js` contains the deterministic fixture adapter. Codex can plug in the formal PLC/interlock model without altering UI or event contracts.

## Acceptance Checks
- Automated unit test suite via `node --test projects/leaf-intake/tests/leaf-intake.test.js`.
- Direct launch at `/demos/leaf-intake/index.html`.
- Verification of nominal, buffer-blocked, validation-error, and reset flows.
