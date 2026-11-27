"""
pytest-compatible verification suite for PanchaRupa Virtual Tea Factory DES.

Verifies:
1. Mass conservation (wet-to-dry outturn & finished-goods inventory balance).
2. Zero fresh leaf intake during Jan-Feb dormancy months (0 kg/day).
3. Deterministic seed reproducibility.
4. Exact KPI JSON schema compliance against ``sim/INTERFACE.md``.
5. Benchmark policy differentiation & paired-seed Monte Carlo execution.

Can be executed via ``pytest sim/test_sim.py`` or ``python sim/test_sim.py``.
"""

from __future__ import annotations

import math
from pathlib import Path
import sys

# Ensure sim/ is importable whether invoked from repo root or sim/
SIM_DIR = Path(__file__).resolve().parent
if str(SIM_DIR) not in sys.path:
    sys.path.insert(0, str(SIM_DIR))

from factory_des import DAYS_IN_MONTH, TeaFactoryDES, day_to_month, default_config  # noqa: E402
from policies import POLICY_SPECS, build_policy_config, run_paired_benchmark  # noqa: E402


def _assert_kpi_schema(kpi: dict) -> None:
    """Validate exact INTERFACE.md KPI JSON schema keys and value types."""
    assert set(kpi.keys()) >= {
        "runSummary",
        "operationalKpis",
        "winterDormancyResilience",
        "laborAndCostingKpis",
    }

    rs = kpi["runSummary"]
    assert isinstance(rs["experimentId"], str)
    assert isinstance(rs["completedAt"], str) and len(rs["completedAt"]) > 0
    assert isinstance(rs["totalSimulatedDays"], int)

    op = kpi["operationalKpis"]
    for key in (
        "annualFreshLeafProcessedKg",
        "annualFinishedTeaProducedKg",
        "averageDryerUtilizationPct",
        "peakFlushQueueWaitHours",
    ):
        assert key in op
        assert isinstance(op[key], (int, float))
        assert math.isfinite(op[key])
    assert 0.0 <= op["averageDryerUtilizationPct"] <= 100.0

    wr = kpi["winterDormancyResilience"]
    assert isinstance(wr["winterStockoutDays"], int)
    assert wr["winterStockoutDays"] >= 0
    assert isinstance(wr["winterOrderFulfillmentPct"], (int, float))
    assert 0.0 <= wr["winterOrderFulfillmentPct"] <= 100.0
    assert isinstance(wr["minimumWinterCashBalanceBdt"], (int, float))
    assert isinstance(wr["workingCapitalDeficitOccurred"], bool)

    lc = kpi["laborAndCostingKpis"]
    for key in (
        "totalOvertimeHoursPaid",
        "totalWorkerIdleHours",
        "averageAbsorptionCostBdtPerKg",
        "totalMealAllowancesPaidBdt",
    ):
        assert key in lc
        assert isinstance(lc[key], (int, float))
        assert lc[key] >= 0.0


def test_mass_conservation() -> None:
    """Verify wet-to-dry outturn and finished-goods inventory mass conservation."""
    cfg = default_config()
    outturn = cfg["seasonalHarvestProfile"]["outturnDryRatio"]
    res = TeaFactoryDES(cfg).run(seed=101, include_traces=True)
    diag = res["_diagnostics"]

    # 1. All fresh leaf intake is processed
    assert math.isclose(
        diag["freshLeafIntakeKg"],
        diag["processedFreshLeafKg"],
        rel_tol=1e-9,
        abs_tol=1e-6,
    )
    # 2. Wet-to-dry outturn conservation
    assert math.isclose(
        res["operationalKpis"]["annualFinishedTeaProducedKg"],
        diag["processedFreshLeafKg"] * outturn,
        rel_tol=1e-6,
        abs_tol=1e-5,
    )
    # 3. Finished goods warehouse conservation: I(0) + Produced == Fulfilled + I(T)
    lhs = diag["initialFinishedGoodsKg"] + res["operationalKpis"]["annualFinishedTeaProducedKg"]
    rhs = diag["totalOrdersFulfilledKg"] + diag["finalFinishedGoodsKg"]
    assert math.isclose(lhs, rhs, rel_tol=1e-6, abs_tol=1e-4)


def test_zero_fresh_leaf_jan_feb_dormancy() -> None:
    """Verify Jan-Feb dormancy has strictly 0 kg/day fresh leaf intake and Nov-Dec tapers."""
    res = TeaFactoryDES(default_config()).run(seed=7, include_traces=True)
    daily_leaf = res["_diagnostics"]["dailyFreshLeafLog"]
    assert len(daily_leaf) == 365

    jan_feb_days = DAYS_IN_MONTH[0] + DAYS_IN_MONTH[1]  # 31 + 28 = 59
    for d in range(jan_feb_days):
        assert day_to_month(d) in (0, 1)
        assert daily_leaf[d] == 0.0, f"Non-zero fresh leaf on dormancy day {d}: {daily_leaf[d]}"

    # Monsoon peak (May-Aug) must exceed Nov-Dec taper
    monsoon_total = sum(daily_leaf[d] for d in range(365) if day_to_month(d) in {4, 5, 6, 7})
    taper_total = sum(daily_leaf[d] for d in range(365) if day_to_month(d) in {10, 11})
    assert monsoon_total > taper_total > 0.0


def test_deterministic_seed_reproducibility() -> None:
    """Verify identical seeds yield identical KPIs and distinct seeds vary."""
    cfg = default_config()
    r1 = TeaFactoryDES(cfg).run(seed=2027)
    r2 = TeaFactoryDES(cfg).run(seed=2027)
    r3 = TeaFactoryDES(cfg).run(seed=2028)

    for section in ("operationalKpis", "winterDormancyResilience", "laborAndCostingKpis"):
        assert r1[section] == r2[section], f"Mismatch in {section} for identical seed"

    assert (
        r1["operationalKpis"]["annualFreshLeafProcessedKg"]
        != r3["operationalKpis"]["annualFreshLeafProcessedKg"]
    )


def test_kpi_schema_compliance() -> None:
    """Verify single-run and 4-policy paired benchmark outputs match INTERFACE.md."""
    single = TeaFactoryDES(default_config()).run(seed=42)
    _assert_kpi_schema(single)

    benchmark = run_paired_benchmark(seed=42, replications=10)
    assert set(benchmark["policies"].keys()) == set(POLICY_SPECS.keys())
    for policy_name, payload in benchmark["policies"].items():
        _assert_kpi_schema(payload["kpis"])
        assert "confidenceIntervals95" in payload
        assert payload["kpis"]["runSummary"]["totalSimulatedDays"] == 365


def test_policy_crossing_effects() -> None:
    """Verify seasonal staffing lowers idle hours and pre-winter buffer improves winter fulfillment."""
    benchmark = run_paired_benchmark(seed=42, replications=20)
    p = benchmark["policies"]

    # Seasonal staffing reduces worker idle hours compared to Fixed staffing
    assert (
        p["seasonal_buffer"]["kpis"]["laborAndCostingKpis"]["totalWorkerIdleHours"]
        < p["fixed_buffer"]["kpis"]["laborAndCostingKpis"]["totalWorkerIdleHours"]
    )

    # Pre-winter 400 kg buffer improves (or maintains) winter order fulfillment vs standard
    assert (
        p["seasonal_buffer"]["kpis"]["winterDormancyResilience"]["winterOrderFulfillmentPct"]
        >= p["seasonal_standard"]["kpis"]["winterDormancyResilience"]["winterOrderFulfillmentPct"]
    )
    assert (
        p["fixed_buffer"]["kpis"]["winterDormancyResilience"]["winterOrderFulfillmentPct"]
        >= p["fixed_standard"]["kpis"]["winterDormancyResilience"]["winterOrderFulfillmentPct"]
    )

    # Confirm policy configs reflect expected targets
    assert build_policy_config("fixed_buffer")["inventoryPolicy"]["preWinterBufferTargetKg"] == 400.0
    assert build_policy_config("seasonal_standard")["staffingPolicy"]["mode"] == "seasonal"


def test_stochastic_cross_replication_variance() -> None:
    """Verify stochastic KPIs exhibit genuinely non-zero cross-replication variance."""
    benchmark = run_paired_benchmark(seed=42, replications=30)
    stochastic_metrics = (
        "annualFreshLeafProcessedKg",
        "averageDryerUtilizationPct",
        "minimumWinterCashBalanceBdt",
        "totalWorkerIdleHours",
        "averageAbsorptionCostBdtPerKg",
    )
    for policy_name, payload in benchmark["policies"].items():
        cis = payload["confidenceIntervals95"]
        for metric in stochastic_metrics:
            ci = cis[metric]
            assert ci["std"] > 0.0, f"{policy_name}.{metric} has zero std across replications"
            assert ci["ci95High"] > ci["ci95Low"], (
                f"{policy_name}.{metric} has degenerate 95% CI: {ci}"
            )


def _run_all_tests() -> int:
    tests = [
        test_mass_conservation,
        test_zero_fresh_leaf_jan_feb_dormancy,
        test_deterministic_seed_reproducibility,
        test_kpi_schema_compliance,
        test_policy_crossing_effects,
        test_stochastic_cross_replication_variance,
    ]
    for fn in tests:
        fn()
        print(f"PASS: {fn.__name__}")
    print(f"All {len(tests)} tests passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_run_all_tests())
