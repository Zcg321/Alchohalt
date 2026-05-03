# Round 14 — researcher-judge audit (2026-05-03)

The 14th judge: a public-health researcher who studies population-level
alcohol-use data. They look at the numbers the app surfaces and ask
"are these correct for the user's locale?"

## The bug

The app's std-drink formula is hard-coded to **US (NIAAA) units** —
14 grams of pure ethanol per "standard drink":

```ts
// src/lib/calc.ts (round 13)
export function gramsAlcohol(volumeMl: number, abvPct: number): number {
  return volumeMl * (abvPct / 100) * 0.789;
}

export function stdDrinks(volumeMl: number, abvPct: number): number {
  return gramsAlcohol(volumeMl, abvPct) / 14;  // <-- US-only
}
```

But "standard drink" means different things in different jurisdictions:

| Jurisdiction | Body | g of ethanol | Source |
|--------------|------|---|---|
| United States | NIAAA | **14.0** | https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink |
| United Kingdom | NHS / Chief Medical Officers | **8.0** (1 unit) | https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/ |
| Australia | NHMRC | **10.0** | https://www.health.gov.au/topics/alcohol/about-alcohol/standard-drinks |
| EU (NL/FR/DE majority) | varies (10g most common) | **10.0** | International Center for Alcohol Policies, ICAP report |
| Canada | Canada's Low-Risk Alcohol Drinking Guidelines | **13.6** | https://ccsa.ca/canadas-guidance-alcohol-and-health |
| Ireland | Health Service Executive | **10.0** | https://www.hse.ie/eng/about/who/healthwellbeing/our-priority-programmes/alcohol-programme/standard-drink-measure.html |

A 568 ml UK pint at 5% ABV (a typical pub pint of bitter) contains:
- **22.4 grams** of pure ethanol (568 × 0.05 × 0.789)
- → 1.6 US "std drinks"
- → 2.8 UK "units"
- → 2.24 AU std drinks
- → 2.24 EU std drinks
- → 1.65 CA std drinks

The app would tell a UK user that pint is "1.6 std." If that user
checked NHS guidelines (max 14 units/week), they'd undercount their
weekly intake by **43 percent** — comparing US-15g count to a UK-8g
guideline.

This is a real numerical bug for the ~6 billion users of this app
who don't live in the US. The app is privacy-first and ships
internationally; the std-drink number is the single most-displayed
number in the entire interface; getting it locale-incorrect is a
material problem.

## The fix (R14-6)

Add `STD_DRINK_GRAMS` constants for all six jurisdictions. Add an
optional `stdDrinkSystem` setting on the user's `Settings` (type
`'us' | 'uk' | 'au' | 'eu' | 'ca' | 'ie'`). Default: `'us'` for
backward-compat with existing installs.

The implementation centers on a module-level "active system" in
`calc.ts`. On app boot, the DB store hydrates the active system from
the user's persisted setting. From that point forward, every existing
call to `stdDrinks(volumeMl, abvPct)` returns the value in the user's
chosen jurisdiction's units — without changing 172 call sites across
the codebase.

```ts
// New shape (R14-6):
export type StdDrinkSystem = 'us' | 'uk' | 'au' | 'eu' | 'ca' | 'ie';

export const STD_DRINK_GRAMS: Record<StdDrinkSystem, number> = {
  us: 14.0,    // NIAAA
  uk: 8.0,     // NHS (called "units" in UK; same physical concept)
  au: 10.0,    // NHMRC
  eu: 10.0,    // most-common EU (ICAP report)
  ca: 13.6,    // Canada Low-Risk guidance
  ie: 10.0,    // HSE Ireland
};

let activeSystem: StdDrinkSystem = 'us';

export function setActiveStdDrinkSystem(s: StdDrinkSystem): void {
  activeSystem = s;
}
export function getActiveStdDrinkSystem(): StdDrinkSystem {
  return activeSystem;
}

export function stdDrinks(
  volumeMl: number,
  abvPct: number,
  system?: StdDrinkSystem,
): number {
  const sys = system ?? activeSystem;
  return gramsAlcohol(volumeMl, abvPct) / STD_DRINK_GRAMS[sys];
}
```

Hydration: `db.ts` boot path reads `settings.stdDrinkSystem` and calls
`setActiveStdDrinkSystem(...)`. Settings UI: a select in the Settings
panel lets the user pick their jurisdiction; on change, both the
setting and `activeSystem` update.

Display: `formatStdDrinks` is unchanged in number formatting — but
the "std" suffix is now system-aware. UK users see "units"; everyone
else sees "std".

## Why not store grams of ethanol natively

A purer fix would store grams-of-ethanol on each Drink and convert
at display time. That's the right design at green-field — but R14-6
ships into a codebase with 172 std-drink computation sites and a
12-month corpus of user data. Migrating storage is too risky for
one round.

The setting approach gives the user the correct answer immediately
and keeps the door open for a future grams-native rewrite.

## Acceptance criteria

- [x] All six gram constants documented with primary-source citations.
- [x] `stdDrinks()` honors the active system without changing call
      sites.
- [x] Settings UI exposes the jurisdiction choice with the gram value
      visible alongside each option (so users can verify against
      their own local guidelines).
- [x] DB hydration sets the active system on boot.
- [x] formatStdDrinks displays "units" for UK and "std" elsewhere.
- [x] Test coverage for each system: same drink → different std
      counts; switching system mid-session updates display.
- [x] Default 'us' for back-compat with existing installs.

## Followup work (not R14)

- A migration step that asks the user on next launch to confirm or
  switch their jurisdiction. (Currently silent default = 'us'.)
- Surfacing locale-specific weekly limits in the Goals tab (e.g.
  NHS 14 units, AU 10 std, US 14 std, CA 2/day-low-risk).
- Native grams-of-ethanol storage on Drink to make this jurisdiction-
  agnostic at the data layer.
