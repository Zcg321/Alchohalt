import { describe, it, expect } from 'vitest';
import {
  parseWinnerFromDescription,
  summarizeExperimentWinners,
} from '../winners';
import type { Experiment } from '../registry';
import type { ExposureRecord } from '../bucket';
import type { SatisfactionSignal } from '../../satisfaction/satisfaction';

describe('parseWinnerFromDescription', () => {
  it('parses bare [winner: arm-name]', () => {
    expect(parseWinnerFromDescription('[winner: softer] copy here')).toBe('softer');
  });

  it('parses [R##-N winner: arm-name]', () => {
    expect(
      parseWinnerFromDescription(
        '[R25-G winner: first-person-trying] Onboarding intent chips ...',
      ),
    ).toBe('first-person-trying');
  });

  it('returns null when no marker present', () => {
    expect(parseWinnerFromDescription('Goal-nudge banner copy: comparison vs goal-first.')).toBe(
      null,
    );
  });

  it('returns null on malformed marker', () => {
    expect(parseWinnerFromDescription('[winner:] unspecified')).toBe(null);
    expect(parseWinnerFromDescription('[winner first-person]')).toBe(null);
  });

  it('honors first match when multiple are present', () => {
    expect(
      parseWinnerFromDescription('[winner: a] later note [winner: b]'),
    ).toBe('a');
  });

  it('accepts arm names with hyphens and digits', () => {
    expect(parseWinnerFromDescription('[winner: arm-2026q2]')).toBe('arm-2026q2');
  });
});

describe('summarizeExperimentWinners', () => {
  const archivedWithWinner: Experiment = {
    key: 'archived-with-winner',
    variants: ['control', 'first-person-trying'] as const,
    status: 'archived',
    description: '[R25-G winner: first-person-trying] details',
  };
  const activeWithWinner: Experiment = {
    key: 'active-with-winner',
    variants: ['control', 'softer'] as const,
    status: 'active',
    description: '[winner: softer] still bucketing',
  };
  const activeNoWinner: Experiment = {
    key: 'active-no-winner',
    variants: ['control', 'b'] as const,
    status: 'active',
    description: 'no marker yet',
  };
  const draft: Experiment = {
    key: 'draft-experiment',
    variants: ['a', 'b'] as const,
    status: 'draft',
    description: 'not yet on',
  };

  function exposure(key: string, variant: string, ts: number): ExposureRecord {
    return { key, variant, ts };
  }

  function signal(surface: string, response: 'up' | 'down', ts: number): SatisfactionSignal {
    return { surface: surface as SatisfactionSignal['surface'], response, ts };
  }

  it('skips draft experiments', () => {
    const out = summarizeExperimentWinners([draft], [], [], []);
    expect(out).toHaveLength(0);
  });

  it('emits a row per non-draft experiment in registry order', () => {
    const out = summarizeExperimentWinners(
      [archivedWithWinner, activeWithWinner, activeNoWinner, draft],
      [],
      [],
      [],
    );
    expect(out.map((r) => r.experimentKey)).toEqual([
      'archived-with-winner',
      'active-with-winner',
      'active-no-winner',
    ]);
  });

  it('canArchiveLosers is true only when active + declared winner + not runtime-archived', () => {
    const out = summarizeExperimentWinners(
      [archivedWithWinner, activeWithWinner, activeNoWinner],
      [],
      [],
      [],
    );
    const byKey = Object.fromEntries(out.map((r) => [r.experimentKey, r]));
    expect(byKey['archived-with-winner']!.canArchiveLosers).toBe(false); // already archived
    expect(byKey['active-with-winner']!.canArchiveLosers).toBe(true);
    expect(byKey['active-no-winner']!.canArchiveLosers).toBe(false); // no winner
  });

  it('canArchiveLosers becomes false once experiment is runtime-archived', () => {
    const out = summarizeExperimentWinners(
      [activeWithWinner],
      [],
      [],
      ['active-with-winner'],
    );
    expect(out[0]!.canArchiveLosers).toBe(false);
    expect(out[0]!.runtimeArchived).toBe(true);
    expect(out[0]!.effectiveStatus).toBe('archived');
  });

  it('[R28-B fix] declared winner that is NOT in exp.variants is treated as no winner', () => {
    /* Typo-protection: a `[winner: soFtr]` marker that doesn't
     * match any actual variant must not enable the Archive Losers
     * button. Otherwise a single typo would silently archive the
     * experiment and pin everyone to the production default. */
    const typoWinner: Experiment = {
      key: 'typo-winner',
      variants: ['control', 'softer'] as const,
      status: 'active',
      description: '[winner: soFtr] typo in winner name',
    };
    const out = summarizeExperimentWinners([typoWinner], [], [], []);
    expect(out[0]!.declaredWinner).toBe(null);
    expect(out[0]!.canArchiveLosers).toBe(false);
    expect(out[0]!.readoutLine).toContain('No declared winner yet');
  });

  it('[R28-B fix] declared winner that matches a real variant still enables canArchiveLosers', () => {
    /* Sanity-check the validation didn't break the happy path. */
    const valid: Experiment = {
      key: 'valid-winner',
      variants: ['control', 'softer'] as const,
      status: 'active',
      description: '[winner: softer] valid winner',
    };
    const out = summarizeExperimentWinners([valid], [], [], []);
    expect(out[0]!.declaredWinner).toBe('softer');
    expect(out[0]!.canArchiveLosers).toBe(true);
  });

  it('reports device arm + post-exposure positive% from crosstab', () => {
    const exposures = [exposure('active-with-winner', 'softer', 1000)];
    const signals = [
      signal('goal-nudge', 'up', 1500),
      signal('goal-nudge', 'up', 1600),
      signal('goal-nudge', 'down', 1700),
    ];
    const out = summarizeExperimentWinners(
      [activeWithWinner],
      exposures,
      signals,
      [],
    );
    expect(out[0]!.deviceArm).toBe('softer');
    expect(out[0]!.deviceUp).toBe(2);
    expect(out[0]!.deviceDown).toBe(1);
    expect(out[0]!.devicePositivePct).toBe(67); // round(2/3*100)=67
    expect(out[0]!.readoutLine).toContain("'softer'");
    expect(out[0]!.readoutLine).toContain('Ready to archive losers');
  });

  it('readoutLine notes "no signals after exposure" when none', () => {
    const exposures = [exposure('active-with-winner', 'softer', 1000)];
    const out = summarizeExperimentWinners(
      [activeWithWinner],
      exposures,
      [],
      [],
    );
    expect(out[0]!.deviceArm).toBe('softer');
    expect(out[0]!.devicePositivePct).toBe(null);
    expect(out[0]!.readoutLine).toContain('no signals after exposure');
  });

  it('readoutLine notes archived state when runtime-archived', () => {
    const exposures = [exposure('active-with-winner', 'softer', 1000)];
    const signals = [signal('goal-nudge', 'up', 1500)];
    const out = summarizeExperimentWinners(
      [activeWithWinner],
      exposures,
      signals,
      ['active-with-winner'],
    );
    expect(out[0]!.readoutLine).toContain('archived via runtime override');
  });

  it('readoutLine notes archived state when registry-archived', () => {
    const exposures = [exposure('archived-with-winner', 'first-person-trying', 1000)];
    const signals = [signal('onboarding-recap', 'up', 1500)];
    const out = summarizeExperimentWinners(
      [archivedWithWinner],
      exposures,
      signals,
      [],
    );
    expect(out[0]!.readoutLine).toContain('archived in registry');
  });

  it('explains the no-declared-winner case in plain English', () => {
    const out = summarizeExperimentWinners(
      [activeNoWinner],
      [],
      [],
      [],
    );
    expect(out[0]!.readoutLine).toContain('No declared winner yet');
  });

  it('falls back to "no exposures" when device has no exposure for the experiment', () => {
    const out = summarizeExperimentWinners(
      [activeWithWinner],
      [],
      [],
      [],
    );
    expect(out[0]!.deviceArm).toBe(null);
    expect(out[0]!.readoutLine).toContain('no exposures recorded on this device');
  });
});
