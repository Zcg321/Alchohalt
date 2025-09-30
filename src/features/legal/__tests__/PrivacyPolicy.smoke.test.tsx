import { describe, it, expect } from 'vitest';
import PrivacyPolicy from '../PrivacyPolicy';

describe('PrivacyPolicy.tsx', () => {
  it('exports a component', () => {
    expect(PrivacyPolicy).toBeDefined();
    expect(typeof PrivacyPolicy).toBe('function');
  });
});
