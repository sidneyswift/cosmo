---
name: self-improvement
version: 1.0.0
description: |
  Self-improving learning loop. After conversations, review what happened and
  update skills and memory. Runs during heartbeats by reviewing recent session
  transcripts. Adapted from Hermes Agent's background_review pattern.
triggers:
  - heartbeat self-improvement check
  - "review recent sessions for learnings"
  - "what should I remember from recent conversations"
  - "update skills from recent work"
tools:
  - read
  - write
  - edit
  - exec
  - memory_search
  - memory_get
mutating: true
writes_to:
  - skills/
  - memory/
  - MEMORY.md
---

# Self-Improvement Loop — Learn From Every Conversation

After conversations, review what happened and extract durable learnings into
skills and memory. This is how you get better over time.

## Contract

This skill guarantees:
- Recent sessions are reviewed for skill/memory signals at least 2x/day
- Frustration signals and corrections become skill updates, not just memory
- Skills are CLASS-LEVEL (umbrella skills, not per-session artifacts)
- Anti-capture rules prevent brittle/harmful skill entries
- State is tracked so sessions aren't reviewed twice

## When to Run

**Heartbeat trigger:** Every heartbeat, check `memory/self-improvement-state.json`.
If `lastReviewedAt` is >6 hours old, run a review pass.

**Manual trigger:** When asked to review sessions, update skills, or capture learnings.

## Phase 1: Gather Recent Sessions

1. Read `memory/self-improvement-state.json` to get `lastReviewedAt` timestamp
2. List session files newer than that timestamp:
   ```bash
   find ~/.openclaw/agents/main/sessions/ -name "*.jsonl" -newer <reference> | head -20
   ```
3. For each session file, extract the conversation:
   ```bash
   cat <file> | python3 -c "
   import sys,json
   for line in sys.stdin:
       try:
           d = json.loads(line)
           if d.get('type') == 'message':
               msg = d.get('message', {})
               role = msg.get('role', '?')
               content = msg.get('content', [])
               if isinstance(content, list):
                   texts = [c.get('text','') for c in content if c.get('type')=='text']
                   text = ' '.join(texts)
               else:
                   text = str(content)
               if role in ('user','assistant') and text.strip():
                   print(f'{role}: {text[:500]}')
       except: pass
   "
   ```
4. Skip sessions that are purely heartbeat/cron (check if first user message contains `[cron:` or `HEARTBEAT`)
5. Focus on substantive conversations (>3 user messages)

## Phase 2: Memory Review

For each substantive session, ask:

1. **Did the user reveal things about themselves?** Persona, desires, preferences,
   personal details worth remembering?
2. **Did the user express expectations?** How I should behave, their work style,
   ways they want me to operate?
3. **Did the user correct me?** Style, tone, format, verbosity?

If something stands out → update MEMORY.md with the learning.

Use `memory_search` first to check if we already know this. Don't duplicate.

## Phase 3: Skill Review — The Core Loop

This is where the real value is. Be ACTIVE — most substantive sessions produce
at least one skill update. A pass that does nothing is a missed learning
opportunity, not a neutral outcome.

### Signals to Look For (any one warrants action)

- **User corrected style/tone/format/verbosity.** Frustration signals like
  "stop doing X", "this is too verbose", "don't format like this", "just give
  me the answer" are FIRST-CLASS skill signals. Update the relevant skill to
  embed the preference.

- **User corrected workflow/approach/sequence.** Encode the correction as a
  pitfall or explicit step in the governing skill.

- **Non-trivial technique, fix, workaround, or debugging path emerged** that
  future sessions would benefit from. Capture it.

- **A skill that got loaded turned out to be wrong, missing a step, or outdated.**
  Patch it NOW.

### Preference Order (pick the earliest that fits)

1. **UPDATE A CURRENTLY-LOADED SKILL.** Look for skills that were read via
   `read` tool calls in the session. If one covers the territory of the new
   learning, patch THAT ONE first.

2. **UPDATE AN EXISTING UMBRELLA SKILL.** Check `skills/` directory for an
   existing class-level skill that covers this domain. Patch it — add a
   subsection, a pitfall, or broaden a trigger.

3. **ADD A SUPPORT FILE** under an existing umbrella:
   - `references/<topic>.md` — session-specific detail, reproduction recipes,
     provider quirks, condensed knowledge banks
   - `templates/<name>.<ext>` — starter files meant to be copied/modified
   - `scripts/<name>.<ext>` — re-runnable verification scripts, probes

4. **CREATE A NEW CLASS-LEVEL UMBRELLA SKILL** when nothing exists. The name
   MUST be at the class level. NEVER a specific PR number, error string,
   feature codename, or session artifact.

### Mark Self-Created Skills

When creating a new skill, add to the YAML frontmatter:
```yaml
created_by: self-improvement
created_at: <ISO timestamp>
```

This tells the skill-curator which skills it's allowed to manage.

## Anti-Capture Rules (DO NOT persist these as skills)

- **Environment-dependent failures:** Missing binaries, fresh-install errors,
  `command not found`, unconfigured credentials, uninstalled packages. These
  are transient setup issues, not durable rules.

- **Negative claims about tools:** "browser tools don't work", "X tool is
  broken", "cannot use Y". These harden into refusals the agent cites against
  itself long after the problem was fixed.

- **Transient errors that resolved.** If retrying worked, the lesson is the
  retry pattern, not the original failure.

- **One-off task narratives.** "Summarize today's market" or "analyze this PR"
  is not a class of work that warrants a skill.

- **Environment-specific paths or configs** that may change.

**Exception:** If a tool failed because of setup state, capture the FIX (install
command, config step, env var) under a troubleshooting skill — never "this tool
does not work" as a standalone constraint.

## Phase 4: Update State

After review, update `memory/self-improvement-state.json`:
```json
{
  "lastReviewedAt": "<ISO timestamp>",
  "totalSessionsReviewed": <count>,
  "skillsCreated": <count>,
  "skillsUpdated": <count>,
  "memoryUpdates": <count>,
  "lastReviewSummary": "<brief description of what was learned>",
  "reviewHistory": [
    {
      "timestamp": "<ISO>",
      "sessionsReviewed": <n>,
      "actions": ["updated skill X", "created skill Y", "updated MEMORY.md"]
    }
  ]
}
```

Keep `reviewHistory` to the last 20 entries.

## Output Format

After a review pass, produce a brief summary:
```
💾 Self-improvement review: <what was done>
```

If nothing was worth capturing:
```
💾 Self-improvement review: Nothing to save.
```

## Anti-Patterns

- ❌ Creating narrow per-session skills ("fix-typescript-error-2026-05-20")
- ❌ Persisting environment failures as permanent constraints
- ❌ Reviewing heartbeat/cron sessions (no signal)
- ❌ Duplicating things already in MEMORY.md
- ❌ Reviewing sessions already covered (check state file)
- ❌ Creating skills without `created_by: self-improvement` frontmatter
