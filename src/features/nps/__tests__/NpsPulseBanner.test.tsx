/**
 * [R24-3] NpsPulseBanner — submit + skip flows.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NpsPulseBanner from '../NpsPulseBanner';
import { useDB } from '../../../store/db';
import { LanguageProvider } from '../../../i18n';

beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
  useDB.getState().setSettings({
    npsResponses: undefined,
    npsDismissedAt: undefined,
  });
});

afterEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

function renderBanner(onResolved = vi.fn()) {
  const fixedNow = () => 1_700_000_000_000;
  return {
    onResolved,
    rendered: render(
      <LanguageProvider>
        <NpsPulseBanner now={fixedNow} onResolved={onResolved} />
      </LanguageProvider>,
    ),
  };
}

describe('NpsPulseBanner [R24-3]', () => {
  it('renders the question, slider, and both actions', () => {
    renderBanner();
    expect(screen.getByTestId('nps-pulse-banner')).toBeTruthy();
    expect(screen.getByTestId('nps-pulse-score')).toBeTruthy();
    expect(screen.getByTestId('nps-pulse-submit')).toBeTruthy();
    expect(screen.getByTestId('nps-pulse-skip')).toBeTruthy();
  });

  it('submitting appends a response with score and timestamp', () => {
    const { onResolved } = renderBanner();
    const slider = screen.getByTestId('nps-pulse-score') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '9' } });
    fireEvent.click(screen.getByTestId('nps-pulse-submit'));
    const settings = useDB.getState().db.settings;
    expect(settings.npsResponses).toHaveLength(1);
    expect(settings.npsResponses?.[0]).toMatchObject({
      ts: 1_700_000_000_000,
      score: 9,
    });
    expect(settings.npsResponses?.[0]?.reason).toBeUndefined();
    expect(onResolved).toHaveBeenCalled();
  });

  it('submitting with a reason persists the trimmed reason', () => {
    renderBanner();
    fireEvent.change(screen.getByTestId('nps-pulse-score'), { target: { value: '6' } });
    fireEvent.change(screen.getByTestId('nps-pulse-reason'), {
      target: { value: '  too few daily prompts  ' },
    });
    fireEvent.click(screen.getByTestId('nps-pulse-submit'));
    const r = useDB.getState().db.settings.npsResponses?.[0];
    expect(r?.score).toBe(6);
    expect(r?.reason).toBe('too few daily prompts');
  });

  it('skip records dismissedAt without touching responses', () => {
    const { onResolved } = renderBanner();
    fireEvent.click(screen.getByTestId('nps-pulse-skip'));
    const settings = useDB.getState().db.settings;
    expect(settings.npsDismissedAt).toBe(1_700_000_000_000);
    expect(settings.npsResponses ?? []).toHaveLength(0);
    expect(onResolved).toHaveBeenCalled();
  });

  it('appends to an existing response history rather than replacing', () => {
    useDB.getState().setSettings({
      npsResponses: [{ ts: 1_690_000_000_000, score: 4 }],
    });
    renderBanner();
    fireEvent.change(screen.getByTestId('nps-pulse-score'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('nps-pulse-submit'));
    const responses = useDB.getState().db.settings.npsResponses;
    expect(responses).toHaveLength(2);
    expect(responses?.[0]?.score).toBe(4);
    expect(responses?.[1]?.score).toBe(10);
  });

  it('shows the thanks state and aria-live=polite after submit', () => {
    renderBanner();
    fireEvent.click(screen.getByTestId('nps-pulse-submit'));
    const thanks = screen.getByTestId('nps-pulse-thanks');
    expect(thanks).toBeTruthy();
    expect(thanks.getAttribute('aria-live')).toBe('polite');
  });
});
