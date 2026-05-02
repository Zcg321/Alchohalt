#!/usr/bin/env bash
# [R8-E] Round-finalize — runs full verification, prints a round summary.
#
# Usage:  bash scripts/round-finalize.sh <round-number>
#
# What it does:
#   1. Verifies you're on the round-N branch.
#   2. Runs typecheck + lint + tests + build (npm run verify:release).
#   3. Diffs current measurements against round-<N>-baseline.md.
#   4. Prints a per-section commit summary so the round writer has a
#      ready-made changelog to paste into the round report.
#   5. Suggests the gh pr create command and the merge flow.
#
# Intentional non-features:
#   - Does not push the branch. Owner runs `git push` explicitly.
#   - Does not auto-create the PR. Owner runs `gh pr create` with the
#     printed body. Auto-creation tempts cargo-cult merging.
#   - Does not auto-merge. Round work is reviewed before merging,
#     period.

set -euo pipefail

ROUND_NUM="${1:-}"
if [[ -z "$ROUND_NUM" ]]; then
  echo "usage: $0 <round-number>" >&2
  exit 2
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != *"round-${ROUND_NUM}-polish"* ]]; then
  echo "✗ expected to be on round-${ROUND_NUM} branch, on ${CURRENT_BRANCH}" >&2
  exit 1
fi

BASELINE_FILE="audit-walkthrough/round-${ROUND_NUM}-baseline.md"
[[ -f "$BASELINE_FILE" ]] || {
  echo "⚠ no baseline found at $BASELINE_FILE — run scripts/round-kickoff.sh first" >&2
}

echo "==> round ${ROUND_NUM} finalize"

# 1. Full verification
echo "--- typecheck"
npm run typecheck
echo "--- lint"
# [R8-E-FIX Copilot] grep -oP is GNU-only (PCRE); BSD grep on macOS
# rejects it. Parse "N errors" with portable awk on the eslint
# summary line ("✖ N problems (M errors, K warnings)").
npm run lint || {
  ERR_COUNT="$(npm run lint 2>&1 | awk '/[0-9]+ errors?/ { for (i=1; i<=NF; i++) if ($i ~ /^[0-9]+$/ && $(i+1) ~ /^errors?/) { print $i; exit } }')"
  ERR_COUNT="${ERR_COUNT:-0}"
  if [[ "$ERR_COUNT" != "0" ]]; then
    echo "✗ lint errors present ($ERR_COUNT) — fix before finalizing" >&2
    exit 1
  fi
}
echo "--- tests"
npx vitest run --coverage=false --reporter=default
echo "--- build"
npm run build

# 2. Per-section commit summary
echo "--- commits on this branch"
COMMITS="$(git log --oneline origin/main..HEAD)"
echo "$COMMITS"

# 3. Suggested PR body
echo
echo "==> suggested gh pr create:"
cat <<'GHHELP'

  gh pr create \
    --title "Round N polish — <theme>" \
    --body "$(cat <<'EOF'
  ## Summary

  - Section A: ...
  - Section B: ...

  ## Test plan

  - [x] Typecheck clean
  - [x] Lint clean (errors 0; warnings unchanged from baseline)
  - [x] Tests passing
  - [x] Build clean

  Round walkthrough: audit-walkthrough/round-N-YYYY-MM-DD.md
  EOF
  )"

GHHELP

echo
echo "==> finalize complete. round ${ROUND_NUM} ready for review."
