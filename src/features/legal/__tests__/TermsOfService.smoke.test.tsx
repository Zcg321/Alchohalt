import { describe, it, expect } from 'vitest';
import TermsOfService from '../TermsOfService';

describe('TermsOfService.tsx', () => {
  it('exports a component', () => {
    expect(TermsOfService).toBeDefined();
    expect(typeof TermsOfService).toBe('function');
  });
});
