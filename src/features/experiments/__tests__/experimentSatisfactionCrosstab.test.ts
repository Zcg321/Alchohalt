/**
 * [R27-2] Cross-tab tests — pure logic.
 */
import { describe, expect, it } from 'vitest';
import { buildExperimentSatisfactionCrosstab } from '../experimentSatisfactionCrosstab';
import type { Experiment } from '../registry';
import type { ExposureRecord } from '../bucket';
import type { SatisfactionSignal } from '../../satisfaction/satisfaction';

const EXP: Experiment = {
  key: 'test-exp',
  variants: ['control', 'variant'] as const,
  status: 'active',
  description: '',
};

const ARCHIVED: Experiment = {
  ...EXP,
  key: 'archived-exp',
  status: 'archived',
};

const DRAFT: Experiment = {
  ...EXP,
  key: 'draft-exp',
  status: 'draft',
};

describe('[R27-2] buildExperimentSatisfactionCrosstab', () => {
  it('skips experiments with no exposures', () => {
    const out = buildExperimentSatisfactionCrosstab([EXP], [], []);
    expect(out).toEqual([]);
  });

  it('skips draft-status experiments even if they have exposures', () => {
    const exposures: ExposureRecord[] = [
      { key: 'draft-exp', variant: 'control', ts: 100 },
    ];
    const out = buildExperimentSatisfactionCrosstab([DRAFT], exposures, []);
    expect(out).toEqual([]);
  });

  it('includes archived experiments with exposures', () => {
    const exposures: ExposureRecord[] = [
      { key: 'archived-exp', variant: 'control', ts: 100 },
    ];
    const out = buildExperimentSatisfactionCrosstab([ARCHIVED], exposures, []);
    expect(out).toHaveLength(1);
    expect(out[0]?.experimentKey).toBe('archived-exp');
  });

  it('uses the earliest exposure ts as firstExposureTs', () => {
    const exposures: ExposureRecord[] = [
      { key: 'test-exp', variant: 'control', ts: 1000 },
      { key: 'test-exp', variant: 'control', ts: 500 },
      { key: 'test-exp', variant: 'control', ts: 2000 },
    ];
    const out = buildExperimentSatisfactionCrosstab([EXP], exposures, []);
    expect(out[0]?.firstExposureTs).toBe(500);
    expect(out[0]?.exposureCount).toBe(3);
  });

  it('counts only signals after firstExposureTs', () => {
    const exposures: ExposureRecord[] = [
      { key: 'test-exp', variant: 'control', ts: 1000 },
    ];
    const signals: SatisfactionSignal[] = [
      { surface: 'today-panel', response: 'up', ts: 500 }, // before — excluded
      { surface: 'today-panel', response: 'up', ts: 1500 }, // after — counted
      { surface: 'today-panel', response: 'down', ts: 2000 }, // after — counted
    ];
    const out = buildExperimentSatisfactionCrosstab([EXP], exposures, signals);
    expect(out[0]?.up).toBe(1);
    expect(out[0]?.down).toBe(1);
    expect(out[0]?.positivePct).toBe(50);
  });

  it('returns null positivePct when no post-exposure signals exist', () => {
    const exposures: ExposureRecord[] = [
      { key: 'test-exp', variant: 'control', ts: 5000 },
    ];
    const signals: SatisfactionSignal[] = [
      { surface: 'today-panel', response: 'up', ts: 100 }, // pre-exposure
    ];
    const out = buildExperimentSatisfactionCrosstab([EXP], exposures, signals);
    expect(out[0]?.positivePct).toBe(null);
    expect(out[0]?.up).toBe(0);
    expect(out[0]?.down).toBe(0);
  });

  it('respects optional surface allow-list', () => {
    const exposures: ExposureRecord[] = [
      { key: 'test-exp', variant: 'variant', ts: 1000 },
    ];
    const signals: SatisfactionSignal[] = [
      { surface: 'today-panel', response: 'up', ts: 1500 },
      { surface: 'drink-form', response: 'down', ts: 1500 },
    ];
    const out = buildExperimentSatisfactionCrosstab(
      [EXP],
      exposures,
      signals,
      ['today-panel'],
    );
    expect(out[0]?.up).toBe(1);
    expect(out[0]?.down).toBe(0);
    expect(out[0]?.positivePct).toBe(100);
  });

  it('records the device variant from the first exposure record', () => {
    const exposures: ExposureRecord[] = [
      { key: 'test-exp', variant: 'variant', ts: 1000 },
    ];
    const out = buildExperimentSatisfactionCrosstab([EXP], exposures, []);
    expect(out[0]?.variant).toBe('variant');
  });

  it('returns one row per registry entry that has exposures', () => {
    const otherExp: Experiment = { ...EXP, key: 'other-exp' };
    const exposures: ExposureRecord[] = [
      { key: 'test-exp', variant: 'control', ts: 1000 },
      { key: 'other-exp', variant: 'variant', ts: 2000 },
    ];
    const out = buildExperimentSatisfactionCrosstab(
      [EXP, otherExp],
      exposures,
      [],
    );
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.experimentKey).sort()).toEqual(['other-exp', 'test-exp']);
  });
});
