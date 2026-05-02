# Round {{ROUND}} polish — {{DATE}}

Sovereign mode. Owner has full decision authority. Branch
`claude/round-{{ROUND}}-polish-{{DATE}}` off `main` at `<sha>`.

## Per-section status

| § | Theme | Status | Commit |
|---|-------|--------|--------|
| A1 | … | ⏳ Planned | — |
| A2 | … | ⏳ Planned | — |
| B  | … | ⏳ Planned | — |
| C  | … | ⏳ Planned | — |
| D  | 8-judge gate refresh | ⏳ Planned | — |
| E  | … | ⏳ Planned | — |
| F  | Real-data resilience pass | ⏳ Planned | — |
| G  | Stop-and-think regression sample | ⏳ Planned | — |

Status legend: ⏳ planned, 🚧 in progress, ✅ shipped,
🛑 blocker / deferred.

## Voice-and-framing checklist

Per round-8 disagreement matrix D5: voice gates run per-round, not
per-feature. Walk every string added or modified this round through:

- [ ] No marketing voice (no exclamation, no empty modifiers)
- [ ] No "you're broken, this app fixes you" framing
- [ ] No clinical jargon the user is asked to apply to themselves
- [ ] No false certainty ("always", "never", "guaranteed")
- [ ] No second-person commands without context ("Drink less" → "When
  the urge ties to a feeling, the feeling often passes faster")

If any string fails, fix it before the round merges.

## Disagreement-matrix consultation

Before adding a feature with conflicting judge inputs, check the
existing matrix in `round-8-eight-judges-2026-05-02.md` for precedent.
If the conflict is novel, add a new D-entry to that file with the
explicit decision and rationale.

## Round summary (filled at finalize)

### What landed

- …

### What didn't

- …

### Findings filed for round {{ROUND}}+1

- …

### Baseline diff

(Run `scripts/round-finalize.sh {{ROUND}}` and paste the diff here.)

- Tests: {{baseline}} → {{current}}
- Lint: {{baseline}} → {{current}}
- Bundle gz: {{baseline}} → {{current}}
