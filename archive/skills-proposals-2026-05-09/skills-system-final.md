# The Skills System — Final Proposal

---

## The Pattern

One convention solves the personal vs. publishable problem: `context.md`.

Every skill we build includes one instruction near the top of SKILL.md:

```
If `{baseDir}/context.md` exists, read it first for personal configuration.
```

That's it. When context.md is present, the skill uses Sid's branding, paths, preferences, audience context. When it's absent, the skill works generically for anyone. The published version ships without context.md. The personal version has it.

No forking. No overriding. No syncing two copies. No middleware. No template variables. One skill, one file for personalization, gitignored from published versions.

### Why context.md specifically

- **Markdown** — the native language of skills. The agent reads it naturally.
- **Prose + structure** — can hold both "default to elegant-founder template" and "the audience is LinkedIn music/tech founders who value editorial quality"
- **Per-skill** — each skill gets its own personalization, not a bloated global config
- **Invisible to publishing** — gitignored by default. The lint script catches it if it leaks.
- **Zero platform changes** — works with OpenClaw today. Skills already support `{baseDir}` for self-referencing.

### What goes in context.md vs. existing workspace files

| Workspace files (TOOLS.md, USER.md, SOUL.md) | context.md |
|---|---|
| Already in system prompt every turn | Read only when the skill activates |
| Global personal context (API keys, identity, tone) | Skill-specific config (template, audience, paths) |
| Shared across all skills | Scoped to one skill |

If it's useful across your whole system, it goes in workspace files. If it's specific to how one skill should behave for you, it goes in context.md.

### Example: social-slides context.md

```markdown
# Social Slides — Personal Context

## Brand
- Footer brand name: "Recoupable"
- Footer font: 17px, Plus Jakarta Sans 600
- Logo: use `{baseDir}/assets/templates/elegant-founder/logo-dark.svg`
- Handle: @sidneyswift

## Default Template
Always use `elegant-founder` unless I specify otherwise.
The sky gradient + Instrument Serif italic IS the brand. Don't deviate.

## Audience
LinkedIn-primary. Music industry + AI/tech crossover.
Founder voice — editorial, data-driven, opinionated.
Not corporate. Not academic. Like a sharp friend explaining something interesting.

## Dimensions
Default to 1080×1350 (LinkedIn carousel) unless told otherwise.
```

---

## Where Skills Live

```
~/.openclaw/workspace/skills/          ← Cosmo's skills (active + development)
├── .git/                              ← version controlled
├── .gitignore                         ← excludes personal + third-party files
├── scripts/
│   ├── lint-for-publish.sh            ← catches personal references
│   └── publish.sh                     ← clean publish to ClawHub
│
├── social-slides/                     ← OUR skill (overrides bundled)
│   ├── SKILL.md
│   ├── context.md                     ← Sid-specific (gitignored)
│   ├── context.example.md             ← shows what to configure (committed)
│   ├── references/
│   └── assets/
│
├── content-engine/                    ← OUR skill
│   ├── SKILL.md
│   ├── context.md                     ← gitignored
│   └── references/
│
├── wiki-builder/                      ← OUR skill
│   ├── SKILL.md
│   ├── context.md                     ← gitignored
│   └── references/
│
├── apify/                             ← third-party (gitignored)
│   └── ...
└── last30days-official/               ← third-party (gitignored)
    └── ...
```

`.gitignore`:
```
# Third-party installed skills
apify/
last30days-official/
*/_meta.json
.clawhub/

# Personal context (never publish)
*/context.md

# System
.DS_Store
```

This is BOTH the development environment AND the runtime. No separate repo, no deploy step, no sync. Edit a skill → OpenClaw's watcher picks it up → instantly active.

For publishing: `scripts/publish.sh` copies the skill to a temp directory, strips context.md, runs lint, and calls `clawhub publish`. 20 lines of bash.

### Why not a separate repo?

I iterated on this 6+ times. Separate repo means: deploy step, two copies, sync problems, symlinks (which OpenClaw rejects for security), or extraDirs (lowest precedence, can't override bundled). All worse than just git-tracking the workspace skills directory.

### Relationship to Recoupable product skills

`~/Documents/projects/mono/skills/` — the Recoupable monorepo — is a SEPARATE concern. Those are product skills for customers (songwriting, chartmetric, release-management). They're published under the recoupable GitHub org. They have their own AGENTS.md and skill-creator.

Cosmo's workspace skills are for Sid's personal system. Published under Sid's personal identity. Different audience, different purpose, different repo. No mixing.

---

## What to Build and When

### Assessment Framework

Before building any skill, ask one question: **Is the core workflow generic or personal?**

**Generic workflow** (the steps work for anyone, the context is personal): Build the skill general from day one. Add context.md for personalization. Publishing is trivial because the general version exists from the start.

**Personal workflow** (the steps themselves are custom to Sid): Build for Sid directly. The skill may never be published, and that's fine. If it does get published later, it requires real abstraction work, not just stripping context.

### Priority 1: social-slides → workspace (Effort: 2-3 hours)

**Why first:** Proves the entire pattern with minimal work. We built it, it's in production, it just needs to move from bundled to workspace with context.md added.

**Generic workflow?** Yes. "Generate carousel slides from content → render via Playwright" is universal. The template and branding are personal.

**Steps:**
1. Copy bundled social-slides structure to workspace/skills/social-slides
2. Add "read context.md if it exists" to SKILL.md
3. Create context.md with Sid's branding/template config
4. Create context.example.md (committed, shows what to configure)
5. Test: create a carousel in a session → verify it uses Sid's branding
6. Commit to git
7. When ready to publish: run publish.sh, push to ClawHub + GitHub

**Publish story:** "I built an AI that creates LinkedIn carousels." The carousel ABOUT the skill is made BY the skill. Meta, visual, shareable.

### Priority 2: content-engine skill (Effort: 4-6 hours)

**Why second:** Highest daily utility. Makes Cosmo better at running the pipeline that creates all content (including content about skills). This is the meta-skill that powers the flywheel.

**Generic workflow?** Partially. The discovery → draft → review → publish flow is generic. But Sid's specific pipeline (pulse.js → generate.js → Slack triage → Postiz publish) is custom. This is a personal skill that MIGHT have a publishable core.

**Steps:**
1. Write SKILL.md documenting the full content pipeline workflow
2. Reference existing scripts in ~/Documents/projects/content-engine/
3. Create context.md with Slack channel IDs, Postiz integration IDs, DB path
4. Test: run the pipeline end-to-end using the skill instructions

**Publish story:** The skill itself may not publish. But the PROCESS of building it becomes content: "How my AI writes all my LinkedIn posts."

### Priority 3: wiki-builder skill (Effort: 4-6 hours)

**Why third:** Compounds knowledge quality, which feeds content quality, which feeds distribution.

**Generic workflow?** Yes. "Ingest web content → extract entities/concepts → maintain structured knowledge base" is universal. The topics and wiki path are personal.

**Steps:**
1. Write SKILL.md documenting the ingest workflow from wiki/AGENTS.md
2. Create references/ with the entity/concept/source page schemas
3. Create context.md with wiki path, topic focus areas, source preferences
4. Test: ingest a link and verify it creates proper wiki pages

**Publish story:** "Building a second brain with AI agents." Universal appeal for anyone doing knowledge management.

---

## The Flywheel (How It Compounds)

```
Build skill for Sid → Cosmo uses it daily → It works → 
Write content about it (using content-engine + social-slides) → 
Publish skill to ClawHub/GitHub → People install it → 
Feedback improves the skill → Better output for Sid → 
More content to write about → Larger audience → 
More installs → More feedback → Repeat
```

Each revolution is faster than the last because:
1. The pattern is established (second skill is easier than first)
2. The tools improve each other (content-engine uses slides, slides use wiki research)
3. The audience grows (more distribution per piece of content)
4. Cosmo gets better (each skill makes the system more capable)

### Where the value accrues

**Short term (month 1):** Sid gets a more organized, documented system. Cosmo is more consistent.

**Medium term (months 2-3):** Published skills attract installs. Content about the system builds audience. Advisory leads increase.

**Long term (months 4-6):** 3-5 published skills with active users. System reputation established. Skills become lead magnets for Recoupable. The "founder who built an AI system" narrative is solid.

### Revenue path

Skills are free. Revenue comes from the AUDIENCE they attract:
1. Skills → content → audience → Recoupable product customers
2. Skills → content → audience → advisory/consulting clients
3. Future: premium skill bundles, but not now

---

## Publishing Workflow

### First time setup (once)
```bash
clawhub login                                    # browser auth
cd ~/.openclaw/workspace/skills && git init       # already done
```

### Per-skill publish
```bash
./scripts/publish.sh social-slides 1.0.0         # copies, strips, lints, publishes
git push origin main                              # push to GitHub for skills.sh/agentskill.sh indexing
```

### Multi-registry distribution (automatic)
- **ClawHub**: `publish.sh` handles it (direct publish)
- **agentskill.sh**: auto-syncs from GitHub within 24h (or instant with webhook)
- **skills.sh**: indexes GitHub repos with SKILL.md files
- **One publish action → three registries**

### Pre-publish lint catches:
```
Sidney, sidney, Sid, /Users/recoupable, Recoupable, recoupable,
@sidneyswift, op://, 1Password, cosmo-, Cosmo, ~/Documents/projects/,
content-engine, C0B2 (Slack channel IDs)
```

---

## Risks and Honest Assessment

**context.md not read by the LLM**: Medium risk. Mitigated by placing the instruction in the first paragraph of SKILL.md. If an LLM skips it, the skill still works — just without personalization. Not a catastrophic failure.

**Extraction never happens for Type B skills**: This is okay. Some skills (content-engine) may always be personal. The value is in Sid's system working better, not in publishing everything. Content about the PROCESS still gets created even if the skill doesn't publish.

**ClawHub publishing friction**: We haven't done it yet. First publish will be a learning experience. Budget an extra hour for setup.

**Sid gets pulled to other priorities**: The system is designed to require minimal Sid time. Cosmo handles the daily pipeline. Sid's role is: approve/reject in #cosmo-review. If that's too much, the system still works — just without the publishing/content step.

**Token bloat from more skills**: Currently 28 ready skills at ~546 tokens. Adding 3 more adds ~75 tokens. Not a problem for at least 2x more skills. At 50+ skills, use `disable-model-invocation: true` for niche skills.

---

## Plugins (Brief)

Sid asked about plugins too. Short answer: skills first. Plugins are for when skills aren't enough — when you need a native tool schema, lifecycle hooks, or background services. Most of what Sid wants is workflow optimization, which skills handle.

When we DO need a plugin (e.g., a native Postiz tool, a content-engine dashboard), it's a separate engineering project with the Plugin SDK. Cross that bridge when we get there.

---

## Next Steps (Actionable)

1. ☐ Git init workspace/skills/ with .gitignore (5 min)
2. ☐ Create scripts/lint-for-publish.sh and scripts/publish.sh (30 min)
3. ☐ Move social-slides to workspace with context.md (2-3 hours)
4. ☐ Authenticate ClawHub (`clawhub login`) (5 min)
5. ☐ Test social-slides in a live session (30 min)
6. ☐ Write content-engine SKILL.md (4-6 hours)
7. ☐ Publish social-slides to ClawHub when satisfied (30 min)

---

## Decision Points for Sid

1. **GitHub identity for published skills**: `sidneyswift` (personal brand) or a new org? I recommend `sidneyswift` — the build-in-public story is about Sid.

2. **Start now or refine further?** The architecture is solid. I'm ready to start building social-slides in workspace today if you give the go.

---

*This supersedes all previous proposals (skills-system-proposal.md, skills-system-holes-and-solutions.md, skills-system-v2.md).*
