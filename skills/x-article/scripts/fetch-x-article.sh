#!/usr/bin/env bash
# Fetch an X (Twitter) article as markdown via Apify.
# Usage: fetch-x-article.sh <tweet_id_or_url> [output_file]
#
# Requires: APIFY_TOKEN env var (or pulls from 1Password)
# Returns: full article markdown to stdout (or writes to output_file)

set -euo pipefail

INPUT="${1:?Usage: fetch-x-article.sh <tweet_id_or_url> [output_file]}"
OUTPUT="${2:-}"

# Extract tweet ID from URL if needed
if [[ "$INPUT" =~ x\.com/.*/status/([0-9]+) ]] || [[ "$INPUT" =~ twitter\.com/.*/status/([0-9]+) ]]; then
  TWEET_ID="${BASH_REMATCH[1]}"
elif [[ "$INPUT" =~ ^[0-9]+$ ]]; then
  TWEET_ID="$INPUT"
else
  echo "Error: Could not extract tweet ID from: $INPUT" >&2
  exit 1
fi

# Get Apify token
if [ -z "${APIFY_TOKEN:-}" ]; then
  if command -v op &>/dev/null; then
    APIFY_TOKEN=$(op read "op://Agents/Apify API Key/credential" 2>/dev/null) || {
      echo "Error: APIFY_TOKEN not set and couldn't read from 1Password" >&2
      exit 1
    }
  else
    echo "Error: APIFY_TOKEN not set and 'op' CLI not available" >&2
    exit 1
  fi
fi

# Run the Apify actor
RESPONSE=$(curl -sf -X POST \
  "https://api.apify.com/v2/acts/fastcrawler~x-twitter-article-to-markdown/runs?waitForFinish=120" \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tweetIds\": [\"$TWEET_ID\"]}" 2>/dev/null)

STATUS=$(echo "$RESPONSE" | jq -r '.data.status // empty')
DATASET_ID=$(echo "$RESPONSE" | jq -r '.data.defaultDatasetId // empty')

if [ "$STATUS" != "SUCCEEDED" ] || [ -z "$DATASET_ID" ]; then
  echo "Error: Apify run failed (status=$STATUS)" >&2
  echo "$RESPONSE" | jq '.' >&2 2>/dev/null || echo "$RESPONSE" >&2
  exit 1
fi

# Fetch the article markdown from the dataset
ARTICLE=$(curl -sf "https://api.apify.com/v2/datasets/$DATASET_ID/items" \
  -H "Authorization: Bearer $APIFY_TOKEN" 2>/dev/null \
  | jq -r '.[0].md // empty')

if [ -z "$ARTICLE" ]; then
  echo "Error: No article content returned. The tweet may not contain an X article." >&2
  exit 1
fi

if [ -n "$OUTPUT" ]; then
  mkdir -p "$(dirname "$OUTPUT")"
  echo "$ARTICLE" > "$OUTPUT"
  echo "Saved to: $OUTPUT" >&2
else
  echo "$ARTICLE"
fi
