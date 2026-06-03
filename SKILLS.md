# Skills System

## How It Works

Sid builds skills across multiple environments (Cosmo, Homa, client work). Skills that are useful beyond one environment go into a public GitHub repo. Anyone can install them.

**Repo:** https://github.com/sidneyswift/skills

**Two config layers (not in the skill directory — survives reinstalls):**

1. **Identity** — `~/.config/sid/identity.md` — who the human/brand is. Set up once per machine. Every skill reads it.
2. **Skill config** — `~/.config/<skill-name>/.env` — per-skill settings. Follows the last30days pattern (key=value, `SETUP_COMPLETE=true` gate).

**First-run:** If a skill doesn't find these files, it asks the user and creates them.

**Publishing:** `clawhub publish` + push to GitHub. Lint script catches personal references before publish.

## What Exists

| Thing | Location | Status |
|-------|----------|--------|
| GitHub repo | github.com/sidneyswift/skills | ✅ Live, public |
| Identity file | ~/.config/sid/identity.md | ✅ Created |
| social-slides | workspace/skills/social-slides | ✅ Workspace (overrides bundled) |
| skill-system (meta-skill) | workspace/skills/skill-system | ✅ Teaches agents the workflow |
| Lint script | workspace/skills/scripts/lint-for-publish.sh | ✅ Works |
| Publish script | workspace/skills/scripts/publish.sh | ✅ Works |
| ClawHub auth | clawhub login | ❌ Not yet |

## Environments

| Environment | Agent | Role |
|-------------|-------|------|
| Cosmo | OpenClaw (this machine) | Hub — builds, publishes |
| Homa | OpenClaw (family Mac) | Spoke — installs, uses. Alessa + Sid in Slack. |
| Clients | Varies | Spoke — Sid builds skills, extracts general versions |

## Building a Skill

1. Build it. Make it work. Iterate.
2. When it's good: separate personal stuff into the two config layers.
3. `lint-for-publish.sh` → `publish.sh` → push to GitHub.
4. Other environments install from ClawHub or GitHub.

## Revenue

Skills are free (distribution) or paid (BuySkills.ai, PaperclipSkills). Content about building them grows audience. Consulting ($500+) for custom setup.

## What To Build Next

Stop architecting. Build actual skills:
1. Content-engine skill (daily utility — formalize the pipeline Sid already uses)
2. Wiki-builder skill (compounds research quality)
3. Whatever Sid needs next

The system will reveal itself through use. Don't design patterns before they're needed.
