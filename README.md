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

## Restoring Cosmo / starting fresh

- **[RESTORE.md](RESTORE.md)** — full resurrection runbook (soft reset, full reformat,
  or new machine). The authoritative procedure.
- **[RESET.md](RESET.md)** — retire Cosmo and stand up a new agent on the same shared infra.
- `scripts/cosmo-snapshot.sh` / `cosmo-restore.sh` — complete backup/restore (core state,
  sessions, gbrain) to the Supabase `cosmo-backups` bucket.

## Secrets

All secrets are in 1Password (Agents vault). See `secrets.template` for the complete list.
The `openclaw.json` in this repo has `${PLACEHOLDER}` values where secrets go.

## Complete backup coverage

| Layer | Backup |
|---|---|
| Code, skills, docs, persona, memory `.md` | this repo (GitHub) |
| Core state (identity, creds, memory.sqlite, flows, live config) | Supabase `cosmo-core/` (encrypted) |
| Session transcripts | Supabase `cosmo-sessions/` |
| GBrain DB | Supabase `gbrain/` |
| Research wiki | GitHub `sidneyswift/cosmo-wiki` |
| Content engine | GitHub `sidneyswift/content-engine` |
| Secrets | 1Password "Agents" vault |

Regenerable, not backed up: `node_modules/` (npm), `content-engine/data/media/` (generated slides).
