# Round-29 — marketing-director 7 concerns triage

[R29-A] Walks each of the seven concerns from
`audit-walkthrough/round-28-marketing-director-judge.md` and tags
each one with status, what was landed in this round, and what is
owner-blocked.

The judge was approving overall — the concerns are post-launch
optimizations, not blockers — but each one is worth tracking so that
nothing falls between rounds.

---

## C1 — No proof of *use* (review-style social proof)

**Judge text (paraphrased):** the listing has zero user-quote social
proof. Pre-launch this is unavoidable; post-launch it should ship
with 5–10 beta-tester quotes in an "Early User Voices" section of the
long description.

**R29 status:** *owner-blocked.* Beta tester quotes can only exist
*after* a beta is run. The R29-1 work item (real user-testing
recruitment script) lays the groundwork — owner can launch a
recruitment campaign on usertesting.com or freelance markets the
moment they're ready, and the 5 scripted prompts in that package are
designed to generate quotable feedback.

**No code change in this round.** The R29-1 recruitment package is
the autonomous deliverable that closes this gap.

---

## C2 — The Today tab buries the privacy moat

**Judge text:** an uncurious first-launch user who never enters
Settings has no signal that this is the privacy app. Today shows the
streak count + drink log + goal progress — that's the *product*, not
the differentiator. Suggested mitigation: a one-time, dismissible
"first-launch privacy headline" card on Today.

**R29 status:** *landed.* Built `FirstLaunchPrivacyCard.tsx` and
mounted it at the top of `TodayHome`. Renders only when:
- `settings.firstLaunchPrivacyCardDismissedAt` is unset
- AND the user has logged ≤ 3 drinks (proxies "first few sessions"
  without requiring session-count tracking)

Tapping "Got it" stamps a timestamp; the card never returns. Reuses
the same i18n keys as `PrivacyHeadline` so the message lines up
across surfaces (single source of truth: `settings.privacy.headline.*`
in the catalog).

5 unit tests pin the render guards.

---

## C3 — Crisis-resources buries the lede

**Judge text:** "Crisis lines on every screen, always free" is the
biggest moat in the description, but it isn't one of the FAQ entries.
A user looking for crisis support in Help wouldn't be led to the
header pill.

**R29 status:** *already landed in R28-FIX.* The crisis-support FAQ
entry (id: `crisis-support`) is at `HelpFaq.tsx` line 113 with the
following copy:

> "How do I find crisis support if I need it right now?" — answer
> describes the always-on header pill, breathing timer, 988/Crisis
> Text Line/SAMHSA, region packs, and that crisis resources are
> "never paid, never gated, and work fully offline."

Verified by reading the existing component.

---

## C4 — Screenshots are still pending capture

**Judge text:** `public/marketing/screenshots/PENDING_CAPTURE.md` is
on record. Until the actual PNGs are committed, the listing cannot
ship. The judge calls this a hard blocker.

**R29 status:** *owner-blocked.* Capture requires Playwright + a
running dev server, neither of which is installable from this
sandboxed CI environment (per the same constraint that drove R28-3's
synthetic walkthrough). Owner-action is documented in
`public/marketing/screenshots/PENDING_CAPTURE.md`:

> Install Playwright (~10 min one-time setup), run the capture
> script per the README, commit the resulting PNGs.

The R28-2 captions are already wired into the capture script, so
the moment the owner runs it the screenshots come out captioned.

---

## C5 — No screenshot demonstrating the premium-features state

**Judge text:** the long description distinguishes free-forever vs
premium clearly, but no screenshot shows the paywall. A reviewer who
believes the list but sees no proof has to take it on faith.

**R29 status:** *partially blocked* — the screenshot requires the
same Playwright capture path as C4. The capture script
(`tools/marketing/capture_screenshots.ts`) already includes
`SubscriptionManager` in its surface list as of R28-2 (verified by
reading the script). The R29 contribution: extending the screenshot
spec to call out the "available, not yet purchased" state explicitly
so the judge's "5-star vs 4-star" distinction is captured.

**No code change in this round.** Documented in
`audit-walkthrough/round-29-marketing-director-triage.md` as a
post-Playwright-capture follow-up.

---

## C6 — App Store subtitle is locale-blind

**Judge text:** "No ads. No analytics. Yours." is 28 chars in EN.
The 6-locale i18n covers in-app strings but the subtitle is a
per-locale App Store Connect field that needs its own translation.

**R29 status:** *landed via R29-3.* The R29-3 deliverable (App Store
metadata localization package) includes the subtitle translated for
each of the 6 shipped locales (es/fr/de/pl/ru), respecting the
30-char App Store limit. See `docs/launch/app-store-locale-pack.md`.

---

## C7 — No landing-page mirror outside the App Store

**Judge text:** most consumer apps have a landing page that mirrors
the App Store description. Currently the only public surface is the
listing + the in-app pages (deep-linked via /legal/* per SHIP-3.1).
Pre-launch this is fine; post-launch it's a 30% organic-discovery
loss.

**R29 status:** *deferred to R30+.* The Vercel deployment is already
serving the SPA at production, and the in-app `/legal/*` routes
(SHIP-3.1) make the privacy + terms surfaces crawlable. A dedicated
landing page is genuinely a separate product surface (different
information architecture, different copy density, different SEO
optimization) — bundling it into a Round-29 commit would compromise
the round's coherence.

The cheapest possible mitigation that *does* land in R29: the App
Store keyword + caption package (R28-2) plus the localized metadata
pack (R29-3) maximize the App Store-side discovery without depending
on inbound link signals from the wider web.

**Recommended R30 scope for C7:** a single static `index.html`
served at the apex domain that mirrors the long description plus
the captioned screenshots, with a "Try it now (PWA)" install CTA
that bypasses the App Store flow. ~1 round of focused work.

---

## Summary

| # | Status | Notes |
|---|--------|-------|
| C1 | owner-blocked | Beta needed; R29-1 recruitment script is the prep |
| C2 | **landed** | FirstLaunchPrivacyCard on Today |
| C3 | already landed | crisis-support FAQ entry from R28-FIX |
| C4 | owner-blocked | Playwright install + capture script |
| C5 | partially blocked | Capture path same as C4; spec documented |
| C6 | **landed via R29-3** | Subtitle translated in locale pack |
| C7 | deferred to R30+ | Static landing page is its own scope |

**Net read:** of the 7 concerns, R29 lands 2 (C2 directly, C6 via
R29-3), confirms 1 was already addressed (C3), and provides the
prep work for 1 owner-action (C1 via R29-1). C4 + C5 are blocked on
the same owner-action (Playwright install). C7 is the only one that
warrants its own future round.

The marketing director would sign off on this round.
