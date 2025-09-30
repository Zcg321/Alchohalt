import { describe, it, expect } from 'vitest';
import OnboardingFlow from '../OnboardingFlow';

describe('OnboardingFlow.tsx', () => {
  it('exports a component', () => {
    expect(OnboardingFlow).toBeDefined();
    expect(typeof OnboardingFlow).toBe('function');
  });
});
