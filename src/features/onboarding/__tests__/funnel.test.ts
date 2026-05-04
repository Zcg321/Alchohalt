import { describe, it, expect } from 'vitest';
import { computeOnboardingFunnel } from '../funnel';

describe('[R11-1] computeOnboardingFunnel', () => {
  it('returns zeros + null completion rate when no attempts exist', () => {
    const f = computeOnboardingFunnel(undefined, undefined);
    expect(f.totalAttempts).toBe(0);
    expect(f.totalCompleted).toBe(0);
    expect(f.totalSkipped).toBe(0);
    expect(f.completionRate).toBeNull();
    for (const s of f.steps) {
      expect(s.reached).toBe(0);
      expect(s.droppedHere).toBe(0);
    }
  });

  it("ignores 'not-started' as a no-op", () => {
    const f = computeOnboardingFunnel({ status: 'not-started' }, undefined);
    expect(f.totalAttempts).toBe(0);
  });

  it('completed attempt: every step reached, none dropped', () => {
    const f = computeOnboardingFunnel(
      { status: 'completed', intent: 'cut-back', completedAt: 1 },
      undefined,
    );
    expect(f.totalAttempts).toBe(1);
    expect(f.totalCompleted).toBe(1);
    expect(f.completionRate).toBe(1);
    expect(f.steps[0].reached).toBe(1);
    expect(f.steps[1].reached).toBe(1);
    expect(f.steps[2].reached).toBe(1);
    for (const s of f.steps) expect(s.droppedHere).toBe(0);
  });

  it('skipped at step 0: only step 0 reached, drop counted there', () => {
    const f = computeOnboardingFunnel(
      { status: 'skipped', skipStep: 0, skipPath: 'x-button', completedAt: 1 },
      undefined,
    );
    expect(f.totalAttempts).toBe(1);
    expect(f.totalSkipped).toBe(1);
    expect(f.steps[0].reached).toBe(1);
    expect(f.steps[0].droppedHere).toBe(1);
    expect(f.steps[0].byPath['x-button']).toBe(1);
    expect(f.steps[1].reached).toBe(0);
    expect(f.steps[2].reached).toBe(0);
  });

  it('skipped at step 1: step 0 + step 1 both count as reached, drop at step 1', () => {
    const f = computeOnboardingFunnel(
      { status: 'skipped', skipStep: 1, skipPath: 'escape', completedAt: 1 },
      undefined,
    );
    expect(f.steps[0].reached).toBe(1);
    expect(f.steps[1].reached).toBe(1);
    expect(f.steps[1].droppedHere).toBe(1);
    expect(f.steps[1].byPath['escape']).toBe(1);
    expect(f.steps[2].reached).toBe(0);
  });

  it('history attempts are aggregated alongside the active row', () => {
    const f = computeOnboardingFunnel(
      { status: 'completed', completedAt: 100 },
      [
        { status: 'skipped', skipStep: 0, skipPath: 'x-button', completedAt: 1, revisedAt: 1 },
        { status: 'skipped', skipStep: 1, skipPath: 'backdrop', completedAt: 2, revisedAt: 2 },
        { status: 'completed', completedAt: 3, revisedAt: 3 },
      ],
    );
    expect(f.totalAttempts).toBe(4);
    expect(f.totalCompleted).toBe(2);
    expect(f.totalSkipped).toBe(2);
    expect(f.completionRate).toBe(0.5);
    // Step 0: 4 reached (every attempt at least started); 1 dropped (the x-button skip)
    expect(f.steps[0].reached).toBe(4);
    expect(f.steps[0].droppedHere).toBe(1);
    expect(f.steps[0].byPath['x-button']).toBe(1);
    // Step 1: 3 reached (one stopped at step 0); 1 dropped (the backdrop skip)
    expect(f.steps[1].reached).toBe(3);
    expect(f.steps[1].droppedHere).toBe(1);
    expect(f.steps[1].byPath['backdrop']).toBe(1);
    // Step 2: 2 reached (the two completed); 0 dropped
    expect(f.steps[2].reached).toBe(2);
    expect(f.steps[2].droppedHere).toBe(0);
  });

  it("backfill: missing skipStep on legacy rows defaults to step 0 — least-surprising", () => {
    const f = computeOnboardingFunnel(
      { status: 'skipped', skipPath: 'just-looking', completedAt: 1 },
      undefined,
    );
    expect(f.steps[0].droppedHere).toBe(1);
    expect(f.steps[0].byPath['just-looking']).toBe(1);
  });
});

describe("[R25-2] computeOnboardingFunnel intent counts", () => {
  it('returns zero counts when no attempts', () => {
    const f = computeOnboardingFunnel(undefined, undefined);
    expect(f.intentCounts).toEqual({
      'cut-back': 0, quit: 0, curious: 0, undecided: 0, none: 0,
    });
  });

  it('counts cut-back intent on a completed attempt', () => {
    const f = computeOnboardingFunnel(
      { status: 'completed', intent: 'cut-back', completedAt: 1 },
      undefined,
    );
    expect(f.intentCounts['cut-back']).toBe(1);
  });

  it('counts undecided intent (R23-C "Decide later" tap)', () => {
    const f = computeOnboardingFunnel(
      { status: 'completed', intent: 'undecided', completedAt: 1 },
      undefined,
    );
    expect(f.intentCounts.undecided).toBe(1);
  });

  it('counts undecided when user picks Decide later then skips', () => {
    const f = computeOnboardingFunnel(
      { status: 'skipped', intent: 'undecided', skipStep: 1, skipPath: 'escape', completedAt: 1 },
      undefined,
    );
    expect(f.intentCounts.undecided).toBe(1);
    expect(f.totalSkipped).toBe(1);
  });

  it('counts "none" when an attempt skipped before any chip tap', () => {
    const f = computeOnboardingFunnel(
      { status: 'skipped', skipStep: 0, skipPath: 'just-looking', completedAt: 1 },
      undefined,
    );
    expect(f.intentCounts.none).toBe(1);
  });

  it('aggregates intent counts across history + current', () => {
    const f = computeOnboardingFunnel(
      { status: 'completed', intent: 'curious', completedAt: 100 },
      [
        { status: 'completed', intent: 'cut-back', completedAt: 1, revisedAt: 1 },
        { status: 'completed', intent: 'undecided', completedAt: 2, revisedAt: 2 },
        { status: 'skipped', intent: 'undecided', skipStep: 0, skipPath: 'x-button', completedAt: 3, revisedAt: 3 },
      ],
    );
    expect(f.intentCounts['cut-back']).toBe(1);
    expect(f.intentCounts.curious).toBe(1);
    expect(f.intentCounts.undecided).toBe(2);
  });
});
