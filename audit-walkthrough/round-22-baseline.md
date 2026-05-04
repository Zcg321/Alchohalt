# Round 22 — baseline (2026-05-03)

Captured at branch creation. Round-finalize compares against this.

## Test count

```
 Test Files  243 passed | 1 skipped (244)
      Tests  1547 passed | 4 skipped (1551)
```

## Lint

```
✖ 30 problems (0 errors, 30 warnings)
```

## Typecheck

```
clean
```

## Bundle / perf-baseline

```
[size] All budgets pass.
  Largest async (gz)  20.2 KB / 250.0 KB

Perf baseline (vs main):
  eagerJsGz         241.79 KB → 245.20 KB   +1.41%
  totalInitGz       324.13 KB → 337.25 KB   +4.05%
  largestAsyncGz     20.19 KB →  20.20 KB   +0.08%
  PASS (threshold 5%)
```

## HEAD

```
8393b50 Merge pull request #55 from Zcg321/claude/round-21-polish-2026-05-03
```
