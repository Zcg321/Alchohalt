import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DrinkForm from '../index';

/** Drink-form progressive disclosure ([IA-3]):
 *  - default: chip + time only.
 *  - "Add detail ▾" reveals volume + ABV.
 *  - "More ▾" reveals intention chips, craving slider, HALT, alt action.
 *  - aria-hidden flips on the panels so SR users see the collapsed state.
 */
describe('DrinkForm — progressive disclosure', () => {
  function setup() {
    const submitted: any[] = [];
    const utils = render(
      <DrinkForm
        onSubmit={(d) => submitted.push(d)}
        presets={[]}
      />,
    );
    return { ...utils, submitted };
  }

  it('renders the four canonical drink chips at the top level', () => {
    setup();
    expect(screen.getByRole('radio', { name: /Beer/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Wine/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Cocktail/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Custom/ })).toBeInTheDocument();
  });

  it('renders a time picker as a top-level field', () => {
    setup();
    expect(screen.getByLabelText(/When\?/i)).toHaveAttribute('type', 'datetime-local');
  });

  it('volume and ABV panels are aria-hidden until "Add detail" expands', () => {
    setup();
    const detailPanel = document.getElementById('drink-detail-panel')!;
    expect(detailPanel.getAttribute('aria-hidden')).toBe('true');

    const toggle = screen.getByRole('button', { name: /Add detail/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(detailPanel.getAttribute('aria-hidden')).toBe('false');
  });

  it('intention, craving, HALT, alt panels are aria-hidden until "More" expands', () => {
    setup();
    const morePanel = document.getElementById('drink-more-panel')!;
    expect(morePanel.getAttribute('aria-hidden')).toBe('true');

    const toggle = screen.getByRole('button', { name: /^More/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(morePanel.getAttribute('aria-hidden')).toBe('false');
  });

  it('Beer chip pre-fills volume=355 / abv=5 when detail expands', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Add detail/i }));
    expect((screen.getByLabelText(/volume/i) as HTMLInputElement).value).toBe('355');
    expect((screen.getByLabelText(/abv/i) as HTMLInputElement).value).toBe('5');
  });

  it('Wine chip swaps presets to 150ml / 12%', () => {
    setup();
    fireEvent.click(screen.getByRole('radio', { name: /Wine/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add detail/i }));
    expect((screen.getByLabelText(/volume/i) as HTMLInputElement).value).toBe('150');
    expect((screen.getByLabelText(/abv/i) as HTMLInputElement).value).toBe('12');
  });

  it('submitting from default level produces a valid drink with chip presets', () => {
    const { submitted } = setup();
    fireEvent.click(screen.getByRole('radio', { name: /Wine/ }));
    fireEvent.submit(document.getElementById('drink-form')!);
    expect(submitted).toHaveLength(1);
    expect(submitted[0].volumeMl).toBe(150);
    expect(submitted[0].abvPct).toBe(12);
  });

  it('disclosure state collapses again after a successful submit (session-only)', () => {
    const { submitted } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Add detail/i }));
    fireEvent.click(screen.getByRole('button', { name: /^More/i }));
    fireEvent.submit(document.getElementById('drink-form')!);
    expect(submitted).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Add detail/i }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: /^More/i }).getAttribute('aria-expanded')).toBe('false');
  });
});
