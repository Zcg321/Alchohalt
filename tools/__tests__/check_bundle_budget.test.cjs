/* [R14-B] Test the failure path of tools/check_bundle_budget.cjs.
 *
 * Round 13 wired size:check into pr-checks.yml so over-budget bundles
 * fail PRs. Round 14 proves the script actually exits non-zero when
 * over budget. Same pattern as perf_baseline.test.cjs: spawn the
 * script against a synthetic dist/, assert exit code + stdout.
 *
 * Pure-Node test (no vitest) so it runs from the same npm script
 * harness as the production tool. Run via: node tools/__tests__/check_bundle_budget.test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const TOOL = path.join(__dirname, '..', 'check_bundle_budget.cjs');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ok  ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL  ${msg}`);
  }
}

function makeFakeDist(tmpDir, sizes) {
  const assets = path.join(tmpDir, 'dist', 'assets');
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'dist', 'index.html'), '<html></html>');
  function pad(name, raw) {
    const buf = Buffer.alloc(raw, 0x61);
    fs.writeFileSync(path.join(assets, name), buf);
  }
  pad('index-aaa.js', sizes.eagerJsRaw);
  pad('react-aaa.js', sizes.reactRaw);
  pad('vendor-aaa.js', sizes.vendorRaw);
  pad('index-aaa.css', sizes.cssRaw);
  pad('AsyncChunk-aaa.js', sizes.asyncRaw);
}

function runTool(cwd, env = {}) {
  const r = spawnSync('node', [TOOL], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { code: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function withTmp(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-check-'));
  try {
    fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('[R14-B] check_bundle_budget.cjs');

console.log('1. all under budget → exit 0, "All budgets pass"');
withTmp((tmp) => {
  /* Highly-compressible 'a' bytes — gzip output very small. With
   * 100/335 KB defaults, all five files (~185KB raw → tiny gz) fit. */
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp);
  assert(r.code === 0, 'exits 0 when within budget');
  assert(/All budgets pass/.test(r.stdout), 'output marks pass');
});

console.log('2. eager > budget → exit 1');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  /* Eager budget set to 0 KB forces the check to fail on eagerJs. */
  const r = runTool(tmp, { SIZE_LIMIT_EAGER_KB: '0' });
  assert(r.code === 1, 'exits 1 when eager exceeds budget');
  assert(/FAIL[^\n]*Eager JS/.test(r.stdout), 'output marks Eager JS failure');
  assert(/budget\(s\) exceeded/.test(r.stderr), 'stderr explains the budget breach');
});

console.log('3. async > budget → exit 1');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp, { SIZE_LIMIT_ASYNC_KB: '0' });
  assert(r.code === 1, 'exits 1 when async exceeds budget');
  assert(/FAIL[^\n]*Largest async/.test(r.stdout), 'output marks async failure');
});

console.log('4. multiple budgets exceeded → exit 1, count surfaces');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp, {
    SIZE_LIMIT_EAGER_KB: '0',
    SIZE_LIMIT_TOTAL_KB: '0',
    SIZE_LIMIT_ASYNC_KB: '0',
  });
  assert(r.code === 1, 'exits 1 when multiple budgets exceed');
  assert(/3 budget\(s\) exceeded/.test(r.stderr), 'reports breach count');
});

console.log('5. dist/ missing → exit 2 (build error, not budget breach)');
withTmp((tmp) => {
  /* No dist/ at all. */
  const r = runTool(tmp);
  assert(r.code === 2, 'no dist/ → exits 2');
});

console.log('');
if (failed > 0) {
  console.error(`FAILED: ${failed} of ${passed + failed} checks`);
  process.exit(1);
}
console.log(`PASSED: ${passed} of ${passed} checks`);
