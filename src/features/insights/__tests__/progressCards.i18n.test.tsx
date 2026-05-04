import { describe, it, expect } from 'vitest';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';
import fr from '../../../locales/fr.json';
import de from '../../../locales/de.json';
import pl from '../../../locales/pl.json';
import ru from '../../../locales/ru.json';

/**
 * [R23-A] progressCards.tsx full i18n sweep.
 *
 * Round 22 caught some hardcoded EN strings in progressCards.tsx —
 * the cards on the Insights tab (Goal Progress, Streak Milestone,
 * Monthly Spending, Health Insights) were rendering literal English
 * regardless of selected language. R23-A ports every visible string
 * to a `progressCards.*` key and translates across all 6 locales.
 *
 * This test pins:
 *   1. The complete set of progressCards.* keys exists in en.
 *   2. Every key resolves to a non-empty string in every locale.
 *   3. The {{days}} placeholder survives translation in streak keys
 *      (so .replace('{{days}}', n) still works).
 */
const REQUIRED_KEYS = [
  'progressCards.goalProgress.heading',
  'progressCards.goalProgress.dailyLabel',
  'progressCards.goalProgress.dailyUnit',
  'progressCards.goalProgress.dailyOverUnit',
  'progressCards.goalProgress.dailyEmpty',
  'progressCards.goalProgress.weeklyLabel',
  'progressCards.goalProgress.weeklyUnit',
  'progressCards.goalProgress.weeklyOverUnit',
  'progressCards.goalProgress.weeklyEmpty',
  'progressCards.streak.heading',
  'progressCards.streak.daysLabel',
  'progressCards.streak.nextMilestone',
  'progressCards.streak.daysFromThere',
  'progressCards.spending.heading',
  'progressCards.spending.spentThisMonth',
  'progressCards.spending.potentialSavings',
  'progressCards.spending.budgetUsage',
  'progressCards.spending.empty',
  'progressCards.health.heading',
  'progressCards.health.afDaysThisMonth',
  'progressCards.health.avgCraving',
  'progressCards.health.overallTrend',
  'progressCards.health.trend.improving',
  'progressCards.health.trend.declining',
  'progressCards.health.trend.stable',
];

const PLACEHOLDER_KEYS = [
  'progressCards.streak.nextMilestone',
  'progressCards.streak.daysFromThere',
];

const LOCALES: Record<string, Record<string, string>> = {
  en: en as unknown as Record<string, string>,
  es: es as unknown as Record<string, string>,
  fr: fr as unknown as Record<string, string>,
  de: de as unknown as Record<string, string>,
  pl: pl as unknown as Record<string, string>,
  ru: ru as unknown as Record<string, string>,
};

describe('progressCards i18n', () => {
  for (const [lang, dict] of Object.entries(LOCALES)) {
    describe(lang, () => {
      it.each(REQUIRED_KEYS)('has non-empty %s', (key) => {
        const value = dict[key];
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect((value || '').trim().length).toBeGreaterThan(0);
      });

      it.each(PLACEHOLDER_KEYS)('preserves {{days}} placeholder in %s', (key) => {
        expect(dict[key]).toContain('{{days}}');
      });
    });
  }
});
