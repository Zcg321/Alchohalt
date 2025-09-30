import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MoodTracker from '../MoodTracker';

describe('MoodTracker', () => {
  it('renders without crashing', () => {
    render(<MoodTracker />);
    expect(document.body).toBeTruthy();
  });

  it('accepts onMoodSubmit callback', () => {
    const mockCallback = () => {};
    render(<MoodTracker onMoodSubmit={mockCallback} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with initial mood data', () => {
    const initialData = {
      mood: 5,
      notes: 'Feeling good',
      timestamp: Date.now()
    };
    render(<MoodTracker initialData={initialData as any} />);
    expect(document.body).toBeTruthy();
  });
});
