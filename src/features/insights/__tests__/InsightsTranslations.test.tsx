import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import QuickActions from '../QuickActions';
import SmartRecommendations from '../SmartRecommendations';
import ProgressVisualization from '../ProgressVisualization';
import { LanguageContext, type Lang, type TranslationValues } from '../../../i18n';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';
import type { Drink } from '../../drinks/DrinkForm';
import type { Goals } from '../../../types/common';
import { getCurrentStreak } from '../lib';

vi.mock('../../analytics/analytics', () => ({
  useAnalytics: () => ({
    trackFeatureUsage: vi.fn()
  })
}));

vi.mock('../../mood/MoodTracker', () => ({
  default: () => <div data-testid="mood-tracker" />
}));

type TranslationDict = { [key: string]: string | TranslationDict };

const dictionaries: Record<Lang, TranslationDict> = {
  en: en as TranslationDict,
  es: es as TranslationDict
};

function resolve(dict: TranslationDict | undefined, key: string): string | undefined {
  if (!dict) return undefined;

  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    const direct = dict[key];
    return typeof direct === 'string' ? direct : undefined;
  }

  const parts = key.split('.');
  let current: string | TranslationDict | undefined = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
      current = (current as TranslationDict)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars?: TranslationValues): string {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return String(vars[name]);
    }
    return '';
  });
}

function translate(lang: Lang, key: string, vars?: TranslationValues): string {
  const template = resolve(dictionaries[lang], key) ?? resolve(dictionaries.en, key) ?? key;
  return interpolate(template, vars);
}

function renderWithLang(ui: React.ReactElement, lang: Lang) {
  const t = (key: string, vars?: TranslationValues) => translate(lang, key, vars);
  return render(
    <LanguageContext.Provider value={{ lang, setLang: () => {}, t }}>
      {ui}
    </LanguageContext.Provider>
  );
}

const dayMs = 24 * 60 * 60 * 1000;
const now = Date.now();

const sampleDrinks: Drink[] = [
  {
    volumeMl: 355,
    abvPct: 5,
    intention: 'social',
    craving: 4,
    halt: ['hungry'],
    alt: '',
    ts: now - 2 * dayMs
  },
  {
    volumeMl: 150,
    abvPct: 12,
    intention: 'social',
    craving: 7,
    halt: ['lonely'],
    alt: '',
    ts: now - 10 * dayMs
  }
];

const sampleGoals: Goals = {
  dailyCap: 3,
  weeklyGoal: 12,
  pricePerStd: 5,
  baselineMonthlySpend: 120
};

const currentStreak = getCurrentStreak(sampleDrinks);
const milestones = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
const nextMilestone = milestones.find(m => m > currentStreak) ?? currentStreak + 30;

function TestInsights() {
  return (
    <>
      <QuickActions
        drinks={sampleDrinks}
        goals={sampleGoals}
        onAddDrink={() => {}}
        onOpenSettings={() => {}}
        onOpenStats={() => {}}
      />
      <SmartRecommendations drinks={sampleDrinks} goals={sampleGoals} />
      <ProgressVisualization drinks={sampleDrinks} goals={sampleGoals} />
    </>
  );
}

describe('insights components translations', () => {
  (['en', 'es'] as Lang[]).forEach(lang => {
    test(`renders localized text for ${lang}`, () => {
      renderWithLang(<TestInsights />, lang);

      expect(screen.getByText(translate(lang, 'quickActions.title'))).toBeInTheDocument();
      expect(screen.queryByText('quickActions.title')).not.toBeInTheDocument();

      expect(screen.getByText(translate(lang, 'smartRecommendations.subtitle'))).toBeInTheDocument();

      const nextText = translate(lang, 'progressVisualization.nextMilestone', { days: nextMilestone });
      expect(screen.getByText(nextText)).toBeInTheDocument();

      const daysToGo = translate(lang, 'progressVisualization.daysToGo', {
        count: nextMilestone - currentStreak
      });
      expect(screen.getByText(daysToGo)).toBeInTheDocument();
    });
  });
});
