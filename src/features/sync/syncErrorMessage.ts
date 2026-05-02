/**
 * Translate raw transport error messages into something a person can
 * read at 11pm. The transport layer throws strings like 'Bad credentials'
 * and 'User already exists' — that's correct at the protocol layer,
 * wrong at the UI. We don't want to lose the original (it's still in
 * the error report flow), but we want the visible message to (a) name
 * what happened, (b) suggest the next step, (c) not blame the user.
 */
export function humanizeSyncError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('bad credentials') || m.includes('not found') || m.includes('invalid')) {
    return "Email and passphrase didn't match. Double-check the passphrase — it's case-sensitive. If you signed up on another device, use the recovery phrase instead.";
  }
  if (m.includes('user already exists')) {
    return "Looks like you already have an account with this email. Try Sign in instead.";
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to')) {
    return "Couldn't reach the sync server. Check your connection and try again — your local data is fine either way.";
  }
  if (m.includes('mnemonic') || m.includes('checksum')) {
    return "That recovery phrase didn't validate. Words are space-separated and case-insensitive; copy-paste tends to be safer than typing.";
  }
  // Fall through: the raw message is at least specific.
  return raw || "Something didn't go through. Try again, and if it keeps happening the report button below sends us the technical details.";
}
