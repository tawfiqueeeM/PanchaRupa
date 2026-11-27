# Advance Work Plan — Grading & Routing (Project 06 / Order 7)

## Lead Department & Work Groups
- **Lead:** Dept 4 Quality & Traceability
- **Contributors:** Dept 1 Production Engineering, Dept 5 HMI & Simulation, Dept 6 Testing & Portfolio
- **Git Branch:** `subproject/06-grading-and-routing`
- **Source Path:** `projects/grading-and-routing/`
- **Demo Route:** `demos/grading-and-routing/` (served at `/demos/grading-and-routing/index.html`)

## Requirements & Scope
1. **Quality Inspection & Grading:**
   - Finished dried lot inspection (`F-G01`, `F-O01`).
   - Grade assignment: Grade A (Premium Whole Leaf), Grade B (Standard Broken), Grade C (Fannings/Dust).
   - Disposition gate: `RELEASED` (permits routing), `ON_HOLD` (routing locked), `REJECTED` (quarantined).
   - Mandatory decision reasons: `MOISTURE_VERIFIED`, `EXCELLENT_LIQUOR`, `SAMPLE_PENDING_LAB`, `OFF_ODOR`.
2. **Material Routing & Bin Capacity Interlock:**
   - Route only released material. Unreleased or held lots trigger routing lock (`ROUTE_INHIBITED_HELD`).
   - Destination bins: Bin 1 (Grade A, 50 kg max), Bin 2 (Grade B, 50 kg max), Bin 3 (Grade C, 30 kg max).
   - Full Bin Interlock: If destination bin is full (`DI_BIN_FULL = TRUE`) or locked:
     - Conveyor drive drops immediately (`DO_ROUTING_CONVEYOR = FALSE`).
     - Upstream surge hopper retains source lot ID and mass without duplication or loss.
     - After acknowledgement, rerouting or bin clearing restores transfer.
3. **Upstream-to-Downstream Lot Genealogy:**
   - Display full traceable lineage: Vendor Delivery (V-01, L-G01) → Processing Batch (B-G01) → Finished Lot (F-G01) → Grade & Disposition → Destination Storage Bin.
   - Quantity conservation: Mass strictly preserved across all states.
4. **Scenarios:**
   - **Nominal Inspection & Release:** Lot F-G01 inspected, Grade A assigned, Released, routed cleanly to Bin 1.
   - **Quality Hold Gate:** Lot F-G01 placed on Hold; routing attempt blocked; releasing restores permissive.
   - **Destination Bin Full Fault:** Bin 1 reaches capacity during routing; conveyor trips; lot retained in surge hopper; acknowledged and rerouted.
   - **Reset:** Full deterministic restoration.
5. **Exports:**
   - Export lot genealogy audit tree and routing ledger as CSV and JSON.

## Permitted Paths
- `projects/grading-and-routing/**`
- `demos/grading-and-routing/**`

## Proposed Engine Contract for Codex
- **State Model:**
  ```typescript
  interface GradingAndRoutingState {
    activeLot: {
      finishedLotId: string;
      batchId: string;
      vendorLotId: string;
      productType: 'GREEN' | 'GOLDEN';
      netMassKg: number;
      moisturePercent: number;
      grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
      disposition: 'PENDING' | 'RELEASED' | 'ON_HOLD' | 'REJECTED';
      decisionReason: string | null;
      routingState: 'IDLE' | 'ROUTING' | 'ROUTED' | 'BLOCKED_FULL_BIN' | 'HOLD_LOCKED';
      targetBinId: string;
    };
    bins: Array<{
      binId: string;
      name: string;
      assignedGrade: string;
      capacityKg: number;
      currentOccupancyKg: number;
      isFull: boolean;
      isLocked: boolean;
    }>;
    genealogyLedger: Array<GenealogyRecord>;
  }
  ```
- **Replacement Point:** `projects/grading-and-routing/js/grading-engine.js`.
