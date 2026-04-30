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

/** In-memory transport for tests. Mirrors a single Supabase project
 *  with multiple users. Wired through SyncPanel test specs. */
export class MockSyncTransport implements SyncTransport {
  private users = new Map<string, { userId: string; authHash: string; userSalt: Uint8Array }>();
  private blobs = new Map<string, Map<string, { ciphertext: Uint8Array; updatedAt: string }>>();

  async signUp(
    email: string,
    authHash: Uint8Array,
    userSalt: Uint8Array,
  ): Promise<AuthSession> {
    if (this.users.has(email)) throw new Error('User already exists');
    const userId = `user-${this.users.size + 1}`;
    const authHashHex = Array.from(authHash).map((b) => b.toString(16).padStart(2, '0')).join('');
    this.users.set(email, { userId, authHash: authHashHex, userSalt });
    return { userId, accessToken: `tok-${userId}`, userSalt };
  }

  async signIn(email: string, authHash: Uint8Array): Promise<AuthSession> {
    const u = this.users.get(email);
    if (!u) throw new Error('Unknown user');
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
