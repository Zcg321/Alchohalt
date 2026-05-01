/**
 * Sync transport interface.
 *
 * Decoupled from the concrete Supabase client so:
 *   1. Tests can swap in an in-memory MockTransport.
 *   2. The owner can plug in their Supabase project URL + anon key
 *      at runtime without us hard-coding either at build time
 *      (the production transport reads them from a thin config
 *      module that's not committed; an env-loader is a follow-up).
 *   3. A future change of provider (e.g. owner self-hosts Postgrest)
 *      doesn't ripple through the UI layer.
 *
 * Auth model:
 *   - signUp(email, authHash, userSalt) creates a Supabase Auth user
 *     with the authHash as the password and stores the userSalt as
 *     user_metadata so any device can recover it on sign-in.
 *   - signIn(email, authHash) returns the same userId + accessToken
 *     and pulls userSalt back out of user_metadata.
 *
 * Ciphertext is always raw bytes — base64 encoding is a transport
 * concern, not a domain one.
 */

export interface AuthSession {
  userId: string;
  accessToken: string;
  /** 16-byte salt used for masterKey + authHash derivation. Stored on
   *  the auth user's metadata (server-readable but useless without
   *  the passphrase). */
  userSalt: Uint8Array;
}

export interface SyncBlob {
  domain: string;
  blobId: string;
  ciphertext: Uint8Array;
}

export interface PullResult {
  blobs: (SyncBlob & { updatedAt: string })[];
  nextCursor: string | null;
}

export interface PushResult {
  accepted: number;
  rejected: { domain: string; blobId: string; reason: string }[];
}

export interface SyncTransport {
  /** [SYNC-3a] Pre-auth salt lookup used by the multi-device sign-in
   *  flow. ALWAYS resolves with 16 raw bytes — for non-existent
   *  emails the production transport returns a pepper-derived fake
   *  salt so the server response leaks no enumeration signal. The
   *  client can't tell a real salt from a fake one until the
   *  subsequent signIn() call fails on auth. */
  getUserSalt(email: string): Promise<Uint8Array>;

  signUp(
    email: string,
    authHash: Uint8Array,
    userSalt: Uint8Array,
  ): Promise<AuthSession>;
  signIn(email: string, authHash: Uint8Array): Promise<AuthSession>;
  push(session: AuthSession, blobs: SyncBlob[]): Promise<PushResult>;
  pull(session: AuthSession, since: string | null): Promise<PullResult>;
  signOut(session: AuthSession): Promise<void>;
}

/** Pepper for fake-salt derivation in MockSyncTransport. The real
 *  pepper lives in Supabase function env (SALT_LOOKUP_PEPPER); the
 *  mock value is only here to keep the mock's enumeration-resistance
 *  posture consistent with the real one for tests. */
const MOCK_PEPPER = 'mock-pepper-not-for-production-use';

/** In-memory transport for tests. Mirrors a single Supabase project
 *  with multiple users. Wired through SyncPanel test specs. */
export class MockSyncTransport implements SyncTransport {
  private users = new Map<string, { userId: string; authHash: string; userSalt: Uint8Array }>();
  private blobs = new Map<string, Map<string, { ciphertext: Uint8Array; updatedAt: string }>>();

  /** Raw response-time delay (ms) the mock waits inside getUserSalt
   *  for both real and fake paths. Tests can shrink it to 0 for
   *  speed and pin variance separately. */
  saltLookupLatencyMs = 5;

  async getUserSalt(email: string): Promise<Uint8Array> {
    const normEmail = email.trim().toLowerCase();
    // Always do BOTH the lookup and the HMAC, return one or the other.
    const [u, fake] = await Promise.all([
      Promise.resolve(this.users.get(normEmail)),
      this.pepperedSalt(normEmail),
      new Promise((r) => setTimeout(r, this.saltLookupLatencyMs)),
    ]);
    return u ? u.userSalt : fake;
  }

  private async pepperedSalt(email: string): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(MOCK_PEPPER),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email));
    return new Uint8Array(sig).subarray(0, 16);
  }

  async signUp(
    email: string,
    authHash: Uint8Array,
    userSalt: Uint8Array,
  ): Promise<AuthSession> {
    const normEmail = email.trim().toLowerCase();
    if (this.users.has(normEmail)) throw new Error('User already exists');
    const userId = `user-${this.users.size + 1}`;
    const authHashHex = Array.from(authHash).map((b) => b.toString(16).padStart(2, '0')).join('');
    this.users.set(normEmail, { userId, authHash: authHashHex, userSalt });
    return { userId, accessToken: `tok-${userId}`, userSalt };
  }

  async signIn(email: string, authHash: Uint8Array): Promise<AuthSession> {
    const normEmail = email.trim().toLowerCase();
    const u = this.users.get(normEmail);
    // Same error message + status either way — the caller cannot
    // distinguish "no such user" from "wrong passphrase". Together
    // with getUserSalt's pepper-derivation, this prevents email
    // enumeration via the sign-in flow.
    if (!u) throw new Error('Bad credentials');
    const authHashHex = Array.from(authHash).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (u.authHash !== authHashHex) throw new Error('Bad credentials');
    return { userId: u.userId, accessToken: `tok-${u.userId}`, userSalt: u.userSalt };
  }

  async push(session: AuthSession, blobs: SyncBlob[]): Promise<PushResult> {
    let userBlobs = this.blobs.get(session.userId);
    if (!userBlobs) {
      userBlobs = new Map();
      this.blobs.set(session.userId, userBlobs);
    }
    const now = new Date().toISOString();
    for (const b of blobs) {
      userBlobs.set(`${b.domain}:${b.blobId}`, { ciphertext: b.ciphertext, updatedAt: now });
    }
    return { accepted: blobs.length, rejected: [] };
  }

  async pull(session: AuthSession, since: string | null): Promise<PullResult> {
    const userBlobs = this.blobs.get(session.userId) ?? new Map();
    const sinceMs = since ? Date.parse(since) : 0;
    const out: (SyncBlob & { updatedAt: string })[] = [];
    for (const [k, v] of userBlobs) {
      if (Date.parse(v.updatedAt) <= sinceMs) continue;
      const [domain, blobId] = k.split(':');
      out.push({ domain: domain!, blobId: blobId!, ciphertext: v.ciphertext, updatedAt: v.updatedAt });
    }
    out.sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
    return { blobs: out, nextCursor: null };
  }

  async signOut(_session: AuthSession): Promise<void> {
    /* in-memory transport has no session table to clear */
  }
}
