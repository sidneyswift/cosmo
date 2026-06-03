# REVIEW.md — Cosmo's Review & Approval System

## Purpose

Nothing goes live without Sid's approval. `#cosmo-review` (C0B6XMYK5CZ) is the staging environment. All work that produces an external-facing artifact queues here before it ships.

## What Requires Review

| Category | Example | Review Card Includes |
|---|---|---|
| Code deploys | Marketing site changes, API updates | Branch name, Vercel preview URL, diff summary |
| Content | LinkedIn posts, carousels, tweets | Full copy + images inline |
| Wiki updates | New concept/entity pages | Summary + link to file |
| Config changes | DNS, env vars, integrations | What changed + why |
| Purchases/signups | New API keys, paid services | Cost + purpose |
| Public comms | Emails, DMs on Sid's behalf | Full text |

## What Does NOT Require Review

- Internal workspace changes (memory files, TOOLS.md, AGENTS.md)
- Reading/researching/exploring
- Git commits to feature branches (not main/prod)
- Responding in Slack conversations where Sid is actively chatting
- Background maintenance (cron checks, heartbeats)

## Review Card Format

Every item posted to `#cosmo-review` follows this structure:

```
🔍 *[CATEGORY] — Short title*

*What:* One-sentence description of the work
*Why:* Context / what triggered this

*Preview:*
[Vercel preview URL / inline content / screenshot description]

*Diff:* [if code — summary of changes, not full diff]

👍 = approve (I push/publish immediately)
💬 = reply in thread with feedback (I revise and repost)
👎 = scrap it
⏸️ = hold, don't work on this category until we talk
```

## Review States

| Emoji | Meaning | My Action |
|---|---|---|
| 👍 / ✅ | Approved | Push to prod / publish immediately |
| 💬 (thread reply) | Feedback | Revise based on notes, repost new version |
| 👎 | Rejected | Scrap, move on |
| ⏸️ | Hold | Stop work in this category, wait for discussion |
| No reaction | Pending | Do NOT push. Work on other things. |

## Rules

1. *One review card per artifact.* Don't batch unrelated work into one message.
2. *No localhost URLs.* Sid reviews from his phone. Use Vercel preview deploys, inline content, or public URLs only.
3. *Block on pending reviews.* If a review is pending in a category, don't stack more work in that category. Move to something else.
4. *Revisions get new cards.* After feedback, post a fresh review card (not an edit) so the thread stays clean.
5. *Time-sensitive items get flagged.* If something has a deadline, add ⏰ and the deadline to the card.
6. *Link to artifacts.* Every card links to the actual thing — PR, preview URL, wiki page, Slack thread.

## Watching for Approvals

I check #cosmo-review for reactions/replies:
- During heartbeats (every ~30 min)
- At the start of each session
- Before starting new work in a category with pending reviews

## Integration with Existing Workflows

### Content Drafts → #cosmo-review (Daily Morning Post)
Content drafts now flow through #cosmo-review, not #cosmo-content.
- **Morning cron** (`morning-post`, 7:45 AM ET): picks the best ready draft with thumbnail and posts it here
- **Reaction watcher** (every heartbeat): checks for 👍/👎/thread replies
- 👍 → auto-schedules via Postiz (approve.js)
- 👎 → rejects the draft
- Thread reply → marks as revising, runs regenerate.js with feedback, re-posts when ready
- Script: `~/Documents/projects/content-engine/scripts/slack-review.js`

### #cosmo-content (C0B2J7JBL6A)
Daily status digest channel. Not used for draft review.
#cosmo-review handles ALL approval workflows — content, code, config, wiki, infra, etc.

### #cosmo-wiki (C0B22GEMRNH)  
Wiki processing from drops doesn't need pre-approval (it's internal).
But significant wiki reorganizations or new frameworks get a review card.

## How I Check Reviews

Using OpenClaw's Slack integration:
- `readMessages` on C0B6XMYK5CZ to see recent cards
- `reactions` on specific message timestamps to check approval status
- Thread replies via Slack API for feedback

## Emergency Override

If something is genuinely urgent (security fix, breaking bug in prod), I can push first and post a review card after with 🚨 prefix. This should be extremely rare.
