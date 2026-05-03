# Round 15 — designer-of-a-competing-app judge

Date: 2026-05-03
Persona: a senior product designer who has shipped a popular drinking-tracker app and is doing a competitive teardown of Alchohalt. They have not used the app before today.

The brief: name the **one feature** that, if I copied it into my own app, would give me the most differentiation gain — and the **one feature** I couldn't copy without changing my whole privacy posture.

I spent ninety minutes in the build, reading the audit log, and poking the live UI. Below is what I'd take and what I literally cannot.

---

## What I'd copy first: the Trust Receipt + Privacy Status pair, with the new R15-4 printable export

This is the durable differentiation. Most "wellness" apps lean on a privacy policy and trust signals from an SOC-2 badge. Alchohalt does something almost no one else does: the app shows the user, **right now in-app**, every storage write and every fetch the app initiated this session. The R15-4 printable export means a security-curious user can print a one-page artifact and walk away with it — that's a kind of artifact-of-trust that costs me nothing to deliver in my own app, and it makes the privacy claim concrete instead of marketed.

Specifically, three sub-pieces ladder together:

1. **PrivacyStatus**: "what features could send data, are they on?" That's a cheap copy.
2. **TrustReceipt** live log: "what storage writes / fetches happened this session?" Mid-cost — needs a fetch wrap + storage-write event publisher. The redaction guarantee (R8-C) is what makes it screenshot-safe; that took real care to land.
3. **Printable receipt** (R15-4): the artifact. The thing the user can show to a journalist, a partner, a court — "I am holding a record of what this app did on this date."

If I bolted the same surface into my app, my marketing team would write a "Privacy Receipt" landing page in a week. It would be 80% as good for 30% of the work — that's classic competitive copy. The reason I'd grab this one is that the *idea* is the bulk of the value; the implementation is mostly mechanical.

## What I literally couldn't copy: the no-server architecture

Everything else flows from this and I cannot match it without rebuilding my product from scratch.

Alchohalt's data lives on the user's device. The encrypted-sync option is end-to-end sealed — the server holds blobs, not contents. Every insight, every recommendation, every pattern detection runs **on the device**, without leaving it. The premium AI insights surface anonymizes before sending and is opt-in. The retrospective panel, the tag-pattern analyzer, the peak-hour insight, the new R15-A tag explorer, the R15-1 monthly delta, the R15-2 goal nudge — none of them require a backend.

My app stores telemetry centrally. Even if I removed PII, my analytics infrastructure is a server-side product that I can't unbuild. My ML team relies on aggregate user data to improve model quality. If I tried to copy the no-server posture, I'd have to:

1. Move all model inference on-device (massive engineering cost, perf regressions on older phones).
2. Tear out my analytics pipeline (board-level decision; SaaS contracts attached).
3. Re-architect my premium tier to not depend on aggregated user data (revenue-at-risk; product team's stated growth thesis is based on cross-user pattern learning).
4. Rewrite my onboarding to not collect demographic fields the funnel team relies on for cohort analysis.

It's a *whole-product-org change*, not a feature.

That's the moat. The thing that makes Alchohalt *different* isn't the visual design or the cleverness of any single insight — those I can match in a sprint. It's that every word the app says about privacy is structurally true. My app says similar words but they're stapled on top of a server-first architecture; they would not survive a determined journalist with a network proxy.

This matches and stress-tests Round 14's competitor-PM judge ("the moat is privacy posture, not features"): Round 14's read was qualitative; mine is the same conclusion arrived at through "what would I actually do if I tried to copy this on Monday." I land in the same place: features ship in a week, posture ships in a year.

---

## Other observations the owner may not have asked for, but I'd flag

- **The R15-A tag explorer is the most "delightful" feature I saw.** A user-curated taxonomy that the app then mines for shape (weekday + hour distribution) — that's the kind of thing that makes a power user evangelize. It's also cheap for me to copy, and I would copy it second.
- **The R15-1 monthly delta is doing real work the user is going to feel.** AF days alone hides session-intensity changes. Drinking-days + avg-per-drinking-day means a user can see if they're spreading the same total across more days vs hitting harder per session. That's a real diagnostic.
- **The R15-3 backup auto-verification is operationally valuable but invisible-by-design.** No marketing leverage. That's fine — most users will never see the failure ribbon, but the ones who do will be glad the app caught it before restore time. The DiagnosticsAudit row is the right surfacing.
- **R15-2 goal nudges are the only feature where I'd push back.** Not on the implementation — calm-config compliance is right — but on the framing. "Want to revisit it?" is good; the alternative copy ("You're at 2 std/day; your goal is 1.5") flirts with shame for users who interpret "missing a goal" as a failure. I'd want to A/B the nudge copy itself in a future round. (And: this is the kind of thing the R15-B variant infrastructure can now actually do.)
- **The chips in onboarding (now under R15-B variant test) are doing more work than they look.** Naming the user's intent at minute one is what makes the app feel like a tool that listens, not a form. I'd copy the second-screen rhythm + the "Just looking around" tertiary-skip pattern.

## Bottom line

The one feature to copy: the printable Trust Receipt artifact. Cheap; high marketing leverage; demonstrably hard for incumbents to match emotionally.

The one feature I cannot copy: the on-device-only, end-to-end-sealed-sync architecture. It's not a feature. It's a posture. The product is built on top of it; my product is not.

Round 15 deepens the moat in three places (R15-A tag explorer adds power-user value on a privacy-preserving surface; R15-3 backup auto-verify hardens the "your data, your file" claim; R15-4 printable receipt makes the privacy claim portable as an artifact). None of them broaden the moat — that work is done — but they all make it more credible.

Owner-blocking items: none. The judgment is "ship it."
