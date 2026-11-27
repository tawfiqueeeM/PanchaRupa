"""
Benchmark policies and paired-seed Monte Carlo runner for PanchaRupa Virtual Tea Factory.

Crosses 2 staffing policies (Fixed vs. Seasonal) x 2 inventory policies
(Standard vs. Pre-Winter Buffer 400 kg) under paired Common Random Numbers
(N=1000 replications by default), exporting the exact KPI JSON schema defined
in ``sim/INTERFACE.md`` with 95% confidence intervals.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from .factory_des import TeaFactoryDES, default_config
except ImportError:
    from factory_des import TeaFactoryDES, default_config


POLICY_SPECS: Dict[str, Dict[str, Any]] = {
    "fixed_standard": {
        "label": "Policy A1: Fixed Staffing + Standard Inventory (Baseline)",
        "staffingPolicy": {
            "mode": "fixed",
            "regularHeadcount": 4,
            "seasonalContractors": 2,
            "winterStaffRetentionPct": 1.0,
        },
        "inventoryPolicy": {
            "mode": "standard",
            "preWinterBufferTargetKg": 0.0,
            "safetyStockKg": 50.0,
            "reorderPointKg": 100.0,
        },
    },
    "fixed_buffer": {
        "label": "Policy A2: Fixed Staffing + Pre-Winter Buffer (400 kg)",
        "staffingPolicy": {
            "mode": "fixed",
            "regularHeadcount": 4,
            "seasonalContractors": 2,
            "winterStaffRetentionPct": 1.0,
        },
        "inventoryPolicy": {
            "mode": "buffer",
            "preWinterBufferTargetKg": 400.0,
            "safetyStockKg": 50.0,
            "reorderPointKg": 100.0,
        },
    },
    "seasonal_standard": {
        "label": "Policy B1: Seasonal Staffing + Standard Inventory",
        "staffingPolicy": {
            "mode": "seasonal",
            "regularHeadcount": 4,
            "seasonalContractors": 2,
            "winterStaffRetentionPct": 0.5,
        },
        "inventoryPolicy": {
            "mode": "standard",
            "preWinterBufferTargetKg": 0.0,
            "safetyStockKg": 50.0,
            "reorderPointKg": 100.0,
        },
    },
    "seasonal_buffer": {
        "label": "Policy B2: Seasonal Staffing + Pre-Winter Buffer (400 kg)",
        "staffingPolicy": {
            "mode": "seasonal",
            "regularHeadcount": 4,
            "seasonalContractors": 2,
            "winterStaffRetentionPct": 0.5,
        },
        "inventoryPolicy": {
            "mode": "buffer",
            "preWinterBufferTargetKg": 400.0,
            "safetyStockKg": 50.0,
            "reorderPointKg": 100.0,
        },
    },
}


def build_policy_config(policy_name: str, base_overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Build a complete simulation config for one of the 4 benchmark policies."""
    if policy_name not in POLICY_SPECS:
        raise ValueError(f"Unknown policy '{policy_name}'. Expected one of {list(POLICY_SPECS)}")

    spec = POLICY_SPECS[policy_name]
    cfg = default_config(experiment_id=f"EXP-EUROSIM-2027-{policy_name.upper()}")
    cfg["staffingPolicy"].update(spec["staffingPolicy"])
    cfg["inventoryPolicy"].update(spec["inventoryPolicy"])

    if base_overrides:
        for k, v in base_overrides.items():
            if isinstance(v, dict) and isinstance(cfg.get(k), dict):
                cfg[k].update(v)
            else:
                cfg[k] = v
    return cfg


def _ci95(values: List[float]) -> Dict[str, float]:
    n = len(values)
    if n == 0:
        return {"mean": 0.0, "std": 0.0, "ci95Low": 0.0, "ci95High": 0.0}
    mean = sum(values) / n
    if n == 1:
        return {"mean": round(mean, 4), "std": 0.0, "ci95Low": round(mean, 4), "ci95High": round(mean, 4)}
    var = sum((x - mean) ** 2 for x in values) / (n - 1)
    std = math.sqrt(var)
    half_width = 1.96 * std / math.sqrt(n)
    return {
        "mean": round(mean, 4),
        "std": round(std, 4),
        "ci95Low": round(mean - half_width, 4),
        "ci95High": round(mean + half_width, 4),
    }


def _aggregate_replications(
    experiment_id: str,
    horizon_days: int,
    runs: List[Dict[str, Any]],
) -> Tuple[Dict[str, Any], Dict[str, Dict[str, float]]]:
    """Aggregate replication KPIs into the exact INTERFACE.md schema + 95% CIs."""
    op_keys = [
        "annualFreshLeafProcessedKg",
        "annualFinishedTeaProducedKg",
        "averageDryerUtilizationPct",
        "peakFlushQueueWaitHours",
    ]
    win_num_keys = [
        "winterStockoutDays",
        "winterOrderFulfillmentPct",
        "minimumWinterCashBalanceBdt",
    ]
    lab_keys = [
        "totalOvertimeHoursPaid",
        "totalWorkerIdleHours",
        "averageAbsorptionCostBdtPerKg",
        "totalMealAllowancesPaidBdt",
    ]

    cis: Dict[str, Dict[str, float]] = {}

    op_summary: Dict[str, float] = {}
    for k in op_keys:
        stats = _ci95([float(r["operationalKpis"][k]) for r in runs])
        cis[k] = stats
        op_summary[k] = stats["mean"]

    win_summary: Dict[str, Any] = {}
    for k in win_num_keys:
        stats = _ci95([float(r["winterDormancyResilience"][k]) for r in runs])
        cis[k] = stats
        win_summary[k] = int(round(stats["mean"])) if k == "winterStockoutDays" else stats["mean"]

    deficit_flags = [bool(r["winterDormancyResilience"]["workingCapitalDeficitOccurred"]) for r in runs]
    win_summary["workingCapitalDeficitOccurred"] = any(deficit_flags)
    cis["workingCapitalDeficitRate"] = _ci95([1.0 if f else 0.0 for f in deficit_flags])

    lab_summary: Dict[str, float] = {}
    for k in lab_keys:
        stats = _ci95([float(r["laborAndCostingKpis"][k]) for r in runs])
        cis[k] = stats
        lab_summary[k] = stats["mean"]

    kpi_schema = {
        "runSummary": {
            "experimentId": experiment_id,
            "completedAt": datetime.now(timezone.utc).isoformat(),
            "totalSimulatedDays": horizon_days,
        },
        "operationalKpis": op_summary,
        "winterDormancyResilience": win_summary,
        "laborAndCostingKpis": lab_summary,
    }
    return kpi_schema, cis


def run_paired_benchmark(
    seed: int = 42,
    replications: int = 1000,
    config_overrides: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run paired-seed Monte Carlo across all 4 benchmark policies.

    Each replication ``r`` in ``0..replications-1`` uses the identical seed
    ``seed + r`` across all 4 policies (Common Random Numbers).
    """
    if replications < 1:
        raise ValueError("replications must be >= 1")

    seeds = [seed + r for r in range(replications)]
    raw_runs: Dict[str, List[Dict[str, Any]]] = {name: [] for name in POLICY_SPECS}
    policy_outputs: Dict[str, Any] = {}

    for name in POLICY_SPECS:
        cfg = build_policy_config(name, config_overrides)
        cfg["randomSeed"] = seed
        cfg["replicationCount"] = replications
        engine = TeaFactoryDES(cfg)

        runs = [engine.run(seed=s) for s in seeds]
        raw_runs[name] = runs
        kpi_schema, cis = _aggregate_replications(
            experiment_id=cfg["experimentId"],
            horizon_days=int(cfg["simulationHorizonDays"]),
            runs=runs,
        )
        policy_outputs[name] = {
            "label": POLICY_SPECS[name]["label"],
            "kpis": kpi_schema,
            "confidenceIntervals95": cis,
        }

    # Paired difference: Seasonal+Buffer (Policy B2) minus Fixed+Standard (Policy A1)
    paired_metrics = [
        ("winterDormancyResilience", "winterStockoutDays"),
        ("winterDormancyResilience", "winterOrderFulfillmentPct"),
        ("winterDormancyResilience", "minimumWinterCashBalanceBdt"),
        ("laborAndCostingKpis", "totalWorkerIdleHours"),
        ("laborAndCostingKpis", "averageAbsorptionCostBdtPerKg"),
    ]
    paired_diff: Dict[str, Dict[str, float]] = {}
    for section, metric in paired_metrics:
        diffs = [
            float(raw_runs["seasonal_buffer"][i][section][metric])
            - float(raw_runs["fixed_standard"][i][section][metric])
            for i in range(replications)
        ]
        paired_diff[f"seasonal_buffer_minus_fixed_standard.{metric}"] = _ci95(diffs)

    return {
        "benchmarkMetadata": {
            "experimentId": "EXP-EUROSIM-2027-BENCHMARK",
            "seed": seed,
            "replications": replications,
            "completedAt": datetime.now(timezone.utc).isoformat(),
        },
        "policies": policy_outputs,
        "pairedComparisons": paired_diff,
    }


def export_results_json(results: Dict[str, Any], output_path: str | Path) -> Path:
    """Write benchmark or single-policy KPI JSON to disk."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    return path


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="PanchaRupa EUROSIM 2027 Paired-Seed Monte Carlo Benchmark"
    )
    parser.add_argument("--seed", type=int, default=42, help="Base random seed (default: 42)")
    parser.add_argument(
        "--replications",
        type=int,
        default=1000,
        help="Number of paired Monte Carlo replications (default: 1000)",
    )
    parser.add_argument(
        "--policy",
        type=str,
        default="all",
        choices=["all", *POLICY_SPECS.keys()],
        help="Run a single policy or all 4 crossed policies (default: all)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="",
        help="Optional output JSON file path",
    )
    args = parser.parse_args(argv)

    if args.policy == "all":
        results = run_paired_benchmark(seed=args.seed, replications=args.replications)
        if args.output:
            export_results_json(results, args.output)
        else:
            print(json.dumps(results, indent=2))
    else:
        cfg = build_policy_config(args.policy)
        cfg["randomSeed"] = args.seed
        cfg["replicationCount"] = args.replications
        engine = TeaFactoryDES(cfg)
        runs = [engine.run(seed=args.seed + r) for r in range(args.replications)]
        kpi_schema, _ = _aggregate_replications(
            experiment_id=cfg["experimentId"],
            horizon_days=int(cfg["simulationHorizonDays"]),
            runs=runs,
        )
        if args.output:
            export_results_json(kpi_schema, args.output)
        else:
            print(json.dumps(kpi_schema, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
