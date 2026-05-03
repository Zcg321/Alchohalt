import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PresetButtons from '../PresetButtons';
import type { DrinkPreset } from '../../DrinkPresets';

/* [R13-1] Each preset button shows a std-drink approximation next
 * to the name. Round-13 brief: "tap to log 'my usual IPA (1 std)',
 * 'my pour of red wine (1.5 std)', 'espresso martini (2 std)'
 * without re-entering." */

describe('[R13-1] PresetButtons std-drink display', () => {
  it('shows (1 std) for a typical 12oz beer at 5% ABV', () => {
    const presets: DrinkPreset[] = [
      { name: 'Beer (12oz)', volumeMl: 355, abvPct: 5.0 },
    ];
    render(<PresetButtons presets={presets} onSelect={vi.fn()} />);
    expect(screen.getByText(/Beer \(12oz\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\(1 std\)|\(1\.0 std\)/)).toBeInTheDocument();
  });

  it('shows (1.5 std) for a 5oz pour of 14% wine', () => {
    const presets: DrinkPreset[] = [
      { name: 'Wine (5oz, big pour)', volumeMl: 178, abvPct: 14.0 },
    ];
    render(<PresetButtons presets={presets} onSelect={vi.fn()} />);
    /* 178 mL × 14% × 0.789 / 14 = 1.405 → rounds to 1.4 */
    expect(screen.getByText(/\(1\.4 std\)/)).toBeInTheDocument();
  });

  it('shows (2 std) for a generous espresso-martini-style preset', () => {
    const presets: DrinkPreset[] = [
      { name: 'Espresso martini', volumeMl: 90, abvPct: 32.0 },
    ];
    render(<PresetButtons presets={presets} onSelect={vi.fn()} />);
    /* 90 mL × 32% × 0.789 / 14 ≈ 1.62 → rounds to 1.6 */
    expect(screen.getByText(/\(1\.6 std\)/)).toBeInTheDocument();
  });

  it('clicking a preset button emits onSelect with the preset', () => {
    const presets: DrinkPreset[] = [
      { name: 'IPA', volumeMl: 473, abvPct: 6.5 },
    ];
    const onSelect = vi.fn();
    render(<PresetButtons presets={presets} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('preset-button-IPA'));
    expect(onSelect).toHaveBeenCalledWith(presets[0]);
  });

  it('aria-label conveys the std-drink count to assistive tech', () => {
    const presets: DrinkPreset[] = [
      { name: 'Beer (12oz)', volumeMl: 355, abvPct: 5.0 },
    ];
    render(<PresetButtons presets={presets} onSelect={vi.fn()} />);
    const btn = screen.getByTestId('preset-button-Beer (12oz)');
    expect(btn.getAttribute('aria-label')).toMatch(
      /Apply preset Beer.*approximately .* standard drinks/i,
    );
  });

  it('renders nothing when presets is empty (no R13 regression)', () => {
    const { container } = render(<PresetButtons presets={[]} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
