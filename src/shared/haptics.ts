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
 * Map (locked 2026-05-01):
 *   drink-logged       → Light  (`selectionFeedback`)
 *     Confirmation that the entry saved. Should feel like the
 *     same kind of tactile "click" the iOS keyboard ships.
 *   af-day-marked      → Light  (`selectionFeedback`)
 *     Same as drink-logged — the user pressed a button, the
 *     button took the press.
 *   goal-hit           → Medium (`notificationFeedback`)
 *     A stronger bump for genuinely good news. NOT used for
 *     every drink-stayed-under-cap event — only when a real
 *     goal lands (a milestone day, a weekly goal closing
 *     under, a streak threshold).
 *   milestone-reached  → Medium (`notificationFeedback`)
 *     Same pulse as goal-hit. The milestone surface itself
 *     scale-up animates only for fresh-within-7d milestones,
 *     and this haptic should fire on the same condition.
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
