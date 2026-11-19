# Department Work Note — Integrated Factory Capstone (Dept 5 with All Departments)

## 1. Department Overview
- **Subproject:** 20 / Row 20 (Capstone) — Integrated Factory
- **Lead Department:** Dept 5 (HMI & Simulation) in coordination with Depts 1–7
- **Git Branch:** `subproject/14-integrated-factory`
- **Scope:** Multi-station capstone simulation comparing five factory evolutionary configurations under identical demand, strict separation of founder-reported benchmarks from modeled simulation dynamics, bottleneck progression tracking, and comprehensive portfolio navigation across all 20 verified subprojects.

## 2. Implemented Capabilities
1. **Five Factory Configurations Evolutionary Engine:**
   - Evaluates Configurations 1 through 5:
     1. `Manual Cottage Operation`: 120 kg/mo cap, 4.2 worker-hrs/kg, hand rolling bottleneck.
     2. `Heated Drum Mechanization`: 250 kg/mo cap, 2.8 worker-hrs/kg, hand rolling bottleneck.
     3. `Automated Final Drying`: 450 kg/mo cap, 1.9 worker-hrs/kg, hand rolling bottleneck.
     4. `Mechanized Rolling & Drying`: 750 kg/mo cap, 1.1 worker-hrs/kg, dryer queue bottleneck.
     5. `Proposed Coordinated Modern Factory`: 1,200 kg/mo cap, 0.42 worker-hrs/kg, BDT 181.63/kg target unit cost, coordinated line balance.
2. **Founder-Reported vs Simulated Output Segregation:**
   - Historical 100 kg/month pilot benchmark and 1,000 kg/month active month design capacity are explicitly flagged with `FOUNDER-REPORTED BENCHMARK` badges.
   - Dynamic simulation evaluates station feasibility, unfulfilled demand, labor hours, SEC (kWh/kg), and total costs without hardcoded constants.
3. **Bottleneck Migration Analytics:**
   - Accurately traces bottleneck shifts: Hand rolling fatigue in Configs 1–3 ➔ Thermal queue congestion at the continuous dryer in Config 4 ➔ Coordinated schedule balance across shared machines in Config 5.
4. **Portfolio-Wide Navigation & Integration Architecture:**
   - Unified directory cataloging all 20 subproject modules, their lead departments, routes, and git branches.
   - Integration status documented with explicit boundary contracts.
5. **Interactive Capstone HMI & Real-time Exports:**
   - Live browser portal at `/demos/virtual-factory/`.
   - Dynamic workload replayer, equipment inspector, comparative matrix, and CSV/JSON data download.
