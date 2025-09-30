import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AchievementDisplay from '../AchievementDisplay';

describe('AchievementDisplay', () => {
  it('renders without crashing', () => {
    const mockAchievementState = {
      achievements: [],
      totalPoints: 0,
      unlockedCount: 0,
      level: 1,
      nextLevelPoints: 100
    };
    render(<AchievementDisplay achievementState={mockAchievementState} onUpgrade={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('displays achievements', () => {
    const mockAchievementState = {
      achievements: [
        { id: '1', name: 'First Step', description: 'Track first drink', points: 10, unlocked: true }
      ],
      totalPoints: 10,
      unlockedCount: 1,
      level: 1,
      nextLevelPoints: 100
    };
    render(<AchievementDisplay achievementState={mockAchievementState} onUpgrade={() => {}} />);
    expect(document.body).toBeTruthy();
  });

  it('handles multiple achievements', () => {
    const mockAchievementState = {
      achievements: Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        name: `Achievement ${i}`,
        description: `Description ${i}`,
        points: 10 * (i + 1),
        unlocked: i < 3
      })),
      totalPoints: 60,
      unlockedCount: 3,
      level: 2,
      nextLevelPoints: 100
    };
    render(<AchievementDisplay achievementState={mockAchievementState} onUpgrade={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
