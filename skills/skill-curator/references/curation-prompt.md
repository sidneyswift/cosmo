# Curation Prompt — Skill Consolidation Pass

Adapted from Hermes Agent's `agent/curator.py` CURATOR_REVIEW_PROMPT. Use this
as the mental framework when running Phase 2 of the curator.

---

You are running a skill CURATOR pass. This is an UMBRELLA-BUILDING consolidation
pass, not a passive audit and not a duplicate-finder.

The goal of the skill collection is a LIBRARY OF CLASS-LEVEL INSTRUCTIONS AND
EXPERIENTIAL KNOWLEDGE. A collection of hundreds of narrow skills where each one
captures one session's specific bug is a FAILURE of the library — not a feature.

The right target shape is CLASS-LEVEL skills with rich SKILL.md bodies +
`references/`, `templates/`, and `scripts/` subfiles for session-specific
detail — not one-session-one-skill micro-entries.

## Hard Rules

1. DO NOT touch skills without `created_by: self-improvement` in frontmatter
2. DO NOT delete any skill. Archive (move to `skills/.archive/`) is the maximum
   destructive action. Archives are recoverable; deletion is not.
3. DO NOT touch pinned skills. Skip them entirely.
4. DO NOT use usage counters as reason to skip consolidation. Counters may be
   new and mostly zero. Judge overlap on CONTENT, not on use_count.
5. DO NOT reject consolidation because "each skill has a distinct trigger".
   The right bar: would a human write N separate skills, or one with N sections?

## How to Work

1. **Scan the full candidate list.** Identify PREFIX CLUSTERS (skills sharing a
   first word or domain keyword). Expect to find 5-15 clusters depending on
   library size.

2. **For each cluster with 2+ members,** ask: "What is the UMBRELLA CLASS these
   skills all serve?" If a maintainer would write one skill for it → merge.

3. **Three consolidation methods:**
   - **MERGE INTO EXISTING UMBRELLA** — one member is already broad. Patch it
     to add sections for siblings. Archive siblings.
   - **CREATE A NEW UMBRELLA** — no member is broad enough. Create new
     class-level skill. Archive absorbed siblings.
   - **DEMOTE TO REFERENCES** — sibling has narrow-but-valuable content. Move
     to `<umbrella>/references/<topic>.md`. Archive old skill.

4. **Flag narrow names** — PR numbers, error strings, codenames, session
   artifacts. These belong as subsections or references under umbrellas.

5. **Iterate.** After one round, scan remaining set for next umbrella.

## Classification

When archiving, classify each removed skill:

- **Consolidated** — content absorbed into an umbrella skill
  - Record: `{from: "<old>", into: "<umbrella>", reason: "..."}`
- **Pruned** — archived for staleness with no merge target
  - Record: `{name: "<skill>", reason: "..."}`

Every archived skill must appear in exactly one list.

## Expected Output

Real umbrella-ification. Process every obvious cluster. "Keep" is legitimate
ONLY when the skill is already a class-level umbrella and no merge would
improve discoverability.
