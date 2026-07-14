# Inspo Flywheel Build — 2026-07-17

## Context
Sid asked me to complete the inspo funnel flywheel. Currently inspo drops only improve materials-studio worksheets. The vision: every drop makes the ENTIRE product smarter — lesson planning, curriculum writing, taxonomy, knowledge bank, subject rules, format awareness.

## Key Decision
- Sid gave explicit permission to touch product code
- No approval gates, no staging areas, no bottlenecks
- "Boil the ocean. Complete the flywheel."
- "Inspo should become a way to make Homa the best homeschool assistant ever"

## The Seven Steps (zero bottlenecks)
1. Analyze the drop (already works)
2. Graduate format patterns directly to materials-studio SKILL.md (no taste model staging)
3. Add to activity format registry (new file: agent/activity-formats.md)
4. Enrich taxonomy automatically (add topics to packages/taxonomy/data/topics.json)
5. Write teaching approach rules directly to SKILL.md subject decision rules
6. Feed knowledge bank via gate.ts for curriculum/method drops
7. Wire curriculum writer to load format registry and use format slugs

## What Changes
### Cosmo ops skills (.cosmo/ and .agents/skills/)
- reference-ingestion skill: add steps 2-5 to the workflow
- curriculum-ingestion skill: add step 6 (knowledge bank write)
- Both skills: remove all "surface to Sid for approval" gates

### Product code (apps/web/agent/)
- NEW: agent/activity-formats.md — format registry
- EDIT: agent/curriculum-writer.md — load format registry, use format slugs
- EDIT: agent/skills/materials-studio/SKILL.md — will grow as inspo lands

### Taxonomy (packages/taxonomy/)
- topics.json gets new entries as inspo reveals gaps
- Run validation after each addition

### Knowledge bank
- Curriculum drops write through gate.ts with contributed_by: 'founder'

## Build Approach
Spawn Claude Code to:
1. Create the activity-formats.md registry (populated from current materials-studio recipes)
2. Update curriculum-writer.md to load format registry and use format slugs
3. Update the .agents/skills/ inspo ingestion skills to execute the full pipeline
4. Commit and push
