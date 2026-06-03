#!/bin/bash
# Publish a skill to ClawHub, stripping personal context.
# Usage: ./scripts/publish.sh <skill-name> <version> [--dry-run]

set -euo pipefail

SKILL_NAME="${1:?Usage: publish.sh <skill-name> <version> [--dry-run]}"
VERSION="${2:?Usage: publish.sh <skill-name> <version> [--dry-run]}"
DRY_RUN="${3:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_SRC="$SKILLS_DIR/$SKILL_NAME"
TMP_DIR=$(mktemp -d)

if [ ! -d "$SKILL_SRC" ]; then
  echo "❌ Skill not found: $SKILL_SRC"
  exit 1
fi

echo "📦 Preparing $SKILL_NAME v$VERSION for publish..."

# Copy skill to temp, excluding personal files
rsync -a --exclude='context.md' --exclude='.DS_Store' "$SKILL_SRC/" "$TMP_DIR/$SKILL_NAME/"

# Run lint on the clean copy
echo "🔍 Running lint..."
if ! "$SCRIPT_DIR/lint-for-publish.sh" "$TMP_DIR/$SKILL_NAME"; then
  rm -rf "$TMP_DIR"
  exit 1
fi

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo ""
  echo "🏁 Dry run complete. Would publish:"
  ls -la "$TMP_DIR/$SKILL_NAME/"
  echo ""
  echo "Files:"
  find "$TMP_DIR/$SKILL_NAME" -type f | sed "s|$TMP_DIR/$SKILL_NAME/||"
  rm -rf "$TMP_DIR"
  exit 0
fi

# Publish
echo "🚀 Publishing to ClawHub..."
clawhub publish "$TMP_DIR/$SKILL_NAME" \
  --slug "$SKILL_NAME" \
  --version "$VERSION"

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo "✅ $SKILL_NAME v$VERSION published to ClawHub"
echo "📌 Don't forget to push to GitHub for skills.sh/agentskill.sh indexing"
