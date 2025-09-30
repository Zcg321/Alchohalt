import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import GoalRecommendations from '../GoalRecommendations';

describe('GoalRecommendations.tsx', () => {
  it('mounts without crashing', () => {
    const mockOnAccept = vi.fn();
    const mockEntries = [];
    const mockSettings = {
      version: 1,
      language: 'en' as const,
      theme: 'light' as const,
      dailyGoalDrinks: 0,
      weeklyGoalDrinks: 0,
      monthlyBudget: 0,
      reminders: { enabled: false, times: [] },
      showBAC: false
    };
    
    const { container } = render(
      <GoalRecommendations 
        entries={mockEntries}
        settings={mockSettings}
        onAcceptRecommendation={mockOnAccept}
      />
    );
    expect(container).toBeTruthy();
  });
});
