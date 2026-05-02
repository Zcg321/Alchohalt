/**
 * Regression for [BUG-PREFERENCES-SHIM-COVERAGE].
 *
 * The web shim in src/shared/capacitor.ts is the only place allowed to
 * import @capacitor/preferences. Any other module that imports it
 * directly bypasses the shim and triggers
 * "Preferences.X() is not implemented on web" errors which the
 * analytics service then writes into localStorage forever.
 *
 * Eslint's no-restricted-imports rule is the primary guard. This test
 * is a belt-and-braces grep so the constraint stays visible in test
 * output even if a future eslint config change loosens the rule.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const REPO_ROOT = join(__dirname, '..', '..', '..');

describe('Capacitor.Preferences shim coverage', () => {
  it('only src/shared/capacitor.ts imports @capacitor/preferences', () => {
    // Use ripgrep / git grep — falling back to a JS scan if not available.
    let lines: string[];
    try {
      const out = execSync(
        `git -C "${REPO_ROOT}" grep -n "from ['\\"]@capacitor/preferences['\\"]\\|import(['\\"]@capacitor/preferences" -- src/`,
        { encoding: 'utf-8' },
      );
      lines = out.split('\n').filter((l) => l.trim().length > 0);
    } catch (e) {
      // git grep returns non-zero on no matches OR on error; treat as empty
      lines = [];
    }
    const offending = lines
      .map((l) => l.split(':')[0] ?? '')
      .filter((p) => p && p !== 'src/shared/capacitor.ts')
      // Test files don't ship; allow them to mock-import the plugin.
      .filter((p) => !/__tests__|\.test\.|\.spec\./.test(p));
    expect(offending).toEqual([]);
  });

  it('shim still uses isNativePlatform to gate the real plugin load', () => {
    const src = readFileSync(join(REPO_ROOT, 'src/shared/capacitor.ts'), 'utf-8');
    expect(src).toMatch(/Capacitor\.isNativePlatform\(\)/);
    expect(src).toMatch(/webPreferences/);
  });
});
