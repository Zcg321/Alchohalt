# User-testing recruitment package

[R29-1] Paste-ready ad text + screening + consent + scripted prompts
the owner can use the moment they're ready to recruit beta testers.

This closes the marketing-director C1 concern (no user-quote social
proof in the App Store listing). Once 5–10 testers run through these
prompts, the resulting feedback can be sliced into quote-style
testimonials for an "Early User Voices" section of the long
description.

The whole package is owner-action (we cannot post ads on the user's
behalf). All copy is reviewed for fairness — no leading questions, no
implicit "tell us we're good" framing.

---

## Channels (in order of cost-effectiveness)

| Channel | Cost | Speed | Fit |
|---------|------|-------|-----|
| usertesting.com | $50–$80/test | 24–48h | Highest — pre-screened panel |
| Reddit r/stopdrinking, r/alcoholism (mod-approved post) | $0 | 3–7d | Highest fit, hardest gate |
| Sober/recovery Discord servers (mod-approved post) | $0 | 3–7d | High fit, niche |
| LinkedIn (the founder's network) | $0 | 1–3d | Medium fit, high trust |
| Craigslist ETC volunteer | $0 | Variable | Lowest fit, but cheap |

Recommended sequence: 3 usertesting.com paid runs (fast, controlled
demographics), then ask Reddit/Discord mods for permission to post
the unpaid recruitment ad below for breadth.

---

## The unpaid recruitment ad

**Subject line:**
> Looking for 10 people to try a privacy-first alcohol-tracking app
> (15-min session, $0 cost, no signup required)

**Body:**
> I'm the maker of Alchohalt, a calm alcohol tracker that runs fully
> on your phone — no analytics, no ads, no account needed. I'm
> looking for ~10 people to try it for 15 minutes and tell me what
> works and what doesn't.
>
> No screen recording, no shared screen, no signup. You install the
> PWA from a link, walk through 5 short prompts I'll send by email,
> and reply with your honest reactions. Take notes however you like.
>
> Who I'm looking for:
> - Anyone who has tried tracking their drinking before (apps,
>   spreadsheet, paper journal, didn't matter what — just want to
>   talk to people who already know the problem space).
> - Or anyone who's curious about cutting back and would like to
>   see if a tool helps.
>
> Compensation: nothing. The whole point is finding people who
> care enough to give feedback without being paid for it.
>
> What you'll see: a working app you can keep using afterwards if
> you want. No ongoing commitment.
>
> If you're up for it, reply with: (1) one sentence about what you've
> tried before, (2) which OS your phone is (iOS or Android), and (3)
> a 15-minute window in the next 7 days that works for you.

**Why this copy:** explicit no-signup is the unfamiliar
differentiator and worth front-loading. The "no compensation" line
is counterintuitive but it filters for people who actually want to
help — paid testers are honest, but unpaid testers volunteer because
they care, which is the higher signal for a privacy-positioned app.

---

## Screening criteria

Before sending the prompts, check each respondent against:

1. **They named what they tried before.** A respondent who can't
   name *anything* (an app, a journal, a count-the-drinks habit) is
   probably curious-only and will give you "looks nice" feedback.
   That's not useless, but it's not the social-proof tier.

2. **They have a phone OS we ship for.** PWA works everywhere; the
   App Store push (post-launch) is iOS + Android only.

3. **No conflicts of interest.** If the respondent is a friend who
   would feel obligated to be nice, decline politely. The exception:
   if a friend has a deep history with drink-tracking apps, that's
   high-signal — but you must explicitly ask them for honest
   negative feedback in the prompt sequence.

Aim for 5–10 selections from 20–30 respondents. The marginal
respondent past 10 is usually a repeat of feedback you've already
heard.

---

## Consent form

Send to each tester before they install. Plain text, no signature
required — explicit reply confirming "I've read and agree" is the
consent record.

> **Alchohalt user-testing — consent form**
>
> Thank you for offering to try Alchohalt. Before you install,
> please read the four points below. They're short.
>
> 1. **Your data stays on your phone.** The app does not transmit
>    drinks, journal entries, mood, or anything else off-device.
>    The only thing I'll see is what you choose to write back to me
>    by email.
>
> 2. **You can stop at any time.** Reply "I'm done" and I won't
>    follow up. No data deletion is needed because there's nothing
>    on a server.
>
> 3. **Your feedback may be used as a quote.** I plan to put 1–2
>    sentence quotes from testers (with first name + region only,
>    e.g., "Maya, NY") in the App Store listing. If you'd rather
>    stay anonymous, write "no quote please" anywhere in your
>    reply and I'll never use yours.
>
> 4. **No payment, no future obligation.** You can keep using the
>    app afterwards if you find it useful. You won't get a follow-up
>    survey, an email list, or any ongoing contact.
>
> If you're good with all four, reply with "I've read and agree" and
> I'll send you the install link + the first prompt.

---

## The 5 scripted prompts

Send one prompt per email, ~24–48h apart, so the tester has time to
actually use the app between prompts. The total commitment from the
tester is ~15 minutes of typing across 5 emails.

### Prompt 1 — first-launch impressions

> "Open the app for the first time. Without doing anything yet, tell
> me: what do you think the app is for? What feeling does it give
> you? Type whatever comes to mind — first impressions, even if
> you're not sure they're 'correct'."

**What this surfaces:** is the value-prop legible in 5 seconds? Does
the calm aesthetic land or read as bland? The marketing-director's
"5-second pitch" question, asked directly.

### Prompt 2 — onboarding walk-through

> "Now walk through the onboarding flow. Take note of: any moment
> you weren't sure what to tap, any question that felt invasive,
> any beat that felt too long. Send me your notes."

**What this surfaces:** the R28-3 synthetic walkthrough baselined
53% completion. This is the human cross-check. If a tester says "I
didn't know whether to tap 'cut back' or 'curious'" — that's a
copy fix. If they say "the third screen took too long" — that's a
beat-removal opportunity.

### Prompt 3 — a real day

> "Pretend you're going through your normal day. Log a drink (or
> mark today AF if you don't drink today). Then come back later and
> log another. Tell me: did the act of logging feel comfortable?
> Did anything pull you out of the flow?"

**What this surfaces:** time-to-value (R24's TTFV doc baselined
~2 minutes). The TestSim was synthetic; this is real. Look for
"the form was too detailed" / "I wished I could log faster" —
the R23 quick-log mode lands the latter, but you need the human
voice to confirm it solved the friction.

### Prompt 4 — privacy moment

> "Open Settings → Privacy & data → Trust Receipt. Read it for as
> long as you want. Then tell me: did this make you trust the app
> more, less, or the same? Did anything in the receipt confuse you?
> If you didn't read all of it, where did you stop?"

**What this surfaces:** the Trust Receipt is the unfair advantage
moment per the R28 marketing-director judge. But "shipped" doesn't
mean "lands." A tester who says "I don't know what 'no third-party
analytics' means in practical terms" is a copy gap; one who says
"this made me feel safer than [competitor]" is the quote.

### Prompt 5 — the free response

> "Last one. In your own words: would you tell a friend about this
> app? If yes, how would you describe it? If no, what's missing or
> wrong? Be as honest as you'd like — negative feedback is more
> useful to me than positive."

**What this surfaces:** the only prompt that can produce
quote-grade output. The "tell a friend" framing is the canonical
NPS-style ask without the 0-10 score (which is what the in-app
NPS pulse already measures). Free-form wording lets the tester
articulate the moat in their own voice — which is what an App
Store listing-quote needs.

---

## How to use the responses

1. **Sort by quote-grade.** A response that names a *specific
   thing* the app does well is quote-grade ("I love that the
   crisis pill is on every screen"); a response that's general
   praise is not ("nice app, easy to use").

2. **Check for fairness.** Don't cherry-pick only positive quotes
   for the listing — the App Store mid-review enforcement is
   getting stricter. Lead with positive, but show one neutral
   quote that names a real limitation. Honesty as positioning.

3. **Watch for repeat themes.** If 3+ testers independently mention
   the same friction point (e.g., "I wished I could log a drink
   from the lock screen"), that's the next round's product work,
   not feedback to ship as-is.

4. **Anonymize in the listing.** Use "Maya, NY" not "Maya Smith
   from New York City" — the consent form covers first-name +
   region only.

5. **Save the raw replies.** A future legal or review-team
   challenge will ask for evidence the quotes are real. Keep the
   full email thread in `~/launch/user-testing-replies/` outside
   the repo (the replies are private user data — they should
   never live in source control).

---

## Expected timeline

| Phase | Days from start |
|-------|-----------------|
| Post recruitment ad / launch usertesting.com runs | 0 |
| Receive responses + screen | 3–7 |
| Send consent + first prompt | 7–10 |
| Receive prompt 1 + send prompt 2 | 10–12 |
| All 5 prompts done | 18–25 |
| Quotes selected + added to App Store listing | 25–30 |

Plan for ~4 weeks from "I'm ready to start recruiting" to "the
listing has 5 user quotes." Of which 3 weeks is wall-clock waiting
on testers; ~1 day of actual owner-time across the whole arc.

---

## What this package does NOT cover

- **Hardware screen-reader testing** — that needs a paid contractor
  (NVDA + JAWS + VoiceOver + TalkBack). See R23 contractor pass for
  the existing process.
- **Comparative testing vs Reframe / Sunnyside** — that needs paired
  testers who use both apps for a week each. Out of scope for the
  initial recruitment.
- **Translation review** — the R23 pl + R24 ru translator-feedback
  pattern is the right model; native speakers should review before
  the localized App Store listing pushes.
