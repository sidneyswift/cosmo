# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

## 1Password — API Keys & Secrets

All secrets live in the *Agents* vault in 1Password. Pull at runtime with `op read`.

| Env Variable | 1Password Path | Notes |
|---|---|---|
| `POSTIZ_API_KEY` | `op://Agents/Postiz API Key/credential` | Social media posting (LinkedIn, X, YouTube) via Postiz CLI |
| `APIFY_TOKEN` | `op://Agents/Apify API Key/credential` | Web scraping, data extraction, automation. Docs: https://docs.apify.com/ |
| `ATTIO_API_KEY` | `op://Agents/Attio API Key/credential` | CRM platform. Docs: https://developers.attio.com/ |
| `GRANOLA_PERSONAL_API_KEY` | `op://Agents/GRANOLA_PERSONAL_API_KEY/credential` | Granola meeting notes. Docs: https://docs.granola.ai/ |
| (X API Key) | `op://Agents/X API Key` | X/Twitter API credentials (see notes field for details) |
| (Cosmo Supabase) | `op://Agents/Cosmo Supabase Project` | Supabase project credentials for Cosmo (secure note) |
| (Instagram) | `op://Agents/Instagram/username`, `.../password` | Instagram login credentials |
| (GitHub) | `op://Agents/GitHub/username`, `.../password` | GitHub login credentials |
| `X_API_*` | `op://Agents/X API Key/notesPlain` | X (Twitter) API keys — consumer, bearer, access token. Stored as key=value pairs in notes field |
| `ATTIO_API_KEY` | `op://Agents/Attio API Key/credential` | Attio CRM API. Docs: https://developers.attio.com/ |
| `GRANOLA_PERSONAL_API_KEY` | `op://Agents/GRANOLA_PERSONAL_API_KEY/credential` | Granola meeting notes API |
| (Tribe) | `op://Agents/Tribe API Key/credential` | Community platform (create/manage online communities, Q&A, discussions). Docs: https://apitracker.io/a/tribe-so |
| (Service Account) | `op://Agents/Service Account Auth Token: Production/credential` | Production service account token |
| (ScrapeCreators) | `op://Agents/ScrapeCreators API Key/credential` | Social media scraping API (TikTok, Instagram, YouTube, Facebook, X). Docs: https://scrapecreators.com |
| (Twelve Labs) | `op://Agents/Twelve Labs API Key/credential` | Video understanding/intelligence API (search, analyze, generate from video). Docs: https://docs.twelvelabs.io/ | SDK: https://github.com/twelvelabs-io/twelvelabs-python
| (Vercel) | `op://Agents/Vercel Cosmo Token/credential` | Vercel API token for Cosmo. Docs: https://vercel.com/docs/rest-api
| (GitHub PAT) | `op://Agents/GitHub Personal Access Token/token` | GitHub Personal Access Token (fine-grained). Settings: https://github.com/settings/personal-access-tokens
| (Google OAuth) | `op://Agents/Google Workspace OAuth Client` | Google Workspace OAuth client credentials (client_id, client_secret, project_id). For Gmail, Calendar, Drive, etc. Docs: https://developers.google.com/identity
| (OpenClaw Gateway) | `op://Agents/OpenClaw Gateway Token/credential` | OpenClaw gateway auth token
| (Vercel AI Gateway) | `op://Agents/Vercel AI Gateway Key/credential` | Vercel AI Gateway API key for model routing
| (Cosmo Slack) | `op://Agents/Cosmo Slack Tokens` | Slack bot_token + app_token for Cosmo app
| (Parallel Search) | `op://Agents/Parallel Search MCP Key/credential` | Parallel Search MCP server API key
| (Cosmo Snapshot) | `op://Agents/Cosmo Snapshot Key/password` | Cosmo snapshot/backup key
| (GitHub PAT RW) | `op://Agents/GitHub PAT sidneyswift all-repos-rw/token` | GitHub PAT for sidneyswift with all-repos read-write scope

Usage pattern:
```bash
POSTIZ_API_KEY=$(op read "op://Agents/Postiz API Key/credential") postiz <command>
```

## Postiz — Social Media

Connected integrations:
- YouTube: `cmmcfame3050xmh0y3u39c90l` (@recoupableai)
- LinkedIn: `cmmcfb8eo0510mh0ya6jvagoy` (sidneyswift)
- X: `cmmcf9j0104ocpa0y02pjlmfe` (sidneyswift)

---

Add whatever helps you do your job. This is your cheat sheet.

### Recoup Design System
- Location: `~/Documents/projects/mono/marketing/design/`
- Full design spec: `design/DESIGN.md` — colors, typography, components, spacing, motion
- Brand lore + worldbuilding: `design/lore/lore.txt`
- Illustration style guide: `design/illustrations/styleguide-illustrations.txt`
- Logos: `design/logos/` — icon-darkmode.svg, logo-darkmode.svg, text-darkmode.svg (+ lightmode variants, PNGs)
- Illustrations: `design/illustrations/` — nightsky.png, field.png, sky.png, market.jpeg
- Fonts: `design/fonts/` — GeistMono (variable + ttf weights)
- Social banners: `design/social/` — LinkedIn, YouTube banners
- Key design rules: Geist Pixel Square for headlines, Plus Jakarta Sans for UI, Geist Sans for body, Instrument Serif for editorial. `#0a0a0a` dark mode bg. Shadow-as-border (not CSS border). No warm colors in UI chrome.

### Research Wiki
- Location: `~/Documents/wiki/`
- Browse in Obsidian, maintained by Cosmo
- Git initialized for version history
- Schema: `~/Documents/wiki/AGENTS.md` — full ingest/query/lint workflows

### #cosmo-review Channel (C0B6XMYK5CZ)
Staging/approval queue. All external-facing work gets posted here before going live.
See `REVIEW.md` for full workflow.
- 👍 = approved, push/publish
- 💬 thread reply = feedback, revise
- 👎 = scrap
- ⏸️ = hold category

### #cosmo-content Channel (C0B2J7JBL6A)
Daily status digest channel. No longer used for individual draft posting or triage.

*Flow:*
- `npm run daily-digest` posts a daily status update at 8 AM ET
- Shows: pipeline stats, top performers, agent activity (last 24h), pending work, dashboard link
- All draft review/approval happens in the <https://content-dashboard-cosmo-agent.vercel.app|Content Dashboard>

*Cron:* `daily-digest` runs at 8:00 AM ET via cron-daemon.js. See also pulse (6 AM), perf-check (8 PM).

### #cosmo-wiki Channel (C0B22GEMRNH)
Sid drops links, content, or topics here → I process them into the wiki.

*Flow when something lands in #cosmo-wiki:*
1. Identify what it is (tweet, article, repo, etc.)
2. Fetch full content — tweets via `xurl --auth oauth1 read <ID>`, articles via `web_fetch`, repos via `gh`
3. Save raw source to `~/Documents/wiki/raw/{type}/`
4. Create source summary in `wiki/sources/`
5. Create/update entity + concept pages in `wiki/entities/` and `wiki/concepts/`
6. Update `wiki/index.md` and append to `wiki/log.md`
7. Reply in-thread with a concise summary + key takeaways

*Tools by content type:*
- Tweet links → `xurl` (extract post ID from URL, read via OAuth1)
- Article/blog links → `web_fetch` (markdown extraction)
- GitHub repos → `gh` CLI or `web_fetch`
- X articles (x.com/i/article/...) → `web_fetch` the linked URL from tweet entities
- Bare text/ideas → straight to wiki as concept or entity page

### #homa Channel (C0BF3QUABDH)
**Project channel for `homa`.** Any message here is about the homa project — assume it without asking.
- Repo: `github.com/sidneyswift/homa` (private) → local clone at `~/projects/homa`
- For coding tasks landing in this channel, resolve the repo to `~/projects/homa` automatically (see AGENTS.md "Resolve the repo").
- Commits in this repo are authored as `Cosmo <cosmo@recoupable.com>`; pushes go out via the `sidneyswift` gh account.
- Weekly digest from homa-feedback/homa-inspo posts here every Sunday 10 AM ET

### #homa-feedback Channel (C0BHTC78R1B)
**Product feedback channel for Aless and Carolyng.** No mention required — I watch all messages.
- Bugs, worksheet critiques, feature requests, account issues
- I act as product manager: triage, implement, merge, deploy, THEN reply
- Content/curriculum issues → flag for Sid in weekly digest
- All feedback logged to `~/projects/homa/.cosmo/feedback-log.md`
- Updates taste model at `~/projects/homa/.cosmo/homa-taste.md`

*Feedback response flow (founder ruling 2026-07-17):*
1. Feedback lands → assess: is it clear and scoped, or vague/large?
2. If *vague or large*: ask ONE clarifying question in-thread before implementing. Examples: "do you mean X or Y?", "which page is this on?", "what should it look like instead?"
3. If *clear and scoped*: implement silently. No "I'm on it" reply.
4. Push branch → open PR → wait for CI green → merge to main → Vercel deploys to prod.
5. *Only reply in-thread once the fix is live on prod.* Aless and Carolyng are non-technical — they don't know what a PR URL is. They expect the real app to reflect their feedback.
6. Reply should confirm what changed, in plain language. No branch names, no PR links, no technical jargon.

*Why:* The users on this channel will check the live app after getting a reply. If the fix isn't deployed yet, they'll think it didn't work. So: deploy first, reply second.

### #homa-inspo Channel (C0BHQDC033M)
**Reference material drops from Aless and Carolyng.** No mention required — I watch all messages.
- TPT worksheets, Etsy finds, curriculum examples, competitor references
- I reply in-thread with structured breakdown: what's valuable about the reference
- Use teach-me-explainer technique: give them vocabulary to express taste
- All references cataloged in `~/projects/homa/.cosmo/inspo-catalog.md`
- Patterns extracted → update taste model → eventually feed materials-studio

### Homa Product Team
- **Aless** — Sid's wife. Non-technical. Homeschool mom and primary Homa user. Co-founder.
- **Carolyng** — Aless's friend. Non-technical. Homeschool mom and Homa user.
- Both are the user feedback loop to PMF. Their taste and feedback is product signal.
- Cosmo acts as PM between them and the codebase: they give feedback, I translate to code.
- Taste model: `~/projects/homa/.cosmo/homa-taste.md` — living spec of their preferences
- Cron: `homa-weekly-digest` — Sundays 10 AM ET, digest to #homa

### #consulting Channel (C0BFC0EC9R7)
**Project channel for `consulting-os`.** Any message here is about the consulting-os project — assume it without asking.
- Repo: `github.com/sidneyswift/consulting-os` (private) → local clone at `~/projects/consulting-os`
- For coding tasks landing in this channel, resolve the repo to `~/projects/consulting-os` automatically (see AGENTS.md "Resolve the repo").
- Commits in this repo are authored as `Cosmo <cosmo@recoupable.com>`; pushes go out via the `sidneyswift` gh account.

### X API (xurl) + Sid's High Signal List
- **High Signal List**: `2053546276210487592` — Sid curates this list with accounts worth monitoring for content discovery. Used by pulse.js as the highest-signal source (1.5x engagement boost).
- List URL: https://x.com/i/lists/2053546276210487592

- Installed: `/opt/homebrew/bin/xurl`
- App: `cosmo-agent` (Free/Pay Per Use tier)
- Auth: OAuth1 as `@DIYhacksdaily` (read-only, for viewing tweets when Sid shares links)
- Credentials: 1Password "X API Key" (Agents vault) + `~/.xurl`
- Usage: `xurl --auth oauth1 read <POST_ID>` to read tweets
- YAML gotcha: oauth1_token needs nested `type: oauth1` + `oauth1:` block (use `xurl auth oauth1 --flags` to set, don't hand-edit)

### Supabase — your database for apps you build
You have a Postgres database. Use it when an app you build needs persistence.
NOT for your own memory/knowledge — that lives in workspace files.

- Project: `kbrjagevyqsskfmdqjup`
- URL: `https://kbrjagevyqsskfmdqjup.supabase.co`
- Credentials: source `. ~/.openclaw/credentials/supabase-env.sh` — pulls
  values from 1Password at runtime via the cosmo-agent service account, no
  copies on disk. Exposes `SUPABASE_URL`, `SUPABASE_DB_URL`, etc.
- Schema-as-code + full README: `~/.openclaw/workspace/db/README.md`
- Convention: one schema per app (`app_<name>`), promote to `shared` schema
  only when 2+ apps need to reference the same data
- 1Password "Cosmo Supabase Project" in Agents vault is the source of truth
  for credentials. Regenerate `supabase.env` from there if anything rotates.

### Attio CRM
- API key in 1Password
- Docs: https://developers.attio.com/

### GBrain
- Personal knowledge brain: `~/gbrain` (CLI), `~/.gbrain/brain.pglite` (database), `~/Documents/wiki/` (markdown)
- Before running gbrain commands: `source ~/.gbrain/env.sh`
- Key commands: `gbrain query "..."`, `gbrain import <dir>`, `gbrain embed --stale`, `gbrain stats`, `gbrain doctor`
- Live sync cron runs every 30 min (brain-sync)
- Vercel AI Gateway provides embeddings (openai:text-embedding-3-large via `base_urls.openai` in config)
- Config: `~/.gbrain/config.json`

### Granola
- Meeting notes API
- API key in 1Password (in `notesPlain` field, NOT `credential`)
- Base URL: `public-api.granola.ai/v1`

### Instagram
- Username: realsidneyswift
- Login credentials in 1Password (Instagram item)

### Tribe
- Community platform (create/manage online communities, Q&A, discussions)
- API key in 1Password: `op://Agents/Tribe API Key/credential`
- Docs: https://apitracker.io/a/tribe-so

### Service Account Auth Token (Production)
- Production service account token in 1Password: `op://Agents/Service Account Auth Token: Production/credential`

### ScrapeCreators
- Social media scraping API (TikTok, Instagram, Threads, Pinterest)
- API key in 1Password: `op://Agents/ScrapeCreators API Key/credential`
- Used by: last30days skill
- Docs: https://scrapecreators.com

### Twelve Labs
- Video understanding/intelligence API (search, analyze, generate from video content)
- API key in 1Password: `op://Agents/Twelve Labs API Key/credential`
- Docs: https://docs.twelvelabs.io/ | SDK: https://github.com/twelvelabs-io/twelvelabs-python

### Vercel
- Vercel CLI token for Cosmo: `op://Agents/Vercel Cosmo Token/credential`
- Account: `sidneysyncstream` (cosmo-agent org)
- Used for: deploying content-dashboard and other projects via `vercel --token`

### X Articles (via Apify)
- X articles (`x.com/i/article/...`) are blocked by web scrapers, the X API, and Firecrawl
- Use Apify actor `fastcrawler~x-twitter-article-to-markdown` with input `{"tweetIds": ["<tweet_id>"]}`
- Returns full article as markdown
- Requires `APIFY_TOKEN` from 1Password