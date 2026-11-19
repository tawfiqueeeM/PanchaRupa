# Handoff to Codex — Leaf Intake & Buffer Interlock (Project 01)

## Metadata & Scope
- **Lead Department:** Dept 1 Production Engineering
- **Contributing Departments:** Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Branch:** `subproject/01-leaf-intake`
- **Source Paths:**
  - Logic & Specification: `projects/leaf-intake/`
  - Interactive Demo: `demos/leaf-intake/`
- **Status:** `READY FOR CODEX REVIEW`

## Revision History
- **Base Revision:** `83f9980d499384ea322f5aa1b3bb347639e1408d`
- **Foundation Revision:** `6ea3f5ff73d392bce306c72feb24470ab75ca0e1`
- **Implementation Revision Tested:** Working commit on `subproject/01-leaf-intake`

## What Works, Fixture-Driven & Missing
- **Working Implementation:**
  - Real-time gross and tare scale inputs with automatic net weight calculation.
  - Scale validation gates (preventing gross <= tare, negative tare, exceeding hopper capacity).
  - Lot acceptance/rejection with mandatory quality reason codes.
  - Downstream buffer sensor (%I0.3) monitoring with immediate motor trip (%Q0.0 dropped) upon buffer blockage.
  - Mass conservation: interrupted transfers retain assigned lot identity and unissued mass; clearing the buffer sensor restores transfer eligibility without duplicating issued mass.
  - Interactive browser HMI with animated transfer conveyor progress, emulated PLC register table, event logging, and CSV/JSON data export.
  - 4 automated unit tests running in Node.js test runner (`node --test`).
- **Fixture-Driven:**
  - Preloaded vendor delivery catalog (DAY-40 V-01 and V-02 records).
  - Emulated optical buffer sensor toggle.
- **Missing / Deferred to Codex:**
  - Physical Modbus TCP / Profinet load-cell fieldbus driver (simulated via `%IW64` and `%IW66` registers).
  - Inter-project integration with Project 02 (Green Tea Drum) and Project 04 (Withering Trays).

## Launch and Test Instructions
1. **Launch Static Server:**
   ```bash
   python shared/serve.py 8080
   ```
2. **Access Demo Route:**
   Open browser to `http://localhost:8080/demos/leaf-intake/index.html`
3. **Execute Unit Tests:**
   ```bash
   node --test projects/leaf-intake/tests/leaf-intake.test.js
   ```

## Proposed Engine Contract for Codex Integration
- **Engine File:** `projects/leaf-intake/js/leaf-intake-engine.js`
- **Class:** `LeafIntakeEngine`
- **State Fields:**
  ```typescript
  interface LeafIntakeState {
    activeLot: {
      vendorId: string;
      lotId: string;
      grossKg: number;
      tareKg: number;
      netKg: number;
      teaType: 'GREEN' | 'GOLDEN';
      disposition: 'PENDING' | 'ACCEPTED' | 'REJECTED';
      rejectionReason: string | null;
      transferStatus: 'READY' | 'IN_TRANSIT' | 'BLOCKED' | 'COMPLETED' | 'QUARANTINED';
    };
    destinationBuffer: {
      targetStation: 'DRUM_INFEED_HOPPER' | 'WITHERING_TRAYS' | 'QUARANTINE_BIN';
      isClear: boolean;
      sensorTag: 'DI_BUFFER_CLEAR';
    };
    transferInterlock: {
      commandActive: boolean;
      progressPercent: number;
      interlockTripped: boolean;
      tripReason: string | null;
    };
    dispatchedHistory: Array<DispatchedRecord>;
  }
  ```
- **Replacement Hook:** Replace or extend `LeafIntakeEngine` in `projects/leaf-intake/js/leaf-intake-engine.js` with your validated PLC ladder/ST backend. The UI interacts solely through `getSnapshot()`, `acceptLot()`, `rejectLot()`, `setBufferClear()`, `startTransfer()`, and `jogTransfer()`.

## Open Issues & Recommended Next Task
- None blocking. Advance queue to **Row 2**: `subproject/02-green-tea-processing` (`projects/green-tea-sequence/`).
