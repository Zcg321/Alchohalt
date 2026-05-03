#!/usr/bin/env python3
"""
[R12-5] One-shot codemod: convert directional Tailwind classes to
logical-property equivalents so the app is ready for RTL locales
(Arabic, Hebrew, Persian, Urdu).

Replacements (word-boundary safe; only inside .ts/.tsx):
  ml-N         → ms-N      (margin-left → margin-inline-start)
  mr-N         → me-N      (margin-right → margin-inline-end)
  ml-auto      → ms-auto
  mr-auto      → me-auto
  pl-N         → ps-N      (padding-left → padding-inline-start)
  pr-N         → pe-N      (padding-right → padding-inline-end)
  text-left    → text-start
  text-right   → text-end
  border-l-N   → border-s-N
  border-r-N   → border-e-N
  left-N       → start-N
  right-N      → end-N

Skipped intentionally:
  - rounded-lg / rounded-xl / etc. — non-directional radius
  - rounded-l-* / rounded-r-* / corner-specific — not present
  - `safe-area-inset-left/right` — anchored to physical hardware,
    must NOT flip
  - position values "left:" / "right:" inside .css files — kept,
    safe-area + a few absolute-positioned debug overlays

Idempotent: running twice yields no change. The output classes
(ms-*, me-*, ps-*, pe-*, border-s-*, border-e-*, start-N, end-N,
text-start, text-end) are not matched by the input regexes.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"

# Each entry: (pattern, replacement). Pattern uses \b for word boundary.
# Order matters: do "ml-auto" / "mr-auto" before "ml-N" / "mr-N" so we
# don't break "auto" with a number-only rule. (Both the "auto" rule and
# the "[0-9]+" rule below are mutually exclusive, but explicit order
# keeps it audit-able.)
RULES: list[tuple[str, str]] = [
    (r"\bml-auto\b", "ms-auto"),
    (r"\bmr-auto\b", "me-auto"),
    (r"\bml-(\d+(?:\.\d+)?)\b", r"ms-\1"),
    (r"\bmr-(\d+(?:\.\d+)?)\b", r"me-\1"),
    (r"\bpl-(\d+(?:\.\d+)?)\b", r"ps-\1"),
    (r"\bpr-(\d+(?:\.\d+)?)\b", r"pe-\1"),
    (r"\btext-left\b", "text-start"),
    (r"\btext-right\b", "text-end"),
    (r"\bborder-l-(\d+)\b", r"border-s-\1"),
    (r"\bborder-r-(\d+)\b", r"border-e-\1"),
    # Position utilities. Match the prefix forms we know are tailwind
    # spacing tokens (digits, fractions). Keep `left-px`, `left-full`,
    # `right-1/2` etc. on a case-by-case basis if needed — none in the
    # codebase as of R12-5.
    (r"\bleft-(\d+)\b", r"start-\1"),
    (r"\bright-(\d+)\b", r"end-\1"),
]


def transform(text: str) -> tuple[str, int]:
    total = 0
    for pat, repl in RULES:
        text, n = re.subn(pat, repl, text)
        total += n
    return text, total


def main() -> int:
    files = list(ROOT.rglob("*.ts")) + list(ROOT.rglob("*.tsx"))
    changed = 0
    total_replaced = 0
    for f in files:
        # Skip test files? No — the app's render output uses these
        # classes too and tests sometimes assert on them. We convert
        # tests as well.
        original = f.read_text(encoding="utf-8")
        new, n = transform(original)
        if n > 0 and new != original:
            f.write_text(new, encoding="utf-8")
            changed += 1
            total_replaced += n
            print(f"  {f.relative_to(ROOT.parent)}: {n} replacements")
    print(f"\n[R12-5] {changed} files changed, {total_replaced} class replacements.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
