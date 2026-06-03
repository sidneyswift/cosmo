#!/usr/bin/env python3
"""
Depth-composite thumbnail generator for Recoup.

Pipeline:
1. Takes a background scene image
2. Vision model analyzes the scene → outputs wordmark placement + subject bounding box
3. Generates a segmentation mask via SAM-like approach or vision-guided polygon
4. Layers: background → wordmark (centered) → masked foreground on top

Usage:
  python3 depth-thumbnail.py <scene_image> --analyze
  python3 depth-thumbnail.py <scene_image> --wordmark-y 0.45 --subject-box 0,0.2,0.35,0.85
"""

import argparse
import base64
import http.client
import json
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter
from rembg import remove

DEFAULT_WORDMARK_SVG = os.path.expanduser(
    "~/Documents/projects/mono/marketing/design/logos/logo-darkmode.svg"
)
TEMP_DIR = Path("/tmp/depth-thumbnail")
AUTH_PROFILES = os.path.expanduser(
    "~/.openclaw/agents/main/agent/auth-profiles.json"
)


def get_gateway_key(override=None):
    if override:
        return override
    try:
        with open(AUTH_PROFILES) as f:
            data = json.load(f)
        return data["profiles"]["vercel-ai-gateway:default"]["key"]
    except Exception:
        return os.environ.get("AI_GATEWAY_API_KEY")


def analyze_scene(image_path: str, gateway_key: str) -> dict:
    """
    Vision model analyzes scene for optimal depth compositing.
    Returns placement + subject bounding box + ground line.
    """
    print("Analyzing scene with vision model...")

    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    prompt = """You are a compositing director for depth-effect thumbnails. A large brand wordmark will be overlaid on this image, and certain foreground elements must appear IN FRONT of the text to create a layered depth illusion.

Analyze this scene and provide:

1. **wordmark_y** (0.0=top, 1.0=bottom): Where should the wordmark center be placed? Usually 0.35-0.55 (middle zone).

2. **subject_box** [x1, y1, x2, y2] as fractions (0-1): Bounding box of the MAIN FOREGROUND SUBJECT that should overlap the text. This is typically a character, object, or structure in the near foreground. Be generous — include the full silhouette.

3. **ground_line** (0.0=top, 1.0=bottom): The Y-coordinate where the IMMEDIATE foreground ground plane begins. Everything below this is clearly foreground terrain (close rocks, grass, cliff edge). NOT distant landscape — only the nearest ground surface.

4. **subject**: Brief description.

5. **reasoning**: One sentence.

Respond in JSON only:
{"wordmark_y": 0.42, "subject_box": [0.05, 0.15, 0.40, 0.75], "ground_line": 0.65, "subject": "robot on cliff", "reasoning": "..."}"""

    body = json.dumps({
        "model": "openai/gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{b64}"},
                    },
                ],
            }
        ],
        "max_tokens": 300,
        "temperature": 0.1,
    }).encode()

    conn = http.client.HTTPSConnection("ai-gateway.vercel.sh", timeout=60)
    conn.request(
        "POST",
        "/v1/chat/completions",
        body=body,
        headers={
            "Authorization": f"Bearer {gateway_key}",
            "Content-Type": "application/json",
        },
    )
    resp = conn.getresponse()
    data = json.loads(resp.read())
    conn.close()

    if "error" in data:
        print(f"Vision API error: {data['error']}")
        return {
            "wordmark_y": 0.45, "subject_box": [0.0, 0.2, 0.4, 0.8],
            "ground_line": 0.65, "subject": "unknown", "reasoning": "fallback"
        }

    text = data["choices"][0]["message"]["content"].strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    result = json.loads(text)
    print(f"  → wordmark_y={result['wordmark_y']}")
    print(f"  → subject_box={result['subject_box']}")
    print(f"  → ground_line={result['ground_line']}")
    print(f"  → subject: {result['subject']}")
    print(f"  → reasoning: {result['reasoning']}")
    return result


def svg_to_png(svg_path: str, width: int) -> Image.Image:
    """Convert SVG to PNG at desired width with clean edges."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    out_path = TEMP_DIR / "wordmark.png"

    try:
        subprocess.run(
            ["rsvg-convert", "-w", str(width), "-a", svg_path, "-o", str(out_path)],
            check=True, capture_output=True,
        )
        img = Image.open(out_path).convert("RGBA")
        # Clean anti-aliasing to prevent stroke artifacts
        alpha = img.split()[3]
        clean_alpha = alpha.point(lambda a: 255 if a >= 128 else 0)
        img.putalpha(clean_alpha)
        return img
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    try:
        import cairosvg
        cairosvg.svg2png(url=svg_path, write_to=str(out_path), output_width=width)
        img = Image.open(out_path).convert("RGBA")
        alpha = img.split()[3]
        clean_alpha = alpha.point(lambda a: 255 if a >= 128 else 0)
        img.putalpha(clean_alpha)
        return img
    except ImportError:
        pass

    png_path = svg_path.replace(".svg", ".png")
    if os.path.exists(png_path):
        img = Image.open(png_path).convert("RGBA")
        data = img.getdata()
        new_data = [(0, 0, 0, 0) if (r < 30 and g < 30 and b < 30) else (r, g, b, a)
                    for r, g, b, a in data]
        img.putdata(new_data)
        ratio = width / img.width
        return img.resize((width, int(img.height * ratio)), Image.LANCZOS)

    raise RuntimeError("Cannot convert SVG. Install librsvg or cairosvg.")


def build_depth_mask(
    scene: Image.Image,
    scene_path: str,
    subject_box: list,
    ground_line: float,
    wordmark_y: float,
) -> Image.Image:
    """
    Build a depth mask using multiple signals:
    1. rembg subject extraction (works well on high-contrast subjects)
    2. Vision-guided subject bounding box (fallback when rembg fails)
    3. Ground plane below ground_line

    The mask is combined: rembg OR bbox-region OR ground-plane = depth layer.
    """
    w, h = scene.size

    # Signal 1: rembg subject extraction
    print("  Extracting subject via rembg...")
    scene_bytes = open(scene_path, "rb").read()
    fg_bytes = remove(scene_bytes)
    fg_path = TEMP_DIR / "foreground_subject.png"
    with open(fg_path, "wb") as f:
        f.write(fg_bytes)
    rembg_mask = Image.open(fg_path).convert("RGBA").split()[3]

    # Check if rembg actually found anything meaningful
    rembg_pixels = sum(1 for p in rembg_mask.getdata() if p > 128)
    rembg_coverage = rembg_pixels / (w * h)
    print(f"  rembg coverage: {rembg_coverage:.1%}")

    # Signal 2: Subject bounding box from vision model
    # Create a soft mask within the bbox region using edge detection
    # to identify the subject silhouette
    bx1 = int(subject_box[0] * w)
    by1 = int(subject_box[1] * h)
    bx2 = int(subject_box[2] * w)
    by2 = int(subject_box[3] * h)
    print(f"  Subject bbox: ({bx1},{by1})-({bx2},{by2})")

    # If rembg failed (<2% coverage), use the bbox directly as the subject mask
    # by cropping the scene to the bbox and running rembg on just that region
    if rembg_coverage < 0.02:
        print("  rembg failed on full image, trying bbox crop...")
        # Crop scene to bbox with padding
        pad = 50
        crop_x1 = max(0, bx1 - pad)
        crop_y1 = max(0, by1 - pad)
        crop_x2 = min(w, bx2 + pad)
        crop_y2 = min(h, by2 + pad)

        cropped = scene.crop((crop_x1, crop_y1, crop_x2, crop_y2))
        cropped_path = TEMP_DIR / "cropped_subject.png"
        cropped.save(cropped_path)

        cropped_bytes = open(cropped_path, "rb").read()
        cropped_fg = remove(cropped_bytes)
        cropped_fg_path = TEMP_DIR / "cropped_fg.png"
        with open(cropped_fg_path, "wb") as f:
            f.write(cropped_fg)
        cropped_mask = Image.open(cropped_fg_path).convert("RGBA").split()[3]

        # Check cropped rembg
        cropped_pixels = sum(1 for p in cropped_mask.getdata() if p > 128)
        cropped_coverage = cropped_pixels / (cropped_mask.size[0] * cropped_mask.size[1])
        print(f"  Cropped rembg coverage: {cropped_coverage:.1%}")

        if cropped_coverage > 0.03:
            # Paste cropped mask back into full-size mask
            rembg_mask = Image.new("L", (w, h), 0)
            rembg_mask.paste(cropped_mask, (crop_x1, crop_y1))
            print("  Using cropped rembg result")
        else:
            # rembg completely failed — use bbox as a solid mask
            print("  rembg failed entirely, using bbox as solid mask")
            rembg_mask = Image.new("L", (w, h), 0)
            bbox_draw = ImageDraw.Draw(rembg_mask)
            bbox_draw.rectangle([bx1, by1, bx2, by2], fill=255)

    # Signal 3: Ground plane mask — ONLY the very bottom strip
    # Keep this minimal to avoid terrain/mountains masking the wordmark
    ground_y = int(h * 0.90)  # Only bottom 10% of frame
    fade_zone = int(h * 0.03)  # 3% fade
    ground_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(ground_mask)
    fade_start = max(0, ground_y - fade_zone)
    for y in range(fade_start, h):
        if y >= ground_y:
            alpha = 255
        else:
            alpha = int(255 * (y - fade_start) / max(1, ground_y - fade_start))
        draw.line([(0, y), (w, y)], fill=alpha)

    # Combine all signals
    depth_mask = ImageChops.lighter(rembg_mask, ground_mask)

    # Save debug
    rembg_mask.save(TEMP_DIR / "mask_subject.png")
    ground_mask.save(TEMP_DIR / "mask_ground.png")
    depth_mask.save(TEMP_DIR / "mask_combined.png")

    return depth_mask


def create_depth_thumbnail(
    scene_path: str,
    output_path: str,
    wordmark_svg: str = DEFAULT_WORDMARK_SVG,
    wordmark_y: float = 0.45,
    wordmark_scale: float = 1.1,
    analyze: bool = False,
    gateway_key: str = None,
    subject_box: list = None,
    ground_line: float = None,
) -> str:
    """Create a depth-composite thumbnail."""

    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    # Vision analysis
    if analyze:
        key = get_gateway_key(gateway_key)
        if not key:
            print("WARNING: No gateway key, using defaults")
        else:
            analysis = analyze_scene(scene_path, key)
            wordmark_y = analysis["wordmark_y"]
            subject_box = analysis.get("subject_box", [0.0, 0.2, 0.4, 0.8])
            ground_line = analysis.get("ground_line", 0.65)

    # Defaults
    if subject_box is None:
        subject_box = [0.0, 0.2, 0.4, 0.8]
    if ground_line is None:
        ground_line = 0.65

    print(f"Loading scene: {scene_path}")
    scene = Image.open(scene_path).convert("RGBA")
    w, h = scene.size
    print(f"Scene size: {w}x{h}")

    # Step 1: Build depth mask
    print("Building depth mask...")
    depth_mask = build_depth_mask(scene, scene_path, subject_box, ground_line, wordmark_y)

    # Apply mask to scene
    depth_layer = scene.copy()
    depth_layer.putalpha(depth_mask)
    depth_layer.save(TEMP_DIR / "depth_layer.png")

    # Step 2: Render wordmark
    wm_width = int(w * wordmark_scale)
    print(f"Rendering wordmark at width {wm_width}...")
    wordmark = svg_to_png(wordmark_svg, wm_width)
    print(f"Wordmark size: {wordmark.size}")

    # Step 3: Composite
    composite = scene.copy()

    # Layer 2: Wordmark (centered)
    wm_x = (w - wordmark.width) // 2
    wm_y_px = int(h * wordmark_y) - wordmark.height // 2
    print(f"Placing wordmark at ({wm_x}, {wm_y_px}) [y={wordmark_y:.2f}]")
    composite.paste(wordmark, (wm_x, wm_y_px), wordmark)

    # Layer 3: Depth layer on top
    composite.paste(depth_layer, (0, 0), depth_layer)

    # Convert to RGB
    final = Image.new("RGB", composite.size, (0, 0, 0))
    final.paste(composite, mask=composite.split()[3])
    final.save(output_path, quality=95)
    print(f"Saved: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Depth-composite thumbnails")
    parser.add_argument("scene", help="Path to the scene image")
    parser.add_argument("--output", "-o", default=None)
    parser.add_argument("--wordmark-y", type=float, default=0.45)
    parser.add_argument("--wordmark-scale", type=float, default=1.1)
    parser.add_argument("--wordmark-svg", default=DEFAULT_WORDMARK_SVG)
    parser.add_argument("--analyze", action="store_true")
    parser.add_argument("--gateway-key", default=None)
    parser.add_argument("--subject-box", default=None,
                        help="x1,y1,x2,y2 as fractions 0-1")
    parser.add_argument("--ground-line", type=float, default=None)
    args = parser.parse_args()

    if args.output is None:
        base = Path(args.scene).stem
        args.output = str(Path(args.scene).parent / f"{base}_depth.png")

    sbox = None
    if args.subject_box:
        sbox = [float(x) for x in args.subject_box.split(",")]

    create_depth_thumbnail(
        scene_path=args.scene,
        output_path=args.output,
        wordmark_svg=args.wordmark_svg,
        wordmark_y=args.wordmark_y,
        wordmark_scale=args.wordmark_scale,
        analyze=args.analyze,
        gateway_key=args.gateway_key,
        subject_box=sbox,
        ground_line=args.ground_line,
    )


if __name__ == "__main__":
    main()
