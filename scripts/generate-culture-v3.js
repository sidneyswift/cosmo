#!/usr/bin/env node
/**
 * Culture thumbnails v3 — emotion-first.
 * 
 * Pebble formula applied to Recoup:
 * - Living characters feeling something
 * - Richly detailed, painterly illustration (NOT flat graphic)
 * - Dramatic scale contrast (big world + small figure, or big object + small person)
 * - Narrative tension between subject and environment
 * - Culture/creativity territory without being literal about music
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = '/tmp/depth-thumbnail/culture-v3';
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

// Style prefix for all prompts — Pebble-quality illustration
const STYLE = `Richly detailed painterly illustration with visible brushstrokes, atmospheric depth, and warm lighting. Semi-realistic anime-inspired style like Studio Ghibli or Makoto Shinkai — detailed textures, atmospheric haze, emotional depth of field. NOT flat graphic, NOT poster art, NOT vector. Hand-painted feeling with fine detail.`;

const SCENES = [
  {
    id: 'speaker-kid',
    prompt: `${STYLE} A small kid wearing oversized headphones sitting cross-legged on top of a MASSIVE vintage speaker cabinet in an enormous empty warehouse. The speaker is 20 feet tall — the kid is tiny on top of it, dangling legs over the edge, lost in music with eyes closed. Warm golden light streams through high warehouse windows. Dust particles float in the air. The scale contrast creates awe — tiny human, massive sound. The kid is in the BOTTOM CENTER of the frame, small. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'rooftop-creator',
    prompt: `${STYLE} A lone figure sitting on the edge of a rooftop at twilight, legs dangling over the edge, looking out at a vast city skyline that stretches to the horizon. They have a small notebook in their lap. The city glows with thousands of warm lights below. The figure is SMALL — positioned in BOTTOM LEFT — dwarfed by the infinite city. The feeling: quiet ambition before the work begins. Warm purple-gold twilight sky. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'vinyl-canyon',
    prompt: `${STYLE} A tiny person standing at the bottom of a massive vinyl record groove, as if the groove were a canyon. The ridges of the record tower above them like canyon walls, catching prismatic light. The person looks up in wonder at the scale of it — sound made physical and enormous. Warm amber light filtering from above. The person is VERY SMALL in BOTTOM CENTER. The record groove stretches in both directions like an infinite landscape. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'lantern-girl',
    prompt: `${STYLE} A girl standing on a rooftop, releasing a single glowing paper lantern into a night sky already dotted with city lights. Her face is lit by the warm orange glow of the lantern. Below her, a vast city stretches in every direction. The lantern is small but bright — the one light she's adding to the millions below. She's in the BOTTOM RIGHT, small against the enormous cityscape. The feeling: one voice joining a world of voices. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'train-window',
    prompt: `${STYLE} A person sitting alone by a train window at golden hour, head resting against the glass, eyes looking out at a beautiful landscape blurring past — fields, distant mountains, warm sunset. Their reflection is faintly visible in the glass. Earbuds in, lost in thought. The world outside is vast and moving. The person is positioned in the RIGHT SIDE, small relative to the expansive window view. The feeling: creative daydreaming, ideas forming. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'mural-painter',
    prompt: `${STYLE} A small figure on a tall ladder painting a massive colorful mural on an enormous concrete wall. They're tiny against the wall — the mural is 50 feet tall and bursting with abstract color and energy. Paint drips run down the concrete. Late afternoon golden light rakes across the wall. The painter is in the BOTTOM LEFT, very small. The mural dominates the frame. The feeling: one person making something bigger than themselves. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'ocean-of-records',
    prompt: `${STYLE} Aerial view of a vast ocean, but the water is made of thousands of vinyl records floating on the surface, their labels catching the light like lily pads. A small wooden boat with a single person rowing through this sea of music. The horizon stretches infinitely. Warm sunset light. The boat is SMALL in CENTER BOTTOM. The feeling: navigating an ocean of culture. Magical realism. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'empty-stage',
    prompt: `${STYLE} An enormous empty concert stage in a vast outdoor venue, seen from behind — looking out at thousands of empty seats stretching to the horizon under a dramatic sunset sky. A single small figure stands center stage, alone, looking out at the empty seats. One spotlight illuminates them from above. The figure is SMALL in BOTTOM CENTER. The scale is overwhelming — one person, infinite potential audience. The feeling: the moment before everything begins. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'frequency-forest',
    prompt: `${STYLE} A magical forest where the trees are shaped like audio equalizer bars — tall rectangular trunks of varying heights, glowing softly with warm bioluminescent light. A small fox sits at the base of the tallest tree, looking up. Fireflies that look like musical notes float between the trees. The fox is SMALL in BOTTOM RIGHT. The forest stretches deep into atmospheric haze. The feeling: nature and music are the same thing. No text no words no UI. 16:9 landscape.`,
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
      quality: 'high',
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

  console.log('=== PHASE 1: Generate 9 emotion-first scenes ===\n');
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
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== PHASE 2: Composite ${scenes.length} scenes ===\n`);
  const results = [];
  for (const scene of scenes) {
    console.log(`Compositing ${scene.id}...`);
    const thumbPath = await compositeScene(scene.scenePath, scene.id);
    if (thumbPath) {
      results.push({ id: scene.id, path: thumbPath });
      console.log(`  ✅\n`);
    }
  }

  console.log(`\n=== DONE: ${results.length}/9 ===`);
  results.forEach(r => console.log(`  ${r.id}: ${r.path}`));
}

main().catch(console.error);
