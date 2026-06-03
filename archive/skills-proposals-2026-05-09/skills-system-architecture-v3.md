# Sid's Skills Architecture — The Full System

*Updated: 2026-05-09 — includes cross-environment propagation and meta-skill*

---

## The Core Problem

Sid builds skills across multiple environments. Each environment has its own agent, its own workspace, its own purpose. Skills built in one environment should compound across all of them — and eventually become distribution and revenue.

## Environments

| Environment | Agent | Machine | Purpose | Slack? |
|-------------|-------|---------|---------|--------|
| Cosmo | OpenClaw | Sid's MacBook Pro | Personal system — content, research, business | Yes (Sid) |
| Homa | OpenClaw | Another Mac | Homeschool for son Story — curriculum, tracking | Yes (Sid + Alessa) |
| Client X | Varies | Client infra | Consulting — skills for their workflows | Varies |
| Client Y | Varies | Client infra | Consulting — skills for their workflows | Varies |
| Recoupable | Product | Mono repo | Music industry AI product (separate scope) | N/A |

---

## The Architecture

### One Repo: `github.com/sidneyswift/skills`

Sid's public skill portfolio. Every general-purpose skill ends up here. It's the single source of truth.

```
sidneyswift/skills/
├── README.md
├── .gitignore              ← excludes */context.md
├── watch/
│   ├── SKILL.md
│   ├── context.example.md
│   └── references/
├── social-slides/
│   ├── SKILL.md
│   ├── context.example.md
│   ├── references/
│   └── assets/
├── lesson-plan-generator/
│   ├── SKILL.md
│   ├── context.example.md
│   └── references/
└── sid-skills-system/       ← THE META-SKILL (see below)
    ├── SKILL.md
    └── context.example.md
```

### One Convention: context.md

Every skill follows the same pattern:
- SKILL.md = general (works for anyone)
- context.md = personal (per environment, gitignored)
- context.example.md = template showing what to configure

### One Meta-Skill: sid-skills-system

This is the skill that teaches every other agent how Sid's system works. It gets installed in EVERY environment Sid touches. It contains:
- The context.md convention
- The portfolio repo location
- How to build, extract, lint, publish
- What patterns to avoid (personal references)
- Revenue channels

When Sid opens a new client engagement or sets up a new OpenClaw instance, the first thing that gets installed is `sid-skills-system`. From that point on, the agent knows how to participate in Sid's ecosystem.

---

## How Each Environment Works

### Cosmo (Hub)

Cosmo is the primary skill-building environment. It has full publishing access.

**Capabilities:**
- Build skills in workspace
- Extract personal → general
- Lint for personal references
- Push to sidneyswift/skills GitHub repo
- Publish to ClawHub
- Write content about published skills (content-engine + social-slides)
- Install skills from ClawHub

**Installed skills:**
- sid-skills-system (with Cosmo context.md)
- social-slides (with Sid's branding context.md)
- All other skills Sid develops or installs
- scripts/lint-for-publish.sh, scripts/publish.sh

**Cosmo's role:** The main workshop. Most skills are either built here or polished here before publishing.

### Homa (Spoke)

Homa consumes skills from the portfolio and sometimes originates new ones.

**Capabilities:**
- Install skills from ClawHub or GitHub
- Create context.md for homeschool-specific config
- Build skills in workspace (Homa or Sid can ask)
- Cannot publish directly (no ClawHub auth, no GitHub push access to sidneyswift/skills)
- CAN flag skills for extraction: "This skill is ready for Sid's portfolio"

**Installed skills:**
- sid-skills-system (with Homa context.md — see below)
- Any skills from the portfolio that are useful for homeschooling
- Skills built locally for Homa-specific needs

**Homa context.md for sid-skills-system:**
```markdown
# Sid's Skills System — Homa Environment

## This Environment
- Agent: Homa
- Instance: OpenClaw on family Mac
- Purpose: Homeschooling for Story — curriculum, lesson plans, tracking

## Publishing Access
- ClawHub CLI: not configured
- GitHub push access: no
- Cannot publish directly

## When a Skill is Ready for Sid's Portfolio
If Sid or Alessa says "port this to the portfolio" or "make this general":
1. Extract personal references into context.md (Story's name, reading level, curriculum details)
2. Save the clean version to a local staging directory
3. Notify Sid (in Slack) that a skill is ready for review
4. Sid will pull it into Cosmo, review, and publish from there

## Notes
- Alessa is a primary user — she may not use technical language
- Skills here often involve educational content, schedules, and child development
- NEVER include Story's personal details (health, biometrics) in publishable skills
```

**How Homa gets new skills:**

Option A (Sid installs manually):
Sid SSHs or sits at the Homa Mac: `openclaw skills install <slug>`

Option B (Sid tells Homa in Slack):
Sid messages in Homa's Slack: "Install the watch skill from ClawHub."
Homa runs: `openclaw skills install watch`
Then Homa creates context.md with the homeschool-specific config.

Option C (Homa updates itself):
Homa's heartbeat could periodically check the portfolio repo for new skills. If a new one appears that's relevant, Homa installs it. (Future — requires automation.)

### Client Environments (Spokes)

Each client has their own workspace. Sid builds skills there, extracts general versions for his portfolio.

**Capabilities:**
- Build skills in client's workspace
- Install skills from Sid's portfolio (if helpful for the client)
- CANNOT publish to Sid's accounts (client's infrastructure)
- Skills stay in client's private repo unless explicitly extracted

**How it works:**

Sid builds a skill for the client in their environment. If the core workflow is general-purpose:

1. Sid tells the client's agent: "Extract the general version of this skill."
   - The agent knows how because sid-skills-system is installed
   - It strips client-specific references, creates context.md
   - Saves the clean version locally

2. Sid copies the clean skill to his machine (git, email, USB, whatever)

3. Sid tells Cosmo: "Add this to the portfolio" — hands over the clean files

4. Cosmo reviews, commits to sidneyswift/skills, publishes to ClawHub

**Client context.md for sid-skills-system:**
```markdown
# Sid's Skills System — Client Environment

## This Environment
- Agent: [Client's agent]
- Instance: [Platform]
- Purpose: [Client engagement description]

## Publishing Access
- Cannot publish to Sid's accounts
- Skills stay in client's private repo unless Sid extracts them

## Extraction Rules
- NEVER include client company name, internal URLs, API keys, employee names
- Client IP stays in client's repo
- Only the general workflow pattern goes to Sid's portfolio
- Sid must explicitly request extraction ("clean this up for my portfolio")

## Notes
- This is a client environment — default to privacy
- When in doubt, keep things in the client's private repo
```

---

## User Journeys (Updated with Cross-Environment Flow)

### Journey 1: Sid builds a skill on Cosmo, deploys everywhere

1. Sid tells Cosmo: "Build a skill that watches URLs for changes"
2. Cosmo builds it in workspace, they iterate
3. Sid says: "Clean this up for my portfolio"
4. Cosmo extracts → lints → pushes to sidneyswift/skills → publishes to ClawHub
5. Sid messages Homa in Slack: "Install the watch skill"
6. Homa runs `openclaw skills install watch`, creates context.md for homeschool URLs
7. Both environments now have the skill, each with their own context

### Journey 2: Alessa needs a new skill on Homa

1. Alessa tells Homa: "I need a lesson plan generator based on Story's reading level"
2. Homa builds it locally (with Story's details baked in during development)
3. When it works, Sid says (in Homa's Slack): "Port this to my portfolio"
4. Homa extracts — moves Story's details to context.md, makes SKILL.md general
5. Homa notifies Sid: "Lesson-plan-generator is ready for review. Clean version saved to ~/staging/"
6. Sid copies it to Cosmo (or pulls via shared folder/git)
7. Cosmo reviews, pushes to portfolio, publishes
8. Sid writes a LinkedIn post about it. Parents go wild.

### Journey 3: Client engagement produces a portable skill

1. Sid builds playlist-analyzer for Client X
2. Works great. Sid realizes the core workflow is general.
3. Sid tells Client X's agent: "Extract the general version"
4. Agent strips client references, saves clean version
5. Sid copies to Cosmo
6. Cosmo pushes to portfolio, publishes
7. Client keeps their customized version. No conflict.

### Journey 4: Stranger buys a skill

1. Alex sees Sid's LinkedIn post about the playlist analyzer
2. **Free path:** `openclaw skills install playlist-analyzer` → creates context.md → works
3. **Paid path:** Buys on BuySkills.ai for $19 → downloads → adds context.md → works
4. **Premium path:** Books a consulting call ($500) → Sid builds custom context.md

### Journey 5: New environment setup

1. Sid starts a new consulting engagement
2. First thing: install sid-skills-system
   - For OpenClaw: `openclaw skills install sid-skills-system`
   - For Claude Code: copy SKILL.md to `.claude/skills/sid-skills-system/`
   - For any agent: put SKILL.md where the agent reads skills
3. Create context.md describing this environment
4. The agent now knows how to build skills that fit Sid's ecosystem

---

## The Compound Flywheel

```
ANY ENVIRONMENT                  SID'S PORTFOLIO              DISTRIBUTION
(Cosmo, Homa, Client)           (GitHub + ClawHub)            (Audience + Revenue)
                                                               
  Build skill ──────────►  Extract general version ──────► Free: ClawHub, skills.sh
                                    │                      Paid: BuySkills ($19)
  Add context.md ◄────── Install from portfolio           Premium: Consulting ($500)
  (personalize)                     │                              │
       │                            │                              │
       ▼                            ▼                              ▼
  Skill works great ─────► Content about the skill ──────► Audience grows
       │                   (LinkedIn, X, carousels)               │
       │                                                          │
       └──────────────────── Feedback improves skill ◄────────────┘
```

Every loop makes the next loop faster:
- More skills → more content → bigger audience → more clients
- More clients → more skills → better portfolio → more installs
- Better skills → Cosmo/Homa work better → Sid has more time → builds more

---

## What Exists Now

| Item | Status |
|------|--------|
| context.md convention | ✅ Built and proven (social-slides) |
| lint-for-publish.sh | ✅ Built and tested |
| publish.sh | ✅ Built and tested |
| social-slides in workspace | ✅ Moved from bundled, working with context.md |
| sid-skills-system meta-skill | ✅ Built (installed in Cosmo) |
| Git-tracked workspace/skills/ | ✅ Initialized with commits |
| sidneyswift/skills GitHub repo | ❌ Needs to be created |
| Portfolio repo cloned locally | ❌ After GitHub repo exists |
| ClawHub authentication | ❌ `clawhub login` not yet run |
| sid-skills-system on Homa | ❌ Needs manual install by Sid |
| Paid marketplace accounts | ❌ Future — BuySkills.ai, PaperclipSkills |
| skill-porter script | ❌ One-command extract → push → publish |

## Next Steps (Ordered)

1. **Create `github.com/sidneyswift/skills`** — Sid needs to create this repo on GitHub
2. **Clone locally** — `git clone` to ~/Documents/projects/sid-skills/
3. **Push initial skills** — social-slides + sid-skills-system
4. **`clawhub login`** — authenticate for publishing
5. **First publish** — social-slides to ClawHub (proof of concept)
6. **Install sid-skills-system on Homa** — Sid runs this on the Homa machine
7. **Create Homa's context.md** — environment-specific config
8. **Build content-engine skill** — next skill in the pipeline

---

*This document is the living architecture reference. Updated as the system evolves.*
