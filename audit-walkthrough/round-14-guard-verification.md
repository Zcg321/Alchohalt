# Round 14 — guard verification (2026-05-03)

## R14-A: perf-baseline regression guard

Round 13 wired `npm run perf-baseline` into pr-checks.yml. Round 14
proves it triggers as designed.

### Synthetic test (manual, this round)

Shrunk `perf-baseline.json` by 6% across all three metrics, ran the
guard, observed exit 1:

```
[REGRESSED]  eagerJsGz         227.28 KB →  241.79 KB   +6.38%
[REGRESSED]  totalInitGz       304.69 KB →  324.13 KB   +6.38%
[REGRESSED]  largestAsyncGz     18.98 KB →   20.19 KB   +6.39%

[perf-baseline] One or more metrics regressed > 5%. ...
exit code: 1
```

Then restored baseline (`git checkout perf-baseline.json`); guard
returned to PASS.

### Durable coverage

Already shipped in round 13: `tools/__tests__/perf_baseline.test.cjs`
exercises the failure path with a synthetic over-budget dist. Round 14
re-ran it: 11/11 checks pass.

## R14-B: bundle-budget guard

Round 13 wired `npm run size:check` into pr-checks.yml. Round 14 also
adds durable failure-path coverage (none existed before).

### Synthetic test (manual, this round)

Tightened budgets via env, ran the guard, observed exit 1:

```
SIZE_LIMIT_EAGER_KB=200 SIZE_LIMIT_TOTAL_KB=250 SIZE_LIMIT_ASYNC_KB=10
node tools/check_bundle_budget.cjs

  FAIL  Eager JS (gz)          241.8 KB / 200.0 KB
  FAIL  Total initial (gz)     324.1 KB / 250.0 KB (5 files)
  FAIL  Largest async (gz)      20.2 KB /  10.0 KB

[size] 3 budget(s) exceeded.
exit code: 1
```

### New durable coverage

Added `tools/__tests__/check_bundle_budget.test.cjs` (10 checks):

1. all under budget → exit 0
2. eager > budget → exit 1
3. async > budget → exit 1
4. multiple budgets exceeded → exit 1, count surfaces
5. dist/ missing → exit 2

Wired both `tools/__tests__/*.test.cjs` files into pr-checks.yml
under a new `npm run test:tools` step. The meta-guard catches the
worst failure mode: a budget script that stops failing on regressions
becomes a silent pass — invisible in CI logs.

## CI wiring confirmed

Both guards run on every PR:

```yaml
- name: Bundle size check (R13 budgets — fails on regression)
  run: npm run size:check

- name: Perf baseline check (R13 — fails on >5% regression)
  run: npm run perf-baseline

- name: Tool tests (R14 — verifies guards actually trigger)
  run: npm run test:tools
```

Result: the round-13 perf/bundle guards are now provably alive, with
permanent meta-coverage.
