# Handoff to Codex — Leaf Intake & Buffer Interlock (Project 01)

## 1. Status & Subproject Metadata
- **Status:** `READY FOR CODEX RE-REVIEW`
- **Subproject ID:** Project 01 (Demo 01)
- **Lead Department:** Dept 4 Quality & Traceability (in coordination with Dept 1 Production Engineering & Dept 3 Controls)
- **Git Branch:** `subproject/01-leaf-intake`
- **Assigned Directories:**
  - Logic & Engine: `projects/leaf-intake/`
  - Interactive HMI Demo: `demos/leaf-intake/`
- **Tested Implementation Revision:** `7f18e1c6ae79bb7d0a2730303ba787265be72d82` (plus corrective commit on branch)
- **Shared Foundation Fix:** `7f18e1c6ae79bb7d0a2730303ba787265be72d82`

---

## 2. Review Findings Addressed in this Pass

| Review Finding ID | Description | Resolution & Evidence |
|:---|:---|:---|
| **R04 (P1)** | Completed intake lot could be delivered repeatedly via extra jogs | Implemented idempotent completion guard. Once `transferStatus === "COMPLETED"`, all subsequent `startTransfer()`, `jogTransfer()`, and `completeTransfer()` calls return `{ success: false, reason: "LOT_ALREADY_COMPLETED" }`. In UI, controls are disabled upon completion. Regression test 5 passes; browser replay verified: 5 jogs result in exactly 1 delivery in the ledger. |
| **R05 (P1)** | Editing measured weights preserved approval and bypassed validation | `setGrossWeight` and `setTareWeight` now revoke lot disposition to `PENDING` if modified post-acceptance and lock edits during transfer. Non-positive/non-finite weights fail boundary checks. `startTransfer()` re-validates weights immediately before motor energization. Negative tare (-100 kg) cannot dispatch material. Regression test 6 passes; browser replay verified. |
| **R22 (Mobile)** | Viewport overflowed at 390px (width 535px) | Added responsive styles, container bounds, and flexible layouts in `shared/css/base.css` and `demos/leaf-intake/style.css`. Browser verified via Edge CDP: `scrollWidth === 390px` at 390px width (0px horizontal overflow). |
| **R24 (Identity)** | Conflicting department mapping (was labeled Dept 1) | Realigned identity: Project 01 / Demo 01 belongs to **Dept 4 Quality & Traceability**, with Dept 1 Production and Dept 3 Controls contributing mechanical and interlock specifications. |
| **R03 (Launch)** | Standardized server launch instructions | Documented `python shared/serve.py 8080` with URL `http://localhost:8080/demos/leaf-intake/`. |

---

## 3. Verification Commands & Observed Results

### 3.1 Unit Test Execution
Command:
```bash
node --test projects/leaf-intake/tests/leaf-intake.test.js
```
Observed Output:
```text
TAP version 13
# Subtest: LeafIntakeEngine - Nominal scale computation and lot acceptance
ok 1 - LeafIntakeEngine - Nominal scale computation and lot acceptance
# Subtest: LeafIntakeEngine - Validation error on gross <= tare or negative tare
ok 2 - LeafIntakeEngine - Validation error on gross <= tare or negative tare
# Subtest: LeafIntakeEngine - Downstream buffer interlock drop and recovery
ok 3 - LeafIntakeEngine - Downstream buffer interlock drop and recovery
# Subtest: LeafIntakeEngine - Quality rejection diverted to quarantine
ok 4 - LeafIntakeEngine - Quality rejection diverted to quarantine
# Subtest: LeafIntakeEngine - Regression R04: Completed transfer is idempotent, additional jogs do not duplicate deliveries
ok 5 - LeafIntakeEngine - Regression R04: Completed transfer is idempotent, additional jogs do not duplicate deliveries
# Subtest: LeafIntakeEngine - Regression R05: Weight mutation after acceptance invalidates approval and negative tare is blocked
ok 6 - LeafIntakeEngine - Regression R05: Weight mutation after acceptance invalidates approval and negative tare is blocked
1..6
# tests 6
# suites 0
# pass 6
# fail 0
```

### 3.2 Browser & Mobile Viewport Verification
- **Command:** Launch `python shared/serve.py 8080` and open `http://localhost:8080/demos/leaf-intake/`.
- **Desktop (1440x1000):** Viewport width 1416px, scrollWidth 1401px (fits without horizontal document scroll).
- **Mobile (390x844):** Viewport width 390px, scrollWidth 390px (fits without horizontal document scroll).
- **Interactive Browser Replay:**
  - 5-jog repeat dispatch test: Dispatched history strictly retains 1 row (`120.00 kg`), Jog button disabled.
  - Negative tare injection test: `-100 kg` tare triggers validation error banner, approval revoked, transfer inhibited.
- **Unrun Checks:** Native Siemens TIA Portal hardware load cell bus coupling (`%IW64`/`%IW66`) remains emulated.

---

## 4. Interface Contract & State Schema
- **Module:** `projects/leaf-intake/js/leaf-intake-engine.js`
- **Class:** `LeafIntakeEngine`
- **State Schema:**
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
      transferStatus: 'IDLE' | 'READY' | 'IN_TRANSIT' | 'BLOCKED' | 'COMPLETED' | 'QUARANTINED';
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
    dispatchedHistory: Array<{
      timestamp: string;
      vendorId: string;
      lotId: string;
      teaType: string;
      grossKg: number;
      tareKg: number;
      netKg: number;
      disposition: string;
      destination: string;
      status: 'DELIVERED';
    }>;
  }
  ```
- **Deferred Work:** Physical Modbus TCP / Profinet fieldbus gateway integration.
