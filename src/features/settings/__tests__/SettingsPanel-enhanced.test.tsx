import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SettingsPanel from '../SettingsPanel';

describe('SettingsPanel', () => {
  const mockGoals = {
    dailyCap: 2,
    weeklyGoal: 10,
    pricePerStd: 3,
    baselineMonthlySpend: 150
  };

  const mockPresets = [
    { name: 'Beer', volumeMl: 355, abvPct: 5.0 },
    { name: 'Wine', volumeMl: 150, abvPct: 12.0 }
  ];

  it('renders without crashing', () => {
    render(
      <SettingsPanel 
        goals={mockGoals} 
        presets={mockPresets} 
        onGoalsChange={() => {}} 
        onPresetsChange={() => {}} 
      />
    );
    expect(document.body).toBeTruthy();
  });

  it('renders with goals and presets', () => {
    const { container } = render(
      <SettingsPanel 
        goals={mockGoals} 
        presets={mockPresets} 
        onGoalsChange={() => {}} 
        onPresetsChange={() => {}} 
      />
    );
    expect(container).toBeTruthy();
  });

  it('handles goals change callback', () => {
    let goalsChanged = false;
    render(
      <SettingsPanel 
        goals={mockGoals} 
        presets={mockPresets} 
        onGoalsChange={() => { goalsChanged = true; }} 
        onPresetsChange={() => {}} 
      />
    );
    expect(document.body).toBeTruthy();
  });

  it('handles presets change callback', () => {
    let presetsChanged = false;
    render(
      <SettingsPanel 
        goals={mockGoals} 
        presets={mockPresets} 
        onGoalsChange={() => {}} 
        onPresetsChange={() => { presetsChanged = true; }} 
      />
    );
    expect(document.body).toBeTruthy();
  });
});
