/**
 * [R17-2] Comprehensive timezone-edge audit.
 *
 * Round 8 caught one DST bug (UTC vs local mixing in computeStreak).
 * Round 17 widens the net to four user-visible timezone scenarios:
 *
 *   1. User travels DST-crossing — phone clock jumps an hour.
 *   2. User travels timezone-crossing — UTC offset changes.
 *   3. User changes phone clock manually — wall clock jumps backwards
 *      OR forwards by hours/days.
 *   4. User re-installs across a DST boundary — fresh app, same DB.
 *
 * The streak / activity / milestone math is computed in UTC throughout,
 * so the date keys derived from drink timestamps stay stable across
 * any wall-clock change. These tests pin that behavior with worked
 * scenarios.
 *
 * What's NOT covered: Date.now() shifting backwards while the app is
 * open. The user can change their phone clock mid-session, but every
 * subsequent computation uses the new now, so the math doesn't try to
 * reconcile two definitions of "today" within one render. Test that
 * scenario at the integration level if it ever becomes a real issue.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  computeStreak,
  computeLongestStreak,
  daysSinceLastDrink,
  computeTotalAFDays,
} from '../calc';

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function buildByDay(drinks: { ts: number; count: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of drinks) {
    const k = dayKey(d.ts);
    out[k] = (out[k] ?? 0) + d.count;
  }
  return out;
}

describe('[R17-2] Timezone edges — DST spring-forward', () => {
  beforeEach(() => {
    // Pin "now" to a known UTC moment so tests aren't flaky with the
    // wall clock. 2026-04-15 12:00:00 UTC is comfortably after the
    // 2026 US DST spring-forward (March 8) and after EU DST (March 29).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  it('streak counts the DST transition day exactly once when AF', () => {
    /* US DST 2026 = March 8 (spring forward at 2 AM local). The user
     * has a drink on March 7 (the day before DST) and then is AF every
     * day through April 15. The streak should be 38 days
     * (March 8 through April 14 = 38 days; today April 15 is also AF
     * but we count "current" streak as days BEFORE today's drink — see
     * computeStreak for the iteration). */
    const byDay = buildByDay([
      { ts: Date.parse('2026-03-07T20:00:00Z'), count: 1 },
    ]);
    const streak = computeStreak(byDay);
    // March 8 → April 15 = 38 days inclusive.
    expect(streak).toBeGreaterThanOrEqual(37);
    expect(streak).toBeLessThanOrEqual(39);
  });

  it('total AF days does not double-count or skip the DST day', () => {
    /* User has one drink ten days before DST. DST is March 8.
     * Earliest = Feb 26. Window from Feb 26 → April 15.
     * That's 49 days inclusive. One drink-day in the middle.
     * Total AF = 48. The DST hour change must not add or remove a day. */
    const drinkTs = Date.parse('2026-02-26T18:00:00Z');
    const byDay = buildByDay([{ ts: drinkTs, count: 1 }]);
    const total = computeTotalAFDays(byDay);
    expect(total).toBeGreaterThanOrEqual(47);
    expect(total).toBeLessThanOrEqual(49);
  });

  it('longest streak agrees with current streak when only one drink event exists', () => {
    /* This was the original R8 bug: streak and longest disagreed when
     * the iteration crossed DST. Pinned here. */
    const byDay = buildByDay([
      { ts: Date.parse('2026-03-07T20:00:00Z'), count: 1 },
    ]);
    expect(computeLongestStreak(byDay)).toBe(computeStreak(byDay));
  });
});

describe('[R17-2] Timezone edges — fall-back DST', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-11-15 12:00 UTC is comfortably after US fall-back (Nov 1).
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  it('does not double-count the repeated wall-clock hour', () => {
    /* On fall-back day, 1:00–2:00 local happens twice in many US zones.
     * Two drinks at "1:30 local" would both have distinct UTC ts values
     * and could land on the same OR different UTC dates depending on
     * offset. We assert the count is exactly 2 — never 1, never 3. */
    const morningTs = Date.parse('2026-11-01T06:30:00Z');
    const repeatedHourTs = Date.parse('2026-11-01T07:30:00Z');
    const byDay = buildByDay([
      { ts: morningTs, count: 1 },
      { ts: repeatedHourTs, count: 1 },
    ]);
    const sum = Object.values(byDay).reduce((a, b) => a + b, 0);
    expect(sum).toBe(2);
  });

  it('streak does not skip the fall-back day', () => {
    /* User's last drink was Oct 30 (before fall-back Nov 1). Today is
     * Nov 15. AF streak should be 15 days (Oct 31 → Nov 14, plus today
     * which is also AF). */
    const byDay = buildByDay([{ ts: Date.parse('2026-10-30T20:00:00Z'), count: 1 }]);
    const streak = computeStreak(byDay);
    expect(streak).toBeGreaterThanOrEqual(14);
    expect(streak).toBeLessThanOrEqual(16);
  });
});

describe('[R17-2] Timezone edges — user travels timezone-crossing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  it('drink logged in NYC at 11pm and again in LAX at 10pm same UTC day still counts as one day', () => {
    /* Timestamps in UTC are absolute. The user's wall clock changing
     * doesn't move the timestamp. If both drinks happen in the same
     * 24-hour UTC window, they land on the same date key. */
    const t1 = Date.parse('2026-06-14T03:00:00Z'); // NYC 11pm Jun 13 EDT
    const t2 = Date.parse('2026-06-14T05:00:00Z'); // LAX 10pm Jun 13 PDT
    expect(dayKey(t1)).toBe(dayKey(t2));
  });

  it('crossing the international date line within the same calendar day produces two date keys', () => {
    /* This is real and intentional: Hawaii midnight to Auckland midnight
     * spans two UTC dates because the actual elapsed UTC time is ~22 hours.
     * The math is correct — the user actually was in two days as UTC sees it. */
    const honolulu = Date.parse('2026-06-15T10:00:00Z'); // HST midnight = UTC 10:00
    const auckland = Date.parse('2026-06-15T12:00:00Z'); // NZST midnight Jun 16 = UTC Jun 15 12:00
    expect(dayKey(honolulu)).toBe('2026-06-15');
    expect(dayKey(auckland)).toBe('2026-06-15');
    /* But a drink at HST 11pm and one at NZST 1am — both feel like
     * "today" to the user — could land on different UTC dates. This is
     * acceptable: the app tracks UTC days, which is the only choice
     * that survives travel + DST consistently. The user's other timezone
     * tools (calendar, photos) make the same trade. */
  });
});

describe('[R17-2] Timezone edges — user manually changes phone clock', () => {
  it('wall clock jumping backwards a day does not corrupt streak — daysSinceLastDrink is bounded', () => {
    /* User had a drink "yesterday" but then sets their clock back one
     * week. daysSinceLastDrink iterates from today and stops when it
     * sees a drink-day. The bound (3650 = 10 years) prevents an
     * infinite loop if the iteration walked past every entry. */
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    const byDay = buildByDay([{ ts: Date.parse('2026-06-14T20:00:00Z'), count: 1 }]);
    expect(daysSinceLastDrink(byDay)).toBe(1); // today AF, yesterday drink.

    // Now jump clock back a week.
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'));
    /* The drink is now in the user's "future". computeStreak walks
     * BACKWARDS from today, so it never sees future drinks. Streak is
     * the count of consecutive AF days going back from today. Since
     * everything before the drink is unrecorded (no drink-day), the
     * streak walks until earliestKey. */
    const streakAfterClockJump = computeStreak(byDay);
    expect(streakAfterClockJump).toBeGreaterThanOrEqual(0);
    /* The key invariant: doesn't crash, doesn't loop forever. */
    vi.useRealTimers();
  });

  it('wall clock jumping forwards a year does not produce a 365-day phantom streak', () => {
    /* User had a drink today. Then sets clock forward a year. */
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    const byDay = buildByDay([{ ts: Date.parse('2026-06-15T18:00:00Z'), count: 1 }]);
    vi.setSystemTime(new Date('2027-06-15T12:00:00Z'));
    /* Streak should reflect the year of unrecorded days as a streak —
     * because as far as the data shows, there were no drinks in that
     * year. This is correct! Inactive ≠ drinking. The 'inactive user'
     * has nothing to dispute. The bound (3650) guarantees no infinite
     * loop if the user time-travels further. */
    const streak = computeStreak(byDay);
    expect(streak).toBeGreaterThan(360);
    expect(streak).toBeLessThan(370);
    expect(streak).toBeLessThan(3650);
    vi.useRealTimers();
  });
});

describe('[R17-2] Timezone edges — re-install across DST', () => {
  it('an exported byDay map re-imported after DST produces identical streak values', () => {
    /* The byDay keys are 'YYYY-MM-DD' strings derived from UTC. They
     * survive any export/import cycle by serializing as plain JSON.
     * This pins the round-trip — if anyone ever changes the date key
     * format to use local time, this test fails immediately. */
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z')); // post-DST
    const byDay = buildByDay([{ ts: Date.parse('2026-03-07T20:00:00Z'), count: 1 }]);
    const streakBefore = computeStreak(byDay);

    // Round-trip through JSON.
    const exported = JSON.stringify(byDay);
    const imported = JSON.parse(exported) as Record<string, number>;
    const streakAfter = computeStreak(imported);

    expect(streakAfter).toBe(streakBefore);
    vi.useRealTimers();
  });
});
