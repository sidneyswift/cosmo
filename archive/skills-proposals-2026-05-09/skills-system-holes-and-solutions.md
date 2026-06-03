# Skills System: Holes, Priorities, and Solutions

## Holes Reorganized by Priority

### P0 — Architectural (these block everything else)

**Hole A: Override ≠ Inheritance**
OpenClaw's precedence system *replaces* skills by name — it doesn't compose them. If workspace has `social-slides`, it completely shadows the bundled/shared version. No merge. No "add my branding on top." This means maintaining two versions (general + personal) requires manually syncing any improvements between them. Every bug fix, every new feature has to be applied twice.

**Hole B: No Configuration Layer**
Skills have no native config/parameterization system. There's no `skills.entries.social-slides.config.brand = "recoupable"` that the skill can read at runtime. The only way to customize behavior is to fork the entire skill. This is the root cause of Hole A — if skills could read config, you wouldn't need overrides for personalization.

**Hole C: Ownership Ambiguity**
`social-slides` lives in `/opt/homebrew/lib/node_modules/openclaw/skills/` (bundled). We built it, but it ships as if it's an OpenClaw platform skill. If OpenClaw updates, it could get overwritten. If we want to publish it, where does it live? The boundary between "our skill" and "the platform's skill" has no clear convention.

### P1 — Process (these determine if the system works in practice)

**Hole D: Extraction Never Happens**
"Build for Sid, then generalize later" sounds good but the extraction step has no structural incentive. It's pure discipline. Without something forcing it, personal skills never become general skills. Monthly calendar reminders aren't architecture.

**Hole E: Accidental Context Leaks**
Personal paths, names, branding, API references in published skills. There's no pre-publish validation that catches `Sidney`, `/Users/recoupable/`, `Recoupable`, or personal 1Password references in a skill meant to be general.

**Hole F: Prioritization (What to Build)**
The proposal lists 5 skills to build. That's months of work. No framework for deciding which compounds fastest. Building the wrong thing first wastes the most valuable resource: Sid's attention and iteration cycles.

### P2 — Scale (these matter once the system is working)

**Hole G: Token Bloat**
Every skill costs ~24+ tokens per turn just for metadata. 30 skills = ~720 baseline tokens. If we double the skill count with personal overrides, that's overhead on every single message. No pruning or rotation strategy exists.

**Hole H: Version Control & Publishing**
No git strategy for skills. No changelog discipline. ClawHub publishing is untested. No CI/CD for skills.

**Hole I: Wiki Integration is Vague**
"Track skills in the wiki" has no defined schema, no automation, and will become stale documentation.

---

## Solutions by Hole

### Hole A: Override ≠ Inheritance

**Solution A1: Config-Driven Personalization (Build on OpenClaw)**
Instead of overriding skills, use OpenClaw's existing `skills.entries.<name>.config` to pass personalization data. Modify skills to read config values for things like brand name, logo path, color scheme, audience, data paths. The skill stays general; the config makes it personal.

*Pros:* Uses existing OpenClaw primitives. One copy of the skill. Updates flow automatically.
*Cons:* Requires skills to be written config-aware from the start. Limited by what you can express in JSON config. `skills.entries.config` is a "custom bag" — there's no schema enforcement or runtime injection into skill context. The skill's SKILL.md can't dynamically read config; it would need to instruct Cosmo to check config at runtime.

**Solution A2: Wrapper Skills (Build Alongside OpenClaw)**
Create thin workspace skills that don't override the general skill — they *call* it with context. Example: `sid-slides` (workspace) is a skill that says "Use the `social-slides` skill but with these parameters: brand=Recoupable, logo=path/to/logo, template=elegant-founder, handle=@sidneyswift." The general skill has a different name and stays untouched.

*Pros:* Clean separation. No shadowing. General skill gets updates automatically. Wrapper is tiny (just context injection). Easy to audit what's personal vs general.
*Cons:* Two skill names in context (extra tokens). User has to know which to invoke (or Cosmo needs to route). Wrapper pattern isn't a standard convention.

**Solution A3: Git Branch Strategy (Build Separately)**
Maintain skills in a dedicated git repo with two branches: `main` (general, publishable) and `sid` (personal overrides). Cherry-pick improvements between branches. Deploy `sid` branch to workspace, `main` branch to ClawHub.

*Pros:* Full version control. Clear separation. Git handles the merge/diff story.
*Cons:* Manual branch management. Cherry-picking gets messy over time. Requires discipline. Doesn't leverage OpenClaw's architecture at all.

**Solution A4: Template Variables (Propose to OpenClaw / Build Custom)**
Build a thin middleware layer that preprocesses SKILL.md files, replacing `{{brand}}`, `{{logo_path}}`, `{{handle}}` with values from a config file before OpenClaw loads them. Run it as a pre-session hook or watcher.

*Pros:* One source file with variables. Personalization is declarative. Could be open-sourced as its own tool.
*Cons:* Adds build step. SKILL.md files aren't standard anymore. Fragile if OpenClaw changes how it loads skills. Non-standard = no ecosystem support.

### Hole B: No Configuration Layer

**Solution B1: Use skills.entries.config + Runtime Instructions**
Skills already have `skills.entries.<name>.config` in openclaw.json. Write skills that instruct Cosmo to `read the config for this skill` at runtime. The config holds brand, paths, preferences. Skill instructions say "Check skills.entries.social-slides.config for brand overrides."

*Pros:* Already supported. No new systems. Config is in openclaw.json (version-controlled, editable).
*Cons:* Skills can't natively read config — Cosmo has to be told to check it. Adds instruction overhead. Config isn't injected into the skill's context automatically. Relies on Cosmo following instructions correctly every time.

**Solution B2: Context Files Convention**
Establish a convention: every skill can optionally read `<workspace>/skills/<skill-name>/context.md` for personalization. This file is gitignored from published versions. Skill instructions say "If context.md exists in your skill directory, read it first for user-specific overrides."

*Pros:* Simple. File-based. Easy to understand. Gitignore handles the personal/public boundary. Works today with no platform changes.
*Cons:* Convention, not enforcement. Nothing prevents context.md from being published accidentally. Every skill has to include the "check for context.md" instruction.

**Solution B3: Workspace CONTEXT.md (Global)**
Single `<workspace>/CONTEXT.md` or `<workspace>/skills/CONTEXT.md` that all skills can reference for cross-cutting personalization (brand, handle, audience, data paths). Individual skills read this global file rather than per-skill configs.

*Pros:* One file to maintain. All skills get the same personalization. Easy to audit.
*Cons:* Doesn't handle per-skill overrides well. Could get bloated. Skills need to be written to reference it.

### Hole C: Ownership Ambiguity

**Solution C1: Move Our Skills to Workspace**
Move any skill we built (like social-slides) from bundled to workspace. Our skills live in `<workspace>/skills/`, bundled skills are OpenClaw's. Clear boundary.

*Pros:* We own what we own. Updates don't overwrite our work. Clear mental model.
*Cons:* Lose automatic bundled updates (though for skills we wrote, there are none). Need to manually track if OpenClaw adds features to the bundled version (if one exists).

**Solution C2: Dedicated Skills Repo**
Create `~/Documents/projects/cosmo-skills/` (or a mono submodule). All skills we build or customize live here. Symlink or use `skills.load.extraDirs` to make them visible to OpenClaw.

*Pros:* Git-controlled. Publishable. Separate from workspace config. Can hold both general and personal versions in different directories.
*Cons:* Another repo to maintain. Symlinks can be fragile. Need to remember to commit.

**Solution C3: Skills Monorepo with Namespacing**
Structure: `cosmo-skills/general/<skill-name>/` and `cosmo-skills/personal/<skill-name>/`. `extraDirs` points to `general/` at low precedence; workspace symlinks or copies from `personal/` at high precedence. Publish only from `general/`.

*Pros:* Everything in one place. Clear namespace for what's publishable. Git diff tells you exactly what's personal.
*Cons:* More complex directory structure. Still manual coordination between personal and general.

### Hole D: Extraction Never Happens

**Solution D1: Build General First, Personalize Second**
Flip the order. Build the general skill first (no personal references). Then create a thin workspace wrapper or context.md that personalizes it. Extraction isn't a step because the general version exists from day one.

*Pros:* Eliminates the extraction step entirely. Publishable artifact exists immediately.
*Cons:* Slower to start (abstraction tax upfront). Might over-engineer before knowing what works. Against the "build for Sid first" instinct.

**Solution D2: Extraction as a Skill (Automate It)**
Build a "skill-extractor" skill/script that takes a personal skill directory and: (1) scans for personal references (Sidney, Recoupable, /Users/recoupable, etc.), (2) replaces them with config variables or removes them, (3) outputs a general version to a separate directory, (4) generates a diff report of what was changed.

*Pros:* Automation removes the discipline requirement. Can run on any skill. Auditable output.
*Cons:* Won't catch semantic personalization (advice that only makes sense for music industry). Still needs human review. Build cost.

**Solution D3: Publish Trigger in Review Workflow**
Add a step to the existing #cosmo-review workflow: when a skill reaches maturity (defined as: used successfully 10+ times, no major changes in 2 weeks), I flag it in the review channel with a "ready to publish?" card. Sid approves or defers. This puts extraction on a natural cadence tied to actual usage.

*Pros:* Leverages existing workflow. Tied to real signals (usage count, stability). Human judgment on timing.
*Cons:* Still requires someone to do the extraction work. "Ready to publish?" is easy to defer forever.

### Hole E: Accidental Context Leaks

**Solution E1: Pre-Publish Lint Script**
Build a script that scans a skill directory for: personal names, personal paths, 1Password references, API keys, email addresses, specific brand names. Run before any `clawhub publish`. Block if found.

*Pros:* Automated. Catches obvious leaks. Can be part of CI.
*Cons:* False positives (what if the skill is legitimately about Recoupable?). Won't catch subtle context (audience assumptions, industry-specific advice that reveals the user).

**Solution E2: .skillignore + Separate Directories**
Convention: personal files go in `personal/` subdirectory within each skill. `.skillignore` excludes `personal/` from publishing. Similar to .gitignore for publishing.

*Pros:* Physical separation of personal files. Publishing tool respects ignore patterns.
*Cons:* Need to ensure clawhub/packaging respects .skillignore. Personal content in SKILL.md itself isn't caught.

**Solution E3: Two-Directory Architecture + Automated Diff**
General skills in one directory, personal skills in another. A script runs `diff -r` between them and flags any personal content that leaked into the general directory. CI-like check before publishing.

*Pros:* Clear physical boundary. Diff catches drift.
*Cons:* Two copies = maintenance burden. Diff noise from intentional differences.

### Hole F: Prioritization

**Solution F1: Compound Score Matrix**
Score each potential skill on: (1) How often Sid would use it daily, (2) How much manual time it replaces, (3) How unique/novel it is (distribution potential), (4) How much existing infrastructure it can leverage. Pick the highest score.

**Solution F2: One Skill at a Time, Ship Then Decide**
Don't prioritize a backlog. Pick the one thing that feels most painful right now, build it, ship it, use it for 2 weeks. Then pick the next one. Backlog ordering is speculative; pain is real.

**Solution F3: Split Build vs Publish Priorities**
Build priority = what helps Sid most (personal). Publish priority = what has the broadest audience appeal (general). These might be different skills. Build one, publish a different one that's already mature.

### Hole G: Token Bloat

**Solution G1: Skill Allowlists Per Agent**
Use `agents.defaults.skills` or `agents.list[].skills` to restrict which skills load per context. Main session gets all skills. Content-focused sessions get only content skills. Research sessions get only research skills.

**Solution G2: Disable-Model-Invocation for Niche Skills**
Set `disable-model-invocation: true` in frontmatter for skills that should only trigger via explicit `/command`. They exist but don't cost prompt tokens unless invoked.

**Solution G3: Skill Rotation via Heartbeat**
Dynamically enable/disable skills based on time of day or current project. Morning = email/calendar skills. Afternoon = coding/content skills. Use heartbeat to toggle `skills.entries.<name>.enabled`.

### Hole H: Version Control & Publishing

**Solution H1: Skills Git Repo + ClawHub CI**
Dedicated repo. Each skill is a directory. GitHub Actions runs lint + package + publish on merge to main. Version bumps via conventional commits.

**Solution H2: Manual Publish with Checklist**
No automation. When ready, run through a checklist (lint, review, test, publish). Document the checklist in the wiki. Good enough for 2-3 skills.

### Hole I: Wiki Integration

**Solution I1: Auto-Generated Skill Registry Page**
Script that scans installed skills and generates `wiki/concepts/skill-registry.md` with: name, source (bundled/workspace/clawhub), version, last modified, personal/general status. Runs on heartbeat.

**Solution I2: Manual Wiki Pages, Linked from Skills**
Each skill's SKILL.md links to its wiki page. Wiki page links back. Manual but connected.

---

## Recommended Architecture (Combining Solutions)

This section is intentionally left as options, not a recommendation — because the right combination depends on which tradeoffs Sid wants to accept. The key decision points:

1. **Build general-first or personal-first?** (D1 vs D2/D3)
2. **Config-driven or wrapper-driven personalization?** (A1/B2 vs A2)
3. **Dedicated repo or workspace-only?** (C2/C3 vs C1)
4. **Automated extraction or manual?** (D2 vs D3)

These four decisions shape everything else.
