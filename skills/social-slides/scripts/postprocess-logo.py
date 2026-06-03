#!/usr/bin/env python3
"""
Post-process AI-generated slides: replace AI-rendered logos with real brand assets.

Usage:
  python3 postprocess-logo.py <input_dir> <output_dir> [--light-slides 3]

Arguments:
  input_dir       Directory containing slide-0.png through slide-N.png
  output_dir      Directory for processed output (created if needed)
  --light-slides  Comma-separated slide indices that use light backgrounds (default: none)

Requires:
  - Pillow: pip3 install Pillow
  - Playwright with Chromium: npx playwright install chromium
  - Brand identity at ~/.config/sid/identity.md (logo SVG path + brand name)
"""

import argparse
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw


def parse_identity():
    """Read brand name and logo SVG from identity file."""
    identity_path = Path.home() / ".config" / "sid" / "identity.md"
    if not identity_path.exists():
        print(f"ERROR: Identity file not found at {identity_path}")
        sys.exit(1)
    
    text = identity_path.read_text()
    brand_name = "Recoupable"  # default
    logo_path = None
    
    for line in text.split("\n"):
        if line.startswith("- Company:"):
            brand_name = line.split(":", 1)[1].strip()
        elif line.startswith("- Logo:"):
            logo_path = Path(line.split(":", 1)[1].strip().replace("~", str(Path.home())))
    
    return brand_name, logo_path


def read_logo_svg(logo_path):
    """Read the SVG path data from the logo file."""
    if logo_path and logo_path.exists():
        svg_text = logo_path.read_text()
        # Extract the path d attribute
        import re
        match = re.search(r'd="([^"]+)"', svg_text)
        if match:
            return match.group(1)
    # Fallback: Recoupable logo path
    return "M118.106 41C112.845 41 108.581 45.2558 108.581 50.5056V88.3242C108.581 93.9241 106.846 99.3868 103.613 103.964C98.5169 111.179 90.2239 115.471 81.3785 115.471H57.525C52.2645 115.471 48 119.727 48 124.977V172.304C48 177.554 52.2645 181.81 57.525 181.81H104.894C110.155 181.81 114.419 177.554 114.419 172.304V139.968C114.419 133.432 116.445 127.056 120.218 121.714L120.885 120.77C126.833 112.348 136.512 107.339 146.836 107.339H165.475C170.736 107.339 175 103.083 175 97.833V50.5056C175 45.2558 170.736 41 165.475 41H118.106Z"


def render_logo_png(output_dir, brand_name, svg_path_d, variant="white"):
    """Render brand logo + name as PNG via Playwright HTML screenshot."""
    fill = "white" if variant == "white" else "#0a0a0a"
    bg = "#0a0a0a" if variant == "white" else "#d8dfe8"
    
    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600&display=swap');
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: 250px; height: 40px; background: {bg}; }}
  body {{ display: flex; align-items: center; padding-left: 4px; }}
</style>
</head>
<body>
<div style="display:flex; align-items:center; gap:10px;">
  <svg width="26" height="29" viewBox="48 41 127 141" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="{svg_path_d}" fill="{fill}"/>
  </svg>
  <span style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; font-size:19px; font-weight:600; color:{fill}; letter-spacing:-0.02em;">{brand_name}</span>
</div>
</body></html>"""
    
    html_path = output_dir / f"logo-{variant}.html"
    png_path = output_dir / f"logo-{variant}.png"
    html_path.write_text(html)
    
    subprocess.run([
        "npx", "playwright", "screenshot",
        "--viewport-size=250,40",
        f"file://{html_path}", str(png_path)
    ], capture_output=True, check=True)
    
    return Image.open(png_path).convert("RGB")


def find_logo_bounds(img, is_dark):
    """Find bounding box of AI-generated logo pixels in bottom-left of image."""
    w, h = img.size
    min_x, max_x, min_y, max_y = w, 0, h, 0
    
    for y in range(h - 150, h):
        for x in range(0, min(500, w)):
            r, g, b = img.getpixel((x, y))
            is_logo = (r > 80 or g > 80 or b > 80) if is_dark else (r < 100 and g < 100 and b < 100)
            if is_logo:
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    
    return (min_x, min_y, max_x, max_y) if max_x > min_x else None


def sample_bg_color(img, is_dark, y_region):
    """Sample the background color from the image near the logo area."""
    w, h = img.size
    if is_dark:
        return (10, 10, 10)
    # For light backgrounds, sample from right side at same y
    samples = [img.getpixel((w - 50 + x, y_region)) for x in range(40)]
    return tuple(sum(c) // len(samples) for c in zip(*samples))


def process_slide(input_path, output_path, logo_img, is_dark):
    """Composite real logo onto a single slide."""
    slide = Image.open(input_path).convert("RGB")
    w, h = slide.size
    draw = ImageDraw.Draw(slide)
    
    bounds = find_logo_bounds(slide, is_dark)
    
    if bounds:
        bx1, by1, bx2, by2 = bounds
        bg = sample_bg_color(slide, is_dark, (by1 + by2) // 2)
        
        # For light mode with gradient, use strip-copying
        if not is_dark:
            strip_y = by1 - 5
            for y in range(by1 - 10, h):
                for x in range(0, bx2 + 20):
                    pixel = slide.getpixel((x, strip_y))
                    right_px = slide.getpixel((w - 100, y))
                    r = int(pixel[0] * 0.7 + right_px[0] * 0.3)
                    g = int(pixel[1] * 0.7 + right_px[1] * 0.3)
                    b = int(pixel[2] * 0.7 + right_px[2] * 0.3)
                    slide.putpixel((x, y), (r, g, b))
        else:
            draw.rectangle([bx1 - 10, by1 - 10, bx2 + 10, by2 + 10], fill=bg)
        
        logo_x = bx1
        logo_y = (by1 + by2) // 2 - logo_img.height // 2
    else:
        # No AI logo found — place in bottom-left corner
        draw.rectangle([20, h - 55, 270, h - 10], fill=(10, 10, 10) if is_dark else (200, 210, 220))
        logo_x = 25
        logo_y = h - 50
    
    slide.paste(logo_img, (logo_x, logo_y))
    slide.save(output_path, "PNG")
    return True


def main():
    parser = argparse.ArgumentParser(description="Post-process AI-generated slides with real brand logo")
    parser.add_argument("input_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--light-slides", default="", help="Comma-separated indices of light-bg slides")
    args = parser.parse_args()
    
    args.output_dir.mkdir(parents=True, exist_ok=True)
    light_indices = set(int(x) for x in args.light_slides.split(",") if x.strip())
    
    brand_name, logo_path = parse_identity()
    svg_path_d = read_logo_svg(logo_path)
    
    print(f"Brand: {brand_name}")
    print(f"Rendering logos...")
    logo_white = render_logo_png(args.output_dir, brand_name, svg_path_d, "white")
    logo_dark = render_logo_png(args.output_dir, brand_name, svg_path_d, "dark")
    
    slides = sorted(args.input_dir.glob("slide-*.png"))
    print(f"Processing {len(slides)} slides...")
    
    for slide_path in slides:
        idx = int(slide_path.stem.split("-")[1])
        is_dark = idx not in light_indices
        logo = logo_white if is_dark else logo_dark
        output_path = args.output_dir / slide_path.name
        
        process_slide(slide_path, output_path, logo, is_dark)
        mode = "dark" if is_dark else "light"
        print(f"  {slide_path.name} ({mode}) → {output_path.name}")
    
    print("Done!")


if __name__ == "__main__":
    main()
