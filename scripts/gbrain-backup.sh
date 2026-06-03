#!/usr/bin/env bash
# Back up the gbrain PGLite DB to Supabase Storage (private cosmo-backups bucket).
# Free-tier files cap at 50MB, so the tarball is split into <50MB chunks + a manifest.
# Re-runnable: overwrites the previous snapshot for the same date.
#   ./gbrain-backup.sh            (date-stamped today)
set -euo pipefail

source ~/.openclaw/credentials/supabase-env.sh
BUCKET="cosmo-backups"
GBRAIN="$HOME/.gbrain/brain.pglite"
STAMP="$(date +%Y-%m-%d)"
PREFIX="gbrain/$STAMP"
WORK="$(mktemp -d)"
CHUNK=45000000   # 45 MB, safely under the 50 MB per-file cap
trap 'rm -rf "$WORK"' EXIT

hdr=(-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")

echo "[1/5] ensure private bucket '$BUCKET' exists"
curl -s -X POST "$SUPABASE_URL/storage/v1/bucket" "${hdr[@]}" -H "Content-Type: application/json" \
  -d "{\"id\":\"$BUCKET\",\"name\":\"$BUCKET\",\"public\":false,\"file_size_limit\":52428800}" >/dev/null || true

echo "[2/5] tar + gzip gbrain DB"
tar -czf "$WORK/gbrain.tar.gz" -C "$HOME/.gbrain" brain.pglite
FULL_SHA=$(shasum -a 256 "$WORK/gbrain.tar.gz" | awk '{print $1}')
FULL_SIZE=$(stat -f%z "$WORK/gbrain.tar.gz")

echo "[3/5] split into chunks"
split -b "$CHUNK" "$WORK/gbrain.tar.gz" "$WORK/chunk-"
CHUNKS=( "$WORK"/chunk-* )
echo "    $FULL_SIZE bytes -> ${#CHUNKS[@]} chunks"

echo "[4/5] upload chunks"
NAMES=()
for c in "${CHUNKS[@]}"; do
  n=$(basename "$c"); NAMES+=("$n")
  curl -s -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/$PREFIX/$n" "${hdr[@]}" \
    -H "Content-Type: application/octet-stream" -H "x-upsert: true" \
    --data-binary "@$c" >/dev/null
  echo "    uploaded $n ($(stat -f%z "$c") bytes)"
done

echo "[5/5] upload manifest"
MANIFEST="$WORK/manifest.json"
printf '{"created":"%s","source":"%s","full_sha256":"%s","full_size":%s,"chunk_bytes":%s,"chunks":[%s]}\n' \
  "$STAMP" "$GBRAIN" "$FULL_SHA" "$FULL_SIZE" "$CHUNK" \
  "$(printf '"%s",' "${NAMES[@]}" | sed 's/,$//')" > "$MANIFEST"
curl -s -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/$PREFIX/manifest.json" "${hdr[@]}" \
  -H "Content-Type: application/json" -H "x-upsert: true" --data-binary "@$MANIFEST" >/dev/null

echo "DONE: $BUCKET/$PREFIX  (sha256 $FULL_SHA)"
