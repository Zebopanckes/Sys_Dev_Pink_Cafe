# Performance Benchmark Report

Generated: 2026-03-25T17:13:43.947137+00:00
Iterations per endpoint: 12
NFR interaction target: <= 2000 ms (p95)

## Results

| Endpoint | Avg (ms) | Median (ms) | P95 (ms) | Min (ms) | Max (ms) | Status |
|---|---:|---:|---:|---:|---:|---|
| /api/predict (linear_regression) | 144.32 | 139.1 | 161.17 | 116.81 | 185.54 | PASS |
| /api/evaluate (linear_regression) | 121.5 | 117.4 | 137.2 | 113.8 | 138.5 | PASS |
| /api/evaluate/compare | 854.34 | 780.14 | 836.16 | 741.82 | 1668.82 | PASS |

## Notes
- Benchmarks executed with Flask test client in-process to remove network variance.
- Linear Regression used for deterministic predict/evaluate endpoint timing.
- Compare endpoint includes all registered algorithms and is expected to be slower.
