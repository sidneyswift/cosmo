---
name: social-slides
description: Generate carousel/slide images for social media (LinkedIn, X, Instagram). Uses AI image generation (GPT Image via Vercel AI Gateway) for fully-composed slides with post-processing for brand assets. Supports multiple visual templates — currently includes "elegant-founder" for editorial thought leadership. Each template lives in references/ with full design specs.
triggers:
  - "generate slides"
  - "social media carousel"
  - "LinkedIn carousel"
  - "slide images"
---

# Social Slides

Generate social media carousel/slide images from content. AI-generated imagery with post-processed brand assets.

## Setup

**Step 0: Check configuration**

1. Read `~/.config/sid/identity.md` (or the owner's identity file). Has brand name, logo SVG path, handle, voice, and audience. If missing, ask the user.

2. Read `~/.config/social-slides/.env`. If missing or `SETUP_COMPLETE` not true:
   - Ask: default template? (currently: `elegant-founder`)
   - Ask: primary platform? (linkedin/x/instagram)
   - Write `.env` with `SETUP_COMPLETE=true`

3. Confirm dependencies:
   - `Pillow` (Python): `pip3 install Pillow` — for post-processing
   - `Playwright` with Chromium: `npx playwright install chromium` — for logo rendering
   - Vercel AI Gateway key: stored in `~/.openclaw/agents/main/agent/auth-profiles.json` under `vercel-ai-gateway:default`

## Workflow

### 1. Choose template & read specs
Use `DEFAULT_TEMPLATE` from `.env` or `elegant-founder`. Load `references/<template>.md` for design specs.

### 2. Structure content into slides
One idea per slide. Typical flow:
- **Slide 1: Hook** — bold statement, scroll-stopping. THE most important slide.
- **Slides 2–3: Evidence** — data, stats, examples
- **Slide 4: Insight** — the "so what"
- **Slide 5: Close** — takeaway + handle

### 3. Generate slides via AI image model
Each slide is fully AI-generated — text and imagery composed as ONE piece (not text overlaid on image).

**API call:**
```bash
curl -s -X POST "https://ai-gateway.vercel.sh/v1/images/generations" \
  -H "Authorization: Bearer ${AI_GW_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-image-1",
    "prompt": "<slide prompt>",
    "n": 1,
    "size": "1536x1024",
    "quality": "high"
  }'
```

Response: `data[0].b64_json` — decode to PNG.

**API key location:** `~/.openclaw/agents/main/agent/auth-profiles.json` → `profiles["vercel-ai-gateway:default"].key`

**Dimensions:** Always 1536×1024 (16:9). This is the native output and works for X, LinkedIn link previews, and article cards.

### 4. Post-process: brand logo compositing
AI image models can't reliably render logos or spell brand names. Post-process every slide:

1. **Render real logo** as PNG via Playwright (HTML → screenshot with correct fonts + SVG)
2. **Find AI-generated logo region** — scan bottom 150px of each slide for bright pixels (dark slides) or dark pixels (light slides) in the left 500px
3. **Blank the region** — fill with sampled background color. For gradient backgrounds, sample a strip above the logo and tile/blend downward
4. **Composite real logo** — paste rendered logo PNG at the blanked position

**Logo rendering (Playwright):**
```html
<!-- Render at viewport 250x40, screenshot to PNG -->
<div style="display:flex; align-items:center; gap:10px;">
  <svg><!-- brand logo SVG from identity.md --></svg>
  <span style="font-family:'Plus Jakarta Sans'; font-size:19px; font-weight:600;">BrandName</span>
</div>
```

**PIL compositing:**
```python
from PIL import Image, ImageDraw
slide = Image.open("slide.png").convert("RGB")
logo = Image.open("logo.png").convert("RGB")
draw = ImageDraw.Draw(slide)
draw.rectangle([logo_x1, logo_y1, logo_x2, logo_y2], fill=bg_color)
slide.paste(logo, (x, y))
slide.save("output.png", "PNG")
```

**Light mode gotcha:** Gradient backgrounds need gradient-matched blanking. Sample pixels from just above the logo area and blend, or copy a horizontal strip to preserve the gradient.

### 5. Upload & attach to draft
Upload to Supabase storage with cache-busting query params:
```bash
curl -X PUT "${SUPABASE_URL}/storage/v1/object/media/slides/${slug}/slide-${i}.png" \
  -H "x-upsert: true" --data-binary @slide.png
```
Update the draft's `media_urls` array with `?v=${timestamp}` params to bust browser cache.

**Important:** The dashboard uses `app_content_dashboard` schema, NOT `public`. The `cd_drafts` view in public is read-only.

### 6. Review & iterate
Review each rendered slide visually. Common issues:
- AI text rendering errors (misspellings, wrong fonts) — these are expected, the text is "close enough" for social
- Logo/brand name wrong — fixed by post-processing
- Imagery too dark/light — adjust prompt or regenerate

## Prompt Craft

### Hook slides (slide 1)
The hook MUST be scroll-stopping. Think movie poster, not presentation slide.

**Pattern:**
```
Dark dramatic 16:9 editorial social media cover image. MASSIVE bold white serif text 
taking up 60% of the frame reading: [HEADLINE]. The text is ENORMOUS, overlapping and 
interweaving with the imagery. Behind and breaking through the text: [IMAGERY — abstract, 
on-brand, dramatic]. Deep black background with [LIGHTING]. Text and image are ONE 
composition, not layered separately. Small muted text at bottom: [SUBTITLE]. 
No logos, no UI. Dramatic, edgy, scroll-stopping.
```

Key: text and imagery INTERWEAVE. Figures/objects break through letterforms.

### Data slides
```
Dark cinematic 16:9 editorial slide. Near-black background. Behind the text, [RELEVANT 
VISUALIZATION]. Upper-left: small coral-orange uppercase label [LABEL]. Below: enormous 
white serif numerals [STAT]. Below in muted gray: [CONTEXT]. Bottom-left: small brand 
name. Bottom-right: [N/T]. All text crisp and legible.
```

### Insight slides (light mode)
```
Light ethereal 16:9 editorial slide. Soft sky-blue to white gradient. Behind the text, 
[ABSTRACT IMAGERY]. Large black italic serif text: [INSIGHT]. Below in gray: [CONTEXT]. 
Style: editorial, soft, premium.
```

### Close slides
```
Dark cinematic 16:9 editorial slide. [GRAND BACKGROUND IMAGERY]. CENTER: coral accent 
line, then large white italic serif text centered: [TAKEAWAY]. Below: @handle in gray.
```

### Prompt rules
- Always end with "No text, no UI elements" — image models love adding random text
- Include "No logos" — let post-processing handle the real logo
- Request specific text to render, but expect ~80% accuracy
- Keep imagery abstract/editorial — never literal stock-photo style
- For Recoupable: use music-tech imagery (soundwaves, nodes, data streams, studio equipment with digital overlays) not sci-fi humanoids

## Available Templates

| Template | Style | Best For | Reference |
|----------|-------|----------|-----------|
| `elegant-founder` | Dark/light modes, Instrument Serif, coral accent, editorial | Thought leadership, data breakdowns, industry analysis | [references/elegant-founder.md](references/elegant-founder.md) |

## Slide Count Guidelines

- **X thread companion:** 3–5 slides. Punchier.
- **LinkedIn carousel:** 5–10 slides. 5 minimum for narrative.
- **Instagram:** 5–7 slides.

## Content Principles

- The hook slide determines whether anyone swipes. Spend disproportionate effort on it.
- Every slide earns its place. One idea per slide.
- Data > opinions. Lead with numbers.
- Hook imagery should be edgy and provocative. Inner slides can be more composed.

## Output

Slides saved as `slide-0.png` through `slide-N.png`. Working files in `/tmp/social-slides/<slug>/`.
