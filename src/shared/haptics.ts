/**
 * Haptics event map — application-level intent → low-level shim call.
 *
 * The nativeChrome shim exposes three primitives (selection / notification
 * / error). This module turns those into named app events so call sites
 * read like behavior, not platform plumbing:
 *
 *   hapticForEvent('drink-logged')      // subtle tap
 *   hapticForEvent('milestone-reached') // medium tap
 *   hapticForEvent('error')             // double-bump
 *
 * Map (locked 2026-05-01, extended Round 4):
 *   drink-logged       → Light  (`selectionFeedback`)
 *     Confirmation that the entry saved. Should feel like the
 *     same kind of tactile "click" the iOS keyboard ships.
 *   af-day-marked      → Light  (`selectionFeedback`)
 *     Same as drink-logged — the user pressed a button, the
 *     button took the press.
 *   drink-undo         → Light  (`selectionFeedback`)
 *     Round 4. Undoing a delete is the same kind of confirmation
 *     tap as logging — the action took. The undo toast surfaces
 *     for 5s and a single tap restores the entry; the haptic is
 *     a quiet "got it".
 *   settings-toggle    → Light  (`selectionFeedback`)
 *     Round 4. Theme / language / reminders / sync flips. A user
 *     flipping a setting is doing one thing once — the same kind
 *     of confirmation moment as logging an entry.
 *   goal-hit           → Medium (`notificationFeedback`)
 *     A stronger bump for genuinely good news. NOT used for
 *     every drink-stayed-under-cap event — only when a real
 *     goal lands (a weekly goal closing under, a streak
 *     threshold). Round 4 fires this on a weekly-AF-cycle
 *     close: count of std=0 entries in the past 7 days hits a
 *     positive multiple of 7.
 *   milestone-reached  → Medium (`notificationFeedback`)
 *     Same pulse as goal-hit. The milestone surface itself
 *     scale-up animates only for fresh-within-7d milestones,
 *     and this haptic fires on the same transition (false→true
 *     for any milestone in the canonical set). Detected via
 *     Round 4's prev-set ref watcher in AlcoholCoachApp.
 *   error              → Error  (`errorFeedback`)
 *     Subtle warning for errors and denied actions (purchase
 *     failed, sync failed, IAP outage).
 *   crisis-opened      → silence (intentional no-op)
 *     A user opening crisis support is in distress; a tactile
 *     bump in that moment is hostile UX. Documented here so
 *     future contributors don't "complete the map".
 *
 * All calls are fire-and-forget. The underlying shim is a no-op on
 * web and on native when ENABLE_NATIVE_HAPTICS is off, so callers
 * can sprinkle these freely without guards.
 */

import { getHaptics } from './nativeChrome';

export type HapticEvent =
  | 'drink-logged'
  | 'af-day-marked'
  | 'drink-undo'
  | 'settings-toggle'
  | 'goal-hit'
  | 'milestone-reached'
  | 'error'
  | 'crisis-opened';

export function hapticForEvent(event: HapticEvent): void {
  void runHaptic(event).catch(() => {
    /* silent — haptics are decoration, never a failure path */
  });
}

async function runHaptic(event: HapticEvent): Promise<void> {
  if (event === 'crisis-opened') return; // intentional silence
  const h = await getHaptics();
  switch (event) {
    case 'drink-logged':
    case 'af-day-marked':
    case 'drink-undo':
    case 'settings-toggle':
      await h.selectionFeedback();
      return;
    case 'goal-hit':
    case 'milestone-reached':
      await h.notificationFeedback();
      return;
    case 'error':
      await h.errorFeedback();
      return;
  }
}
