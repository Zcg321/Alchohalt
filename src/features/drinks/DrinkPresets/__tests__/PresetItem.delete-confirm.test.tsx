import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PresetItem from '../PresetItem';
import type { DrinkPreset } from '../lib';

/* [R13-C] PresetItem delete used to fire on a single tap — too easy
 * to nuke "my usual IPA" by mistake. Round 13 adds tap-to-confirm:
 * first tap arms a 3s confirm window, second tap commits. After 3s
 * the button reverts. */

const sample: DrinkPreset = { name: 'Espresso martini', volumeMl: 90, abvPct: 18 };
const presets: DrinkPreset[] = [sample, { name: 'IPA', volumeMl: 355, abvPct: 6.5 }];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('[R13-C] PresetItem delete tap-to-confirm', () => {
  it('first tap does NOT commit the delete', () => {
    const onChange = vi.fn();
    render(<PresetItem preset={sample} presets={presets} onChange={onChange} />);
    fireEvent.click(screen.getByTestId(`preset-delete-${sample.name}`));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('first tap shows the "Tap again" confirm label', () => {
    const onChange = vi.fn();
    render(<PresetItem preset={sample} presets={presets} onChange={onChange} />);
    fireEvent.click(screen.getByTestId(`preset-delete-${sample.name}`));
    expect(screen.getByText(/Tap again to delete/i)).toBeInTheDocument();
  });

  it('second tap commits — onChange called without the deleted preset', () => {
    const onChange = vi.fn();
    render(<PresetItem preset={sample} presets={presets} onChange={onChange} />);
    fireEvent.click(screen.getByTestId(`preset-delete-${sample.name}`));
    fireEvent.click(screen.getByTestId(`preset-delete-${sample.name}`));
    expect(onChange).toHaveBeenCalledOnce();
    const next = onChange.mock.calls[0]![0] as DrinkPreset[];
    expect(next.find((p) => p.name === sample.name)).toBeUndefined();
    expect(next.find((p) => p.name === 'IPA')).toBeDefined();
  });

  it('confirm window expires after 3s — third tap re-arms instead of committing', () => {
    const onChange = vi.fn();
    render(<PresetItem preset={sample} presets={presets} onChange={onChange} />);
    fireEvent.click(screen.getByTestId(`preset-delete-${sample.name}`));
    /* Drift past the 3-second window without a second tap, wrapped in
     * act() so React flushes the timer-driven setState before we
     * inspect the DOM. */
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    /* The label should have reverted from "Tap again" back to "Delete". */
    expect(screen.getByText(/^Delete$/)).toBeInTheDocument();
    /* And another tap arms again — does not commit. */
    fireEvent.click(screen.getByTestId(`preset-delete-${sample.name}`));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Tap again to delete/i)).toBeInTheDocument();
  });

  it('the aria-label flips to "Confirm delete X" while armed', () => {
    const onChange = vi.fn();
    render(<PresetItem preset={sample} presets={presets} onChange={onChange} />);
    const btn = screen.getByTestId(`preset-delete-${sample.name}`);
    expect(btn).toHaveAttribute('aria-label', `Delete ${sample.name}`);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-label', `Confirm delete ${sample.name}`);
  });
});
