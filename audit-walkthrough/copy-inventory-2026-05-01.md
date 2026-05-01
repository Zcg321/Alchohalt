# Copy inventory — Alchohalt (2026-05-01)

This catalogs the user-facing strings that this voice pass touches. Surfaces below were audited in priority order: anything a user sees in the first 30 seconds, then privacy/paywall/crisis, then long-tail (errors, premium tiles, legal). The locale files (`src/locales/en.json` and `src/locales/es.json`) are the source of truth for translated keys; many surfaces hardcode strings inline as well.

Scope of this pass:
- **Highest-priority surfaces:** Day 0 home, onboarding flow, settings privacy claims, sync panel, subscription page, crisis resources, paywalls, error boundary.
- **Long tail touched:** notification bodies, paywall labels, recommendations buzzwords, premium tiles, empty states across tabs, legal-page wellness phrasing.
- **Out of scope this pass:** non-English locale (es.json — synced where keys changed), purely structural labels ("Theme", "Language", "Email"), legal compliance language in formal policy bodies.

## A. Privacy / "cryptographically cannot read"

Owner brief said this appears 3× in the first 30 seconds. Codebase actually had **10 instances**. The technical phrase belongs in one canonical site (Settings → Data Management); everywhere else gets plain language.

| # | File | Line | Surface | Current | Decision |
|---|------|------|---------|---------|----------|
| A1 | `src/locales/en.json` | 76 | Today footer disclaimer | "Your data is yours. We cryptographically cannot read it. Not medical advice." | **Rewrite** — plain |
| A2 | `src/locales/en.json` | 152 | Onboarding privacy step (legacy carousel) | "Your data is yours. We cryptographically cannot read it. Optional AI features…" | **Rewrite** — plain |
| A3 | `src/locales/en.json` | 191 | privacy.onDevice (About page) | Same | **Keep** — this is the canonical site |
| A4 | `src/features/homepage/TodayPanel.tsx` | 147 | Day 0 hero subcopy | "Logging stays on this device. We cryptographically cannot read it." | **Rewrite** — plain |
| A5 | `src/features/onboarding/OnboardingFlow.tsx` | 107 | Onboarding Beat 3 (the new flow) | "We cryptographically cannot read what you log. Cancel anytime." | **Rewrite** — plain |
| A6 | `src/features/settings/About.tsx` | 41 | About → Privacy section | (renders A3) | **Keep** (canonical site) |
| A7 | `src/features/settings/SettingsPanel.tsx` | 134 | Settings → Data Management section | "Your data is yours. We cryptographically cannot read it. Opt-in AI…" | **Keep** — canonical site, but tighten |
| A8 | `src/features/subscription/SubscriptionManager.tsx` | 126 | Pricing page subhead | "Your data is yours. We cryptographically cannot read it — on any plan." | **Rewrite** — plain |
| A9 | `src/features/subscription/SubscriptionManager.tsx` | 232 | Pricing page footer | "Your data is yours — we cryptographically cannot read it." | **Rewrite** — plain |
| A10 | `src/features/sync/SyncPanel.tsx` | 228 | Encrypted backup subhead | "Your data is yours. We cryptographically cannot read it. Off by default." | **Rewrite** — plain (and sync-specific) |

## B. Onboarding

| # | File | Surface | Current | Decision |
|---|------|---------|---------|----------|
| B1 | `OnboardingFlow.tsx:48` | Beat 1 chip | "Cutting back" | **Rewrite** — see decisions doc |
| B2 | `OnboardingFlow.tsx:49` | Beat 1 chip | "Quitting" | **Rewrite** |
| B3 | `OnboardingFlow.tsx:50` | Beat 1 chip | "Just curious" | **Rewrite** |
| B4 | `OnboardingFlow.tsx:42-43` | Beat 1 subhead | "Whatever you pick stays on your phone. You can change your mind anytime." | **Keep** — hits the brief |
| B5 | `OnboardingFlow.tsx:79-81` | Beat 2 chips | "One day at a time / 30-day reset / Custom goal" | **Tweak** — "30-day reset" reads gimmicky |
| B6 | `OnboardingFlow.tsx:74` | Beat 2 subhead | "Pick the rhythm that fits. You can adjust this in Settings later." | **Keep** |
| B7 | `OnboardingFlow.tsx:103-110` | Beat 3 hero + body | "Your data is yours." + "We cryptographically cannot read what you log…" | **Rewrite body** (see A5) |
| B8 | `OnboardingFlow.tsx:165` | sr-only modal label | "Welcome to Alchohalt" | **Tweak** — modal sr label can be more neutral |
| B9 | `OnboardingFlow.tsx:215` | Skip link | "Skip and explore" | **Keep** — natural |
| B10 | `en.json:165-180` | Legacy 6-step carousel keys (`onboarding.welcome`, `.tracking`, `.insights`, `.goals`, `.ready`, `.quickTips`) | All buzzword-heavy ("wellness companion," "Smart Tracking," "wellness journey") | **Rewrite** — even though the new flow doesn't use these, they're shipped strings and still translated; plus `welcome.title` is referenced from the modal sr label |

## C. Day 0 / empty states

| # | File | Line | Surface | Current | Decision |
|---|------|------|---------|---------|----------|
| C1 | `TodayPanel.tsx` | 144 | Day 0 hero label | "Today is a fresh start" | **Keep** — earned, not chipper |
| C2 | `TodayPanel.tsx` | 167 | Day 0 hero number | "Day 0" | **Keep** — honest |
| C3 | `TodayPanel.tsx` | 147 | Day 0 hero subcopy | (see A4) | **Rewrite** |
| C4 | `TodayPanel.tsx` | 203-209 | Stats grid (Today / 7 days / 30 days) | "0.0 std / 0.0 std / $0 spent" on Day 0 | **Rewrite** — replace with a single earnest line that beats four zeros |
| C5 | `TrackTab.tsx` | 67-69 | Track empty state | "No drinks logged yet. Today's a fresh start. Add an entry above when you'd like." | **Keep** — already good |
| C6 | `GoalsTab.tsx` | 35-37 | Goals empty state | "No goals yet. Start with a daily limit you'd feel good about." | **Keep** — already good |
| C7 | `InsightsTab.tsx` | 46-48 | Insights empty state | "Nothing to chart yet. Add a few entries on the Track tab and your trends will show up here." | **Keep** — already good |

## D. Subscription / paywall

| # | File | Line | Surface | Current | Decision |
|---|------|------|---------|---------|----------|
| D1 | `SubscriptionManager.tsx` | 121 | Pricing page H1 | "A simple price." | **Keep** |
| D2 | `SubscriptionManager.tsx` | 123 | Pricing page subtitle | "Free forever for the things that matter. Premium when you want more." | **Keep** |
| D3 | `SubscriptionManager.tsx` | 211 | Plan CTA | "Get {plan name}" | **Keep** |
| D4 | `SubscriptionManager.tsx` | 35 | Yearly highlight badge | "Most Popular" | **Tweak** — "Most popular" (sentence case) |
| D5 | `SubscriptionManager.tsx` | 36 | Lifetime highlight badge | "No subscription trap" | **Keep** — strong, honest |
| D6 | `PremiumGate.tsx` | 67 | UpgradePrompt default title | "Upgrade to Premium" | **Tweak** — "Part of Premium" |
| D7 | `PremiumGate.tsx` | 68 | UpgradePrompt default body | "This feature is available in our premium plan." | **Tweak** |
| D8 | `PremiumGate.tsx` | 95 | UpgradePrompt CTA | "Learn More" | **Tweak** — "See plans" |
| D9 | `PremiumGate.tsx` | 80 | sparkle ✨ emoji preceding "Premium" | — | **Remove** — pushy |
| D10 | `PremiumGate.tsx` | 57 | PremiumBadge "✨ Premium" | — | **Tweak** — drop sparkle |
| D11 | `SoftPaywall.tsx` (`paywall.unlock` key) | en.json:24 | Soft paywall headline | "Part of Premium." | **Keep** — already what the brief asked for |
| D12 | `SoftPaywall.tsx` | 96 | "Premium" pill | — | **Keep** |
| D13 | `PremiumDataExport.tsx` | 71 | Free fallback CTA | "Upgrade to Premium" | **Tweak** — "See plans" |
| D14 | `PremiumDataExport.tsx` | 63 | Free fallback title | "Premium Data Export" | **Tweak** — sentence case |
| D15 | `PremiumMoodTracking.tsx` | 78 | Free fallback title | "Premium Mood & Trigger Tracking" | **Tweak** |
| D16 | `PremiumMoodTracking.tsx` | 86 | Free fallback CTA | "Upgrade to Premium" | **Tweak** |
| D17 | `PremiumWellnessDashboard.tsx` | 281 | Premium gate H2 | "Premium Wellness Dashboard" | **Rewrite** — reframe |
| D18 | `PremiumWellnessDashboard.tsx` | 282-285 | Premium gate body | "Get comprehensive health insights, wellness tracking, and AI-powered recommendations to optimize your physical and mental wellbeing." | **Rewrite** — clinical/pushy |
| D19 | `PremiumWellnessDashboard.tsx` | 304 | Premium gate CTA | "Upgrade to Access" | **Tweak** — "See plans" |
| D20 | `PremiumWellnessDashboard.tsx` | 280 | Hero emoji | 🏥 | **Remove** |

## E. Crisis copy

(Already strong overall — protect from drift.)

| # | File | Line | Surface | Current | Decision |
|---|------|------|---------|---------|----------|
| E1 | `CrisisResources.tsx` | 156 | 911 banner H2 | "In immediate danger?" | **Keep** |
| E2 | `CrisisResources.tsx` | 175 | Page H1 | "Crisis & Support Resources" | **Keep** |
| E3 | `CrisisResources.tsx` | 177 | Page subhead | "Free help, available right now. We never see who you call or text — these links open your phone's native dialer or messaging app." | **Keep** — exactly the right voice |
| E4 | `CrisisResources.tsx` | 226-229 | Footer | "Alchohalt is not a substitute for…" | **Keep** |

## F. Errors

| # | File | Surface | Current | Decision |
|---|------|---------|---------|----------|
| F1 | `ErrorBoundary.tsx:60-61` | Default heading | `${label} couldn't load` / "Something went wrong" | **Keep** |
| F2 | `ErrorBoundary.tsx:73-76` | Isolate body | "This section hit an unexpected error. The rest of the app should still work." | **Keep** — calm, accurate |
| F3 | `ErrorBoundary.tsx:124-127` | Top-level body | "We hit an unexpected error. Your data is safe — it stays on your device. Try again, or reload the app if the problem persists." | **Keep** |
| F4 | `ExportImport.tsx:16` | Export error | `alert('Export failed: ${err.message || 'Unknown error'}')` | **Rewrite** — meet the (a)(b)(c) bar from voice guidelines |
| F5 | `ExportImport.tsx:33` | Invalid JSON | `alert('Invalid JSON file')` | **Rewrite** — say what to do next |
| F6 | `ExportImport.tsx:41` | Validation failed | `alert('Import validation failed: ${err}')` | **Rewrite** |
| F7 | `ExportImport.tsx:67` | Import success | `alert('Import completed successfully')` | **Tweak** — "Import complete." |
| F8 | `ExportImport.tsx:70` | Import error | `alert('Import failed: ${err}')` | **Rewrite** |
| F9 | `SyncPanel.tsx:115,119,166` | Inline form errors | "Enter a valid email." / "Passphrase must be 12+ characters with upper, lower, and a digit." / "Enter your email and passphrase." | **Keep** — already plain |

## G. Notifications / reminders

| # | File | Line | Surface | Current | Decision |
|---|------|------|---------|---------|----------|
| G1 | `notify.ts` | 58 | Native scheduled body | "Reminder: log your day?" | **Keep** — calm |
| G2 | `notify.ts` | 121-124 | Web/staggered messages | "How's your day going? Take a moment to check in 🌟" / "Time for a mindful moment - how are you feeling? 💭" / "Your wellness journey matters. Ready to log today's progress? 📊" / "Taking care of yourself today? Let's track your progress 🎯" | **Rewrite** — coach voice; emoji parade |
| G3 | `en.json:142` | reminder.prompt | "Reminder: log your day?" | **Keep** |

## H. Buzzword cleanup ("wellness journey," "wellness companion," "mindfulness practice")

| # | File | Line | Current | Decision |
|---|------|------|---------|----------|
| H1 | `en.json:148` | onboarding.welcome.description | "Your personal, private wellness companion for building healthier drinking habits." | **Rewrite** |
| H2 | `en.json:168` | onboarding.ready.description | "Ready to start your wellness journey? Your first log is just a tap away." | **Rewrite** |
| H3 | `en.json:197` | support.description | "We're here to help you on your wellness journey. Your feedback helps us improve the app." | **Rewrite** |
| H4 | `About.tsx:56` | Renders H3 | (renders H3) | (covered) |
| H5 | `LegalLinks.tsx:16` | "Alchohalt keeps wellness data on-device by default." | — | **Tweak** — "your logs" not "wellness data" |
| H6 | `PremiumWellnessDashboard.tsx:283,319` | "comprehensive health insights, wellness tracking" / "Comprehensive health and wellness insights powered by AI analysis" | — | **Rewrite** |
| H7 | `notify.ts:123` | "Your wellness journey matters." | — | (covered in G2) |
| H8 | `HealthIntegrations.tsx:93` | "Connect with health platforms to sync your wellness data." | — | **Tweak** |

## I. Recommendations (`SmartRecommendations.tsx`)

| # | Line | Current | Decision |
|---|------|---------|----------|
| I1 | 45-48 | Approaching daily limit headline + body | **Tweak** — calmer body |
| I2 | 51-55 | Daily limit reached body | **Keep** — already calm |
| I3 | 64 | "Weekend Strategy Needed" | **Tweak** — sentence case + softer |
| I4 | 65 | Weekend body | **Tweak** — drop "consider" pile-up |
| I5 | 79 | "Craving Management Tips" | **Tweak** — sentence case |
| I6 | 95-99 | "Keep Your Streak Going!" + body | **Rewrite** — exclamation + chain-don't-break vibe |
| I7 | 105-108 | "Try Alternative Activities" + body | **Tweak** — sentence case + less "consider" |
| I8 | 117-120 | Budget alert body | **Tweak** — drop "alcohol this month" overload |
| I9 | 150 | Subhead | "Personalized suggestions based on your patterns" | **Keep** |
| I10 | 161 | Empty state | "Great job! No urgent recommendations right now. Keep up the good work!" | **Rewrite** — three exclamations in one line |
| I11 | 258-271 | HALT strategies (Manage Hunger-Triggered Drinking / Channel Your Anger / Combat Loneliness / Address Fatigue) | **Tweak** — Title Case → sentence case, soften clinical verbs |

## J. Misc one-liners

| # | File | Line | Current | Decision |
|---|------|------|---------|----------|
| J1 | `en.json:185` | medicalDisclaimer.content | "Alchohalt is a personal tracking tool and does not provide medical advice…" | **Keep** — legal copy, leave it alone |
| J2 | `en.json:186` | medicalDisclaimer.emergency | "If you are experiencing a medical emergency…" | **Tweak** — slightly tighter |
| J3 | `en.json:202-203` | subscription.coreFeatures + cancellation | — | **Tweak** — "core habit tracking features remain free forever" → simpler |
| J4 | `PrivacyPolicy.tsx:24` | "your personal wellness journey should remain completely private" | — | **Tweak** — drop "wellness journey" |
| J5 | `TermsOfService.tsx:35,87` | "personal wellness tracking application" / "personal wellness tracking" | — | **Keep for ToS** — formal doc, can stay slightly stiff. (reviewed and decided not to touch — legal phrasing scope) |
