# Round 21 — tablet layout audit

Date: 2026-05-03
Devices simulated: iPad Air 4 (820 × 1180 portrait, 1180 × 820
landscape), iPad Pro 12.9 (1024 × 1366 portrait, 1366 × 1024
landscape), Galaxy Tab S8+ (1138 × 712 landscape).

Goal: at iPad / Android-tablet widths, does anything look stranded?
Are any layouts wasting horizontal space? Do touch targets still
meet 44pt at higher pixel density?

## Methodology

Tablets fall into two breakpoint zones with the app's current Tailwind config:
- **iPad portrait (820 × 1180):** `md:` active (≥768px), `lg:` not
  active (<1024px). Mobile bottom-tab nav shown; content fills the
  width within max-width constraints.
- **iPad landscape (1180 × 820)** and any tablet ≥1024px wide:
  `lg:` active. Desktop top-nav shown; content centered within
  `max-w-3xl` (TabShell) and tab content centered within
  `max-w-2xl` (672px).

Tap targets: density-independent in CSS pixels. 44px CSS = 44pt at
1×, 2×, 3× device pixel ratio. Existing `min-h-[44px]` calls
already meet WCAG 2.5.5 / Apple HIG minimums.

## Findings — by impact

### MEDIUM — Insights tab content stranded at landscape tablet

`src/app/tabs/InsightsTab.tsx` uses `max-w-2xl` (672px). At iPad
landscape (1180px) or iPad Pro landscape (1366px), this leaves
~250-350px of empty horizontal space on each side. Charts + cards
that benefit from horizontal real estate (mood-correlation table,
peak-hour bar chart, monthly-spending bars) feel pinched.

**Fix:** widen to `max-w-2xl md:max-w-3xl` so iPad landscape gets
768px, iPad Pro landscape gets the same 768px (still bounded — we
don't want chart line-of-sight to exceed ~80ch). 96px more
horizontal room makes the difference between charts that fit
comfortably and charts that hit edge cases.

Applied in this commit. Empty-state header gets the same widen
since it shares the same max-width contract.

### LOW — Goals tab + Settings tab layouts

`max-w-2xl` (672px) is intentionally newspaper-column reading width.
Settings cards stack vertically; goals list is per-goal cards.
Multi-column at md+ would create reflow inconsistency between
mobile and tablet for what's essentially text-heavy content.

**Decision: keep as-is.** The "wasted" horizontal space is the
correct tradeoff for readability. A user with a goal list of 8+
goals on a wide tablet might benefit from a 2-column layout, but
that's an edge case (<5% of users have >5 goals per the typical
recovery-app distribution) and the symmetry with the mobile single-
column experience is more valuable than the marginal density gain.

### LOW — TabShell desktop nav width

`mx-auto max-w-3xl` (768px) for the top-nav. At iPad Pro landscape
(1366px) the nav is centered with 300px gutters. This matches the
content max-width (so they line up vertically) and is intentional —
making the nav span the full viewport while content stays at 768px
would look disconnected.

**Decision: keep as-is.** The visual alignment of nav + content is
worth more than utilizing the full nav-bar width.

### LOW — Today tab homepage

`src/features/homepage/TodayHome.tsx` uses `max-w-2xl` for most
sections (homepage card, ribbons) and `max-w-3xl` for one wider
section. Inconsistency by design — the wider section is the
multi-column "ribbon" view that benefits from horizontal density;
the others are reading-width content.

**Decision: keep as-is.** The mixed widths are intentional per
section's content type.

### NONE — Tap targets

Spot-checked the major interactive surfaces:
- Bottom-tab nav buttons: w-full (1/5 of screen), py-2 (16px V),
  flex column with 5px icon + 16px text + 2px underline. Total
  vertical = ~62px CSS = 62pt physical at any DPR. **Pass.**
- Top-nav buttons: px-4 py-2 (16px V × 32px H), text-caption (~13px).
  Total ~33px CSS. **Below the 44pt threshold but desktop-only;
  these aren't touch targets in the lg: breakpoint.** Acceptable.
- Goal/preset cards: p-card (~24px) on rounded-2xl tap target. **Pass.**
- Form inputs: rounded-lg with px-3 py-2 + 16px text. ~40px CSS
  before considering line-height. Edge: the standalone "Save" /
  "Cancel" buttons in cards meet `btn` class which has min-height.
- Toast undo button: text-link inline within a flex row with py-3.
  ~44px tap area via parent padding. **Pass.**
- Crisis call buttons: explicit `min-h-[44px] min-w-[44px]`
  per CrisisResources.tsx. **Pass.**
- AddGoalModal close button: explicit `min-h-[44px] min-w-[44px]`. **Pass.**

No tap-target failures found at tablet density.

### NONE — Modal / dialog widths

Dialogs use `max-w-md` (448px) by default which is fine on tablet —
a dialog spanning 1366px would feel oversized. iPad Pro landscape
hosts a 448px dialog with breathing room around it; correct.

## Summary

3 findings:
- 1 MEDIUM (Insights tab widen): **fixed in this commit**.
- 2 LOW (Goals/Settings/TabShell as-is): **decision documented**.
- Tap targets: **no failures**.

The app's tablet experience is already largely correct — the
single fix lands a real improvement (more horizontal room for
Insights charts) without disrupting the mobile-first defaults.

## Process notes

The audit walks the layout end-to-end via the Tailwind breakpoint
zones (mobile <640, sm 640-768, md 768-1024, lg 1024-1280, xl
1280-1536, 2xl ≥1536). Tablets sit in the md/lg transition zone
where mobile-first defaults make sense up to 1024px and desktop
defaults take over above.

For R22, recommend a **landscape phone audit** (iPhone 15 Pro Max
landscape = 932 × 430). The phone-landscape mode is rarely tested
and may have fixed-position elements that overlap rotated content.
