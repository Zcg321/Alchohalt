# Spectacular gate — four judges — 2026-05-01

Each judge took an independent pass through the surfaces post-fix.

---

## 1. Linear designer — hierarchy & motion

**Verdict: ship it, with two notes.**

The visual system is restrained and intentional. Sage as the
recovery accent, indigo as the help-resource accent, crisis red
reserved for actual danger. Tokens flow from
`src/styles/theme.css` → Tailwind utilities. No raw hex in
component layers.

Hierarchy reads cleanly on Today: streak counter is the hero, drink
log is the action, secondary info is grouped under headings with
consistent type scale (`text-h2` → `text-h3` → `text-caption` →
`text-micro`). Spacing tokens (`p-card`, `py-section-y-mobile`)
keep rhythm steady.

Motion is mostly good — `animate-fade-in`, `animate-slide-up`,
`animate-scale-up` are subtle, brief (200-300ms), and properly
zeroed under `prefers-reduced-motion`.

**Notes:**

- The Crisis modal's `animate-slide-up` is a heavy entry for a
  surface that should feel calm. Consider `animate-fade-in` only —
  drama from a crisis modal can read as alarming when the user is
  already in distress.
- `Milestones.tsx:133` has `animate-scale-up` triggering whenever
  a milestone is reached. Combined with the existing toast, that's
  two motion elements competing. Reduce one or the other.

These are polish-tier — not blockers.

---

## 2. NYT writer — does any string read like marketing?

**Verdict: 92% clean. One file is still ad-copy.**

The tab labels, headings, error messages, and crisis copy read as
plain English. The reduce-stigma framing on the Crisis page is
particularly well-handled:

> "Free help, available right now. We never see who you call or text —
> these links open your phone's native dialer or messaging app."

Direct, factual, names the thing.

**One offender:** the PWA manifest + `<meta name="description">`
in `index.html`:

> "AI-powered alcohol tracking with personalized insights, smart
> recommendations, and goal management. 100% offline and private."

This is the description that goes on the App Store, in browser
tab previews, in Open Graph cards, in the install prompt. Five
suspect phrases: "AI-powered", "personalized insights", "smart
recommendations", "goal management", "100% offline and private."

- "AI-powered" — the only LLM/ML in the code is heuristic
  pattern-matching in `src/features/insights/insightGenerators.tsx`.
  Calling that "AI" is generous; calling it "AI-powered" is a
  stretch.
- "personalized insights" + "smart recommendations" — empty
  modifiers; both could be deleted with no information loss.
- "100% offline" — slightly stronger than the truth post-SYNC-3.
  Sync is opt-in, the *default* is offline, but "100%" reads as
  invariant.

**Suggested rewrite:**

> "Private alcohol tracker. Local-first, optional encrypted sync,
> never sells your data. Daily limits, weekly goals, and crisis
> resources built in."

Concrete features. No empty modifiers. The "never sells your data"
line earns the trust the marketing language was reaching for.

Filed but not shipped — manifest descriptions are App Store
listings; rewriting deserves the owner's eye.

The other surface I'd watch: `PremiumWellnessDashboard.tsx`. The
title and feature names ("Wellness Score", "Wellness Trend") have
that wellness-app flavor of meaning-by-vibes. The actual content is
fine.

---

## 3. Stripe frontend — would I merge this?

**Verdict: yes, after this audit. Pre-audit: no.**

What I would have flagged in the pre-audit branch:

- 3 lint errors. Fixed.
- 6 typecheck errors in committed test fixtures. Fixed.
- An "analytics" module silently writing PII to localStorage with
  no upload destination. **This would have been a hard block.**
  Fixed.
- Direct `localStorage` calls scattered through 6 files, no eslint
  rule catching the next regression. Fixed.
- Vendor chunk shipping a 400 KB cryptographic library to every
  user on every page load even though only the Sync surface needs
  it. **This would have been the second hard block.** Fixed.
- A modal that captures focus invisibly (no focus on open) and
  drops focus to body on close. Would have been a comment, not a
  block. Fixed.
- 4 deprecated/orphan files shipped in the production build. Would
  have been a comment, not a block. Fixed.

What's still here that I'd note in review (would not block):

- `src/store/db.ts` is 350+ lines with file-level `eslint-disable
  no-explicit-any`. Probably the right pragma for zustand persist
  but worth a focused refactor someday.
- `madge` reports a runtime cycle (`db ↔ notify`) — works because
  the references are inside function bodies, but is a fragile
  pattern. Would fix in a follow-up by inverting via callback
  registration.
- 44 `max-lines-per-function` warnings on long components.
  Threshold is 80; biggest violators are 350. Each is a
  refactor-when-you-touch-it candidate.

The shipped state would pass my review.

---

## 4. Recovery counselor — would I recommend this?

**Verdict: yes, with two qualifications.**

What works very well, by counselor's eye:

- **Crisis is never gated.** The source code (`CrisisResources.tsx`)
  has a docstring explicitly forbidding feature-flag or
  subscription-store imports. The audit confirmed there are no
  such imports. The page renders even if the user hasn't
  onboarded, hasn't paid, hasn't agreed to terms. That's the right
  decision.
- **The 911 / 999 / 000 banner sits above everything.** First thing
  on the page, sized for a thumb, can't be missed.
- **The locale-aware first-block + US fallback below** is exactly
  right. A misdetected user is never trapped.
- **No fetch, no analytics, no remote.** The privacy claim is
  audited at the code level (test
  `src/features/crisis/__tests__/CrisisResources.smoke.test.tsx`
  asserts no `fetch` ever fires).
- **The HALT check on every drink log.** Hungry, Angry, Lonely,
  Tired — that's the emotional self-assessment frame from
  AA/clinical contexts. Subtle, optional, no judgment in the UI.
- **The "alt action" prompt** when craving is high. Names a
  coping behavior the user picked themselves; doesn't lecture.

Qualifications:

- **The Wellness "score" framing is risky.** A counselor would
  prefer a non-numerical surface for self-perceived wellness
  because daily score-watching can become an OCD axis for an
  anxious user in early recovery. The actual content of
  `PremiumWellnessDashboard` looks like it's mood/streak/HALT
  trends, which is fine. The packaging as a "score" is the
  concern.
- **The "AI-powered" framing in marketing copy** suggests a
  smarter system than the heuristic insight generators are. A user
  who reads "AI" expects the app to *understand* their pattern.
  When it gives them a generic "you log more on Fridays", they
  feel less heard. Better to undersell and overdeliver.

Both are copy/framing issues, not code issues.

---

## Aggregate

Three of four judges say ship. Two file copy/framing notes that
deserve the owner's eye but don't block code merge.

The single most important thing the four-judges pass surfaced
that the other audits couldn't: the **PWA manifest description** is
the front-door pitch — it's what shows up in App Store listings,
browser tab previews, and the install prompt. The current copy
talks about features through marketing-deck language; the
shipped product is unusually focused, private, and honest. The
copy can be unusually focused, private, and honest too.
