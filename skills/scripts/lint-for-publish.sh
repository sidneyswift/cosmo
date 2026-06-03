#!/bin/bash
# Scan a skill directory for personal context that shouldn't be published.
# Usage: ./scripts/lint-for-publish.sh <skill-directory>

set -euo pipefail

SKILL_DIR="${1:?Usage: lint-for-publish.sh <skill-directory>}"

if [ ! -d "$SKILL_DIR" ]; then
  echo "❌ Directory not found: $SKILL_DIR"
  exit 1
fi

PERSONAL_PATTERNS=(
  "Sidney" "sidney" "/Users/recoupable"
  "Recoupable" "recoupable" "@sidneyswift"
  "op://" "1Password" "cosmo-" "Cosmo"
  "~/Documents/projects/" "content-engine"
  "C0B2"  # Slack channel ID prefix
)

FOUND=0

for pattern in "${PERSONAL_PATTERNS[@]}"; do
  matches=$(grep -rn "$pattern" "$SKILL_DIR" \
    --include="*.md" --include="*.yaml" --include="*.json" --include="*.yml" \
    | grep -v "context.md" \
    | grep -v "context.example.md" \
    | grep -v ".git" \
    || true)
  if [ -n "$matches" ]; then
    echo "⚠️  Found '$pattern':"
    echo "$matches"
    echo
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "✅ Clean — no personal references found in $SKILL_DIR"
else
  echo "❌ Personal references detected — fix before publishing"
  exit 1
fi
