#!/usr/bin/env bash
# Restore a Cosmo snapshot from Supabase bucket 'cosmo-backups'.
# Downloads + verifies + (for core) decrypts into a STAGING dir. Never clobbers
# the live ~/.openclaw unless you copy files into place yourself after inspecting.
#
#   ./cosmo-restore.sh <YYYY-MM-DD> [target-dir] [--with-sessions]
#
# Defaults: target-dir = ~/cosmo-restore-<date>.  Requires Supabase creds (from
# ~/.openclaw/credentials/supabase-env.sh OR SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY env)
# and the snapshot passphrase (1P "Cosmo Snapshot Key", or prompted).
set -euo pipefail

STAMP="${1:?usage: cosmo-restore.sh YYYY-MM-DD [target-dir] [--with-sessions]}"
TARGET="${2:-$HOME/cosmo-restore-$STAMP}"; case "$TARGET" in --*) TARGET="$HOME/cosmo-restore-$STAMP";; esac
WITH_SESSIONS=0; for a in "$@"; do [ "$a" = "--with-sessions" ] && WITH_SESSIONS=1; done

# creds: prefer env, fall back to on-disk supabase-env.sh
[ -n "${SUPABASE_URL:-}" ] || { [ -r ~/.openclaw/credentials/supabase-env.sh ] && source ~/.openclaw/credentials/supabase-env.sh; }
: "${SUPABASE_URL:?set SUPABASE_URL (or have ~/.openclaw/credentials/supabase-env.sh)}"
: "${SUPABASE_SERVICE_ROLE_KEY:?set SUPABASE_SERVICE_ROLE_KEY}"
BUCKET="cosmo-backups"; WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
hdr=(-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")
dl() { curl -s "$SUPABASE_URL/storage/v1/object/$BUCKET/$1" "${hdr[@]}" -o "$2"; }
mkdir -p "$TARGET"

# ----- core -----
echo "[core] download + manifest"
dl "cosmo-core/$STAMP/manifest.json" "$WORK/cm.json"
grep -q plaintext_sha256 "$WORK/cm.json" || { echo "no core snapshot for $STAMP"; exit 1; }
CORE_SHA=$(python3 -c "import json;print(json.load(open('$WORK/cm.json'))['plaintext_sha256'])")
dl "cosmo-core/$STAMP/cosmo-core.tar.gz.enc" "$WORK/core.enc"

# passphrase: 1P via service account if available, else prompt
PASS=""
if [ -r ~/.openclaw/credentials/op-service-account-token ]; then
  export OP_SERVICE_ACCOUNT_TOKEN="$(cat ~/.openclaw/credentials/op-service-account-token)"
  PASS="$(op item get 'Cosmo Snapshot Key' --vault Agents --fields label=password --reveal 2>/dev/null || true)"
fi
[ -n "$PASS" ] || { read -rsp "Snapshot passphrase (1P 'Cosmo Snapshot Key'): " PASS; echo; }

echo "[core] decrypt + verify"
openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:$PASS" -in "$WORK/core.enc" -out "$WORK/core.tar.gz"
GOT=$(shasum -a 256 "$WORK/core.tar.gz" | awk '{print $1}')
[ "$GOT" = "$CORE_SHA" ] || { echo "CORE CHECKSUM MISMATCH (got $GOT, want $CORE_SHA) — wrong passphrase?"; exit 1; }
mkdir -p "$TARGET/core"; tar -xzf "$WORK/core.tar.gz" -C "$TARGET/core"
echo "[core] OK -> $TARGET/core"

# ----- sessions (optional) -----
if [ "$WITH_SESSIONS" = 1 ]; then
  echo "[sessions] download + reassemble"
  dl "cosmo-sessions/$STAMP/manifest.json" "$WORK/sm.json"
  S_SHA=$(python3 -c "import json;print(json.load(open('$WORK/sm.json'))['full_sha256'])")
  CH=(); while IFS= read -r l; do CH+=("$l"); done < <(python3 -c "import json;print('\n'.join(json.load(open('$WORK/sm.json'))['chunks']))")
  : > "$WORK/sessions.tar.gz"
  for c in "${CH[@]}"; do dl "cosmo-sessions/$STAMP/$c" "$WORK/$c"; cat "$WORK/$c" >> "$WORK/sessions.tar.gz"; done
  GOT=$(shasum -a 256 "$WORK/sessions.tar.gz" | awk '{print $1}')
  [ "$GOT" = "$S_SHA" ] || { echo "SESSIONS CHECKSUM MISMATCH"; exit 1; }
  mkdir -p "$TARGET/sessions"; tar -xzf "$WORK/sessions.tar.gz" -C "$TARGET/sessions"
  echo "[sessions] OK -> $TARGET/sessions"
fi

echo ""
echo "RESTORE STAGED at $TARGET"
echo "  core/openclaw/  -> copy into ~/.openclaw/ to bring Cosmo back (see RESTORE.md)"
echo "  core/gbrain/    -> gbrain config; restore the DB with gbrain-restore.sh $STAMP"
[ "$WITH_SESSIONS" = 1 ] && echo "  sessions/       -> agents/main/sessions/"
echo "Nothing was copied into place automatically. Inspect, then move files yourself."
