#!/bin/bash
# Wrapper for openclaw-gateway that injects OP_SERVICE_ACCOUNT_TOKEN
# from the on-disk credentials file (kept at mode 600).
# Called by ~/Library/LaunchAgents/ai.openclaw.gateway.plist.
set -euo pipefail

TOKEN_FILE="/Users/recoupable/.openclaw/credentials/op-service-account-token"
if [ -r "$TOKEN_FILE" ]; then
  export OP_SERVICE_ACCOUNT_TOKEN="$(cat "$TOKEN_FILE")"
fi

exec /opt/homebrew/opt/node@22/bin/node /opt/homebrew/lib/node_modules/openclaw/dist/index.js "$@"
