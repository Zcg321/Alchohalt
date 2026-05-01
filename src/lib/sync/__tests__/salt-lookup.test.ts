import { describe, expect, it } from 'vitest';
import { MockSyncTransport } from '../transport';
import { deriveAuthHash, generateUserSalt } from '../keys';

/**
 * [SYNC-3a] Salt-lookup contract.
 *
 * The transport.getUserSalt(email) API is the bedrock of multi-device
 * sign-in. These tests pin three guarantees:
 *
 *   1. For a known email, the returned salt is byte-equal to the
 *      one passed at signUp(). A subsequent deriveAuthHash with that
 *      salt produces the authHash the server has on file, so signIn
 *      succeeds.
 *
 *   2. For an UNKNOWN email, the function still returns 16 bytes —
 *      a deterministic HMAC(pepper, email) fake — so an enumeration
 *      attacker can't tell from the salt-lookup response alone
 *      whether the email is on the platform.
 *
 *   3. signIn() with the wrong passphrase returns the SAME error as
 *      signIn() for an email that doesn't exist (both throw a "Bad
 *      credentials" error). Combined with the fake-salt path, this
 *      blocks email enumeration via either endpoint.
 */
describe('[SYNC-3a] MockSyncTransport.getUserSalt', () => {
  it('returns the real salt for a registered email', async () => {
    const t = new MockSyncTransport();
    const userSalt = await generateUserSalt();
    const authHash = await deriveAuthHash('StrongPass123', userSalt);
    await t.signUp('a@b.com', authHash, userSalt);

    const got = await t.getUserSalt('a@b.com');
    expect(Array.from(got)).toEqual(Array.from(userSalt));
  }, 30_000);

  it('normalizes email casing (sign up A@B.com → look up a@b.com)', async () => {
    const t = new MockSyncTransport();
    const userSalt = await generateUserSalt();
    const authHash = await deriveAuthHash('StrongPass123', userSalt);
    await t.signUp('A@B.COM', authHash, userSalt);

    const got = await t.getUserSalt(' a@b.com  ');
    expect(Array.from(got)).toEqual(Array.from(userSalt));
  }, 30_000);

  it('returns 16 bytes for a never-registered email (deterministic fake salt)', async () => {
    const t = new MockSyncTransport();
    const a = await t.getUserSalt('nobody@example.com');
    const b = await t.getUserSalt('nobody@example.com');
    expect(a.length).toBe(16);
    // Deterministic — same input → same fake salt.
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('different unknown emails yield different fake salts', async () => {
    const t = new MockSyncTransport();
    const a = await t.getUserSalt('alice@nowhere.test');
    const b = await t.getUserSalt('bob@nowhere.test');
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('latency variance between real and fake paths stays within budget', async () => {
    const t = new MockSyncTransport();
    t.saltLookupLatencyMs = 0;
    const userSalt = await generateUserSalt();
    const authHash = await deriveAuthHash('StrongPass123', userSalt);
    await t.signUp('real@example.com', authHash, userSalt);

    // Warm up — first invocation pays for crypto.subtle key import.
    await t.getUserSalt('real@example.com');
    await t.getUserSalt('fake@example.com');

    const N = 20;
    let realTotal = 0;
    let fakeTotal = 0;
    for (let i = 0; i < N; i++) {
      const t1 = performance.now();
      await t.getUserSalt('real@example.com');
      realTotal += performance.now() - t1;
      const t2 = performance.now();
      await t.getUserSalt(`fake-${i}@example.com`);
      fakeTotal += performance.now() - t2;
    }
    const ratio = Math.max(realTotal, fakeTotal) / Math.max(0.0001, Math.min(realTotal, fakeTotal));
    // 5x is a generous bound — host CI / vitest noise dominates this
    // measurement; we're only catching gross asymmetries (e.g. real
    // path takes 100x longer because someone added a network round
    // trip). Real-vs-fake should be within 5x on every machine.
    expect(ratio).toBeLessThan(5);
  }, 30_000);
});

describe('[SYNC-3a] enumeration resistance via signIn', () => {
  it('signIn for a never-registered email throws the same error as wrong-passphrase', async () => {
    const t = new MockSyncTransport();
    const realSalt = await generateUserSalt();
    const realAuth = await deriveAuthHash('CorrectPass123', realSalt);
    await t.signUp('real@example.com', realAuth, realSalt);

    const wrongAuth = await deriveAuthHash('WrongPass123', realSalt);
    let wrongMsg: string | null = null;
    try {
      await t.signIn('real@example.com', wrongAuth);
    } catch (e) {
      wrongMsg = (e as Error).message;
    }

    let unknownMsg: string | null = null;
    try {
      const fakeSalt = await t.getUserSalt('nobody@nowhere.test');
      const probeAuth = await deriveAuthHash('AnyPass123', fakeSalt);
      await t.signIn('nobody@nowhere.test', probeAuth);
    } catch (e) {
      unknownMsg = (e as Error).message;
    }

    expect(wrongMsg).toBe('Bad credentials');
    expect(unknownMsg).toBe('Bad credentials');
  }, 60_000);
});
