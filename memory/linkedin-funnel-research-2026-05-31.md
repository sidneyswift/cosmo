# LinkedIn Funnel Content Research — 2026-05-31

## Summary
Deep research across last30days (Reddit, X, YouTube, TikTok, HN, web) on what works for each funnel stage on LinkedIn in 2026. Results implemented into content engine.

## Changes Made
1. **`data/funnel-styles.md`** — Reference doc with TOF/MOF/BOF definitions, hook formulas, algorithm rules
2. **`scripts/generate.js`** — Added `assignFunnelStage()`, funnel-stage-aware writer prompt, hook rules
3. **`scripts/brain-first-generate.js`** — Same funnel-stage logic for brain-first content
4. **`scripts/qa-judge.js`** — Added Section 4.5 "Funnel Stage Check" + `funnel_stage` and `funnel_coherent` to judge output
5. **`scripts/slack-review.js`** — Shows funnel stage tag (🔵 TOF / 🟡 MOF / 🔴 BOF) on review cards
6. **`scripts/lib/db-adapter.js`** — Added `funnel_stage` to Supabase draft insert
7. **DB migrations** — Added `funnel_stage TEXT DEFAULT 'mof'` to both local SQLite and Supabase `app_content_dashboard.drafts`

## Key Findings

### Post Mix: 20% TOF / 65% MOF / 15% BOF

### TOF (Awareness)
- "How I did X" beats "How to do X"
- Failure stories outperform wins
- No product mentions
- Multi-image (6.6% engagement) > Carousels (596% vs text) > Polls (206% reach) > Text > Video > Single images (DEAD)
- Hooks: bold statement, contrarian, emotional drop-in. Under 8 words.

### MOF (Trust) — 65% of posts, THE revenue driver
- "How we built X" with real numbers
- Feeling understood > being educated
- Frameworks that help prospects build internal business cases
- "Only I can write this" is the AI-era moat
- Hooks: "I" + past tense + specific, number + outcome, behind-the-curtain

### BOF (Conversion)
- Comparison content: 8.43% conversion rate (2x broader keywords)
- Case studies with number in first sentence
- ROI calculators close internal sells
- Write about struggles, not features
- Hooks: result first, number first, outcome-driven

### Algorithm 2026
- "Depth Score" (dwell time) is #1 signal
- External links = 60% reach penalty
- Engagement bait shadowbanned (March 2026 "Authenticity Update")
- Saves > DM shares > thoughtful comments > dwell time
- 2-3x/week quality > daily mixed quality
- Mobile truncation: ~140 chars / 2 lines
- Specialist consistency compounds reach
