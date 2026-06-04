#!/usr/bin/env bash
# Full Cosmo backup -> Supabase private bucket 'cosmo-backups'.
# Produces a same-dated, complete, restorable snapshot in three parts:
#   cosmo-core/<date>/cosmo-core.tar.gz.enc   encrypted ~6MB bundle (identity, creds, memory db, config...)
#   cosmo-sessions/<date>/chunk-*             chunked session transcripts (~203MB)
#   gbrain/<date>/                            delegated to gbrain-backup.sh
# Core is AES-256 encrypted; passphrase read from 1Password ("Cosmo Snapshot Key").
# Re-runnable; overwrites same-date snapshot.  Usage: ./cosmo-snapshot.sh [--no-sessions] [--no-gbrain]
set -euo pipefail

source ~/.openclaw/credentials/supabase-env.sh
export OP_SERVICE_ACCOUNT_TOKEN="$(cat ~/.openclaw/credentials/op-service-account-token)"
BUCKET="cosmo-backups"
STAMP="$(date +%Y-%m-%d)"
WORK="$(mktemp -d)"
CHUNK=45000000
DO_SESSIONS=1; DO_GBRAIN=1
for a in "$@"; do [ "$a" = "--no-sessions" ] && DO_SESSIONS=0; [ "$a" = "--no-gbrain" ] && DO_GBRAIN=0; done
trap 'rm -rf "$WORK"' EXIT
hdr=(-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")
SCRIPTDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

upload() { # <localfile> <remotepath> <contenttype>
  curl -s -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/$2" "${hdr[@]}" \
    -H "Content-Type: $3" -H "x-upsert: true" --data-binary "@$1" >/dev/null
}

echo "[init] ensure private bucket"
curl -s -X POST "$SUPABASE_URL/storage/v1/bucket" "${hdr[@]}" -H "Content-Type: application/json" \
  -d "{\"id\":\"$BUCKET\",\"name\":\"$BUCKET\",\"public\":false,\"file_size_limit\":52428800}" >/dev/null || true

# ---------- PART 1: cosmo-core (encrypted) ----------
echo "[core] collecting Cosmo state"
STAGE="$WORK/core"; mkdir -p "$STAGE/openclaw" "$STAGE/gbrain"
OC="$HOME/.openclaw"
for d in identity credentials memory flows devices canvas qqbot; do
  [ -e "$OC/$d" ] && cp -a "$OC/$d" "$STAGE/openclaw/" || true
done
mkdir -p "$STAGE/openclaw/agents/main"
[ -e "$OC/agents/main/agent" ] && cp -a "$OC/agents/main/agent" "$STAGE/openclaw/agents/main/"
for f in openclaw.json .env; do [ -e "$OC/$f" ] && cp -a "$OC/$f" "$STAGE/openclaw/"; done
mkdir -p "$STAGE/openclaw/cron"; [ -e "$OC/cron/jobs.json" ] && cp -a "$OC/cron/jobs.json" "$STAGE/openclaw/cron/"
for f in config.json env.sh preferences.json autopilot-run.sh; do
  [ -e "$HOME/.gbrain/$f" ] && cp -a "$HOME/.gbrain/$f" "$STAGE/gbrain/" || true
done
{
  echo "Cosmo core snapshot $STAMP"
  echo "host: $(hostname)"
  echo "contents: openclaw/{identity,credentials,memory,flows,devices,canvas,qqbot,agents/main/agent,openclaw.json,.env,cron/jobs.json} gbrain/{config.json,env.sh,preferences.json,autopilot-run.sh}"
} > "$STAGE/MANIFEST.txt"

echo "[core] tar + encrypt"
tar -czf "$WORK/cosmo-core.tar.gz" -C "$STAGE" .
CORE_SHA=$(shasum -a 256 "$WORK/cosmo-core.tar.gz" | awk '{print $1}')
PASS="$(op item get 'Cosmo Snapshot Key' --vault Agents --fields label=password --reveal 2>/dev/null)"
openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:$PASS" \
  -in "$WORK/cosmo-core.tar.gz" -out "$WORK/cosmo-core.tar.gz.enc"
ENC_SHA=$(shasum -a 256 "$WORK/cosmo-core.tar.gz.enc" | awk '{print $1}')
upload "$WORK/cosmo-core.tar.gz.enc" "cosmo-core/$STAMP/cosmo-core.tar.gz.enc" "application/octet-stream"
printf '{"created":"%s","plaintext_sha256":"%s","ciphertext_sha256":"%s","cipher":"aes-256-cbc/pbkdf2","key":"op://Agents/Cosmo Snapshot Key/password"}\n' \
  "$STAMP" "$CORE_SHA" "$ENC_SHA" > "$WORK/core-manifest.json"
upload "$WORK/core-manifest.json" "cosmo-core/$STAMP/manifest.json" "application/json"
echo "[core] done ($(stat -f%z "$WORK/cosmo-core.tar.gz.enc") bytes enc, plaintext sha $CORE_SHA)"

# ---------- PART 2: sessions (chunked) ----------
if [ "$DO_SESSIONS" = 1 ] && [ -d "$OC/agents/main/sessions" ]; then
  echo "[sessions] tar + chunk"
  tar -czf "$WORK/sessions.tar.gz" -C "$OC/agents/main" sessions
  S_SHA=$(shasum -a 256 "$WORK/sessions.tar.gz" | awk '{print $1}')
  S_SIZE=$(stat -f%z "$WORK/sessions.tar.gz")
  split -b "$CHUNK" "$WORK/sessions.tar.gz" "$WORK/schunk-"
  NAMES=(); for c in "$WORK"/schunk-*; do n=$(basename "$c"); NAMES+=("$n")
    upload "$c" "cosmo-sessions/$STAMP/$n" "application/octet-stream"; echo "    uploaded $n"; done
  printf '{"created":"%s","full_sha256":"%s","full_size":%s,"chunks":[%s]}\n' \
    "$STAMP" "$S_SHA" "$S_SIZE" "$(printf '"%s",' "${NAMES[@]}" | sed 's/,$//')" > "$WORK/s-manifest.json"
  upload "$WORK/s-manifest.json" "cosmo-sessions/$STAMP/manifest.json" "application/json"
  echo "[sessions] done (${#NAMES[@]} chunks, sha $S_SHA)"
else
  echo "[sessions] skipped"
fi

# ---------- PART 3: gbrain DB (delegate) ----------
if [ "$DO_GBRAIN" = 1 ] && [ -x "$SCRIPTDIR/gbrain-backup.sh" ]; then
  echo "[gbrain] delegating to gbrain-backup.sh"
  "$SCRIPTDIR/gbrain-backup.sh" >/dev/null && echo "[gbrain] done"
else
  echo "[gbrain] skipped"
fi

echo ""
echo "SNAPSHOT COMPLETE  $BUCKET  date=$STAMP"
echo "  cosmo-core/$STAMP/   plaintext_sha256=$CORE_SHA"
[ "$DO_SESSIONS" = 1 ] && echo "  cosmo-sessions/$STAMP/"
[ "$DO_GBRAIN" = 1 ] && echo "  gbrain/$STAMP/"
