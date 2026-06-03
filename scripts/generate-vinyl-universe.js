#!/usr/bin/env node
/**
 * Vinyl Universe batch — the winning direction.
 * Universe meets data meets vinyl meets tiny figures in massive creation.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = '/tmp/depth-thumbnail/vinyl-universe';
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

const STYLE = `Richly detailed cinematic illustration, photorealistic textures with painterly atmospheric lighting. Dramatic scale, warm golden and amber tones with deep shadows. Visible surface detail and texture. Semi-realistic, emotionally powerful. Like concept art for a prestige film.`;

const SCENES = [
  {
    id: 'vinyl-spiral',
    prompt: `${STYLE} Inside a massive spiral of vinyl record grooves that twist upward like a galaxy or spiral staircase into warm golden light above. A tiny figure stands at the center bottom, looking up at the spiraling grooves that stretch infinitely overhead. The grooves catch amber and gold light, creating prismatic reflections. The scale is cosmic — the figure is minuscule. No text no UI. 16:9.`,
  },
  {
    id: 'waveform-canyon',
    prompt: `${STYLE} A vast canyon whose walls are made of enormous audio waveforms frozen in stone and metal. The waveform ridges tower hundreds of feet high, catching warm sunset light. A tiny figure walks along the canyon floor. Golden light streams through gaps in the waveform walls. The ground is reflective like polished vinyl. Massive scale. No text no UI. 16:9.`,
  },
  {
    id: 'data-aurora',
    prompt: `${STYLE} A vast dark landscape with an enormous aurora borealis overhead, but the aurora is made of streaming data particles and musical frequencies — ribbons of golden light and information flowing across the sky. A tiny figure stands on a hilltop watching the data aurora. The ground is dark and textured like a vinyl record surface. Cosmic scale. No text no UI. 16:9.`,
  },
  {
    id: 'frequency-cathedral',
    prompt: `${STYLE} Inside an enormous cathedral-like space whose pillars and arches are made of solidified sound frequencies — tall columnar waveforms stretching to a vaulted ceiling far above. Warm golden light streams through gaps between the frequency columns. A tiny figure stands in the nave, dwarfed by the architecture of sound. The floor reflects like dark polished vinyl. No text no UI. 16:9.`,
  },
  {
    id: 'record-planet',
    prompt: `${STYLE} A massive vinyl record seen from edge-on, curving like a planet's horizon. The grooves stretch across the surface like terrain — ridges and valleys catching warm sunlight from a low angle. A tiny figure stands on the record surface near the label area, looking out across the groove landscape toward a distant sunrise. Space and stars visible above the curved horizon. Cosmic scale meets analog warmth. No text no UI. 16:9.`,
  },
  {
    id: 'node-ocean',
    prompt: `${STYLE} A vast ocean at golden hour, but the water is made of millions of tiny glowing data nodes connected by thin golden threads — a network rendered as an infinite sea. The surface ripples and flows like real water but is clearly digital infrastructure. A tiny figure stands on a small dark platform in the middle of this data ocean, looking out at the infinite network horizon. Warm amber light. No text no UI. 16:9.`,
  },
  {
    id: 'groove-tunnel',
    prompt: `${STYLE} Looking through an enormous tunnel made of vinyl record grooves — the circular grooves of a record rendered at massive scale, creating a tunnel that stretches into warm golden light at the far end. A tiny figure walks toward the light. The groove walls have rich texture and catch prismatic reflections. Deep amber and gold tones with dark shadows. No text no UI. 16:9.`,
  },
  {
    id: 'signal-tower',
    prompt: `${STYLE} A single enormous transmission tower made of intertwined audio cables and waveforms, rising from a vast dark plain into a golden sunset sky. The tower broadcasts visible waves of golden light and data particles into the atmosphere. A tiny figure sits at the base of the tower, looking up. The cables and wires catch warm light. Infrastructure as monument. No text no UI. 16:9.`,
  },
  {
    id: 'creation-forge',
    prompt: `${STYLE} Inside a massive forge-like space where music is being physically created — enormous molten golden streams of sound pour from high above into a vast pool below, creating ripples of frequency. The space is industrial but beautiful — dark walls with warm golden light reflecting off everything. A tiny figure watches from a walkway overlooking the creation pool. No text no UI. 16:9.`,
  },
];

async function generateScene(config, key) {
  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-image-2', prompt: config.prompt, n: 1, size: '1536x1024', quality: 'high' }),
  });
  if (!response.ok) { console.error(`  ❌ ${config.id}: ${(await response.text()).slice(0, 150)}`); return null; }
  const data = await response.json();
  if (!data.data?.[0]) return null;
  const img = data.data[0];
  const scenePath = join(OUT_DIR, `scene_${config.id}.png`);
  if (img.b64_json) writeFileSync(scenePath, Buffer.from(img.b64_json, 'base64'));
  else if (img.url) { const r = await fetch(img.url); writeFileSync(scenePath, Buffer.from(await r.arrayBuffer())); }
  return scenePath;
}

async function compositeScene(scenePath, id) {
  const outPath = join(OUT_DIR, `thumb_${id}.png`);
  try {
    execSync(`python3 "${DEPTH_SCRIPT}" "${scenePath}" -o "${outPath}" --analyze --wordmark-svg "${LOGO_SVG}"`, { encoding: 'utf-8', timeout: 180000 });
    return outPath;
  } catch (e) { console.error(`  ❌ Composite: ${e.message?.slice(0, 150)}`); return null; }
}

async function main() {
  const key = getGatewayKey();
  if (!key) { console.error('No key'); process.exit(1); }

  console.log('=== Generating 9 Vinyl Universe scenes ===\n');
  const scenes = [];
  for (const config of SCENES) {
    console.log(`Generating ${config.id}...`);
    const path = await generateScene(config, key);
    if (path) { console.log(`  ✅`); scenes.push({ ...config, scenePath: path }); }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Compositing ${scenes.length} ===\n`);
  const results = [];
  for (const scene of scenes) {
    console.log(`Compositing ${scene.id}...`);
    const p = await compositeScene(scene.scenePath, scene.id);
    if (p) { results.push({ id: scene.id, path: p }); console.log(`  ✅`); }
  }

  console.log(`\n=== DONE: ${results.length}/9 ===`);
  results.forEach(r => console.log(`  ${r.id}: ${r.path}`));
}

main().catch(console.error);
