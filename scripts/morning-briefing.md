# Morning Briefing — Prompt Template

This file is read by the `morning-briefing` cron job. It tells Cosmo what to
gather and how to format the daily wake-up message for Sid in #cosmo-chat.

## Data Sources (gather all of these)

### 1. Content Engine — Overnight Pipeline
```bash
cat ~/Documents/projects/content-engine/data/nightly-summary.json
```
Report: discovery results, triage (kept/skipped), POVs generated, drafts
reviewed, slides created, anything scheduled. Flag failures.

Also check the nightly engine log for errors:
```bash
tail -50 ~/Documents/projects/content-engine/data/nightly-engine.log
```
Look for `❌` or `failed` lines and surface them.

### 2. Content Engine — Pipeline Stats
```bash
cd ~/Documents/projects/content-engine && node -e "
import db from './scripts/db.js';
const stats = {
  draftsReady: db.prepare(\"SELECT COUNT(*) as c FROM drafts WHERE status = 'ready'\").get().c,
  draftsRevising: db.prepare(\"SELECT COUNT(*) as c FROM drafts WHERE status = 'revising'\").get().c,
  draftsApproved: db.prepare(\"SELECT COUNT(*) as c FROM drafts WHERE status = 'approved'\").get().c,
  draftsPublished: db.prepare(\"SELECT COUNT(*) as c FROM drafts WHERE status = 'published'\").get().c,
  publishedLast24h: db.prepare(\"SELECT COUNT(*) as c FROM drafts WHERE status = 'published' AND published_at > datetime('now', '-1 day')\").get().c,
  totalIdeas: db.prepare('SELECT COUNT(*) as c FROM ideas').get().c,
  unreviewedIdeas: db.prepare('SELECT COUNT(*) as c FROM ideas WHERE review_decision IS NULL').get().c,
};
console.log(JSON.stringify(stats));
"
```

### 3. Content Performance (last 24h)
```bash
cd ~/Documents/projects/content-engine && node -e "
import db from './scripts/db.js';
const posts = db.prepare(\`
  SELECT pp.likes, pp.comments, pp.shares, pp.views, pp.engagement_rate,
         pp.platform, pp.post_hook as hook
  FROM post_performance pp
  WHERE pp.scraped_at > datetime('now', '-1 day')
  ORDER BY pp.engagement_rate DESC
  LIMIT 5
\`).all();
console.log(JSON.stringify(posts));
"
```

### 4. OpenClaw Cron Jobs — What Ran Overnight
```bash
openclaw cron list
```
Check each job's `Last` and `Status` columns. Report any failures.

### 5. Calendar — Today's Meetings
```bash
gog calendar events --from today --to tomorrow
```
List meetings with times and participants.

### 6. #cosmo-review Queue
Check if there are pending review items (no reaction yet) in C0B6XMYK5CZ.
Use Slack tool to read recent messages.

### 7. Git Activity (Overnight Commits)
```bash
cd ~/Documents/projects/mono && git log --all --since="yesterday 11pm" --oneline --no-merges 2>/dev/null | head -15
```

### 8. Brain Activity
```bash
source ~/.gbrain/env.sh && gbrain stats 2>/dev/null
```
Compare to known baseline if available. Note any changes.

## Format (Slack mrkdwn — NO markdown tables, NO headers with #)

Signal-only. If something is working fine, don't mention it. Only surface:
- ⚠️ Failures, errors, stalls
- Things that need Sid's action or attention
- Today's meetings/calendar
- Notable results (new content published, performance spikes)

Do NOT list green-status cron jobs. Do NOT report "brain-sync: ✅ running."
If everything is fine, the briefing should be ~5 lines.

```
☀️ *{day}, {date}*

• {only things that need attention, broke, or are notable}
• {today's meetings if any}
• {action items}

{or just: "All clear. No meetings today." if nothing needs attention}
```

Keep it under 15 lines. Shorter is better. Sid doesn't want a novel.
