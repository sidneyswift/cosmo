---
name: html-lead-magnet
description: Generate self-contained, interactive HTML lead magnets, proposals, and GTM assets. Use when asked to create a lead magnet, one-pager, interactive proposal, competitive analysis page, onboarding doc, sales page, audit deliverable, or any single-file HTML asset designed to impress prospects before a sales call. Also triggers on "build me an HTML page for outbound", "create a pre-demo deliverable", "make a custom proposal page", or "generate a GTM asset". NOT for full websites, multi-page apps, or standard landing pages with backends.
triggers:
  - "create a lead magnet"
  - "HTML one-pager"
  - "interactive proposal"
  - "pre-demo deliverable"
  - "GTM asset"
  - "sales page HTML"
---

# HTML Lead Magnet Generator

Build self-contained, single-file HTML assets that look like a top-tier firm spent days on them. One file, opens in any browser, no login, no dependencies.

## What This Produces

A single `.html` file containing all CSS, JS, and content inline. Interactive, navigable, mobile-responsive. Suitable for:

- Cold email lead magnets (industry guides, research wikis, readiness tools)
- Custom proposals (tabbed, prospect-specific, interactive pricing)
- Pre-demo deliverables (audits, competitive analyses, scoring rubrics)
- Client onboarding docs (SOPs, campaign strategies, launch roadmaps)
- Sales one-pagers (navigable capability pages with embedded CTAs)
- Internal intelligence briefs (market research, ICP profiles, campaign data)

## Core Workflow

1. **Gather context** — Ask what the asset is for, who receives it, what industry/prospect, and what action it should drive. Collect any source material (CRM data, competitor URLs, existing docs, brand guidelines).

2. **Pick the asset type** — See `references/asset-types.md` for the six GTM use cases, each with structure templates and examples.

3. **Generate the HTML** — Build a single self-contained file. All CSS/JS inline. No external dependencies. Follow the design spec in `references/design-spec.md`.

4. **Review and iterate** — Open in browser, check mobile responsiveness, verify all interactive elements work.

5. **Deliver** — Output the `.html` file. Suggest hosting options (R2, S3, GitHub Pages, Netlify) or direct email attachment.

## Design Principles

- Everything in one file — CSS, JS, content all inline
- Mobile-first responsive design
- Dark/light mode support
- Smooth scroll navigation with sticky header
- Interactive elements: tabs, accordions, toggleable pricing, checklists
- Professional typography (system font stack, no external fonts)
- No external requests — works offline, no tracking pixels, no CDN calls
- Load time < 1 second on any connection

## Key Rules

- Never produce generic content. Every asset must reference the specific prospect, industry, or use case.
- Include a clear CTA (book a call, reply, visit site) — never bury it.
- Use real data, real benchmarks, real industry language. No filler.
- Keep total file size under 500KB for email attachment compatibility.
- Test all interactive elements (tabs, accordions, toggles) before delivering.

## References

- `references/asset-types.md` — Six GTM use case templates with structure guides
- `references/design-spec.md` — CSS/JS patterns, component library, responsive rules
- `assets/starter.html` — Minimal starter template with nav, tabs, accordion, and CTA
