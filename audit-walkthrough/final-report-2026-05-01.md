# Voice + copy pass — final report (2026-05-01)

## Scope of work

End-to-end voice + copy pass on every user-facing surface a person would touch in the first 30 seconds, plus the long-tail strings that shape day-to-day use (errors, notifications, premium tiles, recommendations, insights).

Three commits on branch `claude/optimistic-mendel-a54c53`:
- `[COPY-CORE]` — privacy claim, onboarding chips, Day 0 empty state, premium tiles, locale files
- `[COPY-LONGTAIL]` — errors, notifications, recommendations, buzzword cleanup
- `[COPY-ITERATE]` — Pass 4 spectacular gate: insights, mood tracker, premium insights

## Numbers

- **Files touched:** 25 source files + 3 docs in `audit-walkthrough/`
- **Strings rewritten or replaced:** ~140 user-facing strings (counting one bullet, label, body line, error message, etc. per string; not counting attribute changes or sentence-case-only fixes)
- **Strings deliberately left alone:** ~25 (Crisis copy already strong; legal/ToS bodies; the Privacy Policy ToC keys)
- **Emoji removed:** sparkle ✨ (×3), 🤖, 🏥, 🧠, 📊, ⚡, 🎯, 👩‍⚕️, 🌟 from 4 component files; the trend pill in PersonalizedDashboard switched from 📈/➡️/📊 emoji to typographic ↗ → ↘ glyphs (decorative-only, ARIA-hidden)
- **"cryptographically cannot read"** instances reduced from 10 → 3 (Settings → Data Management; About; canonical Privacy Policy locale key — the three sites where the technical claim earns its keep)
- **"wellness journey" / "wellness companion" / "Smart Tracking" / "mindful moment"** instances: 0 remaining in user-visible copy

## Top 10 highest-impact rewrites — before / after

### 1. Privacy claim (was 3-10× in 30 seconds)
- **Before:** "Your data is yours. We cryptographically cannot read it."
- **After (everywhere except canonical sites):** "Nobody else, including us, can see what you log."

### 2. Day 0 hero subcopy (`TodayPanel.tsx`)
- **Before:** "Logging stays on this device. We cryptographically cannot read it."
- **After:** "Nobody else, including us, can see what you log."

### 3. Onboarding chips Beat 1 (`OnboardingFlow.tsx`)
- **Before:** "Cutting back / Quitting / Just curious"
- **After:** "Trying to drink less / Trying to stop / Not sure yet"

### 4. Onboarding chips Beat 2
- **Before:** "30-day reset / Custom goal"
- **After:** "A month off / Set my own"

### 5. Day 0 stats grid (`TodayPanel.tsx`)
- **Before:** Three tiles showing "0.0 std / 0.0 std / $0"
- **After:** A single full-width tile: "Log your first to see your week shape up. Today, 7 days, and 30 days will fill in as you log."

### 6. Premium wellness gate (`PremiumWellnessDashboard.tsx`)
- **Before:** "🏥 Premium Wellness Dashboard / Get comprehensive health insights, wellness tracking, and AI-powered recommendations to optimize your physical and mental wellbeing."
- **After:** "More patterns, longer view / A longer view of your trends — sleep timing, stress triggers, and how social situations show up. Not medical advice."

### 7. Streak motivation in `SmartRecommendations.tsx`
- **Before:** "Keep Your Streak Going! / You're 5 days alcohol-free. You're doing great! Each day gets easier."
- **After:** "5 days in / 5 alcohol-free days. The hardest stretch is usually the first week — you're past it."

### 8. Notification bodies (`notify.ts`)
- **Before:** "How's your day going? Take a moment to check in 🌟" / "Your wellness journey matters. Ready to log today's progress? 📊" (× 4 with emoji parade)
- **After:** "Log your day if you'd like." / "How's today going?" / "A quiet moment to log." / "Log when you're ready — no rush."

### 9. Empty recommendation state (`SmartRecommendations.tsx`)
- **Before:** "Great job! No urgent recommendations right now. Keep up the good work!" (3 exclamations in one line)
- **After:** "Nothing flagging right now. The patterns you've built are doing the work."

### 10. Pricing footer (`SubscriptionManager.tsx`)
- **Before:** "Payments handled by Apple / Google. Cancel any time from your device's subscription settings. Your data is yours — we cryptographically cannot read it. Opt-in AI features can change this; see Settings → AI."
- **After:** "Payments handled by Apple / Google. Cancel any time from your device's subscription settings. Your data stays on your device — we can't read it. AI Insights is opt-in (Settings → AI)."

## What I deliberately didn't touch

- **Crisis page** (`CrisisResources.tsx`, `regions.ts`) — already at the bar. Voice is literal, low-emotion, action-first. Touching this just risks drift.
- **Form labels** ("Volume ml", "ABV %", "Email", "Theme", etc.) — they're functional and short; rewriting would be busywork.
- **Privacy Policy / ToS bodies** below the fold — formal docs, slight stiffness is appropriate for the genre. Only fixed the few "wellness journey" / "wellness data" mentions; left the rest alone.
- **The canonical Settings → Data Management copy** — kept "We cryptographically cannot read it" here because it's the single site where security-minded users come looking for the strong claim. Tightened the surrounding sentence.

## Verification status

- **JSON validates** (`node -e require(...)` on both `en.json` and `es.json`).
- **Compile / test**: this worktree's `node_modules` is a junction to the parent install (`C:\Projects\_review\alchohalt\node_modules`), where many `@types/*` and `@vitest/*` packages are empty directories. As a result `npx vitest` and `npx tsc --noEmit` both fail at module resolution, not at any change in this branch. Compile-time correctness should be re-verified on a clean install before merge.
- **No tests assert on the strings I changed** (verified by grepping every replaced phrase against `*.test.ts*` files).

## Push status

The user's instruction to "push to origin/main after each batch" was blocked by the CCD safety hook because pushing to `main` directly would bypass PR review. The three commits live on the worktree branch `claude/optimistic-mendel-a54c53`. The user can:
- Open a PR from this branch into `main` (recommended).
- Or grant the worktree explicit permission to push to `main` if direct pushes are intended.

## Output index

- `audit-walkthrough/voice-guidelines.md` — the rules, kept short and concrete enough to share with another writer.
- `audit-walkthrough/copy-inventory-2026-05-01.md` — every string this pass touched, with surface, current state, and the keep / tweak / rewrite decision.
- `audit-walkthrough/copy-rewrite-decisions.md` — for every rewrite: the candidates considered and the rationale for the chosen winner.
- `audit-walkthrough/final-report-2026-05-01.md` — this file.
