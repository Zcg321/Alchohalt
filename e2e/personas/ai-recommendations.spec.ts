import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERSONAS, type PersonaName } from './fixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * [R7-A4] AI-recommendations Playwright proxy walkthrough.
 *
 * Owner can't device-test, so this spec simulates the device run on
 * web. For each fixture state, we:
 *
 *   1. flip the AI-recommendations runtime override to "true" via
 *      localStorage (alchohalt:ai-recommendations-override) so the
 *      surface renders even if the build default is later flipped
 *      off;
 *   2. visit the Goals tab where the recommendations now mount;
 *   3. screenshot the resulting Goals tab;
 *   4. assert the rendered recommendation text contains no
 *      medical-claim regex matches (mirrors the unit-level audit
 *      in src/lib/__tests__/ai-recommendations.audit.test.ts but
 *      against actual rendered DOM, so it catches any slot-template
 *      that wraps user data with bad copy);
 *   5. capture the recommendation-card text into a fingerprint and
 *      diff it across personas — different inputs should produce
 *      different output.
 *
 * The 5th fixture state ("highdata") is a heavy-drinker variant
 * synthesized inline — different signal mix from the day30 persona,
 * makes the cross-persona uniqueness check more interesting.
 */

const SCREENSHOT_DIR = join(__dirname, '..', 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const MEDICAL_CLAIM_RE =
  /diagnos|\bcure[sd]?\b|\btreat(s|ed|ment)\b|heal\s+(your|the)\s+liver|alcohol(?:ism|\s+use\s+disorder)|\bremiss(ion|ive)\b|\b(detox|withdraw(al|ing|s)?)\b|makes them lighter|\bproven\s+to\b|\bclinical(ly)?\b|\bdoctor[s]?\s+recommend|\bguarantee/i;

interface PersonaFixture {
  name: string;
  blob: string;
}

/**
 * Variant that clears the goal caps so the recommender fires (day30 +
 * day7 ship with caps already at the recommender's target, which is
 * correct production behavior — "don't recommend a goal the user
 * already has" — but it means we need an unset variant to actually
 * see any rec render in the proxy walkthrough).
 */
function unsetGoalsVariant(name: PersonaName) {
  const base = PERSONAS[name]();
  const db = base.state.db;
  db.settings.dailyGoalDrinks = 0;
  db.settings.weeklyGoalDrinks = 0;
  db.settings.monthlyBudget = 0;
  return { state: { db }, version: 1 };
}

function highDataFixture(): { state: { db: ReturnType<(typeof PERSONAS)['day30']>['state']['db'] }; version: number } {
  // Re-use day30's shape but bias entries heavier — should produce a
  // weekly-limit + drink-free-days rec with bigger numbers.
  const base = unsetGoalsVariant('day30');
  const heavy = base.state.db;
  heavy.entries = heavy.entries.map((e, i) => ({ ...e, stdDrinks: 4 + (i % 2), cost: 9, craving: 8 }));
  return { state: { db: heavy }, version: 1 };
}

const FIXTURES: PersonaFixture[] = [
  // day0 stays as-is (no entries → recs gate on data anyway).
  { name: 'day0', blob: JSON.stringify(PERSONAS.day0()) },
  // day7/day30 use the unset-goals variant so recs surface.
  { name: 'day7', blob: JSON.stringify(unsetGoalsVariant('day7')) },
  { name: 'day30', blob: JSON.stringify(unsetGoalsVariant('day30')) },
  // recovery as-is (single-entry fixture; recs skipped for sparse data).
  { name: 'recovery', blob: JSON.stringify(PERSONAS.recovery()) },
  // highdata: heavy-drinker variant of day30 with cravings → exercises
  // the craving-management + monthly-budget paths.
  { name: 'highdata', blob: JSON.stringify(highDataFixture()) },
];

const recCorpus: Record<string, string> = {};

for (const fixture of FIXTURES) {
  test(`${fixture.name}: Goals tab AI recommendations render + audit clean`, async ({ page }) => {
    await page.addInitScript(
      ({ blob }) => {
        localStorage.setItem('alchohalt:alchohalt.db', blob);
        // Force-on the runtime override so the surface renders no
        // matter what the build default ends up being.
        localStorage.setItem('alchohalt:ai-recommendations-override', 'true');
      },
      { blob: fixture.blob },
    );
    await page.goto('/?tab=goals');
    await expect(page.getByRole('heading', { name: 'Alchohalt', level: 1 }).first()).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: join(SCREENSHOT_DIR, `ai-recs-${fixture.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    // Pull the rec card text. The component renders an h3 "Goals worth
    // considering" only when there's at least one rec; if it's missing,
    // the persona produced no recs (legitimate for day0 / recovery
    // with thin data).
    const heading = page.getByRole('heading', { name: /Goals worth considering/i });
    const present = await heading.isVisible().catch(() => false);
    if (!present) {
      recCorpus[fixture.name] = '__NO_RECS__';
      test.info().annotations.push({
        type: 'no-recs',
        description: `${fixture.name} produced no recommendations (sparse data)`,
      });
      return;
    }

    // Get the surrounding container — the spec gives us "Goals worth
    // considering" -> sibling div with the cards.
    const container = page.locator('text=Goals worth considering').locator('xpath=ancestor::*[1]');
    const text = (await container.locator('xpath=following-sibling::div[1]').innerText()) || '';
    recCorpus[fixture.name] = text;

    expect(
      text.match(MEDICAL_CLAIM_RE),
      `medical-claim regex matched in ${fixture.name}: "${text.match(MEDICAL_CLAIM_RE)?.[0]}"`,
    ).toBeNull();
  });
}

test('cross-persona uniqueness: at least 2 distinct rec corpora across non-empty fixtures', async () => {
  // The other tests run first because Playwright preserves declaration
  // order with workers=1; recCorpus is populated by then.
  const populated = Object.entries(recCorpus).filter(
    ([, v]) => v && v !== '__NO_RECS__',
  );
  expect(populated.length, 'at least 2 personas should produce recs').toBeGreaterThanOrEqual(2);
  const distinct = new Set(populated.map(([, v]) => v));
  expect(
    distinct.size,
    `personas with recs: ${populated.map(([n]) => n).join(', ')} — all corpora identical`,
  ).toBeGreaterThan(1);
});
