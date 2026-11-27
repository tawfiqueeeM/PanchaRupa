# Packing & Reject Weighing Logic & I/O Specifications

## 1. Dosing & Checkweighing I/O Mapping

| Tag Name | Address | Type | Engineering Range | Description |
|---|---|---|---|---|
| `AI_CHECKWEIGHER_WEIGHT` | `%IW80` | `INT` | 0–30,000 (0.1g res, 0–3,000.0g) | Precision dynamic checkweigher cell |
| `DI_PACK_AT_WEIGH_INSPECTION` | `%I4.0` | `BOOL` | TRUE = In Position | Optical proximity switch at checkweigher deck |
| `DO_COARSE_DOSING_FEEDER` | `%Q4.0` | `BOOL` | TRUE = High Speed | High-flow vibratory coarse feeder gate |
| `DO_FINE_DOSING_FEEDER` | `%Q4.1` | `BOOL` | TRUE = Trickle Speed | Low-flow vibratory fine trickle feeder gate |
| `DO_REJECT_PUSHER` | `%Q4.2` | `BOOL` | Pulse 300ms | Pneumatic cylinder reject arm diverting to reject bin |
| `DO_ACCEPT_CONVEYOR` | `%Q4.3` | `BOOL` | TRUE = Drive Active | Good product discharge conveyor to packing table |
| `DO_REJECT_ALARM_BEACON` | `%Q4.4` | `BOOL` | TRUE = Amber Strobe | Underfill / overfill reject indicator beacon |

---

## 2. Dynamic Weighing & Tolerance Logic

For format $F$ with nominal target $W_{\text{target}}$ and tolerance $\pm \Delta W$:
- **Pass Gate:**
  $$W_{\text{target}} - \Delta W \le W_{\text{actual}} \le W_{\text{target}} + \Delta W$$
  $\implies \text{Status} = \text{PASSED}$, `DO_ACCEPT_CONVEYOR = TRUE`, pack assigned to dispatch manifest.
- **Underfill Gate:**
  $$W_{\text{actual}} < W_{\text{target}} - \Delta W$$
  $\implies \text{Status} = \text{REJECTED\_UNDERFILL}$, `DO_REJECT_PUSHER = TRUE`, pack diverted to reject bin.
- **Overfill Gate:**
  $$W_{\text{actual}} > W_{\text{target}} + \Delta W$$
  $\implies \text{Status} = \text{REJECTED\_OVERFILL}$, `DO_REJECT_PUSHER = TRUE`, pack diverted to reject bin.

---

## 3. Strict Mass & Dispatch Interlock

- Defective containers cannot enter the dispatch manifest under any operator command.
- If an operator clicks "Dispatch" on a rejected pack, the PLC returns error `ERR_CANNOT_DISPATCH_REJECTED_PACK` and triggers `DO_REJECT_ALARM_BEACON`.
- Valid packs can be dispatched once and only once; second dispatch attempts return `ERR_ALREADY_DISPATCHED`.
- Every rejected pack preserves its original source lot ID (`F-G01` or `F-O01`) and measured net weight in the quality quarantine ledger for material reconciliation.
