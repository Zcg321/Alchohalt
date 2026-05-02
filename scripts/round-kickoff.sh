#!/usr/bin/env bash
# [R8-E] Round-kickoff — codifies what every round has been doing manually.
#
# Usage:  bash scripts/round-kickoff.sh <round-number>
# Example: bash scripts/round-kickoff.sh 9
#
# What it does:
#   1. Verifies you're on a clean checkout of main (or warns).
#   2. Creates branch claude/round-N-polish-YYYY-MM-DD off origin/main.
#   3. Captures baseline measurements (test count, lint warnings, bundle KB)
#      into audit-walkthrough/round-<N>-baseline.md so the round-finalize
#      step can diff against them.
#   4. Drops a copy of audit-walkthrough/_template.md at
#      audit-walkthrough/round-<N>-YYYY-MM-DD.md, prefilled with the round
#      number + date so the writer has a starting point.
#
# Intentional non-features:
#   - Doesn't run any auto-fix or auto-format. Round work is human-driven.
#   - Doesn't push the branch. Pushing happens at finalize, after work lands.
#   - Doesn't pull origin/main. Caller is responsible for being current —
#     the script just refuses to start if HEAD diverges from origin/main.

set -euo pipefail

ROUND_NUM="${1:-}"
if [[ -z "$ROUND_NUM" ]]; then
  echo "usage: $0 <round-number>" >&2
  exit 2
fi

if ! [[ "$ROUND_NUM" =~ ^[0-9]+$ ]]; then
  echo "round number must be a positive integer, got: $ROUND_NUM" >&2
  exit 2
fi

DATE="$(date +%Y-%m-%d)"
BRANCH="claude/round-${ROUND_NUM}-polish-${DATE}"
BASELINE_FILE="audit-walkthrough/round-${ROUND_NUM}-baseline.md"
ROUND_FILE="audit-walkthrough/round-${ROUND_NUM}-${DATE}.md"

echo "==> round ${ROUND_NUM} kickoff (${DATE})"

# 1. Clean-checkout sanity
DIRTY="$(git status --porcelain)"
if [[ -n "$DIRTY" ]]; then
  echo "✗ working tree dirty — commit or stash first" >&2
  echo "$DIRTY" >&2
  exit 1
fi

git fetch origin --quiet
LOCAL_HEAD="$(git rev-parse HEAD)"
ORIGIN_HEAD="$(git rev-parse origin/main)"
if [[ "$LOCAL_HEAD" != "$ORIGIN_HEAD" ]]; then
  echo "⚠ HEAD ($LOCAL_HEAD) is not at origin/main ($ORIGIN_HEAD)"
  echo "  continue anyway? (y/N) "
  read -r ans
  [[ "$ans" == "y" ]] || exit 1
fi

# 2. Branch
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "✗ branch ${BRANCH} already exists" >&2
  exit 1
fi
git checkout -b "$BRANCH"
echo "✓ on branch ${BRANCH}"

# 3. Baseline measurements
echo "==> capturing baseline measurements"
mkdir -p audit-walkthrough

TEST_COUNT="$(npx vitest run --coverage=false --reporter=default 2>&1 | grep -E '^\s*Tests' | head -1 || echo 'unknown')"
LINT_OUT="$(npm run lint 2>&1 | tail -3 | tr -d '\r' || echo 'lint failed')"
{
  echo "# Round ${ROUND_NUM} — baseline (${DATE})"
  echo
  echo "Captured at branch creation. Round-finalize compares against this."
  echo
  echo "## Test count"
  echo
  echo '```'
  echo "$TEST_COUNT"
  echo '```'
  echo
  echo "## Lint"
  echo
  echo '```'
  echo "$LINT_OUT"
  echo '```'
  echo
  echo "## HEAD"
  echo
  echo '```'
  git log -1 --format='%H %s'
  echo '```'
} > "$BASELINE_FILE"
echo "✓ baseline → $BASELINE_FILE"

# 4. Round-walkthrough scaffold
if [[ -f audit-walkthrough/_template.md ]]; then
  sed -e "s|{{ROUND}}|${ROUND_NUM}|g" -e "s|{{DATE}}|${DATE}|g" \
    audit-walkthrough/_template.md > "$ROUND_FILE"
  echo "✓ scaffold → $ROUND_FILE"
else
  echo "⚠ audit-walkthrough/_template.md missing; skipping scaffold"
fi

echo
echo "==> kickoff complete. next:"
echo "    1. open ${ROUND_FILE} and outline the round"
echo "    2. land commits as [R${ROUND_NUM}-A] / [R${ROUND_NUM}-B] / ..."
echo "    3. when done: bash scripts/round-finalize.sh ${ROUND_NUM}"
