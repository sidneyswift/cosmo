---
name: janitor
version: 1.0.0
description: |
  Nightly system janitor sweep. Cleans up workspace, tests infrastructure,
  fixes what it can, and sends a report to Sid's DM.
triggers:
  - "janitor sweep"
  - "system cleanup"
  - "nightly maintenance"
created_by: self-improvement
mutating: true
---

# Janitor Sweep

Nightly automated maintenance run. Clean up, test, fix, report.

## When

Every night at 2:30 AM ET via cron. Runs in isolated session.

## Phases

### Phase 1: Workspace Cleanup

1. **Temp files** — Delete stale files in `/tmp/` that belong to Cosmo workflows (depth-thumbnail, test outputs, etc.) older than 48h
2. **Orphan scripts** — Find test/debug scripts left behind in content-engine and workspace (`test-*.js`, `debug-*.js`, `tmp-*`) — list them, delete if >7 days old
3. **Log rotation** — Check `~/.openclaw/logs/` and content-engine logs. If any log file >10MB, truncate keeping last 1000 lines
4. **Memory file hygiene** — Check `memory/` for files >30 days old that are just heartbeat-state noise. Don't delete daily notes, but flag if any are >50KB (bloated)
5. **Stale cron reports** — Clean up `reports/` directories older than 14 days
6. **Workspace disk usage** — Report total size of `~/.openclaw/workspace/` and flag if >1GB

### Phase 2: Infrastructure Tests

1. **Cron daemon health** — Run `openclaw cron list` and verify all jobs show `ok` status. Flag any `error` or `stale` jobs.
2. **Content engine cron** — Check if content-engine cron-daemon.js is running (`pgrep -f cron-daemon`). If dead, restart it and note in report.
3. **Supabase connectivity** — Source `~/.openclaw/credentials/supabase-env.sh` and test a simple query (`SELECT 1`). Report pass/fail.
4. **GBrain health** — Run `source ~/.gbrain/env.sh && gbrain doctor`. Report any issues.
5. **Brain sync cron** — Verify brain-sync cron ran in last 60 min (check cron list last-run time).
6. **Git status** — Check `~/.openclaw/workspace/` and `~/Documents/wiki/` for uncommitted changes. Auto-commit workspace changes with message "janitor: nightly auto-commit".
7. **1Password CLI** — Test `op whoami` to verify auth is healthy.
8. **Slack connectivity** — Verify ability to post (tested by sending the report itself).

### Phase 3: Bug Detection & Auto-Fix

1. **Broken symlinks** — Find and remove broken symlinks in workspace
2. **Empty skill files** — Scan `skills/*/SKILL.md` for empty or malformed files
3. **Duplicate cron jobs** — Check for cron jobs with identical schedules (collision detection)
4. **Content engine SQLite integrity** — Run `PRAGMA integrity_check` on content-engine drafts.db
5. **Session search DB integrity** — Run `PRAGMA integrity_check` on `db/sessions.db`
6. **Node modules health** — Check content-engine `node_modules/` exists and `npm ls --depth=0` has no missing deps
7. **Stale PID files** — Find any `.pid` files pointing to dead processes, clean up

### Phase 4: Report

Compile all findings into a report and send to Sid's DM:

```
🧹 *Janitor Sweep — {date}*

*Cleanup:*
• {n} temp files removed ({size} freed)
• {n} stale scripts cleaned
• Workspace size: {size}

*Infrastructure:*
• ✅/❌ Cron daemon: {status}
• ✅/❌ Content engine: {status}
• ✅/❌ Supabase: {status}
• ✅/❌ GBrain: {status}
• ✅/❌ Brain sync: {status}
• ✅/❌ Git repos: {status}
• ✅/❌ 1Password: {status}

*Bugs Found & Fixed:*
• {list of issues found and actions taken}

*Bugs Found (manual fix needed):*
• {list of issues that need Sid's attention}
```

Save report to `reports/janitor/{YYYY-MM-DD}.md` as well.

## Idempotency

- Safe to run multiple times — cleanup checks "already clean" state
- Tests are read-only (except auto-fix phase)
- Auto-commits only if there are actual changes
- Report is timestamped and saved, not overwritten

## Auto-Fix Policy

- **Fix automatically:** dead cron daemons, stale temp files, broken symlinks, uncommitted workspace changes
- **Report but don't fix:** Supabase issues, missing node_modules, GBrain problems, anything that could break running services
- **Never touch:** user files in mono repo, wiki content, strategy repo, anything outside workspace/content-engine
