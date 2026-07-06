#!/bin/bash
# Wrapper for openclaw-gateway that injects OP_SERVICE_ACCOUNT_TOKEN
# from the on-disk credentials file (kept at mode 600).
# Called by ~/Library/LaunchAgents/ai.openclaw.gateway.plist.
set -euo pipefail

TOKEN_FILE="/Users/recoupable/.openclaw/credentials/op-service-account-token"
if [ -r "$TOKEN_FILE" ]; then
  export OP_SERVICE_ACCOUNT_TOKEN="$(cat "$TOKEN_FILE")"
fi

# Inject Supabase env from 1Password (secrets live in 1P, not on disk).
# HOME is overridden for the op call only: with the real HOME, op discovers the
# 1Password desktop app and blocks forever on its system-auth handshake under
# launchd (no GUI session). Isolated HOME forces pure service-account mode (~1s).
# Hard 10s watchdog as backstop: 1P being slow/unreachable must never block boot.
OP_BIN="/opt/homebrew/bin/op"
OP_HOME="/Users/recoupable/.openclaw/credentials/op-home"
if [ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ] && [ -x "$OP_BIN" ]; then
  mkdir -p "$OP_HOME"
  OP_JSON="$(
    HOME="$OP_HOME" "$OP_BIN" item get "Cosmo Supabase Project" --vault Agents --format=json 2>/dev/null & opid=$!
    { sleep 10; kill -9 "$opid" 2>/dev/null; } & wd=$!
    wait "$opid" 2>/dev/null; rc=$?
    kill "$wd" 2>/dev/null || true
    exit "$rc"
  )" || OP_JSON=""
  if [ -n "$OP_JSON" ]; then
    eval "$(printf '%s' "$OP_JSON" | /usr/bin/python3 -c '
import sys, json, shlex
try:
    d = json.load(sys.stdin)
    for f in d.get("fields", []):
        sec = f.get("section") or {}
        if sec.get("label") == "env" and f.get("value"):
            print("export " + f["label"] + "=" + shlex.quote(f["value"]))
except Exception:
    pass
')" || true
  else
    echo "[wrapper] WARN: 1Password fetch failed/timed out; starting without Supabase env" >&2
  fi
fi

# openclaw is installed to a user-owned npm prefix (~/.npm-global) so it survives
# Homebrew/node@22 reinstalls that would wipe /opt/homebrew/lib/node_modules.
exec /opt/homebrew/opt/node@22/bin/node /Users/recoupable/.npm-global/lib/node_modules/openclaw/dist/index.js "$@"
