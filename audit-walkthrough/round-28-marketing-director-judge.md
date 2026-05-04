# Round 28-5 — 28th judge: marketing director

## Frame

A fictional marketing director with 8 years at consumer-app
agencies (Snapchat, Headspace, MyFitnessPal) is brought in to
audit Alchohalt's go-to-market. They walk: App Store listing
text → screenshot set (with R28-2 captions) → in-app onboarding
→ landing-page-equivalent (the in-app PrivacyHeadline + About
surfaces) → trust receipt.

The lens is *"would I buy this if I saw it in the wild?"* and
specifically:
1. **What's the pitch** — is the value clear in 5 seconds?
2. **What's the proof** — does the page back the pitch?
3. **What's the call-to-action** — what does the user do next?

This is a marketing-craft review, not a brand-strategy review.
The positioning canon (`docs/marketing/positioning.md` + R25-D
description rewrite) is taken as given; the question is whether
the execution serves it.

---

## Strengths the marketing director would champion

### S1. The keyword field finally pulls weight

The R28-2 keyword line:
```
alcohol,tracker,sober,private,encrypted,no analytics,recovery,journal,goal,drinks,habit,calm,offline
```

This is the right execution. Most pre-seed apps ship the App
Store keyword field as an afterthought ("alcohol tracker app
free best") and waste it on head terms they will never rank
for. R28-2 actually intersects ASS suggestions with moat
features and competitor review-quote phrasing — that's
agency-craft, not founder-typing-into-a-box.

**Director note:** the methodology doc
(`docs/launch/app-store-keywords.md`) is the kind of artifact I'd
actually take to a board meeting. Most clients can't articulate
why they picked their keywords; this team has the receipts.

### S2. Screenshot captions actually read as differentiators

The R28-2 caption set:
1. *Today, in plain language.*
2. *Track without judgment.*
3. *Set the goal you actually want.*
4. *Insights you can prove are private.*
5. *Help, on every screen, always free.*

These are the captions I would write. Caption 4 in particular
("Insights you can prove are private") is the one most teams
would soften to "private insights" — losing the verb that does
the work. The "you can prove" reframes insights from "AI sees
your data" (the default user fear) to "you can verify nobody
else does." That's the move.

Caption 5's "always free" is the right preemptive close — it
forecloses the "what if I lose paid access in a crisis"
objection. Most apps gate crisis resources behind subscription
tiers; calling out that this one doesn't is differentiation in
the quietest possible voice.

### S3. The Help FAQ closes the post-tap loop

R28-1's in-app Help with 10 deep-linked answers is the surface
that converts curious-tappers into engaged users. This is the
gap that kills 30-day retention for most privacy-positioned apps:
the user lands, has a question ("can I delete my data?"), can't
get an answer in-app, drops to email-support which takes 24h,
and uninstalls.

The R28-1 FAQ answers in the same screen as the action — and
deep-links from each answer to the relevant Settings section.
That's textbook usability copy + design.

**Director note:** "How is this different from Reframe /
Sunnyside / Drinkaware?" being one of the 10 questions is the
kind of competitive differentiation answer most apps avoid in
their own UI. The honest "three differences" phrasing reads as
confident, not defensive.

### S4. Trust Receipt is the unfair-advantage moment

In a 30-second App Store review, most users never see the Trust
Receipt — but the *concept* is the listing's credibility anchor.
"You can hash the bundle and verify offline" is the kind of
proof that a competitor cannot replicate without removing their
analytics SDK. Sunnyside literally cannot ship a Trust Receipt
because the receipt would show their Segment + Mixpanel calls.

**Director note:** the deck slide for this is "we removed
analytics; here's the math that proves it." Every pre-seed deck
in this category claims privacy; this one is the only one I've
seen that ships the proof in the binary.

### S5. The 100-character keyword + 30-character subtitle pair

App Store ranking weighs these two together. Most teams either
duplicate words across both ("alcohol tracker" in both fields,
wasting the second slot) or leave the subtitle as marketing
fluff ("Your wellness journey starts here"). The pairing here:

- Keywords: head terms + privacy moats + long-tail anchors
- Subtitle: "No ads. No analytics. Yours."

This is correct. The subtitle delivers the same promise in
everyday voice; the keywords back it with searchable terms. Zero
overlap, full ranking weight.

---

## Concerns the marketing director would flag

### C1. The store listing has no proof of *use*

The screenshots show the surfaces. The captions name the
benefits. But there's no review-style social proof
("47,000 users have logged X drinks") — and pre-launch, there
*can't* be. The marketing director would push back: investors
will want a story arc that's currently absent from the listing.

**Mitigation:** before going live, gather 5-10 beta tester
quotes via the in-app survey + Discord and add an
"EARLY USER VOICES" section to the long description. This is
soft launch / TestFlight territory; do it before the public
push.

**Owner-action:** wire a beta-feedback collection flow in
Settings → Help → "Send feedback" (currently the FAQ ends with
"open About → Contact for the human path" — that's the right
hook for the quote-collection surface).

### C2. The landing-page-equivalent leans too hard on Settings

Most users will never enter Settings before deciding whether
to keep the app. The PrivacyHeadline + About surfaces live deep
in the app; the value pitch needs to land on the **Today** tab
(the home screen).

Currently Today shows the streak count + drink log + goal
progress. That's the *product* — fine for retention, but the
first-launch user has no context. There's no surface that says
"this is the privacy app; here's what makes us different" on
Today.

**Mitigation idea (R29+):** a one-time, dismissible
"first-launch privacy headline" card on Today that shows for
the first 3 sessions and then auto-hides. Should reuse the
PrivacyHeadline component to avoid divergence.

**Director note:** the in-app Help FAQ partially closes this
gap — a curious user can find the differentiators in Settings →
Help. But the *uncurious* first-launch user gets no signal.

### C3. The crisis-resources surface buries the lede

The Help FAQ entry "Can I use this offline?" is good. But the
single biggest competitive moat in the listing description —
"Crisis lines on every screen, always free" — is *not* one of
the 10 FAQ entries. A user looking for crisis-lines support
won't find a Help answer that leads them to the surface.

**Mitigation:** add an 11th FAQ entry: "How do I find crisis
support?" → deep-link to the always-on header pill. This makes
the moat discoverable from two paths (header + FAQ) instead of
one.

**Owner-action (1-line edit):** add to `HelpFaq.tsx` after the
"works offline" entry.

### C4. The screenshots are still pending capture

`public/marketing/screenshots/PENDING_CAPTURE.md` is still on
record. The R28-2 captions are wired into the capture script
but the actual PNGs aren't in the repo. Until they're captured
and committed, the listing cannot ship.

**Mitigation:** owner-action — install Playwright + run the
capture script per the README. ~10 minutes one-time setup, ~3
minutes per capture run.

**Director note:** I cannot pass a listing review without the
screenshots in hand. This is the single hard blocker for going
live.

### C5. The "What you get free forever" / "Premium adds" split
is well-written but not *demonstrated*

The long description distinguishes free-forever vs premium
features clearly, but the App Store listing doesn't show the
paywall in any screenshot. A reviewer who reads the description,
believes the list, but sees no proof in the screenshot set has
to take it on faith.

**Mitigation (R29+):** add a 6th screenshot showing a clean
non-gated state of the premium-features list (e.g., the
SubscriptionManager surface in Settings, in its
"available, not yet purchased" state) so the reviewer can see
the line is honest.

**Director note:** this isn't a blocker for launch, but it's
the difference between a 4-star and 5-star listing review pass.

### C6. The 30-character App Store subtitle is good but
locale-blind

"No ads. No analytics. Yours." is 28 chars and reads cleanly
in English. The 6-locale i18n covers in-app strings but the
*subtitle* is a per-locale App Store Connect field that needs
its own localized translation. Currently
`docs/launch/app-store-keywords.md` notes locale fields as R29+
work; the subtitle should land in the same R29+ pass.

**Owner-action (R29 scope):** translate the subtitle into es,
fr, de, pl, ru. ~5 minutes per locale; defer to native-speaker
review (round-23 pl + round-24 ru translator-feedback pattern).

### C7. There is no landing-page mirror outside the App Store

Most consumer apps have a landing page (alchohalt.app) that
mirrors the App Store description with deeper proof — embedded
demo video, founder quote, security FAQ. Currently the only
public surface is the App Store listing + the in-app pages
(deep-linked via /legal/* per SHIP-3.1).

**Mitigation:** R29+ — a single static `index.html` at
alchohalt.app that mirrors the long description + screenshots,
plus a "Try it now (PWA)" install button that bypasses the App
Store for users who land via search but don't want to go through
the store flow. Reuses the existing Vercel deployment.

**Director note:** the App Store's keyword indexer is fed
partially by inbound link signals from the wider web. Without a
landing page, the listing has fewer external citations to pull
on. Pre-launch this is fine; post-launch it's a 30% organic-
discovery loss.

---

## Summary for the partner

**The pitch:** clear in 5 seconds. The keyword + caption + Help
FAQ trio executes the "privacy as moat" positioning with
agency-grade craft. This is a fundable consumer-app go-to-market
posture.

**The proof:** strong on the verifiable side (Trust Receipt,
Help FAQ deep-links, A/B winner readout). Thin on the social-
proof side (zero user quotes, no review count) — fixable with
beta + soft-launch sequencing.

**The call-to-action:** App Store listing tags the install action
correctly. The bigger CTA gap is in-app: there's no "this is
why we're different" surface on Today for the first-launch user
who doesn't enter Settings.

**Hard blocker for launch:** the screenshot PNGs aren't captured
yet. ~10 minutes of owner-action.

**Soft blockers worth fixing before public launch:**
- C3: Add a crisis-support FAQ entry.
- C5: Consider a 6th screenshot showing premium-features state.
- C7: Lightweight landing page mirror.

**R29+ work items the marketing director would put on the
roadmap:**
- C1: Beta-quote collection flow + early-user-voices listing
  section.
- C2: Today tab first-launch privacy-headline card.
- C6: Per-locale App Store subtitle translations.
- A 30-second app preview video (App Store accepts these and
  they lift install rate ~15-25% per category benchmarks).

## What this judge contributes to the gallery

The previous 27 judges cover correctness, accessibility, voice,
internationalization, security, harm reduction, deploy
readiness, ex-competitor comparison, and investor due diligence.
The marketing director adds the **commercial-execution lens**:
does this listing convert? Does the in-app surface back the
listing? Are the moats discoverable, not just present?

This is the lens that turns a defensibly-built product into one
that actually reaches users at scale. Worth keeping in the
gallery for every future round that touches public-facing
surfaces.

## Net read

Technically far ahead of the typical pre-seed, *and now
marketing-craft is catching up to engineering-craft*. R28-1
(Help FAQ) + R28-2 (captions + keywords) are the rounds that
close the GTM gap. With the screenshots captured and the
crisis-FAQ entry added, this listing is ready to go live.

The biggest commercial risk isn't the listing — it's the
absence of a landing page and the absence of beta social proof.
Both are R29 work, neither blocks the App Store submission.
