# Cosmo 🌀

Cosmo is Sid's AI assistant, running on [OpenClaw](https://github.com/openclaw/openclaw).

## What's in this repo

```
├── AGENTS.md              # Operating instructions
├── SOUL.md                # Personality & identity
├── USER.md                # About the human
├── IDENTITY.md            # Name, vibe, creature
├── MEMORY.md              # Long-term memory (curated)
├── HEARTBEAT.md           # Periodic task checklist
├── TOOLS.md               # Tool configs & API references
├── REVIEW.md              # Approval workflow
├── GROWTH-HACKER.md       # Content growth strategy
├── SKILLS.md              # Skill index
│
├── memory/                # Daily logs & state files
├── skills/                # 60+ custom skills
├── scripts/               # Thumbnail generators, briefing templates
├── drafts/                # Content drafts in progress
├── reports/               # Generated reports (nightly, janitor)
├── playbook/              # LinkedIn & content playbooks
├── references/            # Reference materials
├── content-engine-*/      # Content engine configs
├── db/                    # Session search DB schema (db files gitignored)
│
├── openclaw-config/       # Non-workspace OpenClaw configs
│   ├── openclaw.json      # Main config (secrets scrubbed → ${PLACEHOLDER})
│   ├── cron/jobs.json     # All cron schedules
│   ├── agents/            # Agent model configs
│   ├── bin/               # Gateway wrapper script
│   └── claude-skills/     # Claude Code / gstack skills
│
├── secrets.template       # All secrets that need saving (no values)
└── .gitignore
```

## Restoring Cosmo on a new machine

1. Clone this repo to `~/.openclaw/workspace/`
2. Install OpenClaw: `npm i -g openclaw`
3. Copy configs from `openclaw-config/` to their real locations:
   - `openclaw-config/openclaw.json` → `~/.openclaw/openclaw.json`
   - `openclaw-config/cron/jobs.json` → `~/.openclaw/cron/jobs.json`
   - `openclaw-config/agents/` → `~/.openclaw/agents/`
   - `openclaw-config/bin/` → `~/.openclaw/bin/`
   - `openclaw-config/claude-skills/` → `~/.claude/skills/`
4. Fill in secrets from 1Password (see `secrets.template`)
5. Install gstack: `cd ~/.claude/skills/gstack && npm install`
6. Run `openclaw gateway start`

## Secrets

All secrets are in 1Password (Agents vault). See `secrets.template` for the complete list.
The `openclaw.json` in this repo has `${PLACEHOLDER}` values where secrets go.

## Not backed up here

- `~/.openclaw/agents/main/sessions/` — 200MB+ of session transcripts (ephemeral)
- `~/.gbrain/` — GBrain database (separate backup)
- `~/Documents/wiki/` — Research wiki (separate git repo)
- `~/.claude/skills/gstack/node_modules/` — reinstall via npm
- `~/Documents/projects/content-engine/` — separate git repo
