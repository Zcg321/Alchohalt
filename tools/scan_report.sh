#!/usr/bin/env bash
set -e
python3 repo_scan.py --json > repo_scan.json
echo "=== Alchohalt Repo Health (human excerpt) ==="
python3 repo_scan.py | sed -n '1,800p'
echo
echo "JSON saved to repo_scan.json (attach as artifact in CI)."
