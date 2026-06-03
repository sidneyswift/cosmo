---
name: skill-curator
version: 1.0.0
description: |
  Periodic maintenance of agent-created skills. Auto-transitions lifecycle states
  (active→stale→archived), consolidates overlapping skills into umbrellas,
  and maintains the skill collection's health. Adapted from Hermes Agent's
  curator pattern. Runs weekly during heartbeats.
triggers:
  - heartbeat skill curator check
  - "curate skills"
  - "consolidate skills"
  - "review skill health"
  - "archive stale skills"
  - "skill maintenance"
tools:
  - read
  - write
  - edit
  - exec
mutating: true
writes_to:
  - skills/
  - memory/skill-curator-state.json
---

# Skill Curator — Background Skill Maintenance

Periodically reviews agent-created skills and maintains the collection. Two
phases: automatic state transitions (no LLM), then LLM consolidation pass.

## Contract

This skill guarantees:
- Only touches skills with `created_by: self-improvement` in frontmatter
- NEVER touches bundled skills (`/opt/homebrew/lib/node_modules/openclaw/skills/`)
- NEVER touches workspace skills without `created_by: self-improvement`
- NEVER deletes — only archives (recoverable)
- Pinned skills bypass ALL auto-transitions
- Backs up before any mutations

## When to Run

**Weekly cadence:** During heartbeats, check `memory/skill-curator-state.json`.
If `lastRunAt` is >7 days old, run a curation pass.

**Manual trigger:** When asked to curate, consolidate, or review skill health.

## Phase 1: Automatic State Transitions (No LLM)

Pure time-based lifecycle management. No judgment calls.

### Read State

1. Load `memory/skill-curator-state.json`
2. Scan `skills/` directory for skills with `created_by: self-improvement` in
   their SKILL.md frontmatter
3. For each skill, read its telemetry from the state file

### Apply Transitions

Based on `lastActivityAt` (most recent of last_used_at, last_viewed_at, last_patched_at):

| Current State | Condition | New State |
|---|---|---|
| active | No activity for 30+ days | stale |
| stale | No activity for 90+ days | archived (move to `skills/.archive/`) |
| stale | Activity resumed | active (reactivate) |
| any | `pinned: true` | SKIP — never touch |

### Archive Process

When archiving a skill:
```bash
mkdir -p skills/.archive
mv skills/<skill-name> skills/.archive/<skill-name>
```

Update the state file: set `state: "archived"`, `archivedAt: <ISO timestamp>`.

### Restore Process

To restore an archived skill:
```bash
mv skills/.archive/<skill-name> skills/<skill-name>
```

Update state: set `state: "active"`, clear `archivedAt`.

## Phase 2: LLM Consolidation Pass

The creative part. Review all active agent-created skills and consolidate.

### Goal

The target shape of the skill library is CLASS-LEVEL skills with rich SKILL.md
bodies + `references/` directories for session-specific detail. NOT a long flat
list of narrow one-session-one-skill entries.

### Process

1. **List all agent-created skills** (frontmatter `created_by: self-improvement`)
2. **Identify PREFIX CLUSTERS** — skills sharing a first word or domain keyword.
   Examples: `debugging-*`, `api-*`, `content-*`, `deploy-*`
3. **For each cluster with 2+ members**, ask: "What is the UMBRELLA CLASS these
   skills all serve? Would a maintainer write one skill for it?"
4. **Consolidate** using one of three methods:

   **a. MERGE INTO EXISTING UMBRELLA** — one skill in the cluster is already
   broad enough. Patch it to add labeled sections for each sibling's unique
   insight. Archive the siblings.

   **b. CREATE A NEW UMBRELLA** — no existing member is broad enough. Create a
   new class-level skill whose SKILL.md covers the shared workflow. Archive
   the absorbed siblings.

   **c. DEMOTE TO REFERENCES** — a sibling has narrow-but-valuable content.
   Move it to `<umbrella>/references/<topic>.md`. Archive the old skill.

5. **Flag narrow names** — skills containing PR numbers, error strings, feature
   codenames, or session artifacts. These almost always belong as subsections.

6. **Iterate.** After one consolidation round, scan remaining set for the next
   umbrella opportunity. Don't stop after 3 merges.

### Safety

Before ANY mutations in Phase 2:
```bash
# Backup current state
tar czf memory/skill-backup-$(date +%Y%m%d-%H%M%S).tar.gz skills/
```

Keep the last 5 backups. Delete older ones.

### Rules

- DO NOT touch skills without `created_by: self-improvement` in frontmatter
- DO NOT touch bundled or ClawHub-installed skills
- DO NOT touch pinned skills (check state file for `pinned: true`)
- DO NOT use usage counters as reason to skip consolidation — counters may be
  new/zero. Judge overlap on CONTENT, not use_count
- DO NOT reject consolidation because "each skill has a distinct trigger" —
  pairwise distinctness is the wrong bar. The right bar: would a human write
  N separate skills, or one skill with N labeled subsections?

## Telemetry Tracking

The state file at `memory/skill-curator-state.json` tracks everything:

```json
{
  "lastRunAt": "<ISO timestamp>",
  "runCount": 0,
  "lastSummary": "",
  "paused": false,
  "skills": {
    "<skill-name>": {
      "createdAt": "<ISO>",
      "createdBy": "self-improvement",
      "state": "active",
      "pinned": false,
      "useCount": 0,
      "viewCount": 0,
      "patchCount": 0,
      "lastUsedAt": null,
      "lastViewedAt": null,
      "lastPatchedAt": null,
      "archivedAt": null
    }
  },
  "runHistory": [
    {
      "timestamp": "<ISO>",
      "skillsChecked": 0,
      "markedStale": 0,
      "archived": 0,
      "reactivated": 0,
      "consolidated": [],
      "pruned": []
    }
  ]
}
```

### Bumping Telemetry

When the self-improvement loop or any other process interacts with a skill:
- **Skill read/loaded:** bump `viewCount`, update `lastViewedAt`
- **Skill actively used in a response:** bump `useCount`, update `lastUsedAt`
- **Skill patched/edited:** bump `patchCount`, update `lastPatchedAt`

The self-improvement skill should bump these when it reads or modifies skills.

## Pinning

To protect a skill from auto-transitions, set `pinned: true` in the state file.
The curator will never archive, stale-mark, or consolidate a pinned skill.

To pin: edit `memory/skill-curator-state.json`, set the skill's `pinned: true`.
To unpin: set `pinned: false`.

## Output Format

After a curation pass:
```
🔧 Skill curator: <summary>
   Phase 1: checked N skills, M→stale, K→archived, J reactivated
   Phase 2: consolidated X skills into Y umbrellas, Z archived
```

If nothing needed attention:
```
🔧 Skill curator: all skills healthy, no changes needed
```

## Anti-Patterns

- ❌ Deleting skills (always archive — recoverable > gone)
- ❌ Touching bundled/installed skills
- ❌ Consolidating based on usage count alone
- ❌ Creating narrow skill names during consolidation
- ❌ Running consolidation without backup
- ❌ Archiving pinned skills
- ❌ Curating skills that don't have `created_by: self-improvement`
