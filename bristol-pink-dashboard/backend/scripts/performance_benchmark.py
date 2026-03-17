"""Benchmark backend prediction/evaluation endpoints and generate report artifacts."""
from __future__ import annotations

import json
import sys
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import app


ITERATIONS = 12
NFR_INTERACTION_TARGET_MS = 2000


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_sales_data() -> list[dict]:
    root = _project_root()
    coffee_path = root / "src" / "assets" / "pink_coffee.csv"
    croissant_path = root / "src" / "assets" / "pink_croissant.csv"

    coffee = pd.read_csv(coffee_path)
    coffee_long = coffee.melt(id_vars=["Date"], var_name="product", value_name="unitsSold")
    coffee_long = coffee_long.rename(columns={"Date": "date"})

    croissant = pd.read_csv(croissant_path).rename(columns={"Date": "date", "Number Sold": "unitsSold"})
    croissant["product"] = "Croissant"

    merged = pd.concat([coffee_long[["date", "product", "unitsSold"]], croissant[["date", "product", "unitsSold"]]], ignore_index=True)
    merged["date"] = pd.to_datetime(merged["date"], dayfirst=True).dt.strftime("%Y-%m-%d")
    merged["unitsSold"] = merged["unitsSold"].astype(float)

    return merged.to_dict("records")


def _measure_ms(func):
    started = time.perf_counter()
    result = func()
    elapsed = (time.perf_counter() - started) * 1000
    return elapsed, result


def _summary(samples: list[float]) -> dict:
    ordered = sorted(samples)
    p95_index = max(0, int(round(0.95 * (len(ordered) - 1))))
    return {
        "count": len(samples),
        "avg_ms": round(statistics.mean(samples), 2),
        "median_ms": round(statistics.median(samples), 2),
        "p95_ms": round(ordered[p95_index], 2),
        "min_ms": round(min(samples), 2),
        "max_ms": round(max(samples), 2),
    }


def main() -> None:
    sales_data = _load_sales_data()

    with app.test_client() as client:
        login = client.post("/api/auth/login", json={"username": "manager", "password": "manager123"})
        if login.status_code != 200:
            raise RuntimeError(f"Login failed for benchmark: {login.status_code} {login.data!r}")

        token = login.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        predict_samples = []
        evaluate_samples = []
        compare_samples = []

        for _ in range(ITERATIONS):
            predict_ms, predict_res = _measure_ms(
                lambda: client.post(
                    "/api/predict",
                    headers=headers,
                    json={"sales_data": sales_data, "training_weeks": 4, "algorithm": "linear_regression"},
                )
            )
            if predict_res.status_code != 200:
                raise RuntimeError(f"Predict failed during benchmark: {predict_res.status_code} {predict_res.data!r}")
            predict_samples.append(predict_ms)

            evaluate_ms, evaluate_res = _measure_ms(
                lambda: client.post(
                    "/api/evaluate",
                    headers=headers,
                    json={"sales_data": sales_data, "training_weeks": 4, "algorithm": "linear_regression"},
                )
            )
            if evaluate_res.status_code != 200:
                raise RuntimeError(f"Evaluate failed during benchmark: {evaluate_res.status_code} {evaluate_res.data!r}")
            evaluate_samples.append(evaluate_ms)

            compare_ms, compare_res = _measure_ms(
                lambda: client.post(
                    "/api/evaluate/compare",
                    headers=headers,
                    json={"sales_data": sales_data, "training_weeks": 4},
                )
            )
            if compare_res.status_code != 200:
                raise RuntimeError(f"Compare failed during benchmark: {compare_res.status_code} {compare_res.data!r}")
            compare_samples.append(compare_ms)

    predict_summary = _summary(predict_samples)
    evaluate_summary = _summary(evaluate_samples)
    compare_summary = _summary(compare_samples)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "iterations": ITERATIONS,
        "nfr_interaction_target_ms": NFR_INTERACTION_TARGET_MS,
        "endpoints": {
            "predict_linear_regression": predict_summary,
            "evaluate_linear_regression": evaluate_summary,
            "evaluate_compare_all_models": compare_summary,
        },
    }

    reports_dir = Path(__file__).resolve().parents[1] / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    json_path = reports_dir / "performance_report.json"
    md_path = reports_dir / "performance_report.md"

    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    def status_for(summary: dict) -> str:
        return "PASS" if summary["p95_ms"] <= NFR_INTERACTION_TARGET_MS else "FAIL"

    markdown = f"""# Performance Benchmark Report

Generated: {report['generated_at']}
Iterations per endpoint: {ITERATIONS}
NFR interaction target: <= {NFR_INTERACTION_TARGET_MS} ms (p95)

## Results

| Endpoint | Avg (ms) | Median (ms) | P95 (ms) | Min (ms) | Max (ms) | Status |
|---|---:|---:|---:|---:|---:|---|
| /api/predict (linear_regression) | {predict_summary['avg_ms']} | {predict_summary['median_ms']} | {predict_summary['p95_ms']} | {predict_summary['min_ms']} | {predict_summary['max_ms']} | {status_for(predict_summary)} |
| /api/evaluate (linear_regression) | {evaluate_summary['avg_ms']} | {evaluate_summary['median_ms']} | {evaluate_summary['p95_ms']} | {evaluate_summary['min_ms']} | {evaluate_summary['max_ms']} | {status_for(evaluate_summary)} |
| /api/evaluate/compare | {compare_summary['avg_ms']} | {compare_summary['median_ms']} | {compare_summary['p95_ms']} | {compare_summary['min_ms']} | {compare_summary['max_ms']} | {status_for(compare_summary)} |

## Notes
- Benchmarks executed with Flask test client in-process to remove network variance.
- Linear Regression used for deterministic predict/evaluate endpoint timing.
- Compare endpoint includes all registered algorithms and is expected to be slower.
"""

    md_path.write_text(markdown, encoding="utf-8")
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
