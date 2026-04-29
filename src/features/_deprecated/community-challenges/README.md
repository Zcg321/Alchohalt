# Community Challenges — DEPRECATED [IA-6]

Sprint 2B (`[IA-6]`) removed the **SocialChallenges** UI from the app.

## Why removed

The component shipped with:
- Hardcoded participant counts (e.g. 12,847 for "Dry January")
- An auto-joined "Weekend Warrior" the user never opted into
- Difficulty tiers + rewards (badge / title / points) tied to the
  Levels/Points framework that was itself stripped in `[IA-5]`
- No actual community backend — every interaction was local-only and
  the social framing was misleading

Shipping a "community" surface that has no community is dishonest. The
honest move is to cut it until there is one.

## What's preserved

- `types.ts` — the `Challenge` data shape
- `data.ts` — the original seed list of six challenges

A future "Communities" feature with a real backend (real opt-in, real
participant counts, real progress) can re-import these as a starting
point for its data layer. Do **not** import this directory from
production code; it is not wired into any active surface and is not
test-covered.

## Removed surfaces

- `src/features/challenges/SocialChallenges.tsx` — the UI component
- `src/features/challenges/__tests__/SocialChallenges.smoke.test.tsx`
- The lazy-loaded `SocialChallenges` slot in the (already-deleted)
  `MainContent.tsx` home layout
