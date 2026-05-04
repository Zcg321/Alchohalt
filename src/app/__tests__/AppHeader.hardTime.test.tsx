/**
 * [R25-C] Header pill opens HardTimePanel (urgent right-now surface)
 * — promoted from a Today-only CTA so users can reach 988 / breathing
 * timer / quiet rest from any tab in 1 tap.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppHeader from '../AppHeader';
import { LanguageProvider } from '../../i18n';

describe('[R25-C] AppHeader hard-time pill', () => {
  it('renders the pill when onOpenHardTime is provided', () => {
    render(
      <LanguageProvider>
        <AppHeader onOpenHardTime={() => undefined} />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('header-hard-time-pill')).toBeInTheDocument();
  });

  it('hides the pill when no callback is provided', () => {
    render(
      <LanguageProvider>
        <AppHeader />
      </LanguageProvider>,
    );
    expect(screen.queryByTestId('header-hard-time-pill')).toBeNull();
  });

  it('clicking the pill calls onOpenHardTime', () => {
    const cb = vi.fn();
    render(
      <LanguageProvider>
        <AppHeader onOpenHardTime={cb} />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByTestId('header-hard-time-pill'));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('aria-label names the urgent action, not the directory', () => {
    render(
      <LanguageProvider>
        <AppHeader onOpenHardTime={() => undefined} />
      </LanguageProvider>,
    );
    const pill = screen.getByTestId('header-hard-time-pill');
    expect(pill.getAttribute('aria-label')).toMatch(/right-now|breathing|hotlines/i);
  });
});
