#!/usr/bin/env bash
# Restore the gbrain PGLite DB from Supabase Storage (cosmo-backups bucket).
#   ./gbrain-restore.sh [YYYY-MM-DD] [target-dir]
# Defaults: latest snapshot is NOT auto-detected — pass the date you backed up.
# target-dir defaults to ~/.gbrain (existing brain.pglite is moved aside first).
set -euo pipefail

source ~/.openclaw/credentials/supabase-env.sh
BUCKET="cosmo-backups"
STAMP="${1:?usage: gbrain-restore.sh YYYY-MM-DD [target-dir]}"
TARGET="${2:-$HOME/.gbrain}"
PREFIX="gbrain/$STAMP"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
hdr=(-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")
dl() { curl -s "$SUPABASE_URL/storage/v1/object/$BUCKET/$PREFIX/$1" "${hdr[@]}" -o "$2"; }

echo "[1/4] fetch manifest"
dl manifest.json "$WORK/manifest.json"
FULL_SHA=$(python3 -c "import json;print(json.load(open('$WORK/manifest.json'))['full_sha256'])")
CHUNKS=()
while IFS= read -r line; do CHUNKS+=("$line"); done < <(python3 -c "import json;print('\n'.join(json.load(open('$WORK/manifest.json'))['chunks']))")
echo "    ${#CHUNKS[@]} chunks, expect sha256 $FULL_SHA"

echo "[2/4] download + reassemble"
: > "$WORK/gbrain.tar.gz"
for c in "${CHUNKS[@]}"; do dl "$c" "$WORK/$c"; cat "$WORK/$c" >> "$WORK/gbrain.tar.gz"; echo "    got $c"; done

echo "[3/4] verify checksum"
GOT=$(shasum -a 256 "$WORK/gbrain.tar.gz" | awk '{print $1}')
[ "$GOT" = "$FULL_SHA" ] || { echo "CHECKSUM MISMATCH: got $GOT"; exit 1; }
echo "    OK"

echo "[4/4] extract to $TARGET"
mkdir -p "$TARGET"
if [ -e "$TARGET/brain.pglite" ]; then
  mv "$TARGET/brain.pglite" "$TARGET/brain.pglite.pre-restore.$(date +%s)"
  echo "    moved existing brain.pglite aside"
fi
tar -xzf "$WORK/gbrain.tar.gz" -C "$TARGET"
echo "DONE: restored gbrain to $TARGET/brain.pglite"
