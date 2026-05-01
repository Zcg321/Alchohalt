# Mobile-first sanity — 2026-05-01

Alchohalt ships as a PWA + Capacitor (iOS / Android). This pass
checks the chrome behaviors that aren't covered by automated tests
or Lighthouse.

## Findings

### F-MOB-1 — `safe-bottom` / `safe-top` utility classes were undefined 🔴

**Severity:** material — visible chrome regression on iPhones X+.

`src/app/TabShell.tsx:106` applies `className="… safe-bottom"` to
the mobile bottom-tab bar. **No CSS file defined `safe-bottom`.**
The class was a dead reference; the bar sat under the iPhone home
indicator gesture area, blocking taps on the rightmost tab on any
iPhone with a home bar.

**Fix:** added utilities in `src/index.css`:

```css
.safe-bottom { padding-bottom: max(env(safe-area-inset-bottom), 0px); }
.safe-top    { padding-top:    max(env(safe-area-inset-top),    0px); }
```

`max()` keeps the value sane on Android / web where `env()` is
0. Also applied `safe-top` to `AppHeader.tsx` so the title row
clears the iOS notch. `[AUDIT-2026-05-01-F]`

### F-MOB-2 — Bottom-tab content overlap padding 🟡

The active panel wrapper uses `pb-24 lg:pb-0` to keep content from
sliding under the bottom tab. 24 × 4 = 96px. The bottom-tab nav is
roughly 60px tall + safe-bottom inset (~34px on iPhone X). On the
tallest screens we're ~98px which is borderline. Filed as a
follow-up — current state isn't broken on test devices, but a
`pb-[calc(theme(spacing.20)+env(safe-area-inset-bottom))]` would
be more robust.

### F-MOB-3 — Touch targets ≥ 44 × 44 ✓

Spot-checked all primary CTAs:

- `Crisis: Call 988` — `min-h-[44px]`
- `Help?` chip in AppHeader — `min-h-[44px]`
- TabShell tab items — `py-2` + 5-wide grid on a 375px viewport
  gives 75 × 56px each; well above 44 × 44.
- DrinkForm submit / chips — pre-existing `min-h-[44px]`
  utility from prior `[A11Y-1]`.

No regressions found.

### F-MOB-4 — Pull-to-refresh ✓

Grepped for `pullToRefresh` / `refreshOnPull` — nothing implemented.
No conflict with native scroll. Recommend leaving this absent unless
real user signal asks for it; PTR on iOS WebView is finicky and
adding it casually creates phantom scroll-jumps.

### F-MOB-5 — Status-bar style 🟡

`src/services/theme.ts` updates `<meta name="theme-color">` to
match the active theme — this works for browsers (Chrome on
Android tints the system bar). **It does NOT control the
Capacitor StatusBar plugin** on iOS native, where the status bar
is a separate entity.

If iOS native shipping is real (the `build:ios` script suggests
yes), wire `@capacitor/status-bar` and call `StatusBar.setStyle({
style: theme === 'dark' ? Style.Dark : Style.Light })` in
`themeManager.applyTheme()`. The plugin is not yet a dependency.
**Filed, not shipped** — adding a Capacitor plugin mid-audit
would need a build verify on actual hardware.

### F-MOB-6 — Haptics 🟡

The audit prompt called out: "Haptics on key actions (drink logged,
milestone hit) — Capacitor.Haptics or a no-op fallback."

`@capacitor/haptics` is **not installed**. The reward moments —
drink logged, milestone hit, streak day — fire visually only. This
isn't a regression (haptics weren't there pre-audit) but it's a
nice-to-have on native. Adding requires:

1. `npm install @capacitor/haptics`
2. A thin wrapper at `src/shared/haptics.ts` with no-op web
   fallback
3. Calls in `addEntry` / streak tick / milestone-reached effects

**Filed, not shipped** — same reason as F-MOB-5: needs a real
device verify before recommending.

### F-MOB-7 — Viewport meta ✓

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
```

`viewport-fit=cover` is what makes the `env(safe-area-inset-*)`
values meaningful — without it the WebView behaves as if there were
no notch. Confirmed present.

### F-MOB-8 — Reachability on 375px ✓

The mobile bottom-tab bar is reachable with one thumb on iPhone SE
(375 × 667). Tabs are 5-wide so each is 75px — natural thumb
sweep. The "Need help?" chip at top-right is a thumb stretch but
the user typically won't be navigating there mid-action; it's a
break-glass surface.

`AlcoholCoachApp.tsx` has a `ScrollTopButton` on long lists which
helps the down-and-out flow.

## Net effect

| Issue | Before | After |
|--|--|--|
| `.safe-bottom` defined | ❌ dead class | ✅ honors home indicator |
| `.safe-top` on header | ❌ touches notch | ✅ `safe-top` |
| Touch targets ≥ 44 | ✅ | ✅ |
| Status-bar plugin | ❌ not wired | filed |
| Haptics | ❌ none | filed |
| PTR conflict | n/a (none) | n/a |
