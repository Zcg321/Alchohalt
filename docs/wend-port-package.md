# Wend port package — exact files + decisions to copy from Alchohalt

[R28-4] Round 18 (`audit-walkthrough/cross-product-patterns.md`)
documented the *patterns* worth porting from Alchohalt to Wend
(digital death-prep SaaS). Round 28 turns that into a paste-ready
package: which files, what to keep, what to adapt, and what to
skip.

A second engineer should be able to read this doc, sit down at a
fresh Wend repo, and complete the port in a focused week.

## How to use this doc

1. Skim the table-of-contents below.
2. For each numbered item: read the **Source** section (what to
   copy verbatim), the **Adapt** section (what changes for Wend's
   domain), and the **Skip** section (what's Alchohalt-specific
   and should not port).
3. Cross-reference back to `audit-walkthrough/cross-product-patterns.md`
   for the *why*.

This doc is paths + decisions. The pattern-level rationale lives
in the round-18 doc.

---

## Contents

1. Round-process scaffolding
2. Calm-voice judge harness
3. On-device storage + privacy posture
4. Trust Receipt + verifiable build
5. End-to-end encrypted backup
6. On-device A/B + satisfaction signals
7. Diagnostics audit surface
8. i18n + plural helper
9. Onboarding state-machine + completion-rate harness
10. Bundle budget + perf-baseline gates
11. Anti-patterns (DO NOT port)

---

## 1. Round-process scaffolding

**Source files (copy verbatim, no Alchohalt-specific content):**
```
scripts/round-kickoff.sh
scripts/round-finalize.sh
scripts/health-scan.sh
scripts/release-checklist.sh
audit-walkthrough/_template.md
```

**Adapt:**
- The kickoff script grep for "alcohol" → swap to your product
  noun. There are 2-3 references.
- Set the round-number bookkeeping file (often a tag in CHANGELOG)
  to start at R1 for Wend.

**Skip:** `audit-walkthrough/round-N-*.md` past rounds — those are
Alchohalt history; Wend builds its own trail.

**Why this matters:** the round discipline is what made 28 rounds
of polish feasible. Without the scaffold, rounds become ad-hoc
sweeps that drift.

---

## 2. Calm-voice judge harness

**Source files:**
```
audit-walkthrough/round-13-journalist-judge.md
audit-walkthrough/round-14-researcher-judge.md
audit-walkthrough/round-17-clinician-judge.md
audit-walkthrough/round-22-65yo-non-tech-judge.md
audit-walkthrough/round-22-cognitive-load-judge.md
audit-walkthrough/round-25-disability-rights-judge.md
audit-walkthrough/round-26-ex-competitor-judge.md
audit-walkthrough/round-27-investor-due-diligence-judge.md
```

**Adapt for Wend's specialist gallery:**
- Estate lawyer → reads every legal-implication string with the
  same eye the journalist judge reads marketing-speak.
- Hospice nurse → reads every reminder / nudge for "would this
  reach a grieving spouse the wrong way."
- Grieving spouse → reads every onboarding beat for "is this
  written for me, the user, not for an investor's pitch deck?"
- Executor of complex estate → reads every export / share surface
  for "can I actually use this in the situation it's meant for?"
- Identity-theft expert → reads every sensitive-data UI for "is
  this the safe path?"

Keep the round-N-Xjudges-DATE.md aggregate doc shape. Each round
adds one specialist; over 18 rounds the gallery grows from 4 to
the round-N count.

**Skip:** the recovery-counselor judge persona — it's domain-
specific to Alchohalt. Wend's analogous role is the hospice nurse.

---

## 3. On-device storage + privacy posture

**Source files:**
```
src/store/db.ts                            # Zustand + persist + Capacitor Preferences
src/shared/capacitor.ts                    # Lazy-loaded native bridge
src/lib/storage/usage.ts                   # Storage quota + soft cap
src/features/settings/PrivacyStatus.tsx    # The pinned 1-line privacy summary
src/features/settings/PrivacyHeadline.tsx  # The privacy headline card
src/features/settings/ClearData.tsx        # Reset preferences + data
SECURITY.md                                # Threat model
```

**Adapt:**
- `Settings` shape: replace alcohol-tracking fields with Wend's
  death-prep-relevant fields (will state, executor list, document
  vault references, etc.).
- The `defaults()` function in db.ts: re-seed for Wend's empty
  state.
- `SECURITY.md`: re-write the threat model section. The crypto
  + on-device claim is portable; the specific data categories
  change.

**Skip:** Alchohalt-specific Settings keys (calmNotifications,
satisfactionSignals key namespace, etc.) — Wend will define its
own. The *shape* (typed Settings interface, partial-patch
setSettings) is what ports.

---

## 4. Trust Receipt + verifiable build

**Source files:**
```
src/lib/trust/receipt.ts                   # Hash chain + signing
src/features/settings/TrustReceipt.tsx     # User-facing UI
audit-walkthrough/round-19-security-researcher-judge.md
```

**Adapt:**
- The receipt content. Alchohalt's receipt covers entries-on-
  device count, sync state, AI-feature opt-in state. Wend's
  receipt covers documents-on-device count, executor-list state,
  and any cloud-stored ciphertext blob references.
- The receipt format: keep the JSON shape + checksum chain.

**Skip:** the alcohol-specific surface labels in TrustReceipt.tsx.

**Critical note:** the receipt is the user-verifiable proof of
the privacy claim. For Wend (where the user can't easily verify
post-mortem), this surface needs even more care. Document the
exact bytes that go into the receipt and how an executor would
re-verify it.

---

## 5. End-to-end encrypted backup

**Source files:**
```
src/features/backup/encryption.ts          # Argon2id + AES-GCM
src/features/backup/__tests__/             # Round-trip tests
audit-walkthrough/round-27-user-installed-content-backup-audit.md
```

**Adapt:**
- File extension: `.alch-backup` → choose Wend's, e.g. `.wend-backup`.
- Content schema: Wend's backup includes documents + executor
  list + intent metadata. Alchohalt's includes drinks + journal.

**Skip:** none — the crypto layer is portable as-is.

**Critical note:** Argon2id parameters (memory cost, iterations)
were tuned for Alchohalt's threat model. Re-evaluate for Wend's
stronger threat model — death-prep documents are higher-value
targets than drink logs. Consider raising memory cost from
Alchohalt's 64 MB to 256 MB; the 30-second backup-decrypt latency
is acceptable in Wend's flow but not Alchohalt's.

---

## 6. On-device A/B + satisfaction signals

**Source files:**
```
src/features/experiments/registry.ts       # Static module-scope registry
src/features/experiments/bucket.ts         # Stable variant assignment
src/features/experiments/useExperiment.ts  # React hook
src/features/experiments/winners.ts        # [R28-B] Winner readout module
src/features/experiments/AbWinnerReadout.tsx
src/features/experiments/ExperimentSatisfactionPanel.tsx
src/features/experiments/experimentSatisfactionCrosstab.ts
src/features/satisfaction/                 # Per-surface thumbs up/down
```

**Adapt:**
- `REGISTRY` content: Wend's experiments are different copy /
  flow tests. Start with an empty registry; add as you need.
- `SATISFACTION_SURFACES` keys: Wend's surfaces are different.

**Skip:** none — the entire harness is domain-agnostic.

**Why this matters:** lets Wend ship A/B + satisfaction tracking
without an analytics vendor. Investor / partner question "how do
you know what to improve" gets the same on-device-only answer.

---

## 7. Diagnostics audit surface

**Source files:**
```
src/features/settings/DiagnosticsAudit.tsx
src/features/settings/Diagnostics.tsx
src/features/settings/SelfExperimentDashboard.tsx
src/features/satisfaction/SatisfactionDashboard.tsx
src/features/onboarding/funnel.ts
```

**Adapt:**
- The fieldsets (Notifications, Accessibility, Locale, Storage,
  Backup, Experiments, NPS, Satisfaction, A/B winners). Each
  reads off-the-shelf from the store; the shape ports cleanly
  but the labels need Wend-specific wording.

**Skip:** none of the architecture; just the labels.

**Critical note:** this surface is what investors point at when
they ask "show me your analytics dashboard." Wend should keep
the on-device-only invariant — the dashboard reads local store,
nothing else.

---

## 8. i18n + plural helper

**Source files:**
```
src/i18n/index.tsx                         # LanguageProvider + t()
src/i18n/plural.ts                         # Intl.PluralRules helpers
src/locales/{en,es,fr,de,pl,ru}.json       # 6-locale catalogs
```

**Adapt:**
- Wend ships in fewer locales at launch (en, es, fr — the death-
  prep market is smaller in pl/ru). Drop the unused locale files
  for v1.0; add them per round as native-translator review passes
  land.
- The string keys: Wend has its own surface vocabulary.

**Skip:** Alchohalt's locale catalogs verbatim — re-translate
from scratch for Wend's vocabulary. Borrow only the catalog
shape + the plural helper.

**Critical note:** R18 i18n-specialist judge caught a fr/de voice
drift that 4 rounds had missed. Apply that judge from round 1 of
Wend.

---

## 9. Onboarding state-machine + completion-rate harness

**Source files:**
```
src/features/onboarding/OnboardingFlow.tsx
src/features/onboarding/funnel.ts
tools/onboarding/synthetic_walkthrough.ts  # [R28-3]
src/__tests__/onboarding-synthetic-walkthrough.test.ts
audit-walkthrough/round-28-onboarding-completion-baseline.md
```

**Adapt:**
- The 3-beat structure works for Alchohalt's "intent → track-
  style → ready" flow. Wend has different beats — likely
  "intent (cut-back analog: completing or organizing?) →
  document scope → ready." Re-design the beats; keep the
  state-machine + diagnostics + funnel shape.
- `ACTION_WEIGHTS_BEAT_*` in synthetic_walkthrough.ts: re-tune
  for Wend's plausible user behavior.

**Skip:** the BeatOne/BeatTwo/BeatThree React components verbatim
— the copy is Alchohalt-specific. The skeleton + the diagnostic
recording calls port; the strings don't.

---

## 10. Bundle budget + perf-baseline gates

**Source files:**
```
tools/check_bundle_budget.cjs              # Eager-JS budget check
tools/perf_baseline.cjs                    # 5% perf regression gate
tools/marketing/captions.ts                # [R28-2] Caption overlay
size-limit configuration in package.json
```

**Adapt:**
- Bundle budget threshold (Alchohalt: 250 KB). Wend's threshold
  depends on its initial route surface; set per its own
  measurement, not Alchohalt's.
- Perf baseline metrics: same shape, re-pin from Wend's HEAD.

**Skip:** none of the tooling; just the threshold values.

---

## 11. Anti-patterns (DO NOT port)

These work for Alchohalt's domain but are wrong for Wend:

1. **Streak-based engagement.** Wend has no natural streak;
   "consecutive days you remembered to update your will" is
   absurd. No streaks, no streak-break prompts.
2. **HALT-style mood tagging.** Recovery psychology framework;
   doesn't generalize to grief / ambivalence / family pressure.
3. **Crisis-line surface for 988 / SAMHSA.** Wend's analogous
   surface links to grief support, hospice resources, identity-
   recovery hotlines. Different vocabulary entirely.
4. **Daily reminders / quiet-hours.** Death-prep is not a daily-
   habit product. Reminders should be event-triggered (life
   change, post-mortem) not cadence-triggered.
5. **Standard-drink unit conversions.** Domain-specific to
   Alchohalt; the equivalent for Wend would be jurisdiction-
   specific document formats (notarization rules, witness
   requirements) which is its own R-N work.

---

## Suggested Wend round-1 plan

Keeping this concrete and shippable in 1-2 weeks:

1. **Day 1:** scaffold the round process (item 1 above) +
   on-device storage shape (item 3).
2. **Day 2-3:** trust receipt + E2E backup (items 4 + 5).
3. **Day 4-5:** A/B + satisfaction harness + diagnostics audit
   surface (items 6 + 7).
4. **Day 6-7:** i18n helper + locale catalogs for en/es/fr
   (item 8).
5. **Day 8-10:** onboarding state-machine adapted for Wend's
   beats (item 9), completion-rate harness with Wend baseline.
6. **Day 11-12:** bundle budget + perf baseline gates (item 10).
7. **Day 13-14:** R1 judge gate (4 judges to start: estate
   lawyer, NYT writer, privacy journalist, hospice nurse).

Round 2-onward iterates on domain-specific surfaces without
re-litigating the foundation.

## Attribution

Source patterns: Alchohalt rounds R1-R28, owner Cowork Sprint,
co-authored with Claude Opus 4.7 (1M context).

This package is owner-property; copy into Wend without further
permission.
