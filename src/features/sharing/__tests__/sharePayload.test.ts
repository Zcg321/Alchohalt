import { describe, it, expect } from 'vitest';
import {
  buildPayload,
  encodePayload,
  decodePayload,
  buildShareUrl,
  SHARE_TTL_MS,
  type ShareSelection,
} from '../sharePayload';

const NOW = new Date('2026-05-15T12:00:00').getTime();
const source = {
  currentStreak: 45,
  totalAfDays: 120,
  weeklyGoal: 7,
  last30dTotal: 12,
  activeGoal: { title: '90-day reset', current: 45, target: 90 },
};

const allOff: ShareSelection = {
  currentStreak: false,
  totalAfDays: false,
  weeklyGoal: false,
  last30dTotal: false,
  activeGoalSummary: false,
  message: '',
};

describe('buildPayload', () => {
  it('respects per-field opt-in', () => {
    const p = buildPayload({ ...allOff, currentStreak: true }, source, NOW);
    expect(p.data.currentStreak).toBe(45);
    expect(p.data.totalAfDays).toBeUndefined();
    expect(p.data.activeGoalSummary).toBeUndefined();
  });

  it('omits message when empty/whitespace', () => {
    const p = buildPayload({ ...allOff, message: '   ' }, source, NOW);
    expect(p.message).toBeUndefined();
  });

  it('truncates message to 280 chars', () => {
    const long = 'a'.repeat(500);
    const p = buildPayload({ ...allOff, message: long }, source, NOW);
    expect(p.message?.length).toBe(280);
  });

  it('includes all selected fields when all on', () => {
    const all: ShareSelection = {
      currentStreak: true,
      totalAfDays: true,
      weeklyGoal: true,
      last30dTotal: true,
      activeGoalSummary: true,
      message: 'doing the work',
    };
    const p = buildPayload(all, source, NOW);
    expect(p.data.currentStreak).toBe(45);
    expect(p.data.totalAfDays).toBe(120);
    expect(p.data.activeGoalSummary?.title).toBe('90-day reset');
    expect(p.message).toBe('doing the work');
  });

  it('exp is iat + 24h', () => {
    const p = buildPayload(allOff, source, NOW);
    expect(p.exp - p.iat).toBe(SHARE_TTL_MS);
  });
});

describe('encode/decode round-trip', () => {
  it('preserves data through base64url + JSON', () => {
    const p = buildPayload({ ...allOff, currentStreak: true, message: 'hi' }, source, NOW);
    const encoded = encodePayload(p);
    const result = decodePayload(encoded, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.data.currentStreak).toBe(45);
      expect(result.payload.message).toBe('hi');
    }
  });

  it('marks expired payloads', () => {
    const p = buildPayload(allOff, source, NOW);
    const encoded = encodePayload(p);
    const result = decodePayload(encoded, NOW + SHARE_TTL_MS + 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.expired).toBe(true);
  });

  it('rejects malformed encoded strings', () => {
    expect(decodePayload('not-base64-!@#').ok).toBe(false);
  });

  it('rejects unsupported version', () => {
    const fake = btoa(JSON.stringify({ v: 99, iat: NOW, exp: NOW + 1, data: {} }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = decodePayload(fake, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unsupported-version');
  });

  it('handles unicode messages', () => {
    const p = buildPayload({ ...allOff, message: '90 jours sans alcool — 🌱' }, source, NOW);
    const encoded = encodePayload(p);
    const result = decodePayload(encoded, NOW);
    if (result.ok) expect(result.payload.message).toBe('90 jours sans alcool — 🌱');
  });
});

describe('buildShareUrl', () => {
  it('appends fragment to base origin', () => {
    expect(buildShareUrl('abc', 'https://app.example.com')).toBe('https://app.example.com/share#p=abc');
  });
});
