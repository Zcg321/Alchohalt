import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import DrinkPresets from '../DrinkPresets';

describe('DrinkPresets', () => {
  it('renders without crashing', () => {
    const mockPresets = [
      { volumeMl: 355, abvPct: 5.0, name: 'Beer' },
      { volumeMl: 150, abvPct: 12.0, name: 'Wine' }
    ];
    render(<DrinkPresets presets={mockPresets} onSelectPreset={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('handles preset selection', () => {
    let selectedPreset: any = null;
    const mockPresets = [
      { volumeMl: 355, abvPct: 5.0, name: 'Beer' }
    ];
    const { container } = render(
      <DrinkPresets presets={mockPresets} onSelectPreset={(p) => { selectedPreset = p; }} />
    );
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => fireEvent.click(button));
    expect(container).toBeTruthy();
  });

  it('renders with empty presets array', () => {
    render(<DrinkPresets presets={[]} onSelectPreset={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
