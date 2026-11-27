# Advance Work Plan — Packing & Reject (Project 07 / Order 5)

## Lead Department & Work Groups
- **Lead:** Dept 1 Production Engineering
- **Contributors:** Dept 4 Quality & Traceability, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/07-packing-and-dispatch`
- **Source Path:** `projects/packing-and-reject/`
- **Demo Route:** `demos/packing-and-reject/` (served at `/demos/packing-and-reject/index.html`)

## Requirements & Scope
1. **Packaging Formats & Tolerances:**
   - 50 g Retail Bottle: Target 50.0 g, tolerance ±1.5 g (48.5–51.5 g).
   - 100 g Retail Bottle: Target 100.0 g, tolerance ±2.0 g (98.0–102.0 g).
   - 25 kg Bulk Bag: Target 25,000 g, tolerance ±100 g (24.90–25.10 kg).
2. **Two-Stage Dosing Simulation:**
   - Coarse Dosing: Rapid auger/vibratory feed up to ~85% of target weight.
   - Fine Dosing: Precision trickle feed to target weight.
3. **Checkweighing & Reject Lane Interlock:**
   - Precision checkweigher load-cell (`AI_CHECKWEIGHER_WEIGHT`, `%IW80`).
   - Rejection Gate: When container weight is below lower tolerance limit (underfill) or above upper limit (overfill):
     - Pneumatic pusher actuator (`DO_REJECT_PUSHER`, `%Q4.1`) energizes to divert defective pack to Reject Lane.
     - Defective container is marked `REJECTED_UNDERFILL` or `REJECTED_OVERFILL`.
     - Preserves source lot identity (`F-G01`, `F-O01`), container serial number, and exact measured weight.
     - Strictly prevented from entering dispatch manifest or warehouse shipping pallet.
4. **Dispatch Channel Allocation:**
   - Retail packs enter retail channel; bulk bags enter auction channel.
   - Enforce single dispatch: Each valid unit can only be dispatched once.
   - Mass ledger balance: Issued batch mass = Dispatched net mass + Rejected net mass + Hopper residual.
5. **Scenarios:**
   - **Nominal Retail 50 g:** Coarse + Fine dosing -> 50.1 g -> Pass checkweigher -> Dispatched to retail carton.
   - **Nominal Retail 100 g:** Coarse + Fine dosing -> 100.2 g -> Pass checkweigher -> Dispatched to retail carton.
   - **Nominal Bulk 25 kg:** Coarse + Fine dosing -> 25.02 kg -> Pass checkweigher -> Dispatched to auction pallet.
   - **Underfill Reject Fault:** Injected short-fill (e.g. 42.5 g in 50 g bottle) -> Checkweigher triggers reject pusher -> Diverted to reject lane -> Dispatch blocked.
   - **Reset:** Full deterministic restoration.
6. **Exports:**
   - Export pack event ledger, weight inspection readings, and reject log as CSV and JSON.

## Permitted Paths
- `projects/packing-and-reject/**`
- `demos/packing-and-reject/**`

## Proposed Engine Contract for Codex
- **State Model:**
  ```typescript
  interface PackingEngineState {
    activePack: {
      packId: string;
      sourceLotId: string;
      format: 'RETAIL_50G' | 'RETAIL_100G' | 'BULK_25KG';
      targetNetG: number;
      actualNetG: number;
      dosingState: 'EMPTY' | 'COARSE_DOSING' | 'FINE_DOSING' | 'DOSING_COMPLETE';
      checkweighStatus: 'PENDING' | 'PASSED' | 'REJECTED_UNDERFILL' | 'REJECTED_OVERFILL';
      dispatchStatus: 'NOT_DISPATCHED' | 'DISPATCHED' | 'REJECTED_QUARANTINE';
    };
    massLedger: {
      totalDosedG: number;
      totalDispatchedG: number;
      totalRejectedG: number;
      packCountDispatched: number;
      packCountRejected: number;
    };
    dispatchedPacks: Array<PackRecord>;
    rejectedPacks: Array<RejectRecord>;
  }
  ```
- **Replacement Point:** `projects/packing-and-reject/js/packing-engine.js`.
