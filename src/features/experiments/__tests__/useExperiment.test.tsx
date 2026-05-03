import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExperiment } from '../useExperiment';
import { readExposures, clearExposures } from '../bucket';
import * as registryModule from '../registry';

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
  clearExposures();
  vi.restoreAllMocks();
});

describe('[R14-4] useExperiment hook', () => {
  it('returns null for an unknown experiment key', () => {
    const { result } = renderHook(() => useExperiment('unknown-experiment'));
    expect(result.current).toBeNull();
  });

  it('returns null for a draft experiment (not bucketing yet)', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'draft-exp',
      variants: ['A', 'B'],
      status: 'draft',
      description: 'not yet active',
    });
    const { result } = renderHook(() => useExperiment('draft-exp'));
    expect(result.current).toBeNull();
  });

  it('returns null for an archived experiment', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'old-exp',
      variants: ['A', 'B'],
      status: 'archived',
      description: 'kept for historical analysis',
    });
    const { result } = renderHook(() => useExperiment('old-exp'));
    expect(result.current).toBeNull();
  });

  it('returns a variant for an active experiment', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'active-exp',
      variants: ['A', 'B'],
      status: 'active',
      description: 'live test',
    });
    const { result } = renderHook(() => useExperiment('active-exp'));
    expect(result.current === 'A' || result.current === 'B').toBe(true);
  });

  it('records an exposure when active', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'active-exp',
      variants: ['A', 'B'],
      status: 'active',
      description: 'live test',
    });
    renderHook(() => useExperiment('active-exp'));
    const log = readExposures();
    expect(log).toHaveLength(1);
    expect(log[0]?.key).toBe('active-exp');
    expect(log[0]?.variant === 'A' || log[0]?.variant === 'B').toBe(true);
  });

  it('does NOT record an exposure when inactive', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'draft-exp',
      variants: ['A', 'B'],
      status: 'draft',
      description: '',
    });
    renderHook(() => useExperiment('draft-exp'));
    expect(readExposures()).toEqual([]);
  });

  it('returns null and does not crash on misconfigured experiment', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'bad-exp',
      variants: ['A', 'B'],
      weights: [0, 0], // total = 0 → throws inside assignVariant
      status: 'active',
      description: 'misconfigured',
    });
    const { result } = renderHook(() => useExperiment('bad-exp'));
    expect(result.current).toBeNull();
    expect(readExposures()).toEqual([]);
  });

  it('returns the SAME variant on re-render (memoized)', () => {
    vi.spyOn(registryModule, 'findExperiment').mockReturnValue({
      key: 'stable-exp',
      variants: ['A', 'B'],
      status: 'active',
      description: 'persistence test',
    });
    const { result, rerender } = renderHook(() => useExperiment('stable-exp'));
    const first = result.current;
    rerender();
    rerender();
    expect(result.current).toBe(first);
  });
});

describe('[R14-4] live registry is empty by default', () => {
  it('REGISTRY ships empty in R14-4 (no active experiments yet)', () => {
    expect(registryModule.REGISTRY).toEqual([]);
  });
});
