# Governance

## Status

Alchohalt is a single-maintainer open-source project. The current
maintainer (referred to as "the owner" elsewhere in the codebase
and audit walkthroughs) holds final decision authority on all
matters: roadmap, design, voice, releases, and merges.

This is honest, not aspirational. The "we" in `CONTRIBUTING.md`
refers to the maintainer + the assist-bot they pair with on each
sprint. When this changes — when a second human maintainer joins —
this doc gets updated to reflect a maintainer team.

## Decision making

For day-to-day work:

1. **Owner decides.** Most decisions are made directly by the
   owner, often inside a sprint round (see `audit-walkthrough/
   round-*.md` for the public record of each round's decisions).
2. **Issues + PRs are the public record.** Discussion happens on
   GitHub. Decisions get written into issue comments or the PR
   description so a future contributor can reconstruct the
   reasoning.
3. **Audit walkthroughs are the round-level record.** Every
   N-judge gate doc captures what landed, why, and what's
   deferred. They are append-only — older rounds aren't rewritten.

For non-trivial decisions (a new top-level feature, a change to
the privacy commitments, a major dependency, a release):

- The owner posts a short proposal in an issue
- Contributors and users have at minimum 7 days to comment
- The owner's decision is recorded in the issue with the
  motivation written down

## What the owner won't decide unilaterally

The product's hard floors are not the owner's to relax. Even the
owner cannot remove them without a major-version commitment and a
public migration story:

1. **No analytics.** Adding any analytics SDK requires a major
   version bump and a 90-day public migration window where users
   can export their data.
2. **No ads.** Same.
3. **The crisis surface stays first-class.** It cannot be paywalled,
   feature-flagged-off, or otherwise made conditional.
4. **End-to-end encryption stays end-to-end.** Server-side
   decryption is not a future option, even with user consent —
   that consent surface would be a foothold for vendor pressure.
5. **The locales we ship stay shipped.** Removing a locale once
   it has shipped requires a major version + 90 days notice.

These are the user-facing commitments the owner has made publicly
(in the App Store description and in `audit-walkthrough/moat-
analysis-2026-05-01.md`). They are the floor. Future owners (if
the project transfers) inherit them.

## Releases

- Releases are tagged in git. Patch / minor / major follows
  semver.
- Release notes go in `CHANGELOG.md` and the GitHub release.
- Mobile builds (iOS / Android) are released via `npm run
  build:android` / `build:ios` and submitted to the respective
  stores by the owner.

The CI pipeline (typecheck, lint, test, bundle budget, perf
baseline, Lighthouse mobile, axe sweep) gates every release. A
release that doesn't pass CI does not ship — including for
"emergency" hot-fixes. If you find yourself wanting to bypass CI,
the answer is fix the underlying issue, not skip the gate.

## Maintainership

The current maintainer is the owner of the GitHub repository. The
`@OWNER_OR_TEAM` placeholder in `.github/CODEOWNERS` is replaced
with their handle in production.

If a second maintainer joins:

- They are added to `.github/CODEOWNERS` for the file paths they
  own
- They are listed in this doc with their area of responsibility
- They get merge rights via GitHub branch protection rules
- An update to this doc records the change

Contributors who consistently produce high-quality reviews and PRs
over a sustained period (≥3 months, ≥5 merged PRs, no Code-of-
Conduct issues) may be invited to join as a maintainer. We don't
promise this; we just say it's the path.

## Changes to this document

Substantive changes to GOVERNANCE.md require a public proposal in
an issue + at least 7 days for community comment. Editorial
changes (clarifying wording, fixing typos) can be made directly
by the owner and noted in the commit message.

## Conflict resolution

In the rare case the owner is in direct conflict with a
contributor, the path is:

1. Discuss in the relevant issue / PR
2. If unresolved, escalate to a separate issue tagged
   `governance` and have a public, civil discussion
3. The owner makes the final call, with the reasoning written
   down, but is on the record about the disagreement

Civility is required even in conflict — see `CODE_OF_CONDUCT.md`.

## Forks

The project's license permits forking. If you fork because you
disagree with a decision, that's fine — please don't characterize
your fork as an "official" alternative or as endorsed by the
maintainer unless we agree to that in writing.

## Amendments

This document was created in Round 26 (2026-05-04) as part of the
open-source contributor onboarding pass (R26-3). It will be
amended as the project's community evolves.
