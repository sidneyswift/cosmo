# HTML Lead Magnet Design Spec

All CSS/JS inline. Zero external dependencies. Single file.

## Typography

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

- Body: 16px/1.6 line-height
- H1: 2.5rem, font-weight 700
- H2: 1.75rem, font-weight 600
- H3: 1.25rem, font-weight 600
- Small text: 0.875rem

## Color System

Support both light and dark mode via `prefers-color-scheme`.

```css
:root {
  --bg: #ffffff;
  --bg-secondary: #f8f9fa;
  --text: #1a1a2e;
  --text-secondary: #6b7280;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --border: #e5e7eb;
  --card-bg: #ffffff;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --bg-secondary: #1e293b;
    --text: #f1f5f9;
    --text-secondary: #94a3b8;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
    --border: #334155;
    --card-bg: #1e293b;
    --card-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
}
```

## Layout

- Max content width: 800px, centered
- Padding: 2rem horizontal, 1rem on mobile
- Sections: 4rem vertical spacing
- Cards: 1.5rem padding, border-radius 12px, subtle shadow

## Responsive Breakpoints

```css
@media (max-width: 768px) {
  /* Stack columns, reduce font sizes, full-width cards */
}
@media (max-width: 480px) {
  /* Minimal padding, single column everything */
}
```

## Components

### Sticky Navigation

```html
<nav style="position:sticky;top:0;z-index:100;background:var(--bg);
  border-bottom:1px solid var(--border);padding:0.75rem 2rem;">
  <a href="#section">Section Name</a>
</nav>
```

Smooth scroll: `html { scroll-behavior: smooth; }`

### Tabs

```html
<div class="tabs">
  <button class="tab active" onclick="showTab('tab1')">Tab 1</button>
  <button class="tab" onclick="showTab('tab2')">Tab 2</button>
</div>
<div id="tab1" class="tab-content active">...</div>
<div id="tab2" class="tab-content" style="display:none">...</div>
```

```js
function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(id).style.display = 'block';
  event.target.classList.add('active');
}
```

### Accordion

```html
<details class="accordion">
  <summary>Section Title</summary>
  <div class="accordion-content">Content here</div>
</details>
```

Style with transition on `max-height` for smooth open/close.

### Interactive Checklist

```html
<label class="checklist-item">
  <input type="checkbox" onchange="updateProgress()">
  <span>Checklist item text</span>
</label>
```

Track progress with a counter: "3 of 8 complete"

### Data Tables

```css
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border); }
td { padding: 0.75rem; border-bottom: 1px solid var(--border); }
tr:hover { background: var(--bg-secondary); }
```

On mobile, use horizontal scroll wrapper or reflow to card layout.

### CTA Block

```html
<section class="cta" style="background:var(--accent);color:#fff;
  padding:3rem 2rem;border-radius:12px;text-align:center;margin:3rem 0;">
  <h2>Ready to get started?</h2>
  <p>Brief value statement</p>
  <a href="mailto:..." class="cta-button">Book a Call</a>
</section>
```

### Progress Bar

```html
<div class="progress-bar">
  <div class="progress-fill" style="width:40%"></div>
</div>
```

### Metric Cards (Grid)

```html
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
  <div class="metric-card">
    <div class="metric-value">47%</div>
    <div class="metric-label">Response Rate</div>
  </div>
</div>
```

## File Size Budget

- Target: < 200KB for email attachment
- Hard limit: 500KB
- No base64 images unless essential (use SVG or CSS shapes)
- Minify JS only if approaching limit; readability matters for iteration

## Accessibility

- All interactive elements keyboard-navigable
- Sufficient color contrast (4.5:1 minimum)
- Semantic HTML (`nav`, `main`, `section`, `article`)
- Alt text on any images
- Focus styles on interactive elements
