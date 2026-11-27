"""
Discrete-Event Simulation (DES) engine for PanchaRupa Virtual Tea Factory.

Models Panchagarh's seasonal harvest curve (monsoon peak, Nov-Dec taper,
and Jan-Feb winter dormancy at 0 kg/day fresh leaf), batch processing
through withering, rolling, fluidized-bed drying, and packaging, finished-goods
winter buffer management, and daily working-capital cash flow.

Uses ``simpy`` when installed, and falls back to an API-compatible pure-Python
``heapq`` discrete-event engine when ``simpy`` is unavailable.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from datetime import datetime, timezone
import heapq
import math
import random
from typing import Any, Callable, Dict, Generator, List, Optional, Tuple

try:
    import simpy  # type: ignore

    HAS_SIMPY = True
except ImportError:
    simpy = None  # type: ignore
    HAS_SIMPY = False


# ---------------------------------------------------------------------------
# Pure-Python Event-Heap Fallback (SimPy-compatible subset)
# ---------------------------------------------------------------------------

class _FallbackEvent:
    """Lightweight event scheduled on ``_FallbackEnvironment``."""

    def __init__(self, env: "_FallbackEnvironment") -> None:
        self.env = env
        self.callbacks: List[Callable[["_FallbackEvent"], None]] = []
        self.triggered = False
        self.value: Any = None

    def trigger(self, value: Any = None) -> None:
        if self.triggered:
            return
        self.triggered = True
        self.value = value
        for cb in self.callbacks:
            cb(self)
        self.callbacks.clear()


class _FallbackProcess(_FallbackEvent):
    """Generator-driven process scheduled on ``_FallbackEnvironment``."""

    def __init__(self, env: "_FallbackEnvironment", generator: Generator[Any, Any, Any]) -> None:
        super().__init__(env)
        self._gen = generator
        self.env._schedule(0.0, self._step, None)

    def _step(self, value: Any) -> None:
        try:
            yielded = self._gen.send(value)
        except StopIteration as exc:
            self.trigger(exc.value)
            return

        if isinstance(yielded, _FallbackEvent):
            if yielded.triggered:
                self.env._schedule(0.0, self._step, yielded.value)
            else:
                yielded.callbacks.append(lambda ev: self.env._schedule(0.0, self._step, ev.value))
        else:
            self.env._schedule(0.0, self._step, yielded)


class _FallbackResourceRequest(_FallbackEvent):
    """Request token for ``_FallbackResource``."""

    def __init__(self, resource: "_FallbackResource") -> None:
        super().__init__(resource.env)
        self.resource = resource

    def __enter__(self) -> "_FallbackResourceRequest":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.resource.release(self)


class _FallbackResource:
    """FIFO mutual-exclusion resource matching ``simpy.Resource``."""

    def __init__(self, env: "_FallbackEnvironment", capacity: int = 1) -> None:
        self.env = env
        self.capacity = capacity
        self.count = 0
        self.queue: List[_FallbackResourceRequest] = []

    def request(self) -> _FallbackResourceRequest:
        req = _FallbackResourceRequest(self)
        if self.count < self.capacity:
            self.count += 1
            req.trigger(req)
        else:
            self.queue.append(req)
        return req

    def release(self, req: _FallbackResourceRequest) -> None:
        if req in self.queue:
            self.queue.remove(req)
            return
        if self.count > 0:
            self.count -= 1
        while self.queue and self.count < self.capacity:
            next_req = self.queue.pop(0)
            self.count += 1
            next_req.trigger(next_req)


class _FallbackEnvironment:
    """Pure-Python heapq discrete-event environment."""

    def __init__(self, initial_time: float = 0.0) -> None:
        self.now: float = float(initial_time)
        self._queue: List[Tuple[float, int, Callable[[Any], None], Any]] = []
        self._seq = 0

    def _schedule(self, delay: float, callback: Callable[[Any], None], value: Any = None) -> None:
        self._seq += 1
        heapq.heappush(self._queue, (self.now + max(0.0, delay), self._seq, callback, value))

    def timeout(self, delay: float, value: Any = None) -> _FallbackEvent:
        ev = _FallbackEvent(self)
        self._schedule(delay, ev.trigger, value)
        return ev

    def process(self, generator: Generator[Any, Any, Any]) -> _FallbackProcess:
        return _FallbackProcess(self, generator)

    def run(self, until: Optional[float] = None) -> None:
        while self._queue:
            t, _, cb, val = self._queue[0]
            if until is not None and t > until:
                self.now = float(until)
                break
            heapq.heappop(self._queue)
            self.now = t
            cb(val)
        if until is not None and self.now < until:
            self.now = float(until)


def create_environment() -> Any:
    """Return a ``simpy.Environment`` if available, else ``_FallbackEnvironment``."""
    if HAS_SIMPY:
        return simpy.Environment()
    return _FallbackEnvironment()


def create_resource(env: Any, capacity: int = 1) -> Any:
    """Return a ``simpy.Resource`` if available, else ``_FallbackResource``."""
    if HAS_SIMPY:
        return simpy.Resource(env, capacity=capacity)
    return _FallbackResource(env, capacity=capacity)


# ---------------------------------------------------------------------------
# Calendar & Default Configuration (sim/INTERFACE.md)
# ---------------------------------------------------------------------------

DAYS_IN_MONTH: Tuple[int, ...] = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
# Jan=0, Feb=1 (0 kg/day dormancy); Mar-Apr shoulder; May-Aug monsoon peak;
# Sep-Oct shoulder; Nov-Dec taper before winter dormancy.
DEFAULT_MONTHLY_FRESH_LEAF_KG: List[float] = [
    0.0,     # Jan: Winter dormancy (0 kg/day)
    0.0,     # Feb: Winter dormancy (0 kg/day)
    2480.0,  # Mar: Early shoulder (~80 kg/day)
    3600.0,  # Apr: Spring shoulder (~120 kg/day)
    6200.0,  # May: Monsoon surge (~200 kg/day)
    7200.0,  # Jun: Monsoon peak (~240 kg/day)
    7440.0,  # Jul: Monsoon peak (~240 kg/day)
    6820.0,  # Aug: Late monsoon (~220 kg/day)
    4200.0,  # Sep: Autumn shoulder (~140 kg/day)
    3100.0,  # Oct: Pre-winter shoulder (~100 kg/day)
    600.0,   # Nov: Post-monsoon taper (~20 kg/day)
    155.0,   # Dec: Late taper (~5 kg/day)
]

DORMANCY_MONTHS = {0, 1}        # Jan, Feb: strictly 0 kg/day fresh leaf intake
WINTER_WINDOW_MONTHS = {10, 11, 0, 1}  # Nov 1 - Feb 28 winter resilience window


def day_to_month(day: int) -> int:
    """Map 0-indexed day of year (wrapping every 365 days) to month 0..11."""
    d = day % 365
    acc = 0
    for m_idx, m_days in enumerate(DAYS_IN_MONTH):
        acc += m_days
        if d < acc:
            return m_idx
    return 11


def default_config(experiment_id: str = "EXP-EUROSIM-2027-BENCHMARK") -> Dict[str, Any]:
    """Return a deep copy of the default simulation configuration matching INTERFACE.md."""
    return {
        "experimentId": experiment_id,
        "randomSeed": 42,
        "replicationCount": 1000,
        "simulationHorizonDays": 365,
        "seasonalHarvestProfile": {
            "monthlyFreshLeafKg": list(DEFAULT_MONTHLY_FRESH_LEAF_KG),
            "dailyArrivalVariancePct": 0.15,
            "outturnDryRatio": 0.25,
        },
        "staffingPolicy": {
            "mode": "fixed",  # "fixed" or "seasonal"
            "regularHeadcount": 4,
            "seasonalContractors": 2,
            "baseShiftRateBdt": 650.0,
            "shiftMealAllowanceBdt": 120.0,
            "overtimeMultiplier": 2.0,
            "winterStaffRetentionPct": 1.0,
        },
        "inventoryPolicy": {
            "mode": "buffer",  # "standard" or "buffer"
            "preWinterBufferTargetKg": 400.0,
            "safetyStockKg": 50.0,
            "reorderPointKg": 100.0,
        },
        "financialParameters": {
            "initialWorkingCapitalBdt": 500000.0,
            "monthlyFixedOverheadBdt": 65000.0,
            "greenLeafCostBdtPerKg": 38.0,
            "averageSellingPriceBdtPerKg": 260.0,
            "energyCostPerBatchBdt": 120.0,
        },
    }


def _merge_config(overrides: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    cfg = default_config()
    if not overrides:
        return cfg
    for key, val in overrides.items():
        if isinstance(val, dict) and isinstance(cfg.get(key), dict):
            cfg[key].update(val)
        else:
            cfg[key] = copy.deepcopy(val)
    return cfg


# ---------------------------------------------------------------------------
# Factory Simulation Engine
# ---------------------------------------------------------------------------

@dataclass
class _SimState:
    fresh_leaf_intake_kg: float = 0.0
    processed_fresh_leaf_kg: float = 0.0
    finished_tea_produced_kg: float = 0.0
    finished_goods_kg: float = 0.0
    initial_finished_goods_kg: float = 0.0
    total_orders_demanded_kg: float = 0.0
    total_orders_fulfilled_kg: float = 0.0
    winter_orders_demanded_kg: float = 0.0
    winter_orders_fulfilled_kg: float = 0.0
    winter_stockout_days: int = 0
    cash_bdt: float = 500000.0
    min_winter_cash_bdt: float = 500000.0
    working_capital_deficit: bool = False
    dryer_busy_hours: float = 0.0
    peak_flush_max_wait_hours: float = 0.0
    total_overtime_hours: float = 0.0
    total_idle_hours: float = 0.0
    total_meal_allowances_bdt: float = 0.0
    total_operating_cost_bdt: float = 0.0
    daily_fresh_leaf_log: List[float] = field(default_factory=list)
    daily_cash_log: List[float] = field(default_factory=list)
    daily_inventory_log: List[float] = field(default_factory=list)


class TeaFactoryDES:
    """Discrete-event simulation of PanchaRupa Virtual Tea Factory."""

    BATCH_SIZE_KG = 40.0
    WITHERING_HOURS = 2.0
    ROLLING_HOURS = 35.0 / 60.0
    DRYING_HOURS = 1.0
    PACKAGING_HOURS = 0.25
    WORKER_HOURS_PER_BATCH = 2.5

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        self.config = _merge_config(config)

    def _active_headcount(self, month: int) -> int:
        sp = self.config["staffingPolicy"]
        regular = int(sp["regularHeadcount"])
        contractors = int(sp.get("seasonalContractors", 0))
        mode = sp.get("mode", "fixed")
        retention = float(sp.get("winterStaffRetentionPct", 1.0))

        if mode == "seasonal":
            if month in WINTER_WINDOW_MONTHS:
                # Release seasonal contractors; optionally retain subset of regular staff
                return max(1, int(round(regular * retention)))
            if month in {4, 5, 6, 7, 8, 9}:  # May-Oct peak + late shoulder
                return regular + contractors
            return regular  # Mar-Apr early shoulder
        # Fixed staffing: full headcount retained year-round
        return regular + contractors

    def _daily_demand_kg(self, month: int, rng: random.Random) -> float:
        # Realistic demand: ~24-30 kg/day active season, ~8-12 kg/day winter dormancy
        base = 10.0 if month in WINTER_WINDOW_MONTHS else 26.0
        jitter = rng.gauss(0.0, 0.12 * base)
        return max(0.0, base + jitter)

    def _daily_fresh_leaf_kg(self, month: int, rng: random.Random) -> float:
        harvest = self.config["seasonalHarvestProfile"]
        monthly_arr = harvest["monthlyFreshLeafKg"]
        # Enforce strict 0 kg/day during Jan-Feb dormancy months
        if month in DORMANCY_MONTHS:
            return 0.0
        monthly_kg = float(monthly_arr[month])
        if monthly_kg <= 0.0:
            return 0.0
        mean_daily = monthly_kg / DAYS_IN_MONTH[month]
        cv = float(harvest.get("dailyArrivalVariancePct", 0.15))
        sample = rng.gauss(mean_daily, mean_daily * cv)
        return max(0.0, sample)

    def run(self, seed: Optional[int] = None, include_traces: bool = False) -> Dict[str, Any]:
        """Execute one full simulation horizon and return INTERFACE.md KPI schema."""
        run_seed = int(self.config["randomSeed"] if seed is None else seed)
        rng = random.Random(run_seed)

        horizon_days = int(self.config["simulationHorizonDays"])
        harvest = self.config["seasonalHarvestProfile"]
        outturn = float(harvest["outturnDryRatio"])
        sp = self.config["staffingPolicy"]
        ip = self.config["inventoryPolicy"]
        fp = self.config["financialParameters"]

        initial_cash = float(fp["initialWorkingCapitalBdt"])
        daily_fixed_overhead = float(fp["monthlyFixedOverheadBdt"]) / (365.0 / 12.0)
        green_leaf_cost = float(fp["greenLeafCostBdtPerKg"])
        selling_price = float(fp["averageSellingPriceBdtPerKg"])
        energy_per_batch = float(fp.get("energyCostPerBatchBdt", 120.0))

        base_shift_rate = float(sp["baseShiftRateBdt"])
        hourly_rate = base_shift_rate / 8.0
        meal_allowance = float(sp["shiftMealAllowanceBdt"])
        ot_mult = float(sp.get("overtimeMultiplier", 2.0))

        buffer_target = float(ip["preWinterBufferTargetKg"])
        safety_stock = float(ip.get("safetyStockKg", 50.0))
        inv_mode = ip.get("mode", "buffer" if buffer_target > safety_stock else "standard")

        state = _SimState(
            cash_bdt=initial_cash,
            min_winter_cash_bdt=initial_cash,
        )

        env = create_environment()
        trough = create_resource(env, capacity=5)     # 5 * 40 kg = 200 kg trough
        roller = create_resource(env, capacity=1)     # Rolling table mutual exclusion
        dryer = create_resource(env, capacity=1)      # Fluidized bed dryer (40 kg batch)
        packager = create_resource(env, capacity=1)   # Grading & packaging cell

        def process_batch(
            batch_fresh_kg: float,
            month: int,
            arrival_time: float,
            wither_h: float,
            roll_h: float,
            dry_h: float,
            pack_h: float,
            downtime_h: float,
        ) -> Generator[Any, Any, None]:
            req_t = trough.request()
            yield req_t
            yield env.timeout(wither_h)
            trough.release(req_t)

            req_r = roller.request()
            yield req_r
            yield env.timeout(roll_h)
            roller.release(req_r)

            req_d = dryer.request()
            yield req_d
            wait_hours = max(0.0, env.now - arrival_time - wither_h - roll_h)
            if month in {4, 5, 6, 7} and wait_hours > state.peak_flush_max_wait_hours:
                state.peak_flush_max_wait_hours = wait_hours
            yield env.timeout(dry_h + downtime_h)
            state.dryer_busy_hours += dry_h
            dryer.release(req_d)

            req_p = packager.request()
            yield req_p
            yield env.timeout(pack_h)
            packager.release(req_p)

            dry_kg = batch_fresh_kg * outturn
            state.processed_fresh_leaf_kg += batch_fresh_kg
            state.finished_tea_produced_kg += dry_kg
            state.finished_goods_kg += dry_kg

        def daily_controller() -> Generator[Any, Any, None]:
            for day in range(horizon_days):
                month = day_to_month(day)
                in_winter = month in WINTER_WINDOW_MONTHS

                # 1. Fresh leaf arrival & batch scheduling
                fresh_kg = self._daily_fresh_leaf_kg(month, rng)
                state.fresh_leaf_intake_kg += fresh_kg
                if include_traces:
                    state.daily_fresh_leaf_log.append(fresh_kg)

                batches_today = 0
                required_hours = 0.0
                remaining = fresh_kg
                while remaining > 1e-9:
                    b_kg = min(self.BATCH_SIZE_KG, remaining)
                    remaining -= b_kg
                    batches_today += 1
                    wither_h = max(0.5, rng.gauss(self.WITHERING_HOURS, 0.15 * self.WITHERING_HOURS))
                    roll_h = max(0.2, rng.gauss(self.ROLLING_HOURS, 0.12 * self.ROLLING_HOURS))
                    dry_h = max(0.3, rng.gauss(self.DRYING_HOURS, 0.10 * self.DRYING_HOURS))
                    pack_h = max(0.05, rng.gauss(self.PACKAGING_HOURS, 0.10 * self.PACKAGING_HOURS))
                    downtime_h = (
                        min(3.0, rng.expovariate(1.0 / 0.75))
                        if rng.random() < 0.04
                        else 0.0
                    )
                    worker_h = max(1.0, rng.gauss(self.WORKER_HOURS_PER_BATCH, 0.18 * self.WORKER_HOURS_PER_BATCH))
                    required_hours += worker_h + 0.5 * downtime_h
                    env.process(
                        process_batch(
                            b_kg,
                            month,
                            env.now,
                            wither_h,
                            roll_h,
                            dry_h,
                            pack_h,
                            downtime_h,
                        )
                    )

                # Advance 24 hours so today's batches complete into warehouse
                yield env.timeout(24.0)

                # 2. Customer order outflow & pre-winter buffer protection
                demand_kg = self._daily_demand_kg(month, rng)
                state.total_orders_demanded_kg += demand_kg

                if not in_winter and inv_mode == "buffer" and buffer_target > 0.0:
                    # Reserve inventory above safety stock to hit buffer_target by Oct 31
                    # Glidepath rises linearly from Sep 1 (day 243) to Oct 31 (day 304)
                    day_in_year = day % 365
                    if day_in_year >= 212:  # Aug-Oct buffer build window
                        progress = min(1.0, (day_in_year - 212) / 92.0)
                        reserved = max(safety_stock, buffer_target * progress)
                    else:
                        reserved = safety_stock
                    available_for_sale = max(0.0, state.finished_goods_kg - reserved)
                else:
                    available_for_sale = state.finished_goods_kg

                fulfilled_kg = min(demand_kg, available_for_sale)
                state.finished_goods_kg -= fulfilled_kg
                state.total_orders_fulfilled_kg += fulfilled_kg

                if in_winter:
                    state.winter_orders_demanded_kg += demand_kg
                    state.winter_orders_fulfilled_kg += fulfilled_kg
                    if demand_kg > 0.0 and fulfilled_kg < demand_kg - 1e-6:
                        state.winter_stockout_days += 1

                # 3. Labor, Payroll & Energy
                headcount = self._active_headcount(month)
                regular_hours = headcount * 8.0
                overtime_hours = max(0.0, required_hours - regular_hours)
                idle_hours = max(0.0, regular_hours - required_hours)

                state.total_overtime_hours += overtime_hours
                state.total_idle_hours += idle_hours

                payroll_cost = headcount * base_shift_rate + overtime_hours * hourly_rate * ot_mult
                meal_cost = headcount * meal_allowance
                state.total_meal_allowances_bdt += meal_cost

                leaf_cost = fresh_kg * green_leaf_cost
                energy_cost = batches_today * energy_per_batch
                day_cost = daily_fixed_overhead + payroll_cost + meal_cost + leaf_cost + energy_cost
                state.total_operating_cost_bdt += day_cost

                # 4. Working capital cash update
                revenue = fulfilled_kg * selling_price
                state.cash_bdt += revenue - day_cost
                if state.cash_bdt < 0.0:
                    state.working_capital_deficit = True
                if in_winter and state.cash_bdt < state.min_winter_cash_bdt:
                    state.min_winter_cash_bdt = state.cash_bdt

                if include_traces:
                    state.daily_cash_log.append(state.cash_bdt)
                    state.daily_inventory_log.append(state.finished_goods_kg)

        env.process(daily_controller())
        env.run(until=horizon_days * 24.0 + 1e-6)

        # Compute KPIs matching sim/INTERFACE.md Section 4
        available_dryer_hours = horizon_days * 8.0
        dryer_util_pct = min(100.0, (state.dryer_busy_hours / available_dryer_hours) * 100.0) if available_dryer_hours > 0 else 0.0
        winter_fulfillment_pct = (
            (state.winter_orders_fulfilled_kg / state.winter_orders_demanded_kg) * 100.0
            if state.winter_orders_demanded_kg > 0.0
            else 100.0
        )
        absorption_cost = (
            state.total_operating_cost_bdt / state.finished_tea_produced_kg
            if state.finished_tea_produced_kg > 0.0
            else 0.0
        )

        result: Dict[str, Any] = {
            "runSummary": {
                "experimentId": str(self.config["experimentId"]),
                "completedAt": datetime.now(timezone.utc).isoformat(),
                "totalSimulatedDays": horizon_days,
            },
            "operationalKpis": {
                "annualFreshLeafProcessedKg": round(state.processed_fresh_leaf_kg, 6),
                "annualFinishedTeaProducedKg": round(state.finished_tea_produced_kg, 6),
                "averageDryerUtilizationPct": round(dryer_util_pct, 4),
                "peakFlushQueueWaitHours": round(state.peak_flush_max_wait_hours, 4),
            },
            "winterDormancyResilience": {
                "winterStockoutDays": int(state.winter_stockout_days),
                "winterOrderFulfillmentPct": round(winter_fulfillment_pct, 4),
                "minimumWinterCashBalanceBdt": round(state.min_winter_cash_bdt, 2),
                "workingCapitalDeficitOccurred": bool(state.working_capital_deficit),
            },
            "laborAndCostingKpis": {
                "totalOvertimeHoursPaid": round(state.total_overtime_hours, 4),
                "totalWorkerIdleHours": round(state.total_idle_hours, 4),
                "averageAbsorptionCostBdtPerKg": round(absorption_cost, 2),
                "totalMealAllowancesPaidBdt": round(state.total_meal_allowances_bdt, 2),
            },
        }

        if include_traces:
            result["_diagnostics"] = {
                "freshLeafIntakeKg": state.fresh_leaf_intake_kg,
                "processedFreshLeafKg": state.processed_fresh_leaf_kg,
                "initialFinishedGoodsKg": state.initial_finished_goods_kg,
                "finalFinishedGoodsKg": state.finished_goods_kg,
                "totalOrdersFulfilledKg": state.total_orders_fulfilled_kg,
                "finalCashBdt": state.cash_bdt,
                "dailyFreshLeafLog": state.daily_fresh_leaf_log,
                "dailyCashLog": state.daily_cash_log,
                "dailyInventoryLog": state.daily_inventory_log,
                "usedSimpy": HAS_SIMPY,
            }

        return result


def run_simulation(config: Optional[Dict[str, Any]] = None, seed: Optional[int] = None, include_traces: bool = False) -> Dict[str, Any]:
    """Convenience wrapper to instantiate ``TeaFactoryDES`` and run one replication."""
    return TeaFactoryDES(config).run(seed=seed, include_traces=include_traces)
