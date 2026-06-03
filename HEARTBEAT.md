# Heartbeat Tasks

## Mono Repo Sync (Daily)
- Run `cd ~/Documents/projects/mono && git pull origin main && git submodule update --remote --merge` at least once per day
- Track last pull time in `memory/heartbeat-state.json` → `lastChecks.monoRepoPull`
- Do this FIRST before any git archaeology work so you're reading current code

## Brain Building (Priority)
Every heartbeat, pick ONE of these and make progress. Rotate through them. Track state in `memory/heartbeat-state.json`.

### Deep Git Archaeology
- Walk each mono repo submodule's git history: `~/Documents/projects/mono/<submodule>`
- Read key commit messages, PR descriptions, and diffs at inflection points
- Update `wiki/products/recoup/timeline.md` with new findings
- Create brain pages for architectural decisions discovered in commit history
- Track progress in heartbeat-state.json: `gitArchaeology.lastSubmodule`, `gitArchaeology.lastCommitProcessed`

### Attio Re-enrichment via GBrain
- Re-process top contacts through `gbrain put` + `gbrain link` for proper graph wiring
- Add typed links between people and their companies
- Web-search Tier 1 contacts for texture (beliefs, what they're building, trajectory)
- Track: `attioEnrichment.lastProcessedIndex`, `attioEnrichment.tier1Complete`

### Marketing & Plugin Repo Research
- Read `~/Documents/projects/mono/marketing/` — understand current website state
- Read marketplace/plugins repos — understand plugin architecture
- Create brain pages for each plugin (catalog-deals, etc.)
- Document the marketplace architecture in the brain

### Customer Research
- From Attio data, identify customer relationships (Rostrum, APG, etc.)
- Research their public presence, recent news, what they're doing with AI
- Enrich their brain pages with web research
- Track: `customerResearch.lastCompanyResearched`

## #cosmo-review Queue Check
- Read recent messages in C0B6XMYK5CZ
- Check reactions on any pending review cards (no 👍/👎/thread reply yet)
- If approved (👍): execute the approved action (push, publish, etc.)
- If feedback (thread reply): pick up revision work
- If rejected (👎): mark as scrapped, move on
- Check every heartbeat

## Content Engine — Event-Driven Slack Review Loop
- ℹ️ Content engine status is now included in the *morning-briefing* cron (7:30 AM ET → #cosmo-chat)
- **Architecture:** Always one post waiting in #cosmo-review. Sid approves/rejects/gives feedback via Slack. No dashboard needed.
- Run `node ~/Documents/projects/content-engine/scripts/slack-review.js watch` every heartbeat
- The `watch` command handles everything:
  - 👍 → approves + schedules via approve.js → Postiz → **immediately generates next draft and posts it**
  - 👎 → rejects → **auto-replenishes queue with next draft**
  - Thread replies → marks as 'revising' + runs regenerate.js → re-posts revised version
  - Empty queue → auto-generates next draft via mini-pipeline (generate → QA → thumbnail → post)
- Morning-post cron (7:45 AM ET) is a seed/fallback only — posts if nothing is pending
- Nightly engine (1 AM) still runs for batch generation but no longer auto-schedules — just posts best draft to Slack
- Script: `~/Documents/projects/content-engine/scripts/slack-review.js`
- Commands: `post-best` (seed), `watch` (event loop), `replenish` (manual generate+post)

## Growth Hacker (Weekly)
- Read `GROWTH-HACKER.md` for current experiments and strategy
- On Fridays: run `node social-analytics/scripts/growth-review.js` and post results to #cosmo-content
- Check if Sid has answered `memory/growth-questionnaire.md` — if yes, process answers into content angles in GROWTH-HACKER.md
- Proactively look for new experiment ideas based on latest data
- Track: `growthHacker.lastReview`, `growthHacker.currentExperiments`

## Self-Improvement Review (~2x/day)
- Read `skills/self-improvement/SKILL.md` for the full protocol
- Check `memory/self-improvement-state.json` → `lastReviewedAt`
- If >6 hours since last review, run a review pass on recent sessions
- Extract skill updates and memory learnings from substantive conversations
- Skip heartbeat/cron sessions (no signal)
- Track: `self-improvement-state.json` updated after each pass

## Session Index Update (~2x/day)
- Run `node ~/.openclaw/workspace/skills/session-search/scripts/index-sessions.mjs --quiet`
- Indexes new/modified session transcripts into the FTS5 search database
- Quick operation — only processes changed files since last run
- Track: last indexed timestamp in the SQLite db itself

## Skill Curator (Weekly)
- Read `skills/skill-curator/SKILL.md` for the full protocol
- Check `memory/skill-curator-state.json` → `lastRunAt`
- If >7 days since last run, execute a curation pass:
  - Phase 1: auto-transition stale/archived skills (time-based, no LLM)
  - Phase 2: consolidation pass (identify prefix clusters, merge into umbrellas)
- Only curates skills with `created_by: self-improvement` in frontmatter
- Backup before mutations: `tar czf memory/skill-backup-$(date +%Y%m%d-%H%M%S).tar.gz skills/`
- Track: `skill-curator-state.json` updated after each run

## 1Password Agents Vault Sync
- Run `op item list --vault Agents --format json` and compare item IDs against `memory/heartbeat-state.json → agentsVaultItems`
- If new items found: update TOOLS.md with the new item's title, `op://Agents/<title>/<field>` path, and docs URL (if present). Read the docs URL to understand the tool. Then update heartbeat-state.json
- Check ~2x/day
