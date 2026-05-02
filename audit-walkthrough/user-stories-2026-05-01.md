# Real-user instrumented session — first-person walkthroughs (2026-05-02, R7-B)

Four user types, five minutes each. Driven against the running dev
server with the persona fixtures from `e2e/personas/fixtures.ts`
(plus a couple of inline modifications for the parent / college
senior to match their starting state). Screenshots referenced are
in `e2e/screenshots/` from the R7-A3 run.

---

## 1. The 35-year-old new parent

I have ninety seconds. Kid's asleep in the next room. I open the
app. There's no log-in. That's the first thing that doesn't get in
my way — three other apps want me to make an account before they'll
even show me the home screen, and tonight that would be the end of
the experiment.

The home screen says **Day 0 — Today is a fresh start**. Calm
tracking. No leaderboards. Real help if you need it. The CTA in
the middle says *How are you today?* and I tap it. I get a drink
log form: a beer/wine/cocktail/custom row, a time picker that's
already filled in with 10:55 AM today, an "Add" button, and an
inline "Add detail" disclosure for the more elaborate stuff. I tap
Wine, type "5oz" presets are right there, hit Add. **22 seconds
elapsed, one log entered.** That's the right speed.

What didn't work: I tried to get out of the form by tapping the
backdrop and ended up scrolled into a "Drinks reference" section
below — basically a glossary. I didn't want a glossary, I wanted
to leave the form. The Track tab also doesn't give me any "you
added one drink, here's what that means" beat. It just goes back
to the list. I had to walk to the Today tab to see my one logged
drink show up in the 7-day total.

**Fixes worth landing:** Add an `aria-live` confirmation chip on
log success ("Added — you can edit on the History row below").
Verified: I checked the existing `addDrink` flow — there's no
confirmation announcement. Currently file: `Track` tab logs and
the success state is just the form clearing.

---

## 2. The 22-year-old college senior

A friend told me to "try cutting back for finals." I'm skeptical
because every alcohol-tracking thing I've ever seen has been a
preachy temperance sermon and I don't need that vibe. I open the
app. The home screen is sage-green and white. Says "calm tracking,
no leaderboards." OK, that's at least different.

I tap into Track and log a beer (12oz, 5%, last night, "social"
intention, craving 3, no HALT triggers). Then I go to Goals to set
a weekly cap. The Goals screen lets me put in a daily cap of 2 and
weekly goal of 12. The "Advanced goals" button below promises
something more elaborate, but for finals-prep my whole goal is
"don't blow past 12 a week." Done in 90 seconds.

What I notice that I like: there's no public-facing anything. No
leaderboard, no streak that makes me feel like I lose if I have a
beer. The Day-2 indicator is private. The Insights tab does have
a "Smart Recommendations" panel (now showing — it just got mounted
this round) but the suggestions feel like *suggestions*, not
demands. "Cap your week at 8 standard drinks" lands as advice, not
a sentencing.

What didn't work: the Settings tab has like nine sections (theme,
language, reminders, your data, plan & billing, AI, sync, about,
legal, dev tools). For a 22-year-old who just wants to track for
six weeks, that's a lot of surface. I'd want a "just the basics"
collapsed view by default. Will not block the round but worth
noting.

---

## 3. The 58-year-old returning user

I've done this before. Quit for two years, then slipped on
vacation, then a few weekends, then a few weeknights, and now I'm
back in the app. The reason I'm back instead of trying yet another
new one: I remember Alchohalt being honest. It didn't tell me I'd
"healed" or "cured" anything. It didn't make me sign up for a
support community or invite friends. It just kept the count.

I import my old JSON backup. Settings → Your data → import. The
import works. My old streak is gone (because I drank), and the
home screen now says **Day 2** with **1 day to 3** under it — a
small typographic prompt that tells me I'm two days into a new
count and the next milestone is at three. Not a celebration, not
a guilt trip. Two days.

I open the Goals tab and the new "Goals worth considering" panel
shows two suggestions based on my recent data: "1 alcohol-free
day a week" (what — only one?) and "8 standard drinks a week."
The first one feels almost insulting in its modesty given my
history, but I get it: the engine doesn't know I'm a returner. It
sees the last 30 days and is doing the math straight. That's
actually OK — the suggestions aren't wrong, they're just sized for
where I am right now, not where I was three years ago.

**What I'd want:** A "first time, or coming back?" beat in
onboarding that takes returners through a different intro than
fresh users. Not blocking, but the two states have different
needs.

---

## 4. The non-native English speaker

I read English well but I think in another language. When the
home screen says "Calm tracking. No leaderboards. Real help if
you need it." I have to read it twice. *Leaderboards* is a word
I know because I play games, but it's not a word I expected on a
sober-tracker. I worked it out: they mean *we don't make this a
competition*. Once I understood, I liked it. But the first read
was friction.

I look at the Settings tab and see Spanish is offered. I switch.
The home screen swaps cleanly. The "Day 0" hero stays in the same
shape but with Spanish copy. Date and number formatting follows
the locale (Round 6 work — verified: numeric tile reads with the
Spanish thousands separator). The Insights tab also localizes.
Good.

What still tripped me: the AI Insights consent flow uses the
phrase "anonymous device ID" and "instance ID excerpt" — both
correct English but neither would translate cleanly to my
language. The translated Spanish version uses "ID anónimo de
dispositivo" which is also a mouthful. The concept is fine, the
language layer feels engineering-first.

**Worth landing:** the i18n parity test (existing) covers literal
string presence, not reading-grade. A future round could add a
reading-grade check for both EN and ES copy at the
locale-loading boundary. Not in scope for R7 — adding to the
follow-up list in the final report.

---

## What I'm actually fixing inline

The 90-second-attention parent flagged the missing log-success
confirmation. The other observations are notes for follow-up
rounds, not regressions to fix this commit. The log-success
toast is small enough to land here.
