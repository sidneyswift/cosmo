# Skills System v2 — Final Architecture Proposal

*After deep research, 10+ iterations of self-challenge, and honest assessment of what we actually have.*

---

## What I Got Wrong in v1

The original proposal treated this as a greenfield design problem. It's not. We already have:

1. **Recoupable's skills monorepo** (`github.com/recoupable/skills`) — 7 published skills (songwriting, chartmetric, release-management, artist-growth-threshold, trend-to-song, setup-sandbox, artist-workspace) plus a skill-creator. These are *product skills* that ship to Recoupable customers.

2. **Cosmo's workspace skills** (`~/.openclaw/workspace/skills/`) — 2 installed (apify, last30days). These are third-party skills Cosmo uses.

3. **OpenClaw's bundled skills** — 54 total, 28 ready. These include `social-slides` which *we built but lives in bundled*.

4. **The content engine** (`~/Documents/projects/content-engine/`) — A standalone project with scripts, cron, Slack integration. This is an informal "skill" that isn't packaged as one.

5. **The research wiki** (`~/Documents/wiki/`) — Knowledge base that compounds. Also an informal "skill."

The v1 proposal ignored contexts #1 and #4, which changes the architecture completely.

---

## The Real Problem (Reframed)

Sid operates at three levels:

**Level A — Recoupable Product.** AI skills that ship to customers (music industry). These already exist, are published on GitHub, and have a monorepo. This is the product, not Sid's personal system.

**Level B — Sid's Personal System (Cosmo).** Skills that make Cosmo more capable for Sid specifically. Content creation, research, scheduling, knowledge management. These reference Sid's branding, his audience, his data paths, his approval workflows. NOT for customers.

**Level C — Sid's Distribution.** Taking what works at Level B, cleaning it up, and publishing it as content/lead magnets/tools. This is how the personal system becomes distribution for the product.

The original proposal conflated all three. The architecture needs to serve each level differently.

---

## Recommendation: The Context File Pattern

After iterating through the four solutions from v1 (config-driven, wrapper skills, git branches, template variables), testing each against real constraints, and rejecting three of them, here's what I'm confident in:

### Core Mechanism: `context.yaml`

Every skill we build gets a `context.yaml` file convention. The skill's SKILL.md includes one instruction: "If `context.yaml` exists in this skill's directory, read it first and use its values throughout."

```yaml
# context.yaml — Sid's personal context for social-slides
brand:
  name: "Recoupable"
  handle: "@sidneyswift"
  logo_path: "assets/templates/elegant-founder/logo-dark.svg"
  tagline: "The new music industry"

style:
  template: "elegant-founder"
  primary_font: "Instrument Serif"
  bg_gradient: "linear-gradient(175deg, #e4edf6 0%, #edf2f8 20%, #f5f7fa 45%, #fafbfc 70%, #ffffff 100%)"
  text_color: "#0a0a0a"

audience:
  platform: "LinkedIn"
  industry: "music/tech"
  tone: "editorial, founder voice"

paths:
  wiki: "~/Documents/wiki/"
  content_engine: "~/Documents/projects/content-engine/"
  strategy: "~/Documents/projects/mono/strategy/"
```

**Why this wins over every other option I considered:**

1. **vs. Override/fork approach**: One copy of the skill. No sync problems. Updates flow through. `context.yaml` is gitignored from published versions.

2. **vs. OpenClaw `skills.entries.config`**: That config isn't injected into skill context — Cosmo would have to be told to check `openclaw.json` every time, and the skill can't reference it in its SKILL.md. `context.yaml` is a file the skill can directly instruct the agent to read.

3. **vs. Template variables (`{{brand}}`)**: No build step. No preprocessing. No fragile middleware. Just a file the agent reads.

4. **vs. Wrapper skills**: No extra skill in context. No routing confusion. No token overhead from two skill descriptions.

5. **vs. Global workspace CONTEXT.md**: Per-skill context is more precise. A global file gets bloated and forces every skill to parse what's relevant to it.

### Why It Works With OpenClaw's Architecture

- Skills already support `{baseDir}` to reference their own directory
- SKILL.md already instructs agents what files to read and when
- `context.yaml` is just another file in the skill directory — no platform changes needed
- The watcher auto-refreshes skills when files change
- Publishing: `context.yaml` goes in `.gitignore` (or `.clawignore`) — it never ships

### The Tradeoff I'm Accepting

Every skill we write needs one extra line: "Read `context.yaml` if it exists." This is boilerplate. It's ~15 tokens of overhead per skill. I challenged myself on whether this is too manual, too easy to forget. Answer: it's the kind of thing a skill template can enforce, and it's vastly simpler than every alternative.

---

## Architecture: Three Directories, Clear Boundaries

```
1. ~/Documents/projects/mono/skills/     ← Recoupable product skills (Level A)
   - Published to github.com/recoupable/skills
   - Used by Recoupable's AI product + customers
   - Has its own AGENTS.md, skill-creator, brand-guidelines
   - DO NOT mix Cosmo/personal skills here

2. ~/.openclaw/workspace/skills/         ← Cosmo's active skills (Level B)
   - What Cosmo actually uses day-to-day
   - Third-party installs (apify, last30days) live here
   - Our personal skills live here WITH context.yaml
   - Highest precedence in OpenClaw's load order

3. ~/Documents/projects/cosmo-skills/    ← Skills development repo (Level C bridge)
   - NEW: Git repo for skills we build
   - Each skill has two modes:
     a) general/ version (publishable, no context.yaml)
     b) workspace version (with context.yaml, deployed to #2)
   - Publishing goes from here to ClawHub/GitHub
   - Content creation references this repo ("here's how I built this skill")
```

### Why Three, Not Two or Four

I iterated on this extensively:

- **Two directories** (workspace + dev repo) collapses product skills into either workspace or dev, creating confusion about what's for Cosmo vs what's for Recoupable customers.
- **Four directories** (splitting workspace into "installed" and "custom") adds complexity with no clarity benefit — OpenClaw treats them the same.
- **One directory** (everything in workspace) has no version control, no publishing path, no separation of concerns.

Three maps cleanly to the three levels: Product, Personal, Distribution.

---

## Workflow: How a Skill Gets Built

### Phase 1: Identify
Something Sid or Cosmo does repeatedly that could be captured.
- Check if a third-party skill exists (ClawHub search, skills.sh, GitHub)
- If yes: install it → customize with context.yaml if needed → done
- If no: proceed to build

### Phase 2: Build for Sid
Build it in `cosmo-skills/` with personal context baked in.
- Write SKILL.md with full Sid-specific instructions
- Include context.yaml with his branding, paths, preferences
- Copy/symlink to workspace/skills/ for Cosmo to use
- Dog-food it. Break it. Fix it. Iterate.

### Phase 3: Validate
Use it for at least 2 weeks and 10+ invocations.
- Track what works and what doesn't in the daily log
- Note any corrections Sid makes
- Note any edge cases

### Phase 4: Extract (when ready, not before)
- In `cosmo-skills/`, create the general version alongside the personal one
- Remove context.yaml values, replace with "read context.yaml if it exists" pattern
- Replace hardcoded paths with instructions to check context
- Run the pre-publish lint (see below)
- Personal version stays active in workspace; general version ships

### Phase 5: Publish & Content
- Publish general version to ClawHub + push to GitHub
- Submit to agentskill.sh and skills.sh for indexing
- Write content about the skill (carousel, LinkedIn post, thread)
- The skill IS the content. The build process IS the story.

### Phase 6: Maintain
- Public feedback → improve general version → improvements flow to personal version
- Monthly review: any personal skills mature enough to extract?

---

## What to Build First (and Why)

After analyzing every candidate against three criteria:
1. **Daily utility**: How much does this help Sid right now?
2. **Extraction potential**: How useful is this to others?
3. **Existing infrastructure**: How much is already built?

### Priority 1: `content-engine` skill
**Why first:** The content engine already exists as a Node.js project with scripts. Sid uses it daily. Converting it to a skill makes it portable, documented, and teachable. The general version ("AI-powered content pipeline: discovery → draft → review → publish") is genuinely useful to any creator.

*What exists:* pulse.js, generate.js, approve.js, slack-bridge.js, slides renderer. Database. Cron.
*What's needed:* Package the workflow as SKILL.md. Move the process knowledge from scattered scripts into structured instructions. Add context.yaml for Sid's specific Slack channels, brand voice, platform accounts.
*Extraction difficulty:* Medium. Core workflow is generic (discover topics → draft content → review → publish). Personal parts are the specific Slack channels, Postiz integrations, brand voice profile.

### Priority 2: `social-slides` extraction
**Why second:** Already built as a bundled skill. Already proven (multiple iterations, used in production). The elegant-founder template is Sid-specific; the underlying system (HTML → Playwright → PNG carousel) is universal.

*What's needed:* Move from bundled to workspace. Add context.yaml with Sid's template config. Create a general version that supports configurable templates. The template system is already designed for this (each template is a separate reference file).
*Extraction difficulty:* Low. The skill is already well-structured. Just need to externalize the hardcoded "Recoupable" footer and logo.

### Priority 3: `wiki-builder` skill
**Why third:** The wiki already exists and compounds. The workflow (ingest content → extract entities/concepts → maintain knowledge graph) is valuable to anyone building a knowledge base.

*What exists:* Wiki at ~/Documents/wiki/, AGENTS.md schema, concept/entity/source page patterns.
*What's needed:* Package the ingest workflow as a skill. Document the entity/concept/source schema. Add context.yaml for Sid's specific wiki path, topic focus areas, source preferences.
*Extraction difficulty:* Medium. Core pattern is universal (structured knowledge management). Sid-specific parts are topic focus (music industry, AI agents) and source preferences.

### Why NOT music-industry-research or audience-analyzer first
These are too domain-specific to extract early. They'd be great Recoupable product skills (Level A), not Cosmo personal → distribution skills (Level B→C). If we build them, they should go into the Recoupable monorepo, not cosmo-skills.

---

## Pre-Publish Lint: Preventing Context Leaks

Script: `cosmo-skills/scripts/lint-for-publish.sh`

```bash
#!/bin/bash
# Scan a skill directory for personal context that shouldn't be published

PERSONAL_PATTERNS=(
  "Sidney" "sidney" "Sid " "/Users/recoupable"
  "Recoupable" "recoupable" "@sidneyswift"
  "op://" "1Password" "cosmo-" "Cosmo"
  "~/Documents/projects/" "content-engine"
  "C0B2" # Slack channel IDs
)

SKILL_DIR="$1"
FOUND=0

for pattern in "${PERSONAL_PATTERNS[@]}"; do
  matches=$(grep -rn "$pattern" "$SKILL_DIR" --include="*.md" --include="*.yaml" --include="*.json" | grep -v "context.yaml" | grep -v ".git")
  if [ -n "$matches" ]; then
    echo "⚠️  Found '$pattern':"
    echo "$matches"
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "✅ Clean — no personal references found"
else
  echo "❌ Personal references detected — fix before publishing"
  exit 1
fi
```

This runs before any `clawhub publish`. It's not perfect (won't catch semantic leaks like "my music industry audience") but catches the obvious stuff.

---

## Token Management Strategy

Current state: 28 ready skills, ~546 tokens for the skills list. Adding 3 more skills adds ~75 tokens. Manageable.

Strategy:
1. **Immediate**: No action needed. 30ish skills is fine.
2. **At 40+ skills**: Use `disable-model-invocation: true` for niche skills (keep them available via `/command` but out of the prompt).
3. **At 60+ skills**: Implement agent-specific allowlists (`agents.defaults.skills`).
4. **Never needed**: Dynamic rotation. The overhead doesn't justify the complexity.

---

## Version Control & Publishing

### cosmo-skills repo structure:
```
cosmo-skills/
├── README.md
├── scripts/
│   └── lint-for-publish.sh
├── content-engine/
│   ├── SKILL.md
│   ├── context.yaml          ← gitignored
│   ├── context.example.yaml  ← committed (shows what to configure)
│   ├── references/
│   └── scripts/
├── social-slides/
│   ├── SKILL.md
│   ├── context.yaml          ← gitignored
│   ├── context.example.yaml
│   ├── references/
│   └── assets/
└── wiki-builder/
    ├── SKILL.md
    ├── context.yaml          ← gitignored
    ├── context.example.yaml
    └── references/
```

### .gitignore:
```
context.yaml
!context.example.yaml
```

### Publishing workflow:
1. Develop in cosmo-skills/
2. Symlink active skills to workspace/skills/ (or copy)
3. When ready to publish: run lint-for-publish.sh
4. `clawhub publish ./skill-name --slug skill-name --version X.Y.Z`
5. Also push to GitHub for skills.sh/agentskill.sh indexing

### Versioning:
- Semver. Patch for fixes, minor for new features, major for breaking changes.
- Start at 1.0.0 when publishing. Pre-publish iterations are just git commits.
- Changelog in the repo's commit history. Don't maintain a separate CHANGELOG.md (overhead not worth it at our scale).

---

## Wiki Integration

Concrete schema for `wiki/concepts/cosmo-skills-system.md`:
- Architecture overview (link to this document)
- Active skills inventory (auto-updated via heartbeat script)
- Skills we evaluated but didn't install (and why)
- Skills in development (from cosmo-skills/ repo)
- Published skills (links to ClawHub/GitHub)

Automation:
```bash
# scripts/update-wiki-skills.sh — run during heartbeat
# Scans workspace/skills/ and cosmo-skills/, writes wiki page
```

NOT per-skill wiki pages. That's over-documentation for our scale. One page that tracks the whole system.

---

## Failure Mode Analysis (Revised)

I challenged each recommendation against likely failure modes:

**"context.yaml won't get maintained"**
Risk: Low. It's the personal version — the one Sid actually uses. If context changes, the skill stops working correctly, which forces an update. Self-correcting.

**"Extraction still won't happen"**
Risk: Medium. Mitigated by: (1) the cosmo-skills repo structure makes the general version visible — it's a gap you can see, not a task you have to remember, (2) the #cosmo-review workflow can include "ready to publish?" cards on a cadence, (3) content creation is the incentive — you can't write a "how I built this" post without a publishable version.

**"Three directories is too complex"**
Risk: Low. Each directory has a clear owner and purpose. Sid already maintains the mono skills repo. Cosmo already uses workspace/skills. The new repo is the only net addition.

**"ClawHub publishing will have friction"**
Risk: Medium. We haven't done it yet. Mitigation: the CLI is installed, the commands are documented, we just need to authenticate. First publish will be a learning experience — budget time for it.

**"This compounds too slowly"**
Risk: Low. The first skill (content-engine) is something Sid uses daily. Value is immediate. Publishing adds distribution. Each subsequent skill is faster because the pattern is established.

**"social-slides is bundled, moving it is messy"**
Risk: Medium. We'd need to create a workspace version that shadows the bundled one. The bundled version stays as a fallback for other OpenClaw users. Our workspace version has context.yaml. This actually works perfectly with OpenClaw's precedence — workspace wins over bundled.

---

## What This Looks Like at Scale (6 Months Out)

- **5-8 personal skills** active in workspace, each with context.yaml
- **3-5 published skills** on ClawHub/GitHub with installs and feedback
- **3-5 content pieces** per published skill (the build story, the demo, the tutorial)
- **Wiki page** tracking the full inventory
- **Monthly extraction review** in #cosmo-review
- **Recoupable product skills** remain separate in the mono repo — clear boundary
- **Distribution flywheel** turning: skills → content → audience → feedback → better skills

---

## Compounding Mechanism (How This Gets Better Over Time)

Round 1 (now): Build content-engine skill → Cosmo gets better at content → Sid publishes more.
Round 2 (month 2): Publish content-engine → Write about how it was built → Audience grows.
Round 3 (month 3): Build wiki-builder → Knowledge compounds faster → Better research → Better content.
Round 4 (month 4): Social-slides published → Visual content gets picked up → More installs.
Round 5 (month 5): Feedback from public users → Improve skills → Share improvements → More content.

Each round makes the next round faster because:
1. The skill-building pattern is established (less figuring out, more executing)
2. The audience is larger (more distribution per skill)
3. The skills improve each other (wiki feeds content, content-engine uses slides, slides use research)

---

## Immediate Next Steps

1. **Create `cosmo-skills/` repo** — Initialize with README, .gitignore, lint script
2. **Authenticate ClawHub** — `clawhub login` so publishing is unblocked
3. **Move social-slides to workspace** — Copy from bundled, add context.yaml
4. **Start content-engine skill** — Package existing scripts into skill format
5. **Update wiki** — Create `wiki/concepts/cosmo-skills-system.md`

---

## Decision Points for Sid

1. **Cosmo-skills repo location**: `~/Documents/projects/cosmo-skills/` or as a submodule in the mono? I recommend standalone — keeps personal system separate from product.

2. **Publishing identity**: Publish under `recoupable` org or `sidneyswift` personal? I recommend personal for Cosmo/personal skills (Sid the builder) and org for product skills (Recoupable the company).

3. **First skill**: content-engine (highest daily utility) or social-slides extraction (lowest effort)? I recommend social-slides first because it's 80% done and proves the pattern with minimal effort.

---

*This proposal supersedes `skills-system-proposal.md` and `skills-system-holes-and-solutions.md`.*
*Written after researching: AgentSkills spec, OpenClaw skills/plugins docs, ClawHub CLI, skills.sh ecosystem, agentskill.sh creator tools, AgentSkillOS paper, Recoupable skills monorepo, content engine codebase, wiki structure, and mvanhorn's last30days distribution model.*
