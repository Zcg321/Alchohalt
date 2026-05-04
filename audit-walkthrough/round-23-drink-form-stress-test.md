# Round 23 — Drink-form usability stress test

Date: 2026-05-03
Judge: synthetic 5-persona usability walk (R23-3)

The drink-form is the load-bearing UX of the app. R23-3 audits it
across five personas — each with different cognitive load,
attention budget, and physical constraint — and counts the
friction events between "I want to log a drink" and "drink is
saved."

## Method

For each persona, walk through the **time-to-first-drink-logged**
path on a fresh app install. Count:

- **Taps** required (chip presses, expand-toggle taps, save).
- **Cognitive decisions** required (what type? when? volume? abv?
  intention? craving? halt? alt? time?).
- **Reading load** events (form labels, error states, hint text
  the user has to consume to proceed).
- **Friction events** — any moment the persona pauses, re-reads,
  or backs out of a decision.

Comparison baseline: the R23-D detailed-mode form. Quick mode
(R23-D) is also evaluated where it matters.

## Personas

### P1 — Day 0 user (just installed, no context)

**Profile**: Curious. Just installed alchohalt after seeing it
recommended. Hasn't picked an intent yet (or picked "Decide later"
in R23-C). Their first interaction with the form is the test of
whether the app feels overwhelming or simple.

**Walk** — detailed mode:
1. Track tab visible. Form heading "Log a drink" visible. Chip
   row "Beer / Wine / Cocktail / Custom" + datetime input + Add
   button. (1 read)
2. Tap "Beer" (1 tap). Beer chip selected; defaults applied.
3. Datetime input shows "now" — leave it (0 taps).
4. Tap "Add" (1 tap). Drink saved.

**Total**: 2 taps + 1 reading event + 1 cognitive decision (which
chip). **Friction events: 0.** This is the golden path; the
progressive-disclosure design from sprint 2B (`[IA-3]`) was
correct.

**Walk** — quick mode (R23-D enabled):
1. Track tab. QuickLogChips visible at top: 3 chips (Beer / Wine /
   Cocktail). Each shows the type + "Tap to log" subhead. (1 read)
2. Tap "Beer" (1 tap). Drink saved instantly.

**Total**: 1 tap + 1 reading event + 1 cognitive decision.
**Friction events: 0.** Quick mode shaves a tap.

**Verdict for P1**: Both modes are clean. Quick mode is a 50%
reduction in tap count for the simplest case. The "Need more
detail?" disclosure is the right escape hatch.

### P2 — Returning user (logged 50 drinks; muscle memory)

**Profile**: Has been using the app for 30 days. Daily logging is
muscle memory. Wants the form out of the way fast. Still uses
detailed-mode by default (didn't notice the R23-D toggle).

**Walk** — detailed mode:
1. Track tab. Form layout familiar. Beer chip pre-selected from
   prior session? **NO** — `useDrinkForm.ts` resets `chip` to
   'beer' on submit but resets `time` to now and clears
   detail/more disclosure. So muscle memory works for chip, not
   for time. (FRICTION: P2 expects datetime to default to "now"
   on every fresh form. ✅ It does — useDrinkForm L40 calls
   `toLocalInput(initial?.ts ?? Date.now())`.)
2. Tap chip ➜ Tap Add. 2 taps total.

**Verdict for P2**: 0 friction events. Identical to P1 detailed
mode. P2 may benefit more from quick mode (the "Need more detail?"
disclosure becomes obvious after 1 use).

**Recommendation surfaced**: After 7+ logged drinks, surface a
one-time "Try quick log?" toast pointing at the toggle. Deferred
to R24+ (touches the experiment-shim infrastructure).

### P3 — User after a slip (high emotional load, low attention)

**Profile**: Just had a drink they wish they hadn't. Wants to log
it for honesty's sake but is in a mild dissociated state. Reading
load is the binding constraint — every label they have to parse
costs them.

**Walk** — detailed mode:
1. Tap Track tab. Form visible. Heading "Log a drink" reads as
   factual (no "Hey there!" cheerleader voice — the R8 voice
   audit caught this). (0 friction)
2. P3 picks the chip ("Beer" — easy). 1 tap.
3. Time input — defaults to now. P3 is logging an hour ago. They
   tap the datetime input and have to scroll back. (FRICTION: time
   wheels are platform-native and modal; on iOS they take a tap +
   confirm; on Android they take a wheel-spin + confirm.)
4. Tap Add. 4-5 taps total.

**Quick mode walk** for P3:
1. QuickLogChips. Tap Beer.
2. Drink logged at NOW — but P3 wanted a backdated time. They have
   to either:
   a. Tap "Need more detail?" → unfold detailed form → adjust
      time → re-tap chip → save. **8+ taps.**
   b. Edit the just-logged entry from the History list below to
      change its time. **5+ taps including scrolling and finding
      the entry.**

**FRICTION FOUND for P3 in quick mode**: backdating is
significantly harder than detailed mode. The QuickLog chips lock
the time to "now."

**Recommendation**: Add a small "earlier today?" link near the
QuickLog chips that opens the detailed form pre-filled with the
chip choice but lets the user pick a time. Deferred to R24
(touches the toggle UX more deeply than fits R23 scope).

For R23: the quick mode is correctly framed as "tap-to-log"; users
who routinely backdate know to use detailed mode. The toggle gives
them control. Acceptable.

### P4 — Parent in 90 seconds free (interrupted, mobile)

**Profile**: Parent of a toddler. Phone is in their hand. Toddler
is 90 seconds from interrupting them. Wants to log a glass of
wine they just had with dinner before the toddler comes back.

**Walk** — detailed mode:
1. Open app. Track tab visible. Form. Chip → Add. 2 taps. ~3
   seconds. Done. (0 friction)

**Walk** — quick mode (after they've enabled it once):
1. Open app. QuickLogChips. Tap Wine. ~2 seconds. Done.
   (0 friction)

**Verdict for P4**: Both modes serve the speed-binding case.
Quick mode wins by a tap; detailed mode adds zero friction
because the chip+datetime+Add path is already at the speed limit
of "interact with phone in any way."

### P5 — Low-vision user (large text, slow reading)

**Profile**: Uses the system text-size scale at 130%. Can read
the screen but each label takes a beat. Reading load is the
binding constraint — every visible word the user has to parse is
a friction event.

**Walk** — detailed mode:
1. Track tab. Form. Chip row reads "Beer / Wine / Cocktail /
   Custom" — 4 labels, 4 reading events. (4 reading events)
2. "When?" label + datetime input — 2 reading events.
3. "Add detail ▾" disclosure — visible, present even when not
   open. 1 reading event the user pays even if they don't use it.
4. "More ▾" disclosure — same. 1 more reading event.
5. Total reading load before they can decide: ~8 events.
6. Tap chip → Tap Add. 2 taps.

**FRICTION FOUND for P5 in detailed mode**: the disclosure
toggles ("Add detail ▾" / "More ▾") are unconditional even on a
fresh form where the user just wants the simple path. They cost
2 reading events the user can't skip. Estimated friction:
+0.6 seconds per session for a 130%-text user.

**Walk** — quick mode for P5:
1. QuickLogChips visible. Each chip has a 16px headline + 12px
   subhead "Tap to log". 6 reading events for 3 chips.
2. The "Need more detail?" link is below the chips, but P5 can
   skip past it visually — its weight is `text-sm text-primary`.
   Estimated reading load: 1 cumulative event (P5 sees the link
   exists but doesn't read it on the second use forward).
3. Tap a chip. Done.

**Verdict for P5**: Quick mode is a real win. ~7 reading events
in detailed mode → ~6-7 in quick mode the first session, 4-5 on
subsequent (the "Tap to log" subhead is once-learned).

**Recommendation surfaced**: The disclosure toggles in detailed
mode could be `aria-expanded` + visually less prominent on the
default-collapsed state — a quiet caret instead of a "Add
detail ▾" pill. Deferred to R24+ (touches the disclosure
component pattern across the form).

## Friction count summary

| Persona | Detailed mode | Quick mode |
|---|---|---|
| P1 (Day 0) | 2 taps, 1 read, 0 friction | 1 tap, 1 read, 0 friction |
| P2 (returning) | 2 taps, 0 friction | 1 tap, 0 friction |
| P3 (after slip) | 4-5 taps, 1 friction (backdate) | 8+ taps, 1 friction (backdate fix) |
| P4 (parent, 90s) | 2 taps, 0 friction | 1 tap, 0 friction |
| P5 (low vision) | 2 taps, ~8 reads, 1 friction (disclosure noise) | 1 tap, ~6 reads, 0 friction |

## What R23-3 catches that the other 22 don't

The "time-to-first-drink-logged-by-persona" metric. Most prior
judges (a11y, voice, copy edit) check that the form is correct in
isolation. R23-3 measures it as a sequence the user is forced to
walk under realistic constraints (cognitive load, attention
budget, vision impairment, time pressure). Two findings that no
other lens surfaced:

1. **Quick mode is a friction win for low-vision users (P5)**
   even though it was designed for parent/quick-log users (P4).
   The reading-load reduction is the unexpected benefit.
2. **Quick mode is a friction *loss* for backdating users (P3)**
   in a way that detailed mode doesn't have. The slip-recovery
   workflow forces detailed mode and the toggle gives them
   control. Acceptable; flagged for R24 follow-up.

## What R23-3 didn't ship

This judge is analysis-only. No code lands from R23-3 — the
findings inform R24 carry-forward:

- **R24-FF1**: After 7+ logged drinks, surface a one-time "Try
  quick log?" toast.
- **R24-FF2**: Quick-mode "earlier today?" link to backdate
  without unfolding the full detailed form.
- **R24-FF3**: Detailed-mode disclosure toggles less visually
  prominent on default-collapsed state for low-vision users.

## Tests added

None — R23-3 is a usability analysis, not a code change. The
verdict ("both modes serve their cases; the toggle is the right
escape hatch") confirms R23-D shipped at the right shape.
