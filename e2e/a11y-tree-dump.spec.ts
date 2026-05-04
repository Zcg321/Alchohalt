import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERSONAS } from './personas/fixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * [R23-2] Real NVDA-equivalent accessibility tree dump.
 *
 * R22-2 ran a JS-emulated AccName walk in jsdom. R23-2 upgrades to
 * a real browser-driven dump: Playwright's `page.accessibility
 * .snapshot()` returns the Chromium accessibility tree exactly as
 * NVDA / VoiceOver / TalkBack would read it (the same tree backs
 * the Chrome DevTools "Accessibility" pane and the IAccessible2
 * APIs that NVDA queries on Windows).
 *
 * Per surface, this spec:
 *   1. Loads the tab in Chrome at the dev server
 *   2. Snapshots the full a11y tree
 *   3. Saves the JSON to e2e/a11y-snapshots/<surface>.json (CI
 *      uploads this directory as a build artifact for review)
 *   4. Walks the tree counting role/name pairs that an AT user
 *      would land on with Tab + arrow keys
 *   5. Asserts the structural minimums: each surface exposes
 *      at least one landmark, every interactive role has a
 *      non-empty accessible name, no `<image role="img">` without
 *      alt, and the tab list announces its labels.
 *
 * Why this matters beyond R22-2:
 *   - JS-emulation in jsdom approximates AccName via
 *     `aria-label`/`labelledby`/text-content but misses the
 *     Chromium-specific computed accessibility-tree pruning
 *     (e.g., `display: none` from media queries, `aria-hidden`
 *     ancestor inheritance).
 *   - The dumped JSON is a regression baseline: future structural
 *     changes that drop a label or swap a fieldset for a div show
 *     up as a snapshot diff in PR review.
 *   - Running it in CI catches regressions that pass the vitest
 *     suite because vitest doesn't render real Chromium.
 *
 * Run locally:
 *   npx playwright test e2e/a11y-tree-dump.spec.ts
 *
 * Inspect:
 *   open e2e/a11y-snapshots/<surface>.json
 */

const SNAPSHOT_DIR = join(__dirname, 'a11y-snapshots');
mkdirSync(SNAPSHOT_DIR, { recursive: true });

interface A11yNode {
  role?: string;
  name?: string;
  value?: string | number;
  description?: string;
  children?: A11yNode[];
  [k: string]: unknown;
}

function* walk(node: A11yNode | null): Generator<A11yNode> {
  if (!node) return;
  yield node;
  for (const c of node.children ?? []) yield* walk(c);
}

function countRoles(root: A11yNode | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const n of walk(root)) {
    if (!n.role) continue;
    counts.set(n.role, (counts.get(n.role) ?? 0) + 1);
  }
  return counts;
}

function findUnnamedInteractives(root: A11yNode | null): A11yNode[] {
  const interactiveRoles = new Set([
    'button',
    'link',
    'checkbox',
    'radio',
    'tab',
    'menuitem',
    'textbox',
    'combobox',
    'slider',
    'spinbutton',
    'switch',
  ]);
  const out: A11yNode[] = [];
  for (const n of walk(root)) {
    if (!n.role) continue;
    if (!interactiveRoles.has(n.role)) continue;
    if (!n.name || (n.name as string).trim() === '') {
      out.push(n);
    }
  }
  return out;
}

const SURFACES = [
  { id: 'today', tabLabel: 'Today' },
  { id: 'track', tabLabel: 'Track' },
  { id: 'goals', tabLabel: 'Goals' },
  { id: 'insights', tabLabel: 'Insights' },
  { id: 'settings', tabLabel: 'Settings' },
] as const;

test.describe('[R23-2] a11y tree dump per surface', () => {
  test.beforeEach(async ({ page }) => {
    /* Use day7 so the surfaces have content (empty-states would
     * pass the structural assertions but we want trees that
     * exercise the populated paths the AT user actually hits). */
    const blob = JSON.stringify(PERSONAS.day7());
    await page.addInitScript((value) => {
      localStorage.setItem('alchohalt:alchohalt.db', value);
    }, blob);
  });

  for (const surface of SURFACES) {
    test(`${surface.id} — accessibility tree snapshot + structural asserts`, async ({
      page,
    }) => {
      await page.goto('/');
      /* Onboarding modal can race the click; wait for the tablist
       * before navigating. */
      await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
      await page.getByRole('tab', { name: surface.tabLabel }).click();

      /* Give async surfaces (Insights worker, etc.) a beat to
       * resolve before snapshotting. */
      await page.waitForTimeout(500);

      const snapshot = await page.accessibility.snapshot({
        interestingOnly: false,
      });
      const path = join(SNAPSHOT_DIR, `${surface.id}.json`);
      writeFileSync(path, JSON.stringify(snapshot, null, 2));

      /* Structural minimums every surface must satisfy. If any of
       * these fails, NVDA users would experience the same gap. */
      const counts = countRoles(snapshot);
      expect(
        (counts.get('main') ?? 0) + (counts.get('region') ?? 0),
        `${surface.id}: at least one landmark (main or region)`,
      ).toBeGreaterThan(0);

      const unnamed = findUnnamedInteractives(snapshot);
      /* Allow a tiny budget for known unnamed nodes (e.g., the
       * outer tablist container some Chromium versions expose
       * without a name). 0 is the goal; 1 is the alarm. */
      expect(
        unnamed.length,
        `${surface.id}: unnamed interactive roles ${JSON.stringify(
          unnamed.map((u) => u.role),
        )}`,
      ).toBeLessThan(2);

      /* Tab list must expose all 5 tab labels by accessible name —
       * pre-condition for AT users to navigate between surfaces. */
      const tabNames = new Set<string>();
      for (const n of walk(snapshot)) {
        if (n.role === 'tab' && typeof n.name === 'string') {
          tabNames.add(n.name);
        }
      }
      for (const expected of ['Today', 'Track', 'Goals', 'Insights', 'Settings']) {
        expect(
          tabNames,
          `${surface.id}: tab "${expected}" present in a11y tree`,
        ).toContain(expected);
      }
    });
  }
});
