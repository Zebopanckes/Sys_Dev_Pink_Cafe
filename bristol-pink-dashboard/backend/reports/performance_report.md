# Performance Benchmark Report

Generated: 2026-03-17T18:34:10.104254+00:00
Iterations per endpoint: 12
NFR interaction target: <= 2000 ms (p95)

## Results

| Endpoint | Avg (ms) | Median (ms) | P95 (ms) | Min (ms) | Max (ms) | Status |
|---|---:|---:|---:|---:|---:|---|
| /api/predict (linear_regression) | 136.97 | 136.09 | 143.71 | 128.54 | 145.81 | PASS |
| /api/evaluate (linear_regression) | 121.55 | 119.61 | 126.61 | 113.99 | 145.07 | PASS |
| /api/evaluate/compare | 852.75 | 753.74 | 809.4 | 728.58 | 1897.05 | PASS |

## Notes
- Benchmarks executed with Flask test client in-process to remove network variance.
- Linear Regression used for deterministic predict/evaluate endpoint timing.
- Compare endpoint includes all registered algorithms and is expected to be slower.
