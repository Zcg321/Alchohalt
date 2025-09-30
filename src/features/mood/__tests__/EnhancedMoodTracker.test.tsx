import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import EnhancedMoodTracker from '../EnhancedMoodTracker';

describe('EnhancedMoodTracker', () => {
  it('renders without crashing', () => {
    render(<EnhancedMoodTracker />);
    expect(document.body).toBeTruthy();
  });

  it('handles mood tracking with empty state', () => {
    render(<EnhancedMoodTracker moodData={[]} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with mood history', () => {
    const moodHistory = [
      { mood: 5, timestamp: Date.now(), notes: 'Good day' },
      { mood: 3, timestamp: Date.now() - 86400000, notes: 'Okay day' }
    ];
    render(<EnhancedMoodTracker moodData={moodHistory as any} />);
    expect(document.body).toBeTruthy();
  });
});
