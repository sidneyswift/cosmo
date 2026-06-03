#!/usr/bin/env node
/**
 * Generate 9 culture-themed scene images for Recoup thumbnail exploration.
 * Small subjects, tasteful masking, music/culture feel without being literal.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = '/tmp/depth-thumbnail/culture9';
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

const SCENES = [
  {
    id: 'street-culture',
    prompt: `Bold graphic illustration. An empty city street at golden hour, warm light casting long shadows. A single small figure walking away in the distance, back turned. Fresh wheat-paste posters and street art on the walls. The energy of a neighborhood where culture is born. Small figure positioned in the BOTTOM MIDDLE, taking up less than 10% of the frame. Vast atmospheric sky above. Clean flat shapes, strong silhouettes, bold color blocks. Poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'studio-glow',
    prompt: `Bold graphic illustration. A dark hallway with a single door slightly ajar, warm golden-orange light spilling through the crack onto the floor. The creative process happening behind closed doors — mysterious, inviting. The glowing door is small, positioned in the CENTER of the frame. Dark rich atmosphere. Clean flat shapes, bold color blocks, dramatic lighting contrast. Poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'festival-dawn',
    prompt: `Bold graphic illustration. An empty open field at dawn, soft pink-purple sky. Scattered confetti and small flags on the ground. A single lone folding chair in the middle distance. The feeling after something incredible just happened — quiet aftermath of cultural energy. The chair is SMALL in the frame, positioned BOTTOM CENTER. Vast open sky takes up most of the image. Clean flat shapes, bold color blocks. Poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'vinyl-glow',
    prompt: `Bold graphic illustration. Close-up of a vinyl record spinning on a turntable, light catching the grooves creating prismatic rainbow reflections. Highly stylized and graphic — flat color blocks, not photorealistic. The record takes up the BOTTOM RIGHT portion of the frame, with the rest being rich dark atmospheric space with subtle light rays. Clean shapes, poster art. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'culture-artifacts',
    prompt: `Bold graphic illustration. Birds-eye view of cultural artifacts arranged on a dark surface: a vintage camera, a pair of classic sneakers, a cassette tape, scattered polaroid photos. Like museum objects of creative culture. Small items clustered in the BOTTOM LEFT of the frame. Rich dark background with dramatic overhead lighting. Clean flat shapes, bold colors. Poster art aesthetic. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'neon-rain',
    prompt: `Bold graphic illustration. A rainy city street at night, neon signs reflecting in wet pavement creating streaks of pink, blue, and purple light. A single small figure with an umbrella walking in the distance. The vibe of a music video. Figure positioned BOTTOM CENTER, very small. Vast neon-lit cityscape fills the frame. Clean flat shapes, bold color blocks, dramatic neon contrast. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'sound-wave',
    prompt: `Bold graphic illustration. An abstract landscape where rolling hills are shaped like audio waveforms — smooth curves that look both like terrain and sound waves. A tiny figure standing at the peak of one wave, looking out over the sonic landscape. Warm sunset colors, purple and orange gradient sky. Figure is VERY SMALL at TOP CENTER. Clean flat shapes, bold graphic style. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'creators-window',
    prompt: `Bold graphic illustration. A window view looking out over a sprawling city at twilight. On the windowsill: a small potted plant, a coffee cup, headphones resting casually. The quiet moment of a creator looking out at the world they're about to shape. Objects small on the BOTTOM edge of frame, vast cityscape beyond. Clean flat shapes, bold color blocks, warm interior vs cool exterior contrast. No text no words no UI. 16:9 landscape.`,
  },
  {
    id: 'crowd-wave',
    prompt: `Bold graphic illustration. An aerial view of thousands of tiny human silhouettes forming a massive wave or flow pattern, like a river of people moving together. The crowd is both individuals and a collective force — culture as movement. Silhouettes are small and textural, forming a shape that flows from BOTTOM LEFT to TOP RIGHT. Rich contrasting colors: dark crowd against warm golden background. Clean graphic style. No text no words no UI. 16:9 landscape.`,
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

  console.log('=== PHASE 1: Generate 9 culture scenes ===\n');

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

  console.log(`\n=== DONE: ${results.length}/9 thumbnails ===`);
  results.forEach(r => console.log(`  ${r.id}: ${r.path}`));
}

main().catch(console.error);
