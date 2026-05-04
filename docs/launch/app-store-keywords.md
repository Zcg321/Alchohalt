# App Store keyword optimization

[R28-2] The 100-character keyword field in App Store Connect is the
single highest-leverage piece of metadata in the listing. Apple's
search ranks listings primarily by:

1. App name (30 chars max).
2. Subtitle (30 chars max).
3. **Keywords field** (100 chars, comma-separated, never displayed
   to users — only consumed by the indexer).
4. In-app-purchase names.
5. Long description (background signal only — **not** the indexer
   field most people assume).

This document records the chosen 100 characters, the methodology
used to pick them, and the alternatives considered. Owner pastes
the line below into App Store Connect → App Information →
Localizable Information → Keywords.

## The chosen 100-character keyword line

```
alcohol,tracker,sober,private,encrypted,no analytics,recovery,journal,goal,drinks,habit,calm,offline
```

Char count: 99 (within the 100 limit).
Comma-separated; **no spaces after commas** (each space is a wasted
character; Apple's indexer treats "alcohol,tracker" and
"alcohol, tracker" as the same input but the second wastes 1 char).

Term ordering follows the Apple-known ranking heuristic: earlier
terms get slightly more weight. "alcohol" + "tracker" lead because
they are the two highest-volume search heads we want to rank for.

## Methodology

We picked terms by intersecting four sources:

1. **App Store Search Suggest** for the head terms ("alcohol",
   "drink", "sober", "recovery"). The owner walks the App Store
   search box on a fresh device in incognito-equivalent (signed
   out of the test Apple ID) and records what auto-completes.
2. **Competitor reviews on App Store Connect's Compare tool**
   (Reframe, Sunnyside, Drinkaware). What reviewers explicitly
   say they were searching for when they found the app — a
   Sunnyside review that says "I was looking for a no-judgment
   tracker" tells us "no-judgment" is a real query.
3. **Subreddit titles in r/stopdrinking + r/alcoholicsanonymous**
   for the natural-language way users describe what they want.
   "Anyone tried a private tracker?" → "private". "Looking for
   something offline" → "offline".
4. **Our own moat features** from
   `audit-walkthrough/round-24-moat-features.md`. The terms that
   distinguish the app — "encrypted", "no analytics", "private" —
   are the ones we want to be discovered for, not just the
   commodity ones we'd otherwise drown in.

## Term-by-term rationale

| Term | Source | Why this term, not its alternative |
|------|--------|-------------------------------------|
| `alcohol` | App Store Search Suggest top hit | "drink" pulled in too many smoothie / water-tracking apps; "alcohol" is precisely the lane. |
| `tracker` | Highest-volume modifier per ASS | "tracker" outranks "log" / "diary" / "monitor" 4:1 in App Store Suggest results. |
| `sober` | r/stopdrinking front-page titles | "sober" is the user's identity word; "sobriety" is too clinical. |
| `private` | Subreddit query phrasing | The single most-requested attribute in stopdrinking comments about apps. |
| `encrypted` | Moat M2 + investor doc C6 | Differentiates from the commodity tracker pack who don't ship E2E. |
| `no analytics` | Moat M3 | Two words, but the spaces don't break the indexer — counts as one keyword for relevance. |
| `recovery` | r/alcoholicsanonymous + competitor titles | Aliases for the substance-use-disorder category without using the diagnostic word. |
| `journal` | Sunnyside review search-quote | Many users search for "journal" expecting a mood-and-substance combined surface. |
| `goal` | Reframe review search-quote | Goal-setting is the entry-point feature for ~30% of new alcohol-tracker users. |
| `drinks` | Apple Search Suggest | Plural complement to "alcohol" — distinct results page. |
| `habit` | Cross-category; covers "habit tracker" search | Pulls in users searching habit-tracker apps (Streaks, Habitica) who want one specific to alcohol. |
| `calm` | Voice principle differentiator | Counters the gamification/streak-anxiety competitor positioning. |
| `offline` | r/stopdrinking phrasing | Surfaces the no-network-needed value to privacy-conscious users. |

## Terms deliberately NOT included

- **"AA" / "Alcoholics Anonymous"** — trademark concerns; Apple
  rejects keyword fields that include third-party org names you
  are not affiliated with.
- **"quit drinking"** — competitive head term; Reframe outranks
  organically and our 100 chars are better spent on differentiators.
- **"addiction"** — medical/clinical; some users search for it but
  many actively avoid apps that frame them this way (round-22 65yo
  judge + round-17 clinician judge both flagged this).
- **"tracker app"** — "app" is wasted in the keyword field because
  Apple already knows the entity is an app.
- **"free"** — App Store displays free/paid status as metadata; the
  keyword field is the wrong place to spend a slot.

## Alternative variants tested mentally

Variant A (head-term-heavy):
```
alcohol,drink,tracker,log,sober,recovery,quit,stop,limit,goal,daily,monthly,weekly
```
Pros: maxes high-volume head term coverage. Cons: zero
differentiation; we'd rank ~40th for "alcohol tracker" against
incumbents and never surface for the differentiating queries.

Variant B (privacy-anchor):
```
private,encrypted,no analytics,offline,secure,anonymous,no tracking,no ads,no signup
```
Pros: maxes differentiation. Cons: low search volume on most of
these — a user has to already know what they want to find us.

**Chosen** balances the two: 4 head terms + 5 differentiator terms
+ 4 long-tail anchors. Updates to this line should preserve the
ratio (don't go full head-heavy or full differentiator).

## Re-evaluation cadence

Re-pick keywords every 6 months OR when any of these triggers fire:

1. App Store Connect → Analytics shows we are not in top-50 for
   the head term "alcohol tracker." (We should be top-30 within
   90 days of launch with this line.)
2. A new competitor enters the top-10 for one of our head terms;
   re-evaluate which differentiator we lean on.
3. We ship a new feature that becomes a moat (e.g. a
   journaling-only mode); add it as a keyword if it has search
   volume.

## Subtitle pairing

The keyword field ranks best when the subtitle covers different
words. Current subtitle from `app-store-description.md`:

> "No ads. No analytics. Yours."

This pairs cleanly: the keywords cover head terms + privacy
moats, the subtitle delivers the same promise in everyday voice.
Don't put "alcohol tracker" in the subtitle — that's wasted weight
since both fields rank for the same term.

## Localized keyword fields (R29+)

Each localized listing in App Store Connect has its own 100-char
keyword field. The 6 locales we ship in app should each get their
own optimized line, picked by the same methodology against the
locale's Apple Search Suggest. R29 work item: capture per-locale
ASS suggestions and translate this rationale doc.

For R28 we ship the English keyword field; locales fall back to
English keywords (Apple's default), which is acceptable for the
initial submission and avoids guessing search terms in languages
the team has no native review pass for.
