# Marble OS Taxonomy — Deep Analysis for Homa

**Date:** 2026-07-09
**Repo:** https://github.com/withmarbleapp/os-taxonomy
**What:** Open-source curriculum taxonomy: 1,590 micro-topics, 3,221 prerequisite edges, 8 subjects, ages 4-14, aligned to CCSS/NGSS/UK NC standards. ODbL 1.0 (database) + CC BY-SA 4.0 (content). Commercial use OK as long as taxonomy improvements are shared back.

## The Data

- **1,590 micro-topics** — each with: name, description, evidence criteria, assessment prompt (with `{{name}}` placeholder), type (conceptual/procedural/representational/language/meta), centrality score, age range, curriculum standard codes
- **3,221 prerequisite edges** — DAG: "topic X depends on Y", tagged hard/soft with reasons. 161 cross-subject edges.
- **183 clusters** — parent-friendly summaries per (subject, domain, age band)
- **Curriculum alignment** — 818/1,590 topics linked to formal standard codes (CCSS, NGSS, UK NC)

## How It Maps to Homa's 16 Domains

| Homa Domain | Marble Subject(s) | Marble Topic Count | Coverage |
|---|---|---|---|
| math | Mathematics | 503 | Deep (10 sub-domains, counting through algebra) |
| literacy | English > Reading Comprehension | 72 | Strong |
| phonics | English > Phonics & Word Reading | 23 | Good |
| writing | English > Writing Composition, Handwriting | 43 | Good |
| language | English > Grammar, Speaking, Vocabulary, Spelling | 141 | Very strong |
| science | Science | 547 | Massive (15 sub-domains) |
| social_studies | History | 90 | Decent (3 eras + Historical Thinking) |
| art | — | 0 | No coverage |
| music | — | 0 | No coverage |
| gross_motor | — | 0 | No coverage |
| fine_motor | — | 0 | No coverage |
| social_emotional | Personal & Social Development | 88 | Good |
| self_care | Life Skills | 37 | Moderate |
| executive_function | Learning to Learn | 18 | Light |
| computer_science | Computing > AI | 21 | Good match |
| spanish | — | 0 | No coverage |

**Key overlap:** ~1,540 of 1,590 topics map to 10 of Homa's 16 domains. The 6 uncovered domains (art, music, gross/fine motor, spanish) are exactly the non-academic domains Homa already handles via its own benchmark corpus.

## Analysis Written to Homa Docs

See `docs/homa-planning/plans/2026-07-09-marble-taxonomy-opportunities.md` for the full feature analysis.
