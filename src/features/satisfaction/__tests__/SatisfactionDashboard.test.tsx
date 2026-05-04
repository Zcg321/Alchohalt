/**
 * [R27-1] SatisfactionDashboard — render + sentiment tests.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SatisfactionDashboard from '../SatisfactionDashboard';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import {
  surfaceSentiments,
  surfaceDisplayLabel,
  type SatisfactionSignal,
} from '../satisfaction';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    satisfactionSignals: undefined as never,
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('[R27-1] surfaceSentiments', () => {
  it('returns rated:false for surfaces with zero signals', () => {
    const out = surfaceSentiments(undefined);
    expect(out.every((s) => !s.rated)).toBe(true);
  });

  it('marks 100% positive as good mood', () => {
    const signals: SatisfactionSignal[] = [
      { surface: 'today-panel', response: 'up', ts: 1 },
      { surface: 'today-panel', response: 'up', ts: 2 },
    ];
    const today = surfaceSentiments(signals).find((s) => s.surface === 'today-panel');
    expect(today?.rated).toBe(true);
    if (today?.rated) {
      expect(today.positivePct).toBe(100);
      expect(today.mood).toBe('good');
    }
  });

  it('marks 50% as mixed mood', () => {
    const signals: SatisfactionSignal[] = [
      { surface: 'drink-form', response: 'up', ts: 1 },
      { surface: 'drink-form', response: 'down', ts: 2 },
    ];
    const drinkForm = surfaceSentiments(signals).find((s) => s.surface === 'drink-form');
    expect(drinkForm?.rated).toBe(true);
    if (drinkForm?.rated) {
      expect(drinkForm.positivePct).toBe(50);
      expect(drinkForm.mood).toBe('mixed');
    }
  });

  it('marks <50% as concerning mood', () => {
    const signals: SatisfactionSignal[] = [
      { surface: 'insights-tab', response: 'up', ts: 1 },
      { surface: 'insights-tab', response: 'down', ts: 2 },
      { surface: 'insights-tab', response: 'down', ts: 3 },
    ];
    const insights = surfaceSentiments(signals).find((s) => s.surface === 'insights-tab');
    expect(insights?.rated).toBe(true);
    if (insights?.rated) {
      expect(insights.positivePct).toBe(33);
      expect(insights.mood).toBe('concerning');
    }
  });

  it('80%+ marks as good (boundary)', () => {
    const signals: SatisfactionSignal[] = [
      ...Array.from({ length: 8 }, (_, i): SatisfactionSignal => ({
        surface: 'today-panel', response: 'up', ts: i,
      })),
      ...Array.from({ length: 2 }, (_, i): SatisfactionSignal => ({
        surface: 'today-panel', response: 'down', ts: 100 + i,
      })),
    ];
    const today = surfaceSentiments(signals).find((s) => s.surface === 'today-panel');
    expect(today?.rated).toBe(true);
    if (today?.rated) {
      expect(today.positivePct).toBe(80);
      expect(today.mood).toBe('good');
    }
  });
});

describe('[R27-1] surfaceDisplayLabel', () => {
  it('returns a human-readable label for every known surface', () => {
    const surfaces: Array<SatisfactionSignal['surface']> = [
      'insights-tab', 'drink-form', 'hard-time-panel',
      'today-panel', 'settings-privacy', 'onboarding-intent',
    ];
    for (const s of surfaces) {
      const label = surfaceDisplayLabel(s);
      expect(label.length).toBeGreaterThan(0);
      // Labels should not be the raw kebab-case key.
      expect(label).not.toBe(s);
    }
  });
});

describe('[R27-1] SatisfactionDashboard component', () => {
  it('renders the empty state when no signals exist', () => {
    render(<SatisfactionDashboard />);
    expect(screen.getByTestId('satisfaction-dashboard-empty')).toBeTruthy();
    expect(screen.queryByTestId('satisfaction-dashboard-rows')).toBeNull();
  });

  it('renders one row per surface when signals exist', () => {
    useDB.getState().setSettings({
      satisfactionSignals: [
        { surface: 'today-panel', response: 'up', ts: 1 },
        { surface: 'today-panel', response: 'up', ts: 2 },
        { surface: 'drink-form', response: 'down', ts: 3 },
      ] as never,
    });
    render(<SatisfactionDashboard />);
    expect(screen.getByTestId('satisfaction-dashboard-row-today-panel')).toBeTruthy();
    expect(screen.getByTestId('satisfaction-dashboard-row-drink-form')).toBeTruthy();
    expect(screen.getByTestId('satisfaction-dashboard-pct-today-panel').textContent).toBe('100%');
    expect(screen.getByTestId('satisfaction-dashboard-pct-drink-form').textContent).toBe('0%');
  });

  it('renders unrated surfaces with em-dash, not 0%', () => {
    useDB.getState().setSettings({
      satisfactionSignals: [
        { surface: 'today-panel', response: 'up', ts: 1 },
      ] as never,
    });
    render(<SatisfactionDashboard />);
    // drink-form has no responses; should show em-dash placeholder.
    expect(screen.getByTestId('satisfaction-dashboard-unrated-drink-form').textContent).toBe('—');
  });

  it('shows up/down counts for rated surfaces', () => {
    useDB.getState().setSettings({
      satisfactionSignals: [
        { surface: 'today-panel', response: 'up', ts: 1 },
        { surface: 'today-panel', response: 'up', ts: 2 },
        { surface: 'today-panel', response: 'down', ts: 3 },
      ] as never,
    });
    render(<SatisfactionDashboard />);
    expect(screen.getByTestId('satisfaction-dashboard-up-today-panel').textContent).toBe('2 up');
    expect(screen.getByTestId('satisfaction-dashboard-down-today-panel').textContent).toBe('1 down');
  });
});
