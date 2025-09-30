import { describe, it, expect } from 'vitest';
import * as platform from '../platform';

describe('platform.ts', () => {
  it('exports expected interfaces and services', () => {
    expect(platform).toBeDefined();
    expect(platform.dataService).toBeDefined();
  });
});
