/**
 * [R26-1] SatisfactionChip — render + interaction tests.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SatisfactionChip from '../SatisfactionChip';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';

const NOW = 1_700_000_000_000;

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  const current = useDB.getState().db;
  useDB.setState({
    db: {
      ...current,
      settings: { ...current.settings, satisfactionSignals: undefined },
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('[R26-1] SatisfactionChip', () => {
  it('renders nothing when surface has not been used', () => {
    const { container } = render(
      <SatisfactionChip surface="insights-tab" surfaceUsedTs={undefined} now={() => NOW} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the chip after surface is used and no prior signals exist', () => {
    render(
      <SatisfactionChip
        surface="insights-tab"
        surfaceUsedTs={NOW - 60_000}
        now={() => NOW}
      />,
    );
    expect(screen.getByTestId('satisfaction-chip-insights-tab')).toBeInTheDocument();
    expect(screen.getByTestId('satisfaction-up-insights-tab')).toBeInTheDocument();
    expect(screen.getByTestId('satisfaction-down-insights-tab')).toBeInTheDocument();
  });

  it('records an up response and shows thanks state', () => {
    render(
      <SatisfactionChip
        surface="insights-tab"
        surfaceUsedTs={NOW - 60_000}
        now={() => NOW}
      />,
    );
    fireEvent.click(screen.getByTestId('satisfaction-up-insights-tab'));
    const stored = useDB.getState().db.settings.satisfactionSignals;
    expect(stored).toBeDefined();
    expect(stored).toHaveLength(1);
    expect(stored![0]).toMatchObject({ surface: 'insights-tab', response: 'up', ts: NOW });
    expect(screen.getByTestId('satisfaction-thanks-insights-tab')).toBeInTheDocument();
  });

  it('records a down response', () => {
    render(
      <SatisfactionChip
        surface="drink-form"
        surfaceUsedTs={NOW - 60_000}
        now={() => NOW}
      />,
    );
    fireEvent.click(screen.getByTestId('satisfaction-down-drink-form'));
    const stored = useDB.getState().db.settings.satisfactionSignals;
    expect(stored?.[0]?.response).toBe('down');
  });

  it('dismiss occupies the suppression window without poisoning up-count', () => {
    render(
      <SatisfactionChip
        surface="today-panel"
        surfaceUsedTs={NOW - 60_000}
        now={() => NOW}
      />,
    );
    fireEvent.click(screen.getByTestId('satisfaction-dismiss-today-panel'));
    const stored = useDB.getState().db.settings.satisfactionSignals;
    expect(stored?.[0]?.response).toBe('down');
  });

  it('does not render when a recent same-surface signal exists', () => {
    useDB.getState().setSettings({
      satisfactionSignals: [
        { surface: 'insights-tab', response: 'up', ts: NOW - 60_000 },
      ],
    });
    const { container } = render(
      <SatisfactionChip
        surface="insights-tab"
        surfaceUsedTs={NOW - 24 * 60 * 60 * 1000}
        now={() => NOW}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
