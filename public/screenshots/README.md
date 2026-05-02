# App Store screenshot assets

This folder is the destination for App Store / Play Store screenshots
once the owner registers Apple Developer + Google Play and we run a
deterministic capture pass.

## Directory layout (target)

```
public/screenshots/
├── ios/
│   ├── en/
│   │   ├── 01-today.png            # Day N hero + primary CTA
│   │   ├── 02-log-drink.png        # DrinkForm with chips selected
│   │   ├── 03-insights.png         # Trend tile + smart rec
│   │   ├── 04-crisis.png           # Hard time panel + 988 button
│   │   └── 05-settings.png         # Data Management + plan chip
│   └── es/                         # Same five, Spanish locale
├── android/
│   ├── en/  (same five)
│   └── es/  (same five)
└── feature-graphics/
    ├── ios-feature-graphic.png
    └── android-feature-graphic.png
```

## Capture targets

### iOS App Store
- iPhone: **1290 × 2796** (iPhone 15 Pro)
- iPad: **2048 × 2732** (iPad Pro 12.9")
- No device frames — Apple now generates these in the listing.

### Google Play Store
- Phone: **1080 × 1920** minimum
- Tablet: **1200 × 1920** minimum
- Feature graphic: **1024 × 500**

## What to capture

1. **Today** — Day-N hero, "Log a drink" or "Mark today AF" CTA, the
   stats-strip below. Shows the calm voice + the primary verb.
2. **Log a drink** — DrinkForm with a chip selected (e.g. "Beer"),
   time set, "Add detail" expanded once. Shows progressive disclosure.
3. **Insights** — One progress tile + one smart recommendation. Picks
   honest copy ("Past the first week"), avoids the wellness panel
   (Premium-only).
4. **Right now** — Hard-time panel with the 988 / SAMHSA / breathing
   buttons visible. The "calm + real crisis support" promise made
   tangible.
5. **Settings → Data Management** — Plan chip + the "Nobody else,
   including us, can see what you log" copy. Shows the privacy
   story.

## Caption copy (per screenshot)

The store listings allow a short caption ABOVE each screenshot. Use
the round-4 voice. Sentence case. No exclamation marks. No emoji.

| # | Caption |
|---|---|
| 1 | Day-N counter. Quiet wins count. |
| 2 | Log a drink in three taps. |
| 3 | Patterns from your last 30 days. Not medical advice. |
| 4 | Crisis lines on every screen. One tap, no friction. |
| 5 | Your logs stay on your device. We can&rsquo;t read them. |

## Old marketing copy (deleted)

The previous version of this README had banned phrases per round-4
voice guide:
- "wellness journey"  → banned
- "AI-powered insights"  → AI is now opt-in, off by default; can&rsquo;t
  be the headline.
- "100% private — data never leaves your device"  → old opening,
  replaced by the calm + crisis-support headline (see
  `docs/launch/app-store-description.md`).
- "celebrate progress"  → banned ("hollow praise" per voice guide).

The current canon for the listing is:

> A calm alcohol tracker. No streaks-leaderboards, no levels, no
> rocket emojis. Just clean tracking and real help when you need it.

See `docs/launch/app-store-description.md` for the full long copy
ready to paste into App Store Connect / Play Console.

## Generating the screenshots

Once a real iOS / Android sim or emulator is available, the easiest
path is:
- iOS: open in iPhone-15-Pro simulator, hit ⌘⇧4 with Quick Time
  recording, save with the right resolution.
- Android: `adb shell screencap` from a Pixel 8 emulator at 1080×1920.
- A future round can automate this with Playwright once a Chromium
  binary is available on the build machine. For now, manual is fine —
  this is a one-time submission asset, not a CI artifact.
