---
name: frontend-feedback
version: 1.0.0
description: |
  Process frontend/UI feedback and implement fixes properly. Ensures both desktop
  and mobile are addressed, changes are visually verified before merging, and
  iteration happens before shipping — not after.
triggers:
  - "fix the landing page"
  - "fix this UI bug"
  - "this looks broken"
  - "fix the layout"
  - "frontend feedback"
  - "CSS fix"
  - "styling issue"
  - "responsive fix"
created_by: self-improvement
---

# Frontend Feedback

## Contract

This skill guarantees:
- Every frontend fix addresses BOTH desktop AND mobile breakpoints
- Visual verification happens BEFORE merging (not after)
- Iteration loop: fix → verify → iterate → merge (never fix → merge → hope)
- Responsive breakpoints in the project are identified and tested against
- No "it works on desktop, ship it" mentality

## Phases

1. **Understand the bug.** Read the screenshot/description. Identify what's wrong and on which viewport (mobile, tablet, desktop).

2. **Read the code.** Find the component AND its responsive CSS. Identify ALL breakpoints that affect the element. In Homa, the key breakpoint is `@media (max-width: 880px)` in `globals.css`.

3. **Plan the fix for ALL viewports.** Before writing any code, list:
   - What changes on desktop
   - What changes on mobile (≤880px)
   - What changes on small mobile (≤540px) if applicable
   - Whether elements should be hidden, repositioned, or resized per breakpoint

4. **Implement the fix.** Make changes that cover every breakpoint. Common patterns:
   - `display: none` on mobile for decorative elements that cause overlap
   - Different `top`/`left`/`right` values per breakpoint
   - Adjusted `size`/`font-size`/`padding` per breakpoint
   - `className` wrappers for CSS-driven responsive behavior (since inline styles can't do media queries)

5. **Verify visually.** Before committing:
   - Run the dev server (`npm run dev` or equivalent)
   - Check the page at desktop width (~1200px)
   - Check the page at mobile width (~375px)
   - Check the page at tablet width (~768px)
   - If you can't run a browser, at minimum reason through the CSS math: "at 375px width with padding X, element at position Y with size Z — does it overlap?"
   - Use `peekaboo` skill to take screenshots if available

6. **Push to branch first.** Push to a feature branch, wait for preview deploy, verify on the preview URL. Only merge after confirmation.

7. **Merge and confirm deploy.** After merging to main, confirm the Vercel deploy completes before telling the user it's live.

## Anti-Patterns

- **Fix-and-ship without checking mobile.** The #1 mistake. Inline styles don't respond to media queries — you MUST use CSS classes or check responsive behavior explicitly.
- **Guessing pixel values.** Do the math: container padding + element position + element size = where it renders. Don't eyeball.
- **Merging before visual verification.** The user sees the production site. If your fix doesn't work, they see the broken version AND lose trust.
- **Assuming inline `top`/`left` works across viewports.** Absolute positioning with fixed pixel values almost always breaks on mobile. Use responsive CSS or hide/reposition with media queries.
- **Saying "fixed" before deploying.** The user checks the live site. If the deploy hasn't finished, they think you lied. Deploy first, confirm second, reply third.

## Homa-Specific Notes

- Main responsive breakpoint: `@media (max-width: 880px)` in `apps/web/app/globals.css`
- Secondary breakpoint: `@media (max-width: 540px)` for small phones
- Hero shell padding on mobile: `padding-top: 56px`
- Nav height: `--lp-nav-height: 80px`
- Decorative `Doodle` components use inline styles for positioning — wrap in a className div for responsive control
- Build has pre-existing module errors — don't block on full build success; verify your specific files compile
- Vercel auto-deploys from `main`; deploys take 1-2 minutes
