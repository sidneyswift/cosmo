#!/usr/bin/env node
/**
 * Culture thumbnails v2 — dialing into urban culture, creativity, atmosphere.
 * Key learnings: vast open sky, small subjects, warm tones, not literal about music.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = '/tmp/depth-thumbnail/culture-v2';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/images/generations';
const LOGO_SVG = join(homedir(), 'Documents/projects/mono/marketing/design/logos/logo-darkmode.svg');
const DEPTH_SCRIPT = join(__dirname, 'depth-thumbnail.py');

function getGatewayKey() {
  try {
    const authPath = join(homedir(), '.openclaw/agents/main/agent/auth-profiles.json');
    const auth = JSON.parse(readFileSync(authPath, 'utf-8'));
    return auth?.profiles?.['vercel-ai-gateway:default']?.key;
  } catch { return null; }
}

// Learnings applied:
// - Vast open sky/atmosphere in upper half (logo needs room to breathe)
// - Small subjects below or beside the logo
// - Warm tones + golden hour palette
// - Urban culture + atmosphere territory
// - NOT literal about music (no instruments, no performers)
const SCENES = [
  {
    id: 'rooftop-dawn',
    prompt: `Bold graphic illustration. A rooftop at dawn overlooking a vast city skyline. A pair of headphones resting casually on the concrete ledge in the BOTTOM RIGHT corner, very small. Massive open sky with pink and gold clouds takes up 70% of the frame. City buildings silhouetted below. The morning after a late creative session. Warm golden light, long shadows. Clean flat shapes, strong silhouettes, poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'recording-booth',
    prompt: `Bold graphic illustration. Interior of an empty recording booth seen through the glass. A single microphone stand in warm overhead light, positioned SMALL in the CENTER BOTTOM of the frame. Sound foam panels on walls. The glass creates a subtle reflection. Moody, warm amber tones. The space where creativity happens, not the act. Clean flat shapes, poster art. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'tokyo-crossing',
    prompt: `Bold graphic illustration. Aerial birds-eye view of a massive city intersection at twilight, like Shibuya crossing. Tiny figures walking in every direction, creating patterns of movement. The figures are very small — this is about the PATTERN and ENERGY, not individuals. Warm city lights beginning to glow, blue-purple twilight sky. Clean flat graphic shapes, poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'mural-wall',
    prompt: `Bold graphic illustration. A vibrant abstract street mural painted on a large concrete wall, taking up the BOTTOM HALF of the frame. The mural is colorful and abstract (geometric shapes, flowing lines, bold color blocks) — NOT music themed. Above the wall: vast open sky at golden hour. A small bird perched on the wall's edge. Paint drips on the concrete below. Clean flat shapes, poster art. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'vintage-marquee',
    prompt: `Bold graphic illustration. An old theater marquee at dusk with warm yellow bulb lights glowing along its frame. The marquee is EMPTY — no letters, just the illuminated frame structure. Below it, a quiet city street. A single small figure walking past. Twilight sky with deep blue and pink gradients. Nostalgic but forward-looking. Clean flat shapes, poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'desert-highway',
    prompt: `Bold graphic illustration. An endless desert highway stretching to the horizon from a low angle. A single vintage car trailing a plume of dust, VERY SMALL in the distance at BOTTOM CENTER. Massive dramatic sky with layered orange, pink, and purple sunset clouds taking up 75% of the frame. Open, free, independent. Clean flat shapes, bold color blocks, poster art. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'skatepark-golden',
    prompt: `Bold graphic illustration. An empty concrete skate park bowl at golden hour. Long dramatic shadows cast across the curves. A single skateboard left at the edge of the bowl, SMALL in BOTTOM LEFT. Vast warm sky above. The culture that music soundtracks — youth, freedom, movement. Clean flat shapes, warm tones, poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'warehouse-light',
    prompt: `Bold graphic illustration. Massive industrial warehouse doors from outside, slightly open with warm golden light streaming through the gap onto wet pavement. The gap of light is positioned at CENTER BOTTOM, narrow but bright. Dark building exterior, rain-slicked ground reflecting the light. The underground creative space. Clean flat shapes, dramatic light contrast, poster art. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'paper-planes',
    prompt: `Bold graphic illustration. Hundreds of small white paper planes filling a vast sunset sky, each one catching golden light at different angles. They flow upward from BOTTOM LEFT to TOP RIGHT like a flock of birds. Below, a minimal city skyline silhouette at the horizon. Each plane is an idea taking flight. Rich warm sunset palette: gold, coral, soft purple. Clean flat shapes, poster art. No text no words no UI. 16:9 landscape.`,
  },
];

async function generateScene(config, key) {
  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-image-2',
      prompt: config.prompt,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  ❌ ${config.id}: API error - ${err.slice(0, 200)}`);
    return null;
  }

  const data = await response.json();
  if (!data.data?.[0]) return null;

  const img = data.data[0];
  const scenePath = join(OUT_DIR, `scene_${config.id}.png`);

  if (img.b64_json) {
    writeFileSync(scenePath, Buffer.from(img.b64_json, 'base64'));
  } else if (img.url) {
    const imgRes = await fetch(img.url);
    writeFileSync(scenePath, Buffer.from(await imgRes.arrayBuffer()));
  }
  return scenePath;
}

async function compositeScene(scenePath, id) {
  const outPath = join(OUT_DIR, `thumb_${id}.png`);
  try {
    const result = execSync(
      `python3 "${DEPTH_SCRIPT}" "${scenePath}" -o "${outPath}" --analyze --wordmark-svg "${LOGO_SVG}"`,
      { encoding: 'utf-8', timeout: 180000 }
    );
    console.log(result.trim());
    return outPath;
  } catch (e) {
    console.error(`  ❌ Composite failed for ${id}:`, e.message?.slice(0, 200));
    return null;
  }
}

async function main() {
  const key = getGatewayKey();
  if (!key) { console.error('No gateway key'); process.exit(1); }

  console.log('=== PHASE 1: Generate 9 culture v2 scenes ===\n');
  const scenes = [];
  for (const config of SCENES) {
    console.log(`Generating ${config.id}...`);
    const path = await generateScene(config, key);
    if (path) {
      console.log(`  ✅ ${path}`);
      scenes.push({ ...config, scenePath: path });
    } else {
      console.log(`  ❌ Failed`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== PHASE 2: Composite ${scenes.length} scenes ===\n`);
  const results = [];
  for (const scene of scenes) {
    console.log(`Compositing ${scene.id}...`);
    const thumbPath = await compositeScene(scene.scenePath, scene.id);
    if (thumbPath) {
      results.push({ id: scene.id, path: thumbPath });
      console.log(`  ✅ ${thumbPath}\n`);
    }
  }

  console.log(`\n=== DONE: ${results.length}/9 ===`);
  results.forEach(r => console.log(`  ${r.id}: ${r.path}`));
}

main().catch(console.error);
