import { describe, expect, it } from 'vitest';
import {
  applyCalmRules,
  applyDailyCap,
  APP_QUIET_HOURS,
  DEFAULT_CALM_CONFIG,
  dropOffTypes,
  dropQuietNotifications,
  dropUnwiredTypes,
  inQuietHours,
  isInAnyQuietWindow,
  SCHEDULING_NOT_YET_WIRED,
  type ScheduledNotification,
} from '../calmConfig';

function n(
  partial: Partial<ScheduledNotification> & { fireAt: number },
): ScheduledNotification {
  return {
    id: partial.id ?? 1,
    type: partial.type ?? 'dailyCheckin',
    title: partial.title ?? 'Alchohalt',
    body: partial.body ?? 'Log your day if you\'d like.',
    fireAt: partial.fireAt,
  };
}

function at(hour: number, day = 1): number {
  // 2026-05-01 is a Friday; safe stable date.
  return new Date(2026, 4, day, hour, 0, 0, 0).getTime();
}

describe('inQuietHours', () => {
  it('returns true inside a same-day window', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 14, 0), { startHour: 12, endHour: 16 })).toBe(true);
  });

  it('returns false outside a same-day window', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 9, 0), { startHour: 12, endHour: 16 })).toBe(false);
  });

  it('returns true at the start hour (inclusive)', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 12, 0), { startHour: 12, endHour: 16 })).toBe(true);
  });

  it('returns false at the end hour (exclusive)', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 16, 0), { startHour: 12, endHour: 16 })).toBe(false);
  });

  it('handles wrap (23-7) — true at 23:00', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 23, 0), APP_QUIET_HOURS)).toBe(true);
  });

  it('handles wrap (23-7) — true at 03:00', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 3, 0), APP_QUIET_HOURS)).toBe(true);
  });

  it('handles wrap (23-7) — false at 07:00', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 7, 0), APP_QUIET_HOURS)).toBe(false);
  });

  it('handles wrap (23-7) — false at 14:00', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 14, 0), APP_QUIET_HOURS)).toBe(false);
  });

  it('returns false when start === end (no quiet window)', () => {
    expect(inQuietHours(new Date(2026, 4, 1, 14, 0), { startHour: 0, endHour: 0 })).toBe(false);
  });
});

describe('isInAnyQuietWindow', () => {
  it('app quiet hours are enforced even if user disables their own', () => {
    expect(
      isInAnyQuietWindow(new Date(2026, 4, 1, 3, 0), { startHour: 0, endHour: 0 }),
    ).toBe(true);
  });

  it('user-extended quiet hours add to app default (union)', () => {
    expect(
      isInAnyQuietWindow(new Date(2026, 4, 1, 14, 0), { startHour: 13, endHour: 15 }),
    ).toBe(true);
  });

  it('hour outside both windows is not quiet', () => {
    expect(
      isInAnyQuietWindow(new Date(2026, 4, 1, 10, 0), { startHour: 13, endHour: 15 }),
    ).toBe(false);
  });
});

describe('dropQuietNotifications', () => {
  it('drops notifications scheduled inside the app quiet window', () => {
    const candidates = [
      n({ id: 1, fireAt: at(3) }), // quiet
      n({ id: 2, fireAt: at(8) }), // ok
      n({ id: 3, fireAt: at(23) }), // quiet
      n({ id: 4, fireAt: at(14) }), // ok
    ];
    const out = dropQuietNotifications(candidates, undefined);
    expect(out.map((x) => x.id)).toEqual([2, 4]);
  });

  it('drops notifications inside a user-extended quiet window', () => {
    const candidates = [
      n({ id: 1, fireAt: at(13) }), // user quiet
      n({ id: 2, fireAt: at(15) }), // ok
    ];
    const out = dropQuietNotifications(candidates, { startHour: 13, endHour: 14 });
    expect(out.map((x) => x.id)).toEqual([2]);
  });
});

describe('applyDailyCap', () => {
  it('keeps the earliest N per calendar day', () => {
    const candidates = [
      n({ id: 1, fireAt: at(9) }),
      n({ id: 2, fireAt: at(12) }),
      n({ id: 3, fireAt: at(18) }),
      n({ id: 4, fireAt: at(20) }),
    ];
    const out = applyDailyCap(candidates, 2);
    expect(out.map((x) => x.id)).toEqual([1, 2]);
  });

  it('caps independently per calendar day', () => {
    const candidates = [
      n({ id: 1, fireAt: at(9, 1) }),
      n({ id: 2, fireAt: at(12, 1) }),
      n({ id: 3, fireAt: at(18, 1) }), // dropped, day 1 cap
      n({ id: 4, fireAt: at(9, 2) }),
      n({ id: 5, fireAt: at(15, 2) }),
    ];
    const out = applyDailyCap(candidates, 2);
    expect(out.map((x) => x.id).sort()).toEqual([1, 2, 4, 5]);
  });

  it('cap of 0 drops everything', () => {
    expect(applyDailyCap([n({ fireAt: at(10) })], 0)).toEqual([]);
  });

  it('negative cap is treated as 0', () => {
    expect(applyDailyCap([n({ fireAt: at(10) })], -1)).toEqual([]);
  });
});

describe('dropOffTypes', () => {
  it('drops types whose toggle is false or missing', () => {
    const candidates = [
      n({ id: 1, type: 'dailyCheckin', fireAt: at(10) }),
      n({ id: 2, type: 'goalMilestone', fireAt: at(11) }),
      n({ id: 3, type: 'retrospective', fireAt: at(12) }),
    ];
    const out = dropOffTypes(candidates, { dailyCheckin: true });
    expect(out.map((x) => x.id)).toEqual([1]);
  });

  it('keeps a type when its toggle is true', () => {
    const candidates = [n({ id: 2, type: 'goalMilestone', fireAt: at(11) })];
    const out = dropOffTypes(candidates, { dailyCheckin: true, goalMilestone: true });
    expect(out.map((x) => x.id)).toEqual([2]);
  });
});

describe('[R13-FIXUP] dropUnwiredTypes', () => {
  it('weeklyRecap is in the unwired set', () => {
    expect(SCHEDULING_NOT_YET_WIRED.has('weeklyRecap')).toBe(true);
  });

  it('drops unwired types regardless of stored config', () => {
    const candidates = [
      n({ id: 1, type: 'dailyCheckin', fireAt: at(10) }),
      n({ id: 2, type: 'weeklyRecap', fireAt: at(11) }),
    ];
    expect(dropUnwiredTypes(candidates).map((x) => x.id)).toEqual([1]);
  });

  it('applyCalmRules drops weeklyRecap even when stored types[weeklyRecap]=true', () => {
    const candidates = [
      n({ id: 1, type: 'dailyCheckin', fireAt: at(10) }),
      n({ id: 2, type: 'weeklyRecap', fireAt: at(11) }),
    ];
    const out = applyCalmRules(candidates, {
      ...DEFAULT_CALM_CONFIG,
      types: { ...DEFAULT_CALM_CONFIG.types, weeklyRecap: true },
    });
    /* The hard floor wins: weeklyRecap doesn't fire even if the user
     * has stored true (e.g. from a stale install before the fixup
     * hid the toggle). */
    expect(out.map((x) => x.id)).toEqual([1]);
  });

  it('non-unwired types still pass through normally', () => {
    const candidates = [
      n({ id: 1, type: 'goalMilestone', fireAt: at(10) }),
    ];
    expect(dropUnwiredTypes(candidates).map((x) => x.id)).toEqual([1]);
  });
});

describe('applyCalmRules — full pipeline', () => {
  it('drops off-types, then quiet hours, then caps', () => {
    const candidates = [
      n({ id: 1, type: 'dailyCheckin', fireAt: at(3) }), // quiet
      n({ id: 2, type: 'dailyCheckin', fireAt: at(9) }), // ok, kept
      n({ id: 3, type: 'dailyCheckin', fireAt: at(12) }), // ok, kept
      n({ id: 4, type: 'dailyCheckin', fireAt: at(15) }), // ok, dropped by cap
      n({ id: 5, type: 'goalMilestone', fireAt: at(10) }), // type off
    ];
    const out = applyCalmRules(candidates, DEFAULT_CALM_CONFIG);
    expect(out.map((x) => x.id)).toEqual([2, 3]);
  });

  it('survives all-off config: nothing fires', () => {
    const candidates = [n({ fireAt: at(10) })];
    const out = applyCalmRules(candidates, {
      ...DEFAULT_CALM_CONFIG,
      types: { dailyCheckin: false },
    });
    expect(out).toEqual([]);
  });

  it('respects user-extended quiet window in addition to app default', () => {
    const candidates = [
      n({ id: 1, fireAt: at(8) }),
      n({ id: 2, fireAt: at(13) }), // user quiet 13-15
    ];
    const out = applyCalmRules(candidates, {
      ...DEFAULT_CALM_CONFIG,
      quietHours: { startHour: 13, endHour: 15 },
    });
    expect(out.map((x) => x.id)).toEqual([1]);
  });

  it('deduplicates input ordering — sort is by fireAt, not array index', () => {
    const candidates = [
      n({ id: 99, fireAt: at(20) }),
      n({ id: 1, fireAt: at(8) }),
      n({ id: 2, fireAt: at(10) }),
    ];
    const out = applyCalmRules(candidates, DEFAULT_CALM_CONFIG);
    expect(out.map((x) => x.id)).toEqual([1, 2]);
  });
});

describe('DEFAULT_CALM_CONFIG', () => {
  it('matches the documented calm posture', () => {
    expect(DEFAULT_CALM_CONFIG.dailyCap).toBe(2);
    expect(DEFAULT_CALM_CONFIG.quietHours).toEqual({ startHour: 23, endHour: 7 });
    expect(DEFAULT_CALM_CONFIG.types.dailyCheckin).toBe(true);
    expect(DEFAULT_CALM_CONFIG.types.goalMilestone).toBe(false);
    expect(DEFAULT_CALM_CONFIG.types.retrospective).toBe(false);
    expect(DEFAULT_CALM_CONFIG.types.backupVerification).toBe(false);
  });
});
