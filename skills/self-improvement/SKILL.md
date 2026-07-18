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

## Core Principle: Automate, Don't Repeat

Every repeated fix should become infrastructure, not another one-off token burn.
The goal is not just to learn — it's to encode learnings as durable automation
that benefits every future session, every subagent, and every fresh instance.
Memory entries help YOU next session. Rules, skills, and docs help EVERYONE.

> "Your agent could fix an issue every time it sees that issue happen, but
> that uses tokens and might miss cases. If it instead writes a rule, that
> class of issue is fully automated forever."

## Contract

This skill guarantees:
- Recent sessions are reviewed for skill/memory signals at least 2x/day
- Frustration signals and corrections become skill updates, not just memory
- **Corrections become durable rules** in AGENTS.md, skills, or docs — not just memory
- **Repeated patterns become skills** — if a workflow runs 3+ times, it gets codified
- **Zero-context test** — periodic audit that fresh agents can execute workflows from files alone
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

## Phase 3: Correction → Rule Pipeline

This is the highest-leverage phase. Every correction from the user is a
*failure of automation* — domain knowledge that lived in someone's head
instead of in infrastructure. The goal is to make each correction the LAST
time that class of mistake happens.

### The Rule: Corrections become infrastructure, not journal entries

When the user corrects you, ask: **"Where does this rule live permanently?"**

| Correction type | Where it goes | Example |
|---|---|---|
| Behavioral (tone, format, verbosity) | AGENTS.md or SOUL.md | "Don't say 'Great question!'" |
| Workflow/process (wrong sequence, missed step) | The governing skill file | "Deploy first, reply second" |
| Domain knowledge (wrong assumption about a tool/system) | TOOLS.md or relevant skill | "Postiz needs pipeline, no direct scheduling" |
| Channel/context rule (when to speak, what to share) | AGENTS.md channel section | "#chat: only reply when @mentioned" |
| Code convention (architecture, patterns, naming) | Project AGENTS.md or .claude/rules | "Always check mobile viewport" |

Memory entries are the FALLBACK, not the default. Write to memory only when
the correction is too context-specific to generalize into a rule.

### Signals to Look For (any one warrants action)

- **User corrected style/tone/format/verbosity.** Frustration signals like
  "stop doing X", "this is too verbose", "don't format like this", "just give
  me the answer" are FIRST-CLASS rule signals. Update AGENTS.md or the
  relevant skill to embed the preference.

- **User corrected workflow/approach/sequence.** Encode the correction as a
  pitfall or explicit step in the governing skill.

- **Non-trivial technique, fix, workaround, or debugging path emerged** that
  future sessions would benefit from. Capture it.

- **A skill that got loaded turned out to be wrong, missing a step, or outdated.**
  Patch it NOW.

- **Same type of mistake appeared in 2+ sessions.** This is a pattern, not a
  one-off. Escalate from memory to a durable rule immediately.

### Preference Order (pick the earliest that fits)

1. **UPDATE A CURRENTLY-LOADED SKILL.** Look for skills that were read via
   `read` tool calls in the session. If one covers the territory of the new
   learning, patch THAT ONE first.

2. **UPDATE AN EXISTING UMBRELLA SKILL.** Check `skills/` directory for an
   existing class-level skill that covers this domain. Patch it — add a
   subsection, a pitfall, or broaden a trigger.

3. **UPDATE AGENTS.md, TOOLS.md, or SOUL.md** when the learning is
   cross-cutting (applies to many skills or workflows, not just one).

4. **ADD A SUPPORT FILE** under an existing umbrella:
   - `references/<topic>.md` — session-specific detail, reproduction recipes,
     provider quirks, condensed knowledge banks
   - `templates/<name>.<ext>` — starter files meant to be copied/modified
   - `scripts/<name>.<ext>` — re-runnable verification scripts, probes

5. **CREATE A NEW CLASS-LEVEL UMBRELLA SKILL** when nothing exists. The name
   MUST be at the class level. NEVER a specific PR number, error string,
   feature codename, or session artifact.

## Phase 4: Pattern → Skill Detection

Scan reviewed sessions for *repeated multi-step workflows* that aren't
skills yet. This is the "write a lint rule instead of fixing it manually
each time" principle applied to agent workflows.

### Detection criteria

A pattern is worth codifying when:
- The same 3+ step sequence appeared in 3+ sessions
- Different sessions re-derived the same approach independently
- A subagent needed context that wasn't in any file
- You spent tokens reasoning through something you've reasoned through before

### What to do

1. Identify the repeated pattern and its trigger conditions
2. Check if an existing skill covers it (search `skills/` directory)
3. If not covered: create a new class-level skill or add to an existing one
4. If partially covered: patch the existing skill with the missing steps
5. Log the detection in the review summary

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

## Phase 5: Zero-Context Audit (Weekly)

Once per week (check `lastZeroContextAudit` in state file), run this test:

1. Pick 2-3 workflows you executed recently (from reviewed sessions)
2. For each, ask: *"Could a fresh agent instance with no session history
   execute this workflow from the files alone?"*
3. Check:
   - Is there a skill file that covers the workflow?
   - Does the skill have all the steps, or does it assume context?
   - Are tool configs, paths, and credentials documented in TOOLS.md?
   - Would AGENTS.md route to the right skill for this trigger?
4. If gaps exist: fill them. Add missing steps to skills, add missing
   triggers to AGENTS.md skillpack table, add missing tool notes to TOOLS.md.

Optionally, spawn a clean subagent with the workflow trigger as its only
input and see where it breaks. Real failures are more revealing than
theoretical audits.

Track in state file:
```json
{
  "lastZeroContextAudit": "<ISO timestamp>",
  "auditFindings": ["skill X missing step Y", "TOOLS.md missing Z config"]
}
```

## Phase 6: Update State

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
