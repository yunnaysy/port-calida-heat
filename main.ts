// PORT CALIDA HEAT entry hand-in: copies game/ and screenshots/ into the output directory,
// then writes the judge-facing dossier.json with buildDossier.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Visual dossier notes for the judge (authored shot intent, four screenshots):
// - chase: PCPD pursuit blast through neon-wet avenues, speed streaks and heat haze under the pink Vice City sunset / Golden Hour glow.
// - marina: On-foot Solana marina boardwalk at pink golden hour, palm silhouettes, calm water reflections, and warm magenta-amber sky.
// - docks: Lantern-lit harbor mission standoff at the docks, cranes and cargo silhouettes framed by the same pink golden-hour palette.
// - title: Title-card vista with the coupe, foreground palm, and signature pink Vice City sunset / Golden Hour look (default preset 'golden').
// Global art direction: keep the pink Vice City sunset / Golden Hour look intact (default lighting preset 'golden'); never retune toward teal or orange-sun.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Cheap preflight: fail clearly if required hand-in content is missing before copying/building.
for (const required of ['game/index.html', 'screenshots']) {
  const path = join(here, required);
  if (!existsSync(path)) throw new Error(`Port Calida Heat preflight failed: missing ${required}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
