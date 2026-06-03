# MEMORY.md — Cosmo's Long-Term Memory

## People

### Sid (my human)
- Founder & CEO of Recoup (renamed from Recoupable May 2026). Self-funded, $0 salary. Builder.
- Direct communicator. Says what he means, doesn't waste words.
- Timezone: America/New_York (EDT)
- Prefers autonomy — "you do you" energy.
- Building AI infrastructure for the music business + running his own label to prove it works.
- **Decision-making DNA** (deep-mined from swift-labs, May 2026):
  - YAGNI as religion: declare conventions early, defer implementation until pressure is exercised
  - Concrete promotion triggers > vague "later" — every deferred idea has a specific condition that justifies building it
  - Evidence over intuition, but intuition starts everything — captures half-formed ideas then demands empirical validation
  - Pushes back hard on framing (wrong audience, wrong packaging) then trusts the process once framing is right
  - Kills with a lesson, not shame — dead experiments stay as evidence
  - Honest framing > optimistic framing — would rather scope a claim correctly than oversell
  - Research before build — full research pass before implementing anything structural
  - Writing IS thinking — long documentation entries are the thinking process itself, not a byproduct
  - Names and frames matter — renames things when framing drifts, catches silent semantic narrowing
  - Compound-knowledge bet — believes structured written context is a force multiplier for humans and AI
  - Multiple graduation surfaces — thinks "where could this go?" not "what is this for?"
  - Sovereignty model — doesn't impose uniformity, each project/team is its own world
- **GitHub accounts:** `sidneyswift` (personal, primary), `recoupableorg` (Recoup org), `sswiftdrtv` (Flex/DRTV work)
- Full analysis: brain page `people/sidney-swift-operating-style`

## About Me
- **Name:** Cosmo 🌀
- **Born:** 2026-04-11
- **Vibe:** Sharp, resourceful, dry. Opinions welcome.

## Sid's Brain (GBrain)
- **What:** Personal knowledge brain covering Sid's entire world — products, people, decisions, research, strategies
- **Location:** Markdown at `~/Documents/wiki/`, database at `~/.gbrain/brain.pglite`
- **GBrain version:** v0.37.0.0 at `~/gbrain` (updated 2026-05-20 from v0.35.1.0 — 8 releases caught up)
- **Embeddings:** OpenAI text-embedding-3-large via Vercel AI Gateway
- **Env setup:** `source ~/.gbrain/env.sh` before any gbrain commands
- **Live sync cron:** Every 30 min (`brain-sync`)
- **Structure:** RESOLVER.md decision tree, MECE directories (people/, companies/, products/, decisions/, meetings/, concepts/, entities/, sources/, comparisons/, ideas/, inbox/)
- **Schema:** Two-layer pages (compiled truth above ---, timeline below), YAML frontmatter required
- **Skills:** 42 GBrain skills installed (ingest, enrich, query, meeting-ingestion, signal-detector, etc.)
- **Current stats:** ~751 pages, 100% embedding coverage (as of May 30)
- **Doctor score:** 55/100 (May 30) — DB checks all passing, schema v78. Resolver fixed: 18 unreachable skills added to AGENTS.md skillpack table + 12 MECE_GAP skills got triggers. 0 errors now, 59 advisory warnings remaining.
- **Git archaeology complete:** All 10 mono submodules fully analyzed (api, database, chat, open-agents, plugins, marketing, gtm, admin, strategy, bash). Detailed evolution pages in wiki/products/recoup/.
- **Key principle:** Brain-first lookup on every response. Check brain before external APIs.
- **Content guardrails:** `CONTENT_GUARDRAILS.md` in wiki root. All brain pages have `visibility` field (internal/anonymized/public). Default = internal. Never cite brain data in public content without checking visibility. See guardrails doc before generating any LinkedIn/X/blog content.
- **Obsidian:** Browse at `~/Documents/wiki/` — graph view shows connections

## Content Pipeline Architecture
- **QA Judge** (`scripts/qa-judge.js`) sits between writer/critic and Sid's dashboard
- Flow: Writer (Sonnet) → Critic (GPT-4o score) → QA Judge (GPT-4o eval + rewrite loop) → Thumbnails → Dashboard
- Judge loads: full copywriting skill, anti-slop rules, format rules, guardrails.json, principles.json, learned rules
- Judge verdicts: pass / rewrite (with notes to rewriter) / reject
- Sid's feedback on dashboard → extracted as general rule → saved to guardrails.json → judge gets smarter
- **Local SQLite = source of truth.** Supabase is a mirror for the dashboard, NOT a dependency. Core pipeline (generate, review, thumbnail, schedule) works offline. Fixed 2026-05-20.
- Supabase sync fixed 2026-05-20: OP token loading added to cron-daemon.js and nightly-engine.js
- **Never schedule posts directly to Postiz.** All content must go through pipeline: engine DB → QA Judge → thumbnail → approve.js → Postiz. Bypassing = no judge, no thumbnail, no tracking. Learned hard way 2026-05-21 when batch-scheduled replacements went out bare.
- Nightly value cron: 1 AM ET, reads strategy, identifies bottleneck, builds highest-leverage thing, reports to Sid's DM
- Janitor sweep cron: 2:30 AM ET, cleanup + infra tests + bug detection
- **Discovery ideas:** Purged from 2,327 → 111 keeps (May 21). 5 buckets: Sid's stories, builder insights, music×AI, agent ops, BYOA strategy. Manual human review > automated filtering for quality.

### Event-Driven Slack Review Loop (May 28)
- Rebuilt content pipeline from batch-mode to event-driven (May 28)
- Architecture: always one post waiting in #cosmo-review. Sid approves/rejects/gives feedback via Slack reactions.
- `slack-review.js watch` handles everything: 👍 → approve + schedule + auto-replenish next draft. 👎 → reject + replenish. Thread reply → revise + re-post.
- Morning-post cron (7:45 AM) is seed/fallback only — posts if nothing pending
- Nightly engine still runs for batch generation but no longer auto-schedules
- Approved posts now schedule to next open day on LinkedIn calendar (stacking)
- Dashboard: added unschedule button (May 27), calendar tab (May 28), delete endpoint (May 27)

### Content Quality Purge (May 26)
- Sid asked to audit all approved posts rigorously. Killed 46/72 ready drafts, kept 26.
- Identified 3 pipeline quality problems: (1) no thesis-level dedup (same thesis from different source ideas), (2) writer prompt too permissive (no Sid-angle enforcement), (3) QA judge not catching derivative/lazy takes
- Fixed all 3: thesis dedup in generate, Sid-angle requirements in writer prompt, QA judge upgraded

## Content Rules (Non-Negotiable)
- **THUMBNAILS ONLY — NO SLIDES.** Every post gets ONE single thumbnail image. Never generate multi-slide carousels, slide decks, or numbered slide sets. One thumbnail per post, period.
- **Pipeline (v16, locked 2026-05-19):** gpt-image-2 → depth-thumbnail.py compositor → Recoup wordmark depth-composited
- **Style: Pixel art anime × Vinyl Universe** — dreamy pastel clouds, 8-bit anime aesthetic, surreal music/data/culture environments, tiny figures dwarfed by massive creation
- **Composition rule:** Top 60% = open sky/clouds ONLY. All subjects/terrain in bottom 40%. Nothing crosses the wordmark zone.
- **Logo:** Dark (lightmode) logo for pastel/light scenes, white (darkmode) logo for dark/night scenes. Full logo with icon, not text-only.
- **ALWAYS CHECK YOUR WORK.** Zoom in on every letter before claiming a thumbnail is done. Sid called this out — never say "fixed" without verifying every letter reads clean.
- Record Planet is the reference thumbnail. The winning formula: cosmic-scale environments made of sound/data/vinyl + tiny figure + pixel anime clouds.
- This was rewritten on 2026-05-14, reinforced 2026-05-16, completely overhauled 2026-05-19.

## Recoup (formerly Recoupable)
- Renamed to "Recoup" on 2026-05-12. All references should use "Recoup" going forward.
- Monorepo: `~/Documents/projects/mono/` (git submodules)
- Strategy repo: `~/Documents/projects/mono/strategy/` — source of truth for all business specifics
- For details on customers, financials, deals, roster, roadmap — read from the strategy repo directly, don't duplicate here.

### Team
- **Sweets** — Sid's engineer. Owns backend (api, database, tasks submodules). SRP/DRY, code approval required.
- Non-backend submodules (skills, marketplace, marketing, GTM, strategy) can ship without Sweets' approval. Still open PRs.
- **docs submodule = source of truth** — docs-driven development.

### Product Strategy (as of May 2026)
- Moving from chat app → BYOA (Bring Your Own Agent). Users bring Claude Cowork / Codex / Cursor / etc.
- Product = opinionated domain-specific skills & plugins for the music business, distributed through marketplace.
- Monetization pipeline: skill/plugin → prove value with customers → turn key operations into Recoup API endpoints → charge for usage.
- Example: Chartmetric skill (local Python) → proven valuable → Sweets built Recoup API endpoints → revenue.
- Flex Seal (Sid's DRTV org, NOT a Recoup customer) going to Claude Desktop (Cowork & Code) → triggered BYOA-first strategy.
- **Flex Seal Firewall (approved 2026-05-17):** Full transparency internally, hard wall on public output. Brain pages tagged `sensitivity: flex-firewall`. Never name-drop Flex in content. Anonymize transferable patterns only. See CONTENT_GUARDRAILS.md for full rules.
- catalog-deals plugin demo got great customer feedback: drop a deal room folder → AI does the rest.

## Swift Labs (Sid's Research Lab)
- **What:** Personal research lab — monorepo of experiments, forks, half-built ideas
- **Location:** `~/Documents/projects/swift-labs/`
- **Repo:** `github.com/sidneyswift/swift-labs` (private)
- **Sub-repos:** tribe-viral (Modal brain-encoding service, HTTP API shipped), auto-edit (video re-editing optimization), auto-reason (A/B/AB tournament pattern reference), auto-research (LLM training loop reference)
- **Memory system:** PROGRESS.md (past), IDEAS.md (future), LEARNINGS.md (durable/timeless)
- **Agent skills:** `.agents/skills/` — twelve-labs, tribe-viral (with Flex Cowork .skill package)
- **Key ideas being tracked:** video-gen optimization loop, Claude Managed Agents as substrate, multi-factor virality predictor, content-gap analyzer for Flex
- **Key insight:** Brain-encoded engagement (TRIBE v2) measures intrinsic creative quality but is blind to extrinsic amplifiers (trending audio, cultural moments, distribution velocity)
- **Flex connection:** tribe-viral deployed to Flex Seal's 43 knowledge workers via Cowork .skill package
- **Brain pages:** `products/swift-labs`, `products/tribe-viral`, `products/auto-edit`, `concepts/brain-encoded-engagement`, `people/sidney-swift-operating-style`
- **Ingested:** 2026-05-16. Full analysis of AGENTS.md, IDEAS.md, LEARNINGS.md, PROGRESS.md (505 lines of session logs covering 30+ sessions from Apr-May 2026)
