#!/usr/bin/env node
/**
 * Generate 9 scene images with subjects at different grid positions.
 * Then run each through the depth-thumbnail compositor.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = '/tmp/depth-thumbnail/grid9';
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

const GRID = [
  { pos: 'top-left',      subject: 'a tall radio antenna tower', placement: 'positioned in the TOP LEFT of the frame', scene: 'overlooking a foggy coastal city at dawn, ocean in the distance' },
  { pos: 'top-middle',    subject: 'a hot air balloon', placement: 'centered at the TOP MIDDLE of the frame, high in the sky', scene: 'above rolling farmland with patchwork fields below' },
  { pos: 'top-right',     subject: 'a lighthouse', placement: 'positioned in the TOP RIGHT of the frame', scene: 'on a dramatic cliff with waves crashing below, stormy sky' },
  { pos: 'middle-left',   subject: 'a robot standing upright', placement: 'positioned at the LEFT CENTER of the frame', scene: 'on a desert mesa with vast canyon stretching to the right' },
  { pos: 'middle-middle', subject: 'a large tree with spreading branches', placement: 'CENTERED in the middle of the frame', scene: 'on a grassy plain with mountains in the background, golden hour' },
  { pos: 'middle-right',  subject: 'a rocket on a launch pad', placement: 'positioned at the RIGHT CENTER of the frame', scene: 'with open sky and distant mountains to the left' },
  { pos: 'bottom-left',   subject: 'a wolf sitting', placement: 'positioned in the BOTTOM LEFT of the frame', scene: 'on a snowy ridge with northern lights in the sky above' },
  { pos: 'bottom-middle', subject: 'a small robot sitting', placement: 'CENTERED at the BOTTOM MIDDLE of the frame', scene: 'on a cliff edge looking out over a vast valley at sunset' },
  { pos: 'bottom-right',  subject: 'a samurai statue', placement: 'positioned in the BOTTOM RIGHT of the frame', scene: 'with cherry blossom trees and a temple in the misty background' },
];

async function generateScene(config, key) {
  const prompt = `Bold graphic illustration. ${config.subject} ${config.placement}, ${config.scene}. Clean flat shapes, strong silhouettes, bold color blocks. Poster art aesthetic. Rich saturated colors. Sharp clean edges, minimal texture. The subject must have a CLEAR SILHOUETTE that stands out from the background. No text, no words, no UI elements. 16:9 landscape.`;

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-image-2',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  ❌ ${config.pos}: API error - ${err.slice(0, 200)}`);
    return null;
  }

  const data = await response.json();
  if (!data.data?.[0]) return null;

  const img = data.data[0];
  const scenePath = join(OUT_DIR, `scene_${config.pos}.png`);

  if (img.b64_json) {
    writeFileSync(scenePath, Buffer.from(img.b64_json, 'base64'));
  } else if (img.url) {
    const imgRes = await fetch(img.url);
    writeFileSync(scenePath, Buffer.from(await imgRes.arrayBuffer()));
  }

  return scenePath;
}

async function compositeScene(scenePath, pos) {
  const outPath = join(OUT_DIR, `thumb_${pos}.png`);
  try {
    const result = execSync(
      `python3 "${DEPTH_SCRIPT}" "${scenePath}" -o "${outPath}" --analyze --wordmark-svg "${LOGO_SVG}"`,
      { encoding: 'utf-8', timeout: 180000 }
    );
    console.log(result);
    return outPath;
  } catch (e) {
    console.error(`  ❌ Composite failed for ${pos}:`, e.message?.slice(0, 200));
    return null;
  }
}

async function main() {
  const key = getGatewayKey();
  if (!key) { console.error('No gateway key'); process.exit(1); }

  console.log('=== PHASE 1: Generate 9 scenes ===\n');

  // Generate sequentially to avoid rate limits
  const scenes = [];
  for (const config of GRID) {
    console.log(`Generating ${config.pos}: ${config.subject}...`);
    const path = await generateScene(config, key);
    if (path) {
      console.log(`  ✅ ${path}`);
      scenes.push({ ...config, scenePath: path });
    } else {
      console.log(`  ❌ Failed`);
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== PHASE 2: Composite ${scenes.length} scenes ===\n`);

  const results = [];
  for (const scene of scenes) {
    console.log(`Compositing ${scene.pos}...`);
    const thumbPath = await compositeScene(scene.scenePath, scene.pos);
    if (thumbPath) {
      results.push({ pos: scene.pos, path: thumbPath });
      console.log(`  ✅ ${thumbPath}`);
    }
  }

  console.log(`\n=== DONE: ${results.length}/9 thumbnails ===`);
  results.forEach(r => console.log(`  ${r.pos}: ${r.path}`));
}

main().catch(console.error);
