# Resetting to a fresh agent 🆕

How to retire Cosmo and stand up a **new OpenClaw agent with a new purpose** on the
same shared infrastructure.

> ⚠️ **Do not run any of this until you've confirmed a current backup exists.**
> Run `scripts/cosmo-snapshot.sh` first and verify with `cosmo-restore.sh <today>`.
> Everything below is reversible *only* because the snapshot exists — a fresh agent
> can be rolled back to Cosmo by following `RESTORE.md`.

This playbook is intentionally **decision-driven**: fill in the checklist, then run the
matching steps. Nothing here is destructive until you choose it.

---

## What always RESETS (Cosmo-specific identity & state)

| Item | Path | Why |
|---|---|---|
| Crypto identity | `~/.openclaw/identity/` | New agent regenerates its own on first boot |
| Agent memory DB | `~/.openclaw/memory/main.sqlite` | Cosmo's recall — start blank |
| Episodic memory | `workspace/memory/*.md`, `workspace/MEMORY.md` | Cosmo's history |
| Persona | `workspace/{IDENTITY,SOUL,HEARTBEAT}.md` | New agent gets a new soul |
| Sessions | `~/.openclaw/agents/main/sessions/` | Conversation history (context bleed) |
| Crons | `~/.openclaw/cron/jobs.json` | Cosmo's automations |
| Slack branding | `openclaw.json` channels (`#cosmo-*`) | New agent's channels |

## What always SURVIVES (shared infrastructure — reuse for free)

openclaw install · Node · launchd service · 1Password service token + vault ·
Supabase project · Vercel AI Gateway key · gws (Google Workspace) auth · MCP
parallel-search · **gbrain + wiki** (Sid's knowledge base, not Cosmo's).

---

## Inheritance checklist (decide per item)

| Inherit? | Item | Keep it by… |
|:--:|---|---|
| ☐ | **Skills library** (`workspace/skills/`, ~120) | Don't delete `skills/`; prune Cosmo-specific ones |
| ☐ | **Sid context** (`workspace/USER.md`) | Keep the file; new agent reads it day one |
| ☐ | **Crons as scaffold** (`cron/jobs.json`) | Keep file, rename/rewrite job messages |
| ☐ | **gbrain + wiki** | Always available; nothing to do |
| ☐ | **Operating docs** (`AGENTS.md`, `TOOLS.md`, `REVIEW.md`) | Keep; edit for new purpose |

Anything unchecked → delete during reset.

---

## Reset procedure (run after backup is verified)

```bash
openclaw gateway stop

# 1. Wipe Cosmo identity & memory
rm -f  ~/.openclaw/identity/device.json ~/.openclaw/identity/device-auth.json
rm -f  ~/.openclaw/memory/main.sqlite
rm -rf ~/.openclaw/agents/main/sessions/*
rm -f  ~/.openclaw/workspace/{IDENTITY,SOUL,HEARTBEAT,MEMORY}.md
rm -f  ~/.openclaw/workspace/memory/*.md

# 2. Reset automations (or keep as scaffold per checklist)
#    edit ~/.openclaw/cron/jobs.json — remove/rewrite jobs for the new purpose

# 3. Rebrand Slack (simplest: reuse Cosmo's app, new channels)
#    edit openclaw.json channels.slack.channels -> #<newagent>-chat etc.
#    re-invite the bot to the new channels in Slack.
#    (Alternative: register a brand-new Slack app, new xoxb/xapp tokens -> 1P.)

# 4. Author the new agent
#    write new workspace/IDENTITY.md, SOUL.md, AGENTS.md for the new purpose.

# 5. Boot — new identity regenerates automatically
openclaw gateway start
```

### Slack: reuse vs new app
- **Reuse Cosmo's app** (recommended): tokens are just auth, not identity. Point them at
  new channels and rename the app in api.slack.com if desired. Fast.
- **New app**: register a fresh app in the workspace, generate `xoxb`/`xapp`
  (`connections:write`), store in 1P, swap into `openclaw.json`.

---

## Rolling back to Cosmo
A fresh agent is never a point of no return. To bring Cosmo back, follow
`RESTORE.md` Path A with the pre-reset snapshot date.
