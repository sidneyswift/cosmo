#!/usr/bin/env node
/**
 * Culture v3b — retry failed prompts with safety-friendly rewrites.
 * Shorter prompts, no specific human descriptions, focus on scene + emotion.
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

const SCENES = [
  {
    id: 'speaker-giant',
    prompt: `Painterly anime-style illustration. A massive vintage speaker cabinet, 20 feet tall, in a sun-drenched empty warehouse. A small cat sits on top of it, ears perked, listening. Golden light through high windows, dust floating in the air. Dramatic scale contrast. Warm tones. Detailed brushwork and atmospheric haze. No text no UI. 16:9.`,
  },
  {
    id: 'lantern-release',
    prompt: `Painterly anime-style illustration. A single glowing paper lantern floating upward into a night sky full of city lights seen from a rooftop. A small bird perched on the rooftop railing watches it rise. The lantern is warm orange against cool blue city. Thousands of windows glow below. Atmospheric, emotional. Detailed brushwork. No text no UI. 16:9.`,
  },
  {
    id: 'train-journey',
    prompt: `Painterly anime-style illustration. View from inside a train window at golden hour. Beautiful landscape blurring past — fields, distant mountains, warm sunset. A pair of headphones and a notebook rest on the window ledge. The reflection of warm interior light on the glass. The world outside is vast and dreamy. Atmospheric perspective. Detailed brushwork. No text no UI. 16:9.`,
  },
  {
    id: 'mural-wall-v2',
    prompt: `Painterly anime-style illustration. A massive concrete wall covered with a vibrant abstract mural — bold geometric shapes, flowing color. A paint-splattered ladder leans against the wall, a bucket of paint at its base. Late afternoon golden light rakes across the surface. The wall is enormous, the ladder is tiny. The feeling: creative energy bigger than any one person. Detailed brushwork. No text no UI. 16:9.`,
  },
  {
    id: 'record-sea',
    prompt: `Painterly anime-style illustration. A vast calm ocean at sunset, but the water surface is covered with thousands of vinyl records floating like lily pads, their colorful labels catching golden light. A small paper boat drifts among them. The horizon stretches infinitely. Magical realism. Warm sunset colors. Atmospheric haze in the distance. Detailed brushwork. No text no UI. 16:9.`,
  },
  {
    id: 'empty-venue',
    prompt: `Painterly anime-style illustration. An enormous outdoor concert venue at sunset, seen from the stage looking out. Thousands of empty seats stretch to the horizon under a dramatic orange-purple sky. A single microphone stand and a guitar leaning against it center stage. One spotlight beam cuts through the twilight air. The scale is overwhelming. The moment before everything begins. Detailed brushwork. No text no UI. 16:9.`,
  },
  {
    id: 'sound-forest',
    prompt: `Painterly anime-style illustration. A magical forest where the trees are shaped like audio equalizer bars — tall rectangular trunks of varying heights glowing with warm bioluminescent light. A small fox sits at the base of the tallest tree, looking up. Fireflies float between the glowing trees. Atmospheric mist. The feeling: nature and sound are the same thing. Warm greens and ambers. Detailed brushwork. No text no UI. 16:9.`,
  },
];

async function generateScene(config, key) {
  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
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
    console.error(`  ❌ ${config.id}: ${err.slice(0, 150)}`);
    return null;
  }

  const data = await response.json();
  if (!data.data?.[0]) return null;
  const img = data.data[0];
  const scenePath = join(OUT_DIR, `scene_${config.id}.png`);

  if (img.b64_json) writeFileSync(scenePath, Buffer.from(img.b64_json, 'base64'));
  else if (img.url) {
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
    console.error(`  ❌ Composite failed:`, e.message?.slice(0, 200));
    return null;
  }
}

async function main() {
  const key = getGatewayKey();
  if (!key) { console.error('No gateway key'); process.exit(1); }

  console.log('=== Generating 7 retry scenes ===\n');
  const scenes = [];
  for (const config of SCENES) {
    console.log(`Generating ${config.id}...`);
    const path = await generateScene(config, key);
    if (path) {
      console.log(`  ✅ ${path}`);
      scenes.push({ ...config, scenePath: path });
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Compositing ${scenes.length} scenes ===\n`);
  const results = [];
  for (const scene of scenes) {
    console.log(`Compositing ${scene.id}...`);
    const p = await compositeScene(scene.scenePath, scene.id);
    if (p) { results.push({ id: scene.id, path: p }); console.log(`  ✅\n`); }
  }

  console.log(`\n=== DONE: ${results.length}/7 ===`);
  results.forEach(r => console.log(`  ${r.id}: ${r.path}`));
}

main().catch(console.error);
