# Restoring Cosmo 🌀

The authoritative runbook to bring Cosmo back into operation. Supersedes the short
version that used to live in `README.md`.

## Where everything lives (the backup map)

| What | Location | How to get it |
|---|---|---|
| Code, skills, docs, persona, memory `.md` | GitHub `sidneyswift/cosmo` | `git clone` |
| **Core state** (identity, creds, memory.sqlite, flows, live config) | Supabase `cosmo-backups/cosmo-core/<date>/` (AES-256 encrypted) | `scripts/cosmo-restore.sh` |
| **Session transcripts** | Supabase `cosmo-backups/cosmo-sessions/<date>/` (chunked) | `cosmo-restore.sh --with-sessions` |
| **gbrain DB** | Supabase `cosmo-backups/gbrain/<date>/` (chunked) | `scripts/gbrain-restore.sh` |
| All secrets / API keys | 1Password "Agents" vault (+ `~/Desktop/cosmo.env` local snapshot) | 1P |
| Snapshot decryption passphrase | 1Password "Cosmo Snapshot Key" | 1P (human login) |
| Research wiki | GitHub `sidneyswift/cosmo-wiki` | `git clone` |
| Content engine | GitHub `sidneyswift/content-engine` | `git clone` (then `npm install`) |

> **No bootstrap deadlock.** To restore you need (a) Supabase service key and (b) the
> snapshot passphrase. Both are in 1Password, reachable by a **human login** at
> 1password.com — you do **not** need the on-disk op service-account token to start.
> The op token itself comes back inside the encrypted core snapshot, and can also be
> regenerated from the 1Password admin console (Developer → Service Accounts).

---

## Path A — Soft reset (same Mac, openclaw still installed)

Use when the agent layer was reset but the machine/install/shared infra survive.

```bash
cd ~/.openclaw/workspace/scripts

# 1. Stage the core state (decrypts; prompts for passphrase if op token absent)
./cosmo-restore.sh <DATE>            # e.g. 2026-06-03  → ~/cosmo-restore-<DATE>/core/

# 2. Stop the gateway, then copy core state into place
openclaw gateway stop
cp -a ~/cosmo-restore-<DATE>/core/openclaw/.   ~/.openclaw/
cp -a ~/cosmo-restore-<DATE>/core/gbrain/.     ~/.gbrain/

# 3. Restore the gbrain DB
./gbrain-restore.sh <DATE> ~/.gbrain

# 4. (optional) restore conversation history
./cosmo-restore.sh <DATE> ~/cosmo-restore-<DATE> --with-sessions
cp -a ~/cosmo-restore-<DATE>/sessions/sessions  ~/.openclaw/agents/main/

# 5. Boot
openclaw gateway start
```

Verify: `curl -s -H "Authorization: Bearer <xoxb>" https://slack.com/api/auth.test`
returns `ok:true`, gateway log shows `[slack] socket mode connected`, and Cosmo
replies in `#cosmo-chat`.

---

## Path B — Full reformat / new machine (bare metal)

Everything from Path A, preceded by rebuilding the shared layer:

```bash
# 1. Toolchain
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node@22 gh openssl
npm i -g openclaw

# 2. Bootstrap 1Password access
#    Get the op service-account token from 1P (human login) or regen in the admin console.
mkdir -p ~/.openclaw/credentials
printf '%s' '<OP_SERVICE_ACCOUNT_TOKEN>' > ~/.openclaw/credentials/op-service-account-token
chmod 600 ~/.openclaw/credentials/op-service-account-token

# 3. Supabase creds for the restore (from 1P "Cosmo Supabase Project" or ~/Desktop/cosmo.env)
export SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...

# 4. Clone code + restore state
git clone https://github.com/sidneyswift/cosmo.git ~/.openclaw/workspace
cd ~/.openclaw/workspace/scripts
./cosmo-restore.sh <DATE>                       # core
# ...then Path A steps 2–5

# 5. Reinstall the launchd service (so the gateway runs on login)
#    The wrapper is restored at ~/.openclaw/bin/openclaw-gateway-wrapper.sh.
#    Recreate ~/Library/LaunchAgents/ai.openclaw.gateway.plist pointing at it, then:
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.gateway.plist

# 6. Re-auth machine-level tools
gws auth login --full          # Google Workspace (client_secret.json from 1P)
```

Also clone the side repos if needed:
`git clone …/cosmo-wiki ~/Documents/wiki` and `…/content-engine` (then `npm install`).

---

## Refresh the backup before a planned wipe

```bash
cd ~/.openclaw/workspace/scripts
./cosmo-snapshot.sh        # core + sessions + gbrain, all date-stamped today
```
Then restore using **today's** date. The snapshot is re-runnable and overwrites the
same-date snapshot.

## Notes
- `cosmo-restore.sh` never overwrites the live `~/.openclaw` automatically — it stages
  into a dir so you can inspect first. The `cp -a` steps above are the explicit "go live".
- `data/media/` (generated slides, ~927MB) is intentionally **not** in the content-engine
  backup — it's regenerable. Only code + `content.db` are preserved.
