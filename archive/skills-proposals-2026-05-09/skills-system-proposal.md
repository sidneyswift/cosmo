# Skills System Proposal — Cosmo × Sid

## The Problem

Sid wants to build a powerful personal AI system AND productize parts of it. These feel like competing priorities but they're actually the same thing if the architecture is right.

The tension: skills built for Sid contain his name, his data paths, his branding, his API keys, his audience insights. That's what makes them powerful. But that's also what makes them un-publishable.

## The Landscape (What Exists)

### Registries & Marketplaces
- **ClawHub** (clawhub.ai) — OpenClaw's native registry. 52.7K tools, 180K users, 12M downloads. CLI: `clawhub install/publish/search`.
- **skills.sh** — Open leaderboard/directory for AgentSkills. Top collections: Microsoft Azure (4.5M installs), Firecrawl, Lark. `npx skills add <owner/repo>`.
- **LarryBrain** — Premium skill marketplace for OpenClaw agents.
- **UI Skills** — Curated design/UI skill directory.

### The last30days Model (Case Study)
mvanhorn built `/last30days` — a research skill that searches Reddit, X, YouTube, TikTok, HN, Polymarket, etc. It's:
- **General purpose** — works for any topic, any user
- **Open source** on GitHub (MIT)
- **Listed on** skills.sh (trending), ClawHub, and Claude marketplace
- **Distribution play** — the skill IS the content. Every demo is a proof-of-value. Every install grows the creator's reputation.
- **No personal data baked in** — it uses API keys the user brings, not the creator's

This is the blueprint. Build something genuinely useful → open source it → the skill markets itself.

### Our Current Setup
- **28 ready skills** (mostly openclaw-bundled), 2 workspace skills (apify, last30days)
- **social-slides** — bundled, has Sid's branding (elegant-founder template), not productizable as-is
- **content-engine** — local project at `~/Documents/projects/content-engine/`, handles draft generation/approval via Slack
- **Wiki** at `~/Documents/wiki/` — concept/entity/source pages, already tracking the skills ecosystem

### How OpenClaw Skills Work
Skills load from multiple locations with precedence:
1. `<workspace>/skills/` (highest — per-agent, overrides everything)
2. `<workspace>/.agents/skills/`
3. `~/.agents/skills/`
4. `~/.openclaw/skills/` (shared across agents)
5. Bundled (shipped with OpenClaw)
6. `skills.load.extraDirs` (lowest)

This precedence system is the key architectural insight. It means we can have a **generic skill** at a lower level and a **Sid-specific overlay** at a higher level.

## The Architecture: Layer Cake

Instead of "two separate tracks" or "build personal then strip it," I'm proposing a *layer cake* architecture:

```
┌─────────────────────────────────────────────┐
│  LAYER 3: Context Injection (Sid-specific)  │  workspace/skills/
│  - Sid's branding, data paths, audience     │
│  - References his local system              │
│  - NOT publishable                          │
├─────────────────────────────────────────────┤
│  LAYER 2: Custom Skills (publishable)       │  ~/.openclaw/skills/ or GitHub repos
│  - Built by us, general purpose             │  
│  - Our IP, our distribution                 │
│  - Published to ClawHub + skills.sh         │
├─────────────────────────────────────────────┤
│  LAYER 1: 3rd Party Skills (installed)      │  clawhub install / npx skills add
│  - last30days, apify, etc.                  │
│  - Maintained by others                     │
│  - We customize via Layer 3 overrides       │
└─────────────────────────────────────────────┘
```

### How It Works

**Layer 1 — Collect.** Install the best 3rd party skills. We already have last30days and apify. Research and install more. These are maintained by others; we consume them.

**Layer 2 — Build.** Create general-purpose skills from our workflows. These contain NO references to Sid, Cosmo, Recoupable, or any personal data. They solve a real problem anyone could have. Example: a `social-slides` skill that generates carousels with *configurable* branding (not hardcoded elegant-founder with Sid's aesthetic).

**Layer 3 — Personalize.** Workspace-level skill overrides that inject Sid's context. These use the same skill name as Layer 2, so OpenClaw's precedence system automatically picks Sid's version. They reference his branding, his wiki, his content engine, his audience data.

### Concrete Example: social-slides

**Layer 2 (publishable):**
```
~/.openclaw/skills/social-slides/
├── SKILL.md          # Generic: "Generate carousel slides from content"
├── references/       # Template system docs, how to add templates
├── assets/           # Default templates (clean, minimal)
└── scripts/          # Rendering pipeline
```

**Layer 3 (Sid-specific overlay):**
```
<workspace>/skills/social-slides/
├── SKILL.md          # Same name → overrides Layer 2
├── references/
│   └── elegant-founder.md    # Sid's specific template
├── assets/
│   └── templates/elegant-founder/
│       └── logo.png          # Sid's branding
```

Because workspace skills have highest precedence, Cosmo always uses Sid's version. But the Layer 2 version is what gets published.

## The Flywheel

```
Build for Sid → Skill works great → Strip personal context → 
Publish general version → Content about the skill → 
Audience growth → Feedback → Improve Sid's version → repeat
```

Each revolution:
1. Sid gets a better system (Layer 3 keeps improving)
2. A publishable skill exists (Layer 2)
3. Content exists (the build process IS the content — "build in public")
4. Distribution grows (ClawHub installs, GitHub stars, skills.sh ranking)
5. Sid's reputation as a builder grows
6. Feedback from public users improves the core skill

## The Pipeline: From Idea to Product

### Stage 1: Research
- Scan ClawHub, skills.sh, GitHub for existing skills
- Check if someone already solved this (don't rebuild)
- If they did → install it (Layer 1) and customize (Layer 3)
- If they didn't → document the gap, create a PRD in wiki

### Stage 2: Build for Sid (Layer 3 first)
- Build it specifically for Sid. Use his name, his paths, his data.
- This is the fastest path to value — no abstraction tax
- Dog-food it hard. Iterate. Break it. Fix it.

### Stage 3: Extract General Skill (Layer 2)
- Once the skill is stable and proven for Sid:
- Fork the skill, remove all Sid-specific references
- Replace hardcoded paths with `{baseDir}` or config patterns
- Replace personal branding with configurable templates
- Add proper description/triggers for general users
- Test it standalone (does it work without Sid's context?)

### Stage 4: Publish
- `clawhub publish ./skill-name --slug skill-name --version 1.0.0`
- Push to GitHub repo (for skills.sh listing)
- Post to #cosmo-review for Sid's approval before publishing

### Stage 5: Content
- Write about the skill (what it does, why it exists, how it was built)
- Create social-slides carousel showing the skill in action
- Use the content-engine pipeline to draft/approve/publish

### Stage 6: Maintain
- Track installs, feedback, issues on GitHub
- Improvements flow: public feedback → Layer 2 update → Layer 3 inherits

## What to Build First

Based on what Sid already uses and what has distribution potential:

| Priority | Skill | Why | Status |
|----------|-------|-----|--------|
| 1 | `social-slides` | Already half-built, high content value, visual = shareable | Needs Layer 2/3 split |
| 2 | `content-engine` | Sid's draft→review→publish pipeline is unique | Build from scratch |
| 3 | `wiki-builder` | Personal knowledge base that compounds — GBrain-adjacent | Build from scratch |
| 4 | `music-industry-research` | Recoupable-specific, but "industry research" is general | Layer 3 heavy |
| 5 | `audience-analyzer` | Uses last30days + scraping to build audience profiles | Layer 2 opportunity |

## Failure Points

1. *Abstraction too early.* Building general-purpose skills before they work for Sid = wasted effort. Always build for Sid first.
2. *Never extracting.* Building only for Sid and never publishing = no flywheel. Need a trigger (monthly review?) to check what's ready.
3. *Quality gap.* Publishing half-baked skills hurts reputation. Only publish what actually works.
4. *Maintenance burden.* Each published skill is a commitment. Start with 2-3, not 20.
5. *Leaking personal context.* Accidentally publishing Layer 3 content. Need a pre-publish checklist.
6. *Over-engineering the layer system.* If a skill is purely personal (like a "Sid's daily briefing" skill), don't force it into a publishable shape. Some things are just Layer 3.

## Where Value Accrues

- *Short-term:* Sid gets a more powerful, personalized AI system. Every skill makes Cosmo more capable.
- *Medium-term:* Published skills drive distribution. Each one is a "proof of work" that builds credibility.
- *Long-term:* The skills become lead magnets for Recoupable's audience. "The founder who built an AI system that runs his music business" is a compelling narrative. The skills are artifacts of that story.

## Integration with Wiki

The wiki should track:
- Every skill we evaluate (entity page per skill)
- Skills ecosystem concepts (already started)
- Build logs for skills we create (source pages)
- Comparison pages (our skill vs alternatives)
- A dedicated `wiki/concepts/cosmo-skills-system.md` page explaining this architecture

## Next Steps

1. Create `wiki/concepts/cosmo-skills-system.md` documenting this architecture
2. Split `social-slides` into Layer 2 (general) + Layer 3 (Sid's branding)
3. Set up a `skills/` directory structure in workspace for Layer 3 overrides
4. Create a monthly "skill extraction" review cadence
5. Start a skills backlog in wiki tracking ideas → research → build → publish

---

*This proposal lives at `skills-system-proposal.md` in workspace. It's a living document — update it as the system evolves.*
