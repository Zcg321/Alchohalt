# Judge #10 — Ethics / medical-perspective review (round 10)

**Lens:** are we engaging in any pattern that could be harmful to a
user — gamification of a delicate behavior, false confidence in a
metric, encouraging continued use when stepping back would help, or
cargo-cult medicalization without the underlying competence?

**Verdict overall:** ⚠️ **Pass with three deferred owner decisions.**
The app is consistently more honest and less manipulative than its
peer category. Three concerns deserve direct owner attention before
launch — none are implementation blockers.

---

## What's working

### 1. The "no streak pressure" voice is real, not theatre

`stats.softRestart.starting` ("Today's a fresh start.") and the
`SoftRestartBanner` mean a relapse doesn't reset a streak counter to
zero with red typography. The `streakStatus` enum has explicit
`starting` / `restart` / `building` modes. This is genuinely calmer
than every peer app I've reviewed. The voice was tested for tone
fidelity in earlier rounds. **Pass, no concerns.**

### 2. Crisis resources never gate behind any UX

The AppHeader pill is one tap from every screen, including the
onboarding modal. `CrisisResources.tsx` carries `regions.ts` packs
for US/UK/AU/CA/IE — region-aware, no signup required, direct
device tel/sms links. The hard-time panel is action-first with no
"we hear you" filler. **Pass, exemplary.**

### 3. Privacy claims are not just marketing

`installFetchWrap` (Trust Receipt) wraps every outbound request and
shows the user the actual log. `Capacitor.isNativePlatform()` web
fallback means cloud features genuinely off without a server round
trip. The R10-3 sharing flow puts the payload in the URL fragment —
never on a server. **Pass, claim is auditable.**

### 4. AI features are off by default with audit trail

`aiRecommendationsOptOut` defaults the surface OFF on the build
flag, with a Settings → AI flow that explains the data path before
the user opts in. Comments in `db.ts` and `analytics.ts` warn that
the analytics shim is a no-op shim and any future opt-in is gated
on explicit user consent. **Pass.**

### 5. R10-4 escalation is the right shape

The soft prompt at 3 opens / 24h doesn't push the user toward a
harder door — it offers a *softer middle* between repeat 988 calls
and "log this and move on". The free SAMHSA locator is the always-
available default. The footer copy is explicit: "We don't earn
anything from these links." That's the right tone for a delicate
nudge. **Pass.**

---

## ⚠️ Concerns — owner review needed

### Concern A: Points system is fundamentally gamified

`computePoints` in `src/features/rewards/Stats/lib.ts` produces a
running scalar that the `TopSection` displays prominently. This is
the most gamification-shaped element in the app. The points have
no real-world meaning — they're a derived metric the app invented.

The mitigation that already exists: there's no leaderboard, no
social feed, no comparison to "other users". The points exist as a
self-feedback loop, not a competitive instrument.

The lingering concern: a recovering user who sees their points drop
on a tough day might experience that as failure. The app's softer
voice in other places (the streak handling) shows we know how to
handle this — points should follow the same soft-restart pattern.

**Owner ask:** decide whether to keep, soften, or remove the points
display. Recommendation: rename to "consistency score" with the
same soft-restart semantics as the streak (not zero-reset on a
single setback). Round-11 work, not a launch blocker.

### Concern B: BAC display is a clinical claim

`computeBAC` in `src/lib/calc.ts` computes an estimate using sex /
weight / TBW formulas. It's gated behind `settings.showBAC` which
defaults off, but when on, it shows a single number that reads as
clinical fact.

The number is an estimate based on Widmark-style math that ignores
food intake, time of last drink, individual variation in liver
enzymes, medications, and at least a dozen other factors. Driving
decisions based on it is unsafe. Anyone old enough to drink knows
this in theory but the number on screen is persuasive in the
moment.

The current mitigation: gated off by default, no driving / safety
copy attached.

**Owner ask:** strengthen the disclaimer when BAC is enabled. At
minimum: a one-time modal on first-enable that says "this is an
estimate, not a measurement, and shouldn't drive any safety
decision." Maybe also a confidence interval (±0.02) on the display.

### Concern C: Premium paywall locks data export

`PER_PLAN_PERKS` shows that **CSV / PDF export** is in the Premium
tier. JSON export is free, which is the right baseline (data
portability is a fundamental user right). But CSV — the format
spreadsheet apps eat without any conversion — being premium-only
creates friction for users who want their data out.

A user trying to leave (or audit their history) shouldn't hit a
paywall. The R10-D translation review doc is for a third-party
translator; the R10-1 import path takes CSV from foreign trackers
*in*. Both directions of CSV access matter — locking export feels
inconsistent with the import openness.

**Owner ask:** consider moving CSV export to free. Keep PDF on
Premium (PDF generation is a nice-to-have, not data portability).
This is a meaningful free-tier improvement that costs us only the
"reason to upgrade" signal — and there are five other premium
features that read as nicer.

---

## Reviewed and explicitly NOT a concern

### Onboarding is calm, not manipulative

The 3-step beat (intent → tracking style → privacy) doesn't pressure
the user toward signing up. The "Just looking" tertiary skip lands
the user in the fully functional app without any feature gates.
There's no "free trial expires in" countdown, no "limited time"
banner, no dark-pattern checkboxes. Round-9 added a 500ms pause
before chips appear so the question lands first — that's the
opposite of urgency design. **No concern.**

### The reminder system is gentle, not addictive

`installReminderSync` only fires user-chosen times (default off).
There's no notification cadence the user didn't pick. No "you
haven't logged in 3 days" guilt nudge. The Free tier explicitly
caps at one reminder per the plan grid; Premium unlocks more. No
re-engagement spam. **No concern.**

### The "trust receipt" is real

R8-C added `installFetchWrap` and the receipt UI. I checked the
implementation — every outbound fetch lands in the buffer with
URL + status + timestamp. The user can audit network activity
themselves. This is rare and worth calling out as exemplary.
**No concern, exemplary.**

### Crisis lines are correct + region-aware

`regions.ts` has the canonical numbers for US (988, SAMHSA, Crisis
Text Line), UK (Samaritans 116 123, Drinkline, NHS 111), AU
(Lifeline 13 11 14, DirectLine), CA (Talk Suicide 1-833-456-4566),
IE (Samaritans Ireland 116 123). I cross-checked the numbers — all
current. **No concern.**

### R10-3 sharing is privacy-preserving by design

I reviewed `sharePayload.ts` — the payload genuinely never reaches
a server. Fragment-only encoding, base64url, no fetch, no fetch
wrap log entry on share generation (because there IS no fetch). The
24h TTL is the right scope (limits accidental spread, doesn't
pretend to enforce against the recipient). The default OFF state on
every field is the correct opt-in posture. **No concern.**

### R10-1 data import is honest about what it does

The wizard surfaces row count + skipped reasons. Multi-drink
expansion (3 beers → 3 entries) preserves frequency math. Date
parsing is forgiving but doesn't silently invent timestamps. **No
concern.**

---

## Summary table

| Concern                              | Severity | Status                       |
| ------------------------------------ | -------- | ---------------------------- |
| Points display gamification          | Low      | Owner decision (R11 candidate) |
| BAC clinical-confidence framing      | Medium   | Owner decision (pre-launch)  |
| CSV export behind paywall            | Low      | Owner decision (free-tier UX) |
| Onboarding pressure                  | —        | No concern                   |
| Reminder cadence                     | —        | No concern                   |
| Trust receipt implementation         | —        | Exemplary                    |
| Crisis line accuracy                 | —        | No concern                   |
| R10-3 sharing privacy posture        | —        | No concern                   |
| R10-1 import behavior                | —        | No concern                   |
| R10-4 escalation prompt design       | —        | No concern                   |

## Verdict

⚠️ **Pass with three deferred owner decisions.** None of the
concerns are implementation blockers; all are owner-product calls.
The app's overall posture toward a delicate user population is
markedly more honest than peer apps. Ship.

---

*Generated as part of round 10's expanded gate. The other 9 judges
ran in round 9 — see docs/rounds/round-9-report.md.*
