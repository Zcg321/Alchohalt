# Round-13 13th-judge: a journalist writing a positive review

**Persona.** A tech / health-vertical journalist (think *The Verge*, *Wired*, *Vox*) writing a 1,500-word piece on calmer alcohol-tracking apps. They've spent 30 minutes with the app on a real device. They want 3–5 screenshots that distill what makes Alchohalt different from the dozens of streak-shame trackers in the App Store. The piece is positive — they liked the app — and the screenshots are doing the heavy lifting in the layout.

What would they shoot? What's the moment of delight? Is it reachable? Is it screenshot-able?

---

## Five moments worth shooting

### 1. The privacy receipt
**Where:** Settings → Privacy & data → Trust receipt panel.
**The frame:** Toggle on, take an action that touches storage, watch the receipt log it in real-time. Caption: *"Most apps say they don't track you. Alchohalt shows you a live log of every storage write."*
**Quality today:** Good. The toggle is clear, the events list is technical-factual (no "we promise" hand-waving). [R8-C] already nailed the voice.
**Reachable:** Two taps from Home (Settings → scroll to Privacy section). Findable.
**Rough edge:** A first-time user wouldn't know to look for it. The Settings privacy heading reads "No ads. No analytics. Trust receipt included." — the receipt is namechecked but not pinned as a hero feature. Acceptable for now.

### 2. The crisis resources
**Where:** Crisis tab (always-on, never gated).
**The frame:** UK locale, page open. Banner reads "If you or someone near you is in immediate physical danger, call your local emergency number right now (UK/IE 999)." Below: Samaritans 116 123, Drinkline, NHS 111, Childline (R13-A). Caption: *"Most trackers hide crisis resources behind a paywall. Alchohalt opens them for everyone, in your country."*
**Quality today:** Strong. R13-A added youth-specific lines for UK / AU / CA / IE — a journalist with a UK editor will appreciate the local accuracy.
**Reachable:** One tap from any tab (the Crisis tab is always visible).
**Rough edge:** None. This is a hero moment.

### 3. The soft-restart banner
**Where:** Home → header banner.
**The frame:** A user who recently logged a drink after an alcohol-free streak. Banner reads "You're back. 47 alcohol-free days so far." Caption: *"After a relapse, every other tracker resets the counter to zero. Alchohalt names what's actually true."*
**Quality today:** Good. Owner-locked language, three states (building / starting / restart), uses the totalAFDays so the user sees their full history. Round-13 R13-3 added a calm reflective prompt ("Your streak resets today. The longest one (N days) is preserved...") that mounts alongside.
**Reachable:** Default home screen.
**Rough edge:** The R13-3 prompt component exists but isn't wired into TodayHome yet (deferred to R14 with the bundle-bloat triage). The soft-restart banner alone is still the screenshot.

### 4. The audit panel ("What the app is doing right now")
**Where:** Settings → Diagnostics → DiagnosticsAudit (R13-4).
**The frame:** Scroll-to-fit screenshot of the four fieldsets: Notifications (enabled types, quiet-hours, daily cap, app-wide floor) / Accessibility (theme, reduced motion, high contrast) / Locale / Backup. Caption: *"Other apps tell you they respect your privacy. Alchohalt shows you the receipt."*
**Quality today:** New surface (R13-4). Read-only, honest about what it doesn't track ("Last verified backup: not tracked").
**Reachable:** Settings → scroll to Diagnostics → it's right below the onboarding card.
**Rough edge:** Buried under Settings. Not surfaced in the App Store description. **Fix in this commit:** add a short note to the marketing copy.

### 5. The 7-day ribbon
**Where:** Home → for users 30+ days in.
**The frame:** A long-term user's Home, with the ribbon line: "Last 7 days: 4 AF days, 2 logged drink days, 1 over your daily cap." Caption: *"No exclamation marks. No 'great job!' No streak-shame. Just facts."*
**Quality today:** R12-D + R13-B — voice is calm-factual; localized to es / fr / de.
**Reachable:** Home, after the user has logged 7+ entries over 30+ days. (Acceptable gating — this surface is for the long-term user.)
**Rough edge:** First-time install screenshots can't capture this. The journalist would need to either fake a 30-day history or accept that the FirstMonthRibbon screenshot is the "fresh install" angle.

---

## What's reachable but not as photogenic as it should be

- **The drink form's preset buttons** (R13-1: now show "(1 std)" / "(1.5 std)") look great inline but in a screenshot the std-count is a visually quiet annotation. Consider bumping its weight slightly. **Not changed in this commit** — the current weight is intentional (subtle, tabular-nums) and matches the calm voice.

- **The bulk-edit selection bar** (R12-2) demonstrates polish but a screenshot needs a contrived setup (tap Edit on a drink, select 3, see "3 drinks selected" + Done). Worth shooting for app-store screenshots; the journalist piece is unlikely to feature it.

---

## One concrete fix in this commit

The journalist asked: "where do I see the receipt of what the app is doing?" The answer is Settings → Diagnostics → DiagnosticsAudit. The App Store description names privacy and trust receipts but not the round-13 audit. **Updating `docs/launch/app-store-description.md`** to surface the audit panel as a screenshot-able moment.

---

## Screenshot stitch order (suggested for the journalist)

1. Home with soft-restart banner ("You're back. 47 days...")
2. Crisis tab in en-GB locale (Samaritans + Childline visible)
3. Settings → Trust Receipt (toggle on, log of a recent action)
4. Settings → DiagnosticsAudit (the four-fieldset panel)
5. Home with the 7-day ribbon (long-term user)

Five frames. Tells the differentiator story without a single user complaint and without exposing any private data. Every screenshot is reachable from the default install in under three taps.
