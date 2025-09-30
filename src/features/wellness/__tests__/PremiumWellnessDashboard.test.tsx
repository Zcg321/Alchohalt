import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PremiumWellnessDashboard from '../PremiumWellnessDashboard';

describe('PremiumWellnessDashboard', () => {
  it('renders without crashing', () => {
    render(<PremiumWellnessDashboard />);
    expect(document.body).toBeTruthy();
  });

  it('renders with wellness data', () => {
    const wellnessData = {
      sleepHours: 7,
      exercise: 'moderate',
      hydration: 8,
      stress: 3
    };
    render(<PremiumWellnessDashboard data={wellnessData as any} />);
    expect(document.body).toBeTruthy();
  });

  it('handles empty wellness data', () => {
    render(<PremiumWellnessDashboard data={undefined} />);
    expect(document.body).toBeTruthy();
  });
});
