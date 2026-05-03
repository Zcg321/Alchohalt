/* [R13-5] Test the comparison logic of perf_baseline.cjs without
 * spawning a child process or shelling out — extract the comparison
 * by stubbing fs and re-requiring the module. The real shape we
 * care about: regression > threshold → exit 1, otherwise exit 0.
 *
 * Pure-Node test (no vitest) so it runs from the same npm script
 * harness as the production tool. Run via: node tools/__tests__/perf_baseline.test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const TOOL = path.join(__dirname, '..', 'perf_baseline.cjs');

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
  /* Generate slightly-compressible content of a target raw size so
   * gzip output is repeatable. zlib level 9 hashes deterministically. */
  function pad(name, raw) {
    const buf = Buffer.alloc(raw, 0x61); // run of 'a' bytes
    fs.writeFileSync(path.join(assets, name), buf);
  }
  pad('index-aaa.js', sizes.eagerJsRaw);
  pad('react-aaa.js', sizes.reactRaw);
  pad('vendor-aaa.js', sizes.vendorRaw);
  pad('index-aaa.css', sizes.cssRaw);
  pad('AsyncChunk-aaa.js', sizes.asyncRaw);
}

function runTool(cwd, args = []) {
  /* Use spawnSync to reliably capture stderr regardless of exit code.
   * execSync only exposes stderr via the thrown error on non-zero
   * exits — when the tool exits 0 (e.g. "no baseline → warn") stderr
   * goes to /dev/null in execSync's default. */
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [TOOL, ...args], { cwd, encoding: 'utf8' });
  return {
    code: r.status ?? 1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

function withTmp(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-baseline-'));
  try {
    fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('[R13-5] perf_baseline.cjs');

console.log('1. --update writes a baseline file');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp, ['--update']);
  assert(r.code === 0, '--update exits 0');
  assert(
    fs.existsSync(path.join(tmp, 'perf-baseline.json')),
    'perf-baseline.json was created',
  );
  const blob = JSON.parse(
    fs.readFileSync(path.join(tmp, 'perf-baseline.json'), 'utf8'),
  );
  assert(typeof blob.eagerJsGz === 'number', 'baseline contains eagerJsGz');
  assert(typeof blob.totalInitGz === 'number', 'baseline contains totalInitGz');
});

console.log('2. check passes when current matches baseline exactly');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  runTool(tmp, ['--update']);
  const r = runTool(tmp);
  assert(r.code === 0, 'check exits 0 when no diff');
});

console.log('3. check fails (exit 1) when eager regresses > 5%');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  runTool(tmp, ['--update']);
  /* Bloat eager JS substantially. The run of 'a' bytes is highly
   * compressible — we go from 100KB raw → ~150KB raw to ensure the
   * gzipped size moves enough to clear the 5% regression threshold. */
  makeFakeDist(tmp, {
    eagerJsRaw: 150_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp);
  assert(r.code === 1, 'check exits 1 on >5% regression');
  assert(/REGRESSED/.test(r.stdout), 'output marks the regression');
});

console.log('4. check passes when within +5% of baseline');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  runTool(tmp, ['--update']);
  /* Tiny growth — 2% is well under 5%. With repeating 'a' bytes the
   * gzip ratio is so high that a 2KB raw bump is barely visible
   * gzipped, so this stays under threshold. */
  makeFakeDist(tmp, {
    eagerJsRaw: 102_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp);
  assert(r.code === 0, 'check exits 0 within threshold');
});

console.log('5. no baseline → warns and exits 0 (does not block)');
withTmp((tmp) => {
  makeFakeDist(tmp, {
    eagerJsRaw: 100_000,
    reactRaw: 50_000,
    vendorRaw: 20_000,
    cssRaw: 10_000,
    asyncRaw: 5_000,
  });
  const r = runTool(tmp);
  assert(r.code === 0, 'no baseline → exits 0');
  /* The warning goes to stderr OR stdout depending on Node version /
   * Windows shell. Look in either. */
  const allOut = r.stdout + r.stderr;
  assert(/No perf-baseline\.json found/.test(allOut), 'warns about missing baseline');
});

console.log('6. dist/assets missing → exits 2 (build error, not regression)');
withTmp((tmp) => {
  fs.mkdirSync(path.join(tmp, 'dist'));
  /* No assets/ subfolder. */
  const r = runTool(tmp);
  assert(r.code === 2, 'no dist/assets → exits 2');
});

console.log('');
if (failed > 0) {
  console.error(`FAILED: ${failed} of ${passed + failed} checks`);
  process.exit(1);
}
console.log(`PASSED: ${passed} of ${passed} checks`);
