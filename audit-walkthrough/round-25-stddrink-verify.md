# Round 25 — R25-A: Country-aware std-drink units, verification + NZ expansion

**Date:** 2026-05-03
**Carry-forward from:** Round 24 final report (R25-blocker)
**Status:** Verified shipped (R14-6) + R25-A delta merged

## What the round-24 competitive matrix said

> "Alchohalt accepts ml + ABV %, computes std drinks via a single
> US-style 14g formula. No country-toggle for UK 8g, AU 10g, etc."
> — `audit-walkthrough/round-24-competitive-matrix.md` § D.1

**This was incorrect.** The country toggle was already shipped in R14-6.
The matrix was written without checking the current state of `src/lib/calc.ts`.
R25-A's job: verify that the toggle is solid end-to-end, expand coverage
where coverage was thin, and update the documentation so the next round's
audit doesn't repeat the same mistake.

## What was already shipped (R14-6 + R15-C)

### Numeric model — `src/lib/calc.ts`

`STD_DRINK_GRAMS` table holds grams-of-ethanol per "standard drink" (or
"unit" in UK parlance) for every health-authority definition we honor:

| System | Grams / std | Source |
|--------|-------------|--------|
| `us`   | 14.0        | NIAAA  |
| `uk`   | 8.0         | NHS / Chief Medical Officers (called "units") |
| `au`   | 10.0        | NHMRC  |
| `eu`   | 10.0        | NL/FR/DE/IE consensus (ICAP report) |
| `ca`   | 13.6        | Canada Low-Risk Drinking Guidelines |
| `ie`   | 10.0        | Irish HSE |

`stdDrinks(volumeMl, abvPct, system?)` honors a module-level
`activeSystem` set on app boot via `setActiveStdDrinkSystem()`. Pure
gram-of-ethanol arithmetic is invariant; only the divisor changes.

### Settings hook — `src/app/hooks/useAppEffects.ts`

`useStdDrinkSystem` reads `db.settings.stdDrinkSystem` (or
`detectStdDrinkSystemFromNavigator()` if unset) and pushes the value
into `setActiveStdDrinkSystem`. Re-runs whenever the user changes
the setting. All 20+ `stdDrinks()` callers across the app honor the
active system.

### Picker — `src/features/settings/SettingsPanel.tsx`

`<select id="std-drink-system">` lets the user pick. Default is the
locale-detected value. The Diagnostics card surfaces the detected
default with a "you can change this" hint when the user hasn't
explicitly set one (R15-C).

### Locale detection — `src/lib/detectStdDrinkSystem.ts`

`detectStdDrinkSystem(localeTag)` parses the BCP-47 region subtag
(`en-GB` → `gb` → `uk`) and returns a `StdDrinkSystem`. Conservative
mapping: only known regions get a non-`us` answer.

## R25-A delta (this round)

### 1. Add `nz` (New Zealand) as a first-class system

The matrix called out UK/AU/IE/NZ/CA store reviews as the unblock
target. NZ was the only entry from that list missing. Added:

- `STD_DRINK_GRAMS.nz = 10.0` (NZ Health Promotion Agency)
- `STD_DRINK_SYSTEM_LABELS.nz = 'New Zealand (HPA, 10 g)'`
- `case 'nz': return 'nz'` in the locale detector
- `<option value="nz">` in the SettingsPanel picker
- Test coverage in both `stdDrinkSystems.test.ts` and
  `detectStdDrinkSystem.test.ts`

NZ has the same 10g constant as AU/EU/IE, but a distinct label —
identity matters for trust signal. A Kiwi user seeing "Australia"
as their detected default would (rightly) wonder if the app was
written for them.

### 2. Expand EU locale detection

The detector previously covered 16 EU/EFTA regions. Added 9 more:

- `sk` Slovakia, `hu` Hungary, `ro` Romania, `gr` Greece
- `lu` Luxembourg, `lt` Lithuania, `lv` Latvia, `ee` Estonia
- `si` Slovenia, `hr` Croatia, `bg` Bulgaria, `is` Iceland

All map to `eu` (10g consensus). Same conservative bias: a region
we don't recognize falls through to `us` rather than guessing.

## What we did NOT do, and why

### No re-scaling of historical entries

The picker affects what's *displayed* and *computed* going forward.
It does NOT mutate stored entries. A drink logged on Tuesday at
US 1.0-std-equivalent will display as UK 1.75-units the moment the
user switches to UK — but the underlying `volumeMl × abvPct` data
is unchanged, and switching back restores the original count.

This is intentional: the source-of-truth is grams-of-ethanol, not
"std drinks." We never want to bake a jurisdiction choice into the
data model.

### No automatic detection-on-launch

Users who already shipped through onboarding and never set the
system explicitly continue on the auto-detected default. We only
re-run detection if the setting is unset. Aggressive re-detection
would surprise users who've moved between countries and want their
historical baseline preserved.

### No "your country" superset setting

Considered: a single "country" picker in Settings that drives
std-drink + crisis-line region + currency + plurals all at once.
Decided against for R25 — those four already auto-detect from
locale independently, and a single conjoined setting would be a
net-loss when (e.g.) someone uses USD pricing but lives in the UK.

## Test coverage

- `src/lib/__tests__/stdDrinkSystems.test.ts` — 23 tests, +1 for NZ
- `src/lib/__tests__/detectStdDrinkSystem.test.ts` — 14 tests, +2 for NZ + EU expansion

All passing. Wire-through to `useAppEffects` covered indirectly by
existing component tests that exercise stdDrinks-dependent surfaces.

## Sign-off

R25-A is shipped. The competitive matrix § D.1 line should be
considered closed. NZ user count (per analytics-free posture) is
unknown but the App Store cost of supporting NZ is now zero.

— Round 25 audit, 2026-05-03
