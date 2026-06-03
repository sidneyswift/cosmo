# Template: Elegant Founder

Editorial-style carousel slides for thought leadership, data breakdowns, and industry analysis. Designed primarily for LinkedIn (4:5) with an X variant (1.91:1).

**Configurable values:** The HTML template shell below uses `BRAND_NAME` as a placeholder. Replace it with the brand name from the identity file. The logo SVG below is a default — replace with the logo from the identity file if specified.

## Visual Identity

### Modes

The template supports two visual modes. Choose per-slide based on content:

| Mode | When to use | Background | Text |
|------|-------------|------------|------|
| **Dark** (default for hooks) | Hook slides, bold statements, data with drama | `#0a0a0a` near-black | White `#ffffff` headlines, `#999999` supporting, `#666666` labels |
| **Light** | Insight slides, context-heavy slides, closers | Light sky gradient | `#0a0a0a` headlines, `#888888` supporting, `#aaaaaa` labels |

**Dark background:** `background: #0a0a0a;` with subtle noise texture overlay.
**Light background:** `background: linear-gradient(175deg, #e4edf6 0%, #edf2f8 20%, #f5f7fa 45%, #fafbfc 70%, #ffffff 100%);`

### Accent Color

One signature accent color used sparingly — for thin rules, labels, or small highlights:
- **Coral/salmon:** `#e8634a` — warm, distinctive, works on both dark and light
- Usage: thin horizontal rule (3px × 48px) above category labels, or as label text color
- Never as background fills or large areas

### Visual Elements

Slides should not be typography-only. Add *one* of these per slide to create visual interest:

1. **Abstract geometric shapes** — Large, partially-clipped CSS shapes (circles, rounded rectangles) at 8-12% opacity, positioned at edges. They bleed off the canvas. Use `border-radius`, `transform: rotate()`, and partial positioning.
2. **Gradient orbs** — Soft radial gradients (200-400px) in muted tones, positioned behind text. Subtle glow effect.
3. **Grid/dot patterns** — Faint dot grid or line grid overlay on a portion of the slide (20-30% opacity max).
4. **Topic-relevant CSS illustrations** — Simple shapes that evoke the topic (e.g., connected nodes for "agents forming coalitions", stacked bars for data topics). Keep abstract — never literal.

Rules for visual elements:
- They support the text, never compete with it
- At least 1 visual element per slide, max 2
- Elements should be partially clipped by the canvas edge (feels expansive)
- Opacity: 6-15% on dark mode, 10-25% on light mode
- No stock photos, no emojis, no icons

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines (H1/H2) | Instrument Serif italic | 400 | Hook slides, insight slides, closers |
| Data numbers | Instrument Serif regular | 400 | Giant stat displays ($1.44B, +51%) |
| Labels | Plus Jakarta Sans | 600 | Uppercase category labels above data |
| Body/supporting | Plus Jakarta Sans | 500 | Context lines, subtitles |

Load via Google Fonts:
```
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

## Dimensions

| Platform | Width | Height | Aspect |
|----------|-------|--------|--------|
| LinkedIn carousel (default) | 1080px | 1350px | 4:5 |
| X single image / article card | 1200px | 628px | ~1.91:1 |
| Instagram story | 1080px | 1920px | 9:16 |

**Default: 1080×1350 (LinkedIn 4:5).** No square format — it underperforms on both platforms.

For X threads: use 1200×628 for the first image (appears as card), carousel images can be 1080×1080 if needed.

## Layout Rules

- **Margins:** 80px left/right, content never touches edges
- **Content fill:** Text and visual elements should use 60-75% of the slide area. Avoid large empty voids — white space should feel intentional, not accidental
- **Alignment:** Left-aligned throughout. Exception: the final/CTA slide may center for a deliberate shift
- **Footer:** Logo mark + brand name (17px, 600 weight) left, page count right. Positioned at bottom: 52px. Always present.
- **One idea per slide.** If a slide has more than one concept, split it.
- **Type scale:** Headlines should feel *big* — they're the scroll-stopper. On dark mode hook slides, headlines can go up to 96px.

## Logo

The logo SVG path with viewBox `48 41 127 141`.

For light backgrounds, set `fill="#0a0a0a"`.
For dark backgrounds, set `fill="white"`.

Inline SVG at 26×29px in the footer:
```html
<svg width="26" height="29" viewBox="48 41 127 141" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M118.106 41C112.845 41 108.581 45.2558 108.581 50.5056V88.3242C108.581 93.9241 106.846 99.3868 103.613 103.964C98.5169 111.179 90.2239 115.471 81.3785 115.471H57.525C52.2645 115.471 48 119.727 48 124.977V172.304C48 177.554 52.2645 181.81 57.525 181.81H104.894C110.155 181.81 114.419 177.554 114.419 172.304V139.968C114.419 133.432 116.445 127.056 120.218 121.714L120.885 120.77C126.833 112.348 136.512 107.339 146.836 107.339H165.475C170.736 107.339 175 103.083 175 97.833V50.5056C175 45.2558 170.736 41 165.475 41H118.106Z" fill="#0a0a0a"/>
</svg>
```

## Slide Types

### Hook (Dark Mode — Maximum Impact)
The hook slide is the scroll-stopper. It must feel like a movie poster or magazine cover, NOT a presentation slide.

**Key principles:**
- Text should fill 60%+ of the frame — MASSIVE, bold, commanding
- Imagery and text INTERWEAVE — figures/objects break through, overlap, and interact with the letterforms
- Dramatic cinematic lighting: backlighting, volumetric light rays, smoke, atmosphere
- Slightly menacing/provocative energy — NOT safe, NOT corporate
- Think "Wired magazine cover meets sci-fi thriller poster"

**Generation approach:** Hook slides are fully AI-generated with text and imagery composed as ONE piece (not text overlaid on image). The prompt should describe text and imagery as physically interacting.

**Prompt pattern for hooks:**
```
Dark dramatic 16:9 editorial social media cover image. MASSIVE bold white serif text taking up 60% of the frame reading: [HEADLINE]. The text is ENORMOUS, overlapping and interweaving with the imagery. Behind and breaking through the text: [DRAMATIC IMAGERY DESCRIPTION, specific to topic]. Deep black background with [CINEMATIC LIGHTING]. Text and image are ONE composition, not layered separately. Small muted text at bottom: [SUBTITLE]. No logos, no UI. Dramatic, edgy, scroll-stopping.
```

- Subtitle: small muted text at bottom of frame
- Logo: post-processed in bottom-left corner (real logo, not AI-generated)
- No accent rules or category labels on hook slides — the imagery IS the design

### Data (Dark Mode)
Small uppercase label → giant number → short context. The number IS the design.
- Background: `#0a0a0a`
- Label: 15px Plus Jakarta Sans 600, color `#e8634a`, letter-spacing 0.12em, uppercase
- Accent rule: 3px × 48px `#e8634a` bar below label, margin 16px
- Number: 148–180px Instrument Serif 400, line-height 0.88, letter-spacing -5px, color `#ffffff`
- Context: 24px Plus Jakarta Sans 500, color `#999999`. Second line `#666666`
- Visual element: large geometric shape partially clipped at right or bottom edge
- Position: content starts ~280px from top edge

### Insight (Light Mode)
Instrument Serif italic statement + supporting context. For the "so what" moment.
- Background: light sky gradient
- Headline: 60–68px italic, line-height 1.10, color `#0a0a0a`
- Body: 24px Plus Jakarta Sans 500, color `#888888`, max-width 720px, margin-top 40px
- Visual element: subtle geometric form or gradient orb at edge
- Position: content starts ~220px from top edge

### Close (Dark Mode)
Centered Instrument Serif italic statement. The takeaway.
- Background: `#0a0a0a`
- Headline: 60–68px italic, centered, max-width 800px, color `#ffffff`
- Handle: 19px Plus Jakarta Sans 600, color `#666666`, margin-top 48px
- Visual element: subtle centered glow or radial gradient behind text
- Position: true vertical center (translateY -50%)

## HTML Template Shells

### Dark Mode Shell
```html
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    position: relative; overflow: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #0a0a0a;
  }
  body::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
  }
</style>
</head>
<body>
  <!-- VISUAL ELEMENTS HERE (abstract shapes, orbs) -->
  <!-- SLIDE CONTENT HERE -->

  <!-- FOOTER (every slide) -->
  <div style="position:absolute; bottom:52px; left:80px; right:80px; display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; align-items:center; gap:10px;">
      <svg width="26" height="29" viewBox="48 41 127 141" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M118.106 41C112.845 41 108.581 45.2558 108.581 50.5056V88.3242C108.581 93.9241 106.846 99.3868 103.613 103.964C98.5169 111.179 90.2239 115.471 81.3785 115.471H57.525C52.2645 115.471 48 119.727 48 124.977V172.304C48 177.554 52.2645 181.81 57.525 181.81H104.894C110.155 181.81 114.419 177.554 114.419 172.304V139.968C114.419 133.432 116.445 127.056 120.218 121.714L120.885 120.77C126.833 112.348 136.512 107.339 146.836 107.339H165.475C170.736 107.339 175 103.083 175 97.833V50.5056C175 45.2558 170.736 41 165.475 41H118.106Z" fill="white"/></svg>
      <span style="font-size:17px; font-weight:600; color:#ffffff; letter-spacing:-0.02em;">BRAND_NAME</span>
    </div>
    <span style="font-size:15px; font-weight:500; color:#666666; letter-spacing:0.04em;">N / T</span>
  </div>
</body></html>
```

### Light Mode Shell
```html
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    position: relative; overflow: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: linear-gradient(175deg, #e4edf6 0%, #edf2f8 20%, #f5f7fa 45%, #fafbfc 70%, #ffffff 100%);
  }
  body::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 100% 70% at 65% 10%, rgba(195, 215, 235, 0.25) 0%, transparent 55%),
      radial-gradient(ellipse 70% 50% at 15% 60%, rgba(200, 218, 235, 0.1) 0%, transparent 45%);
    pointer-events: none;
  }
</style>
</head>
<body>
  <!-- VISUAL ELEMENTS HERE -->
  <!-- SLIDE CONTENT HERE -->

  <!-- FOOTER (every slide) -->
  <div style="position:absolute; bottom:52px; left:80px; right:80px; display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; align-items:center; gap:10px;">
      <svg width="26" height="29" viewBox="48 41 127 141" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M118.106 41C112.845 41 108.581 45.2558 108.581 50.5056V88.3242C108.581 93.9241 106.846 99.3868 103.613 103.964C98.5169 111.179 90.2239 115.471 81.3785 115.471H57.525C52.2645 115.471 48 119.727 48 124.977V172.304C48 177.554 52.2645 181.81 57.525 181.81H104.894C110.155 181.81 114.419 177.554 114.419 172.304V139.968C114.419 133.432 116.445 127.056 120.218 121.714L120.885 120.77C126.833 112.348 136.512 107.339 146.836 107.339H165.475C170.736 107.339 175 103.083 175 97.833V50.5056C175 45.2558 170.736 41 165.475 41H118.106Z" fill="#0a0a0a"/></svg>
      <span style="font-size:17px; font-weight:600; color:#0a0a0a; letter-spacing:-0.02em;">BRAND_NAME</span>
    </div>
    <span style="font-size:15px; font-weight:500; color:#aaaaaa; letter-spacing:0.04em;">N / T</span>
  </div>
</body></html>
```

## Hero Image Generation

Each slide should have a unique AI-generated hero image as a background layer. Images are generated via the Vercel AI Gateway image API.

### API Call
```bash
curl -s -X POST "https://ai-gateway.vercel.sh/v1/images/generations" \
  -H "Authorization: Bearer ${AI_GW_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-image-1",
    "prompt": "<slide-specific prompt>",
    "n": 1,
    "size": "1536x1024",
    "quality": "high"
  }'
```

Response contains `data[0].b64_json` — decode and save as PNG.

API key: stored in `~/.openclaw/agents/main/agent/auth-profiles.json` under `vercel-ai-gateway:default`.

### Prompt Style Guide
- Dark slides: "Dark cinematic editorial illustration. [topic-specific scene]. Deep black background with subtle warm coral accents. Atmospheric, moody. No text, no UI elements."
- Light slides: "Light ethereal editorial illustration. Soft sky-blue and white palette. [topic-specific scene]. Dreamy atmospheric light. No text, no UI."
- Always end prompts with "No text, no UI elements" — image models love to add text
- Request "Aspect: wide landscape" for 1536×1024 output
- Keep imagery abstract/editorial — never literal or stock-photo-like

### Image Compositing in HTML
Images go behind text as background layers with gradient overlays for legibility:
```html
<img src="images/hero.png" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0.35;">
<div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.7) 100%);"></div>
```

Opacity range: 0.3–0.55 depending on image brightness. Always add a gradient overlay.

## Rendering

Generate HTML per slide, then screenshot with Playwright:
```bash
npx playwright screenshot --viewport-size="1080,1350" "file:///path/to/slide.html" "/path/to/slide.png"
```

For X single images:
```bash
npx playwright screenshot --viewport-size="1200,628" "file:///path/to/slide.html" "/path/to/slide.png"
```

## Quality Checklist

Before finalizing slides, verify:
- [ ] Every slide conveys exactly one idea
- [ ] Headlines use Instrument Serif italic (not regular, not sans-serif)
- [ ] Hook slide uses dark mode (scroll-stopping contrast)
- [ ] Data numbers are the largest element on their slide
- [ ] Supporting text is noticeably smaller and lighter than headlines
- [ ] Left margin is consistent (80px) across all slides
- [ ] Footer logo + page number present on every slide
- [ ] At least one visual element (shape, orb, pattern) per slide
- [ ] Visual elements are subtle (low opacity) and partially clipped at edges
- [ ] Coral accent (`#e8634a`) used sparingly — rules and labels only
- [ ] Text fills 60-75% of the slide area (no huge empty voids)
- [ ] Slides render cleanly at 1080×1350 (LinkedIn) or 1200×628 (X)
- [ ] Dark/light mode alternation creates visual rhythm across the carousel
