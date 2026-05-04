import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickLogChips from '../QuickLogChips';
import { LanguageProvider } from '../../../../i18n';

/**
 * [R23-D] QuickLogChips: tap-to-log chips for the Quick drink-log
 * mode.
 *
 * Pins:
 *   - Renders 3 chips (beer / wine / cocktail) with stable testids
 *   - Each chip is at least 64px tall (above the 44pt floor — the
 *     extra height is the headline + subhead two-line layout)
 *   - Tapping a chip emits the correct default-shape Drink to onLog
 *     with current-time ts
 *   - The chips group is announced as a labelled <div role="group">
 *     so SR users hear "Quick log a drink" before the chip names
 */
function renderChips(onLog: (...args: unknown[]) => void) {
  return render(
    <LanguageProvider>
      <QuickLogChips onLog={onLog as never} />
    </LanguageProvider>,
  );
}

describe('QuickLogChips', () => {
  it('renders three chips with stable testids', () => {
    renderChips(vi.fn());
    expect(screen.getByTestId('quick-log-beer')).toBeTruthy();
    expect(screen.getByTestId('quick-log-wine')).toBeTruthy();
    expect(screen.getByTestId('quick-log-cocktail')).toBeTruthy();
  });

  it('group has a labelled role for SR users', () => {
    renderChips(vi.fn());
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-label')).toBeTruthy();
  });

  it('each chip is at least 64px (well above 44pt floor)', () => {
    renderChips(vi.fn());
    for (const id of ['beer', 'wine', 'cocktail'] as const) {
      const chip = screen.getByTestId(`quick-log-${id}`);
      expect(chip.className).toMatch(/min-h-\[64px\]/);
    }
  });

  it('tap on beer logs a 355ml/5% drink with current-time ts', () => {
    const onLog = vi.fn();
    const before = Date.now();
    renderChips(onLog);
    fireEvent.click(screen.getByTestId('quick-log-beer'));
    const after = Date.now();
    expect(onLog).toHaveBeenCalledTimes(1);
    const drink = onLog.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(drink.volumeMl).toBe(355);
    expect(drink.abvPct).toBe(5);
    expect(drink.intention).toBe('social');
    expect(drink.craving).toBe(0);
    expect(drink.halt).toEqual([]);
    expect(drink.alt).toBe('');
    expect(drink.ts).toBeGreaterThanOrEqual(before);
    expect(drink.ts).toBeLessThanOrEqual(after);
  });

  it('tap on cocktail logs a 60ml/40% drink', () => {
    const onLog = vi.fn();
    renderChips(onLog);
    fireEvent.click(screen.getByTestId('quick-log-cocktail'));
    expect(onLog).toHaveBeenCalledTimes(1);
    const drink = onLog.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(drink.volumeMl).toBe(60);
    expect(drink.abvPct).toBe(40);
  });

  it('tap on wine logs a 150ml/12% drink', () => {
    const onLog = vi.fn();
    renderChips(onLog);
    fireEvent.click(screen.getByTestId('quick-log-wine'));
    expect(onLog).toHaveBeenCalledTimes(1);
    const drink = onLog.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(drink.volumeMl).toBe(150);
    expect(drink.abvPct).toBe(12);
  });
});
