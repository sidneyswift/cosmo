# Review Prompts — Self-Improvement Loop

Adapted from Hermes Agent's `agent/background_review.py`. Three prompt variants
depending on what signals were detected.

## Memory-Only Review Prompt

Use when the session had user self-disclosure but no technical learnings.

```
Review this conversation and consider saving to memory if appropriate.

Focus on:
1. Has the user revealed things about themselves — persona, desires,
   preferences, or personal details worth remembering?
2. Has the user expressed expectations about how I should behave, their
   work style, or ways they want me to operate?

If something stands out, update MEMORY.md. If nothing is worth saving,
move on.
```

## Skill-Only Review Prompt

Use when the session had technical work, corrections, or new techniques.

```
Review this conversation and update the skill library. Be ACTIVE — most
sessions produce at least one skill update, even if small. A pass that
does nothing is a missed learning opportunity, not a neutral outcome.

Target shape: CLASS-LEVEL skills, each with a rich SKILL.md and a
references/ directory for session-specific detail. Not a long flat list
of narrow one-session-one-skill entries.

Signals to look for (any one warrants action):
  • User corrected style, tone, format, legibility, or verbosity.
    Frustration signals are FIRST-CLASS skill signals.
  • User corrected workflow, approach, or sequence of steps.
  • Non-trivial technique, fix, workaround, or debugging path emerged.
  • A skill that got loaded/consulted turned out wrong, missing, or outdated.

Preference order:
  1. UPDATE A CURRENTLY-LOADED SKILL (was read during the session)
  2. UPDATE AN EXISTING UMBRELLA (scan skills/ for the right one)
  3. ADD A SUPPORT FILE (references/, templates/, scripts/)
  4. CREATE A NEW CLASS-LEVEL UMBRELLA

User-preference embedding: when the user expressed a style/format/workflow
preference, the update belongs in the SKILL.md body, not just in memory.

DO NOT capture:
  • Environment-dependent failures (missing binaries, unconfigured creds)
  • Negative claims about tools ("X doesn't work")
  • Transient errors that resolved
  • One-off task narratives
```

## Combined Review Prompt

Use for the default heartbeat review pass (most common).

```
Review this conversation and update two things:

**Memory**: Did the user reveal persona, desires, preferences, personal
details, or expectations about how I should behave? Save durable facts
about the user to MEMORY.md.

**Skills**: How to do this class of task. Be ACTIVE — most sessions
produce at least one skill update. A pass that does nothing is a missed
learning opportunity.

Target shape: CLASS-LEVEL skills with rich SKILL.md + references/ for
session-specific detail.

Signals that warrant a skill update (any one is enough):
  • User corrected style, tone, format, verbosity, or approach
  • Non-trivial technique, fix, workaround, or debugging path emerged
  • A skill that was loaded/consulted turned out wrong or outdated

Preference order for skills:
  1. UPDATE A CURRENTLY-LOADED SKILL
  2. UPDATE AN EXISTING UMBRELLA
  3. ADD A SUPPORT FILE (references/, templates/, scripts/)
  4. CREATE A NEW CLASS-LEVEL UMBRELLA

User-preference embedding: when the user complains about how I handled
a task, update the skill that governs that task — memory alone isn't
enough.

DO NOT capture as skills:
  • Environment-dependent failures
  • Negative claims about tools
  • Transient errors that resolved
  • One-off task narratives

Act on whichever dimension has real signal. If genuinely nothing stands
out on either, move on — but don't reach for that conclusion as default.
```
