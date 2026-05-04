/**
 * [R24-FF1] QuickLogHintBanner — gate + actions.
 *
 * Pins:
 *  - shouldShowQuickLogHint returns false until 7 drinks logged.
 *  - Returns false when the user is editing.
 *  - Returns false when drinkLogMode is 'quick'.
 *  - Returns false when quickLogHintAt is set (already responded).
 *  - "Use quick mode" sets drinkLogMode='quick' AND quickLogHintAt.
 *  - "Not now" sets only quickLogHintAt — drinkLogMode stays.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickLogHintBanner, {
  shouldShowQuickLogHint,
  QUICK_LOG_HINT_THRESHOLD,
} from '../QuickLogHintBanner';
import { useDB } from '../../../../store/db';
import { LanguageProvider } from '../../../../i18n';

beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    drinkLogMode: undefined,
    quickLogHintAt: undefined,
  });
});

afterEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('shouldShowQuickLogHint [R24-FF1]', () => {
  it('returns false below the 7-drink threshold', () => {
    for (let n = 0; n < QUICK_LOG_HINT_THRESHOLD; n++) {
      expect(
        shouldShowQuickLogHint({
          drinkCount: n,
          drinkLogMode: undefined,
          quickLogHintAt: undefined,
          editing: false,
        }),
      ).toBe(false);
    }
  });

  it('returns true at exactly the threshold on detailed mode', () => {
    expect(
      shouldShowQuickLogHint({
        drinkCount: QUICK_LOG_HINT_THRESHOLD,
        drinkLogMode: undefined,
        quickLogHintAt: undefined,
        editing: false,
      }),
    ).toBe(true);
    expect(
      shouldShowQuickLogHint({
        drinkCount: QUICK_LOG_HINT_THRESHOLD,
        drinkLogMode: 'detailed',
        quickLogHintAt: undefined,
        editing: false,
      }),
    ).toBe(true);
  });

  it('returns false when already on quick mode', () => {
    expect(
      shouldShowQuickLogHint({
        drinkCount: 50,
        drinkLogMode: 'quick',
        quickLogHintAt: undefined,
        editing: false,
      }),
    ).toBe(false);
  });

  it('returns false once the user has responded', () => {
    expect(
      shouldShowQuickLogHint({
        drinkCount: 50,
        drinkLogMode: undefined,
        quickLogHintAt: 1700000000000,
        editing: false,
      }),
    ).toBe(false);
  });

  it('returns false while the user is editing an existing drink', () => {
    expect(
      shouldShowQuickLogHint({
        drinkCount: 50,
        drinkLogMode: undefined,
        quickLogHintAt: undefined,
        editing: true,
      }),
    ).toBe(false);
  });
});

describe('QuickLogHintBanner actions [R24-FF1]', () => {
  function renderBanner() {
    return render(
      <LanguageProvider>
        <QuickLogHintBanner now={() => 1700000000000} />
      </LanguageProvider>,
    );
  }

  it('"Use quick mode" sets drinkLogMode=quick AND records timestamp', () => {
    renderBanner();
    fireEvent.click(screen.getByTestId('quick-log-hint-switch'));
    const settings = useDB.getState().db.settings;
    expect(settings.drinkLogMode).toBe('quick');
    expect(settings.quickLogHintAt).toBe(1700000000000);
  });

  it('"Not now" records timestamp without changing drinkLogMode', () => {
    useDB.getState().setSettings({ drinkLogMode: 'detailed' });
    renderBanner();
    fireEvent.click(screen.getByTestId('quick-log-hint-dismiss'));
    const settings = useDB.getState().db.settings;
    expect(settings.drinkLogMode).toBe('detailed');
    expect(settings.quickLogHintAt).toBe(1700000000000);
  });

  it('renders aria-live region for screen-reader visibility', () => {
    renderBanner();
    const banner = screen.getByTestId('quick-log-hint-banner');
    expect(banner.getAttribute('aria-live')).toBe('polite');
    expect(banner.getAttribute('role')).toBe('status');
  });
});

describe('TrackTab integrates QuickLogHintBanner [R24-FF1]', () => {
  // Smoke test that pins the gate is also wired into TrackTab. Full
  // visual integration is covered by TrackTab.quickLogMode.test.tsx;
  // here we assert the testid is present given the right state.
  it('mounts when drinks ≥ threshold and never-responded', async () => {
    const TrackTab = (await import('../../../../app/tabs/TrackTab')).default;
    const drinks = Array.from({ length: QUICK_LOG_HINT_THRESHOLD }, (_, i) => ({
      ts: 1700000000000 + i * 60000,
      volumeMl: 355,
      abvPct: 5,
      intention: 'social' as const,
      craving: 0,
      halt: [] as never[],
      alt: '',
    }));
    render(
      <LanguageProvider>
        <TrackTab
          drinks={drinks}
          goals={{ dailyCap: 2, weeklyGoal: 14, baselineMonthlySpend: 0, pricePerStd: 5 }}
          presets={[]}
          editing={null}
          onAddDrink={vi.fn()}
          onSaveDrink={vi.fn()}
          onStartEdit={vi.fn()}
          onDeleteDrink={vi.fn()}
          onCancelEdit={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('quick-log-hint-banner')).toBeTruthy();
  });

  it('does not mount in quick mode (already adopted)', async () => {
    useDB.getState().setSettings({ drinkLogMode: 'quick' });
    const TrackTab = (await import('../../../../app/tabs/TrackTab')).default;
    const drinks = Array.from({ length: 20 }, (_, i) => ({
      ts: 1700000000000 + i * 60000,
      volumeMl: 355,
      abvPct: 5,
      intention: 'social' as const,
      craving: 0,
      halt: [] as never[],
      alt: '',
    }));
    render(
      <LanguageProvider>
        <TrackTab
          drinks={drinks}
          goals={{ dailyCap: 2, weeklyGoal: 14, baselineMonthlySpend: 0, pricePerStd: 5 }}
          presets={[]}
          editing={null}
          onAddDrink={vi.fn()}
          onSaveDrink={vi.fn()}
          onStartEdit={vi.fn()}
          onDeleteDrink={vi.fn()}
          onCancelEdit={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.queryByTestId('quick-log-hint-banner')).toBeNull();
  });
});
