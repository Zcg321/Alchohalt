# Contributing to Alchohalt

Thank you for considering a contribution. Alchohalt is built on a
small set of non-negotiable commitments: no ads, no analytics, no
telemetry, plain language, and a calm voice on the worst days.
Every change has to honor those.

This document is how we keep that bar without making contribution
painful. If anything below contradicts the user's ability to log a
drink calmly and privately, **the user wins** — file an issue.

## TL;DR for first-time contributors

1. Open an issue first for anything bigger than a typo or a doc fix.
   We'd rather discuss the shape than reject a PR after you've
   already invested time.
2. `npm install` then `npm run verify` should pass before you push.
   That runs typecheck + lint + the full test suite (~1,800 tests).
3. Match the existing voice. See `audit-walkthrough/voice-
   guidelines.md` for what's banned. Banned words: streak, level
   up, win, victory, lose, fail, weak, strong, just, simply, easy,
   amazing, awesome, perfect, great. There are more — read the doc.
4. Don't add analytics SDKs, telemetry, or third-party tracking.
   Don't make the app phone home for any reason that isn't behind
   an explicit user opt-in.
5. PR description should explain *why*, not what. The diff explains
   the what.

## Project ground truths

Before you propose a change, internalize these. They're not
preferences — they're the product:

- **Local-first.** Every primary surface (logging, history, stats,
  goals, crisis) works offline. Optional features that need a
  network (AI Insights, multi-device sync, IAP) are off by default
  and visible in Settings → Privacy.
- **No analytics.** There is no analytics SDK in `package.json`.
  There is no metrics endpoint. There is no funnel. The R26-1
  satisfaction signals and R24-3 NPS pulse are local-only and
  visible to the owner via DiagnosticsAudit.
- **Plain language.** Reading-grade target is 6-7. We do not use
  therapy-speak, gamification, or marketing language. "30 days
  alcohol-free" not "30-day streak unlocked!"
- **Crisis surface is first-class.** A user in distress reaches
  regional helplines in two taps from any tab. No admin UI, no
  feature-flag, no mis-config possible.
- **Six locales, parity-tested.** EN, ES, FR, DE, PL, RU. CI fails
  if any key is missing in any locale. New strings have to ship
  with all six.

If you don't yet know the codebase, the round-X audit walkthroughs
in `audit-walkthrough/` are the fastest way in. They walk through
the round's reasoning end-to-end.

## Setting up

Requirements: Node 18+, npm 9+. (Mobile builds also need Android
Studio for `build:android` and Xcode for `build:ios`, but you don't
need those to make a web change.)

```bash
npm install
npm run dev          # Vite dev server
npm test             # full test suite
npm run typecheck    # standalone tsc
npm run lint         # standalone eslint
npm run verify       # all three in sequence
npm run build        # production bundle
```

The dev server hot-reloads on save. The test suite uses Vitest +
Testing Library + JSDOM; Capacitor Preferences is mocked.

## Workflow

1. **Open an issue.** Even a quick description in an issue beats a
   PR that has to be reshaped. We use `[BUG]`-prefixed and
   `[FEATURE]`-prefixed templates in `.github/ISSUE_TEMPLATE/`.
2. **Branch from `main`.** Naming convention: `fix/<short-noun>`,
   `feat/<short-noun>`, or `chore/<short-noun>`.
3. **Make the change.** Keep the diff focused. If you find a
   second bug while fixing the first, file it as a separate issue
   and don't bundle.
4. **Run `npm run verify`.** This MUST pass before you push.
5. **Push and open a PR** against `main`. The PR template asks for
   the things we need to know — fill every section that applies.
6. **CI runs:** typecheck, lint, full test suite, bundle-size
   budget, perf-baseline diff, Lighthouse mobile, accessibility
   axe sweep. All must pass.
7. **Review.** A maintainer reviews against this doc + the voice
   guidelines + the privacy commitments. Expect questions.

## What we'll merge fast

These changes get fast-track review (target: <48h):

- Locale fixes (typos, awkward phrasing, missing string)
- Documentation improvements
- Test coverage on existing code paths
- Accessibility fixes with a clear axe / Lighthouse trace
- Crisis surface improvements (regional helpline additions, copy
  edits)
- Bug fixes with a regression test

## What we'll usually decline

- Analytics, telemetry, tracking pixels, or any "just a tiny
  metric" addition. Hard no.
- Push notifications that aren't user-initiated. We do calm
  reminders the user opted into; we don't push retention nudges.
- Gamification surfaces (XP, levels, badges, "you're on fire!"
  banners). The voice guidelines bar these.
- Cloud-first features that don't have a local fallback.
- Features that bypass the crisis surface or hide regional
  helpline links behind a paywall.
- AI features that send raw user data anywhere by default.
- Major dependency bumps without a clear motivation.

## What gets a thorough discussion before code

These need an issue + maintainer agreement before you start:

- New top-level features (a new tab, a new permission, a new
  storage shape)
- Anything that changes how data is stored, exported, or imported
- Anything that touches the encryption / sync / backup machinery
- New optional opt-in features (those are okay; the discussion is
  about how the opt-in is presented)
- Changes to the voice guidelines or the banned-words list

## Code style

ESLint enforces most of it. The `.eslintrc.cjs` is the source of
truth. The notable items the linter doesn't catch:

- **Prefer named exports.** Default exports are fine for React
  components in their own file; everything else uses named.
- **Comment the WHY, never the WHAT.** Identifier names tell you
  what; comments tell you what's surprising, why a workaround is
  needed, what invariant the next reader needs to know.
- **No comments referencing "this PR" or "this fix".** They rot
  the moment the PR merges. Put that in the PR description.
- **No marketing language in code.** "amazing", "easy", "powerful"
  don't go in identifier names or strings.
- **Test the behavior, not the implementation.** A refactor that
  preserves behavior should not require test changes.

## Voice & tone

For any user-facing string, ask: would this be okay to read on the
worst day this month? If you are not sure, surface it in the PR
and ask. The voice guideline doc is in `audit-walkthrough/voice-
guidelines.md`.

The reading-grade target is 6-7. Sentences should be short. Verbs
do the work. Adjectives are suspect.

## Locales

If you add or change a user-facing string, you have to update all
six locales (`en.json`, `es.json`, `fr.json`, `de.json`, `pl.json`,
`ru.json`). The `locale-parity-all.test.ts` will fail otherwise.

If you don't speak the language, do your best with the existing
voice as a guide and label the new string `// REVIEW NEEDED` in the
PR description. A native-speaker reviewer can polish in a follow-up.
We've done this for every locale; it's normal.

## License

By contributing you agree your contributions are licensed under the
project's license (see `LICENSE` if present, otherwise the project
default per the `package.json`).

## Getting help

- Issues: <https://github.com/Zcg321/Alchohalt/issues>
- Discussions: enable via the GitHub repository tab if not already
  on; we welcome design / voice / philosophy questions there
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security disclosure: `SECURITY.md`

Thanks for taking the time to read this. The product is what it is
because we've held the line on these commitments. Help us keep
holding it.
