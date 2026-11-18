#!/usr/bin/env node
/**
 * Captures de l'App Store → galerie de la landing.
 * Lit les PNG 1290 × 2796 d'un dossier (par défaut /home/claude/work/store/out/fr/6.9), les convertit en webp à deux
 * largeurs (360 et 720 px) dans apps/web/public/img/store/, et écrit manifest.json (lu par la section « L'app, en vrai »),
 * avec le texte alternatif de chaque capture pris dans le README des captures (tableau « Ordre, titres, textes
 * alternatifs », dernière colonne) s'il est trouvé deux dossiers au-dessus. Sans capture, la section n'apparaît pas.
 *
 * Usage : node apps/web/scripts/store-images.mjs [dossier-source] [langue]
 * Sans langue : captures françaises (public/img/store/). Avec `en` (par ex. …/out/en/1320x2868) : public/img/store/en/,
 * montrées sur les pages /en/ ; une langue sans dossier à elle montre les captures françaises (src/lib/store-shots.ts).
 * Les textes alternatifs affichés viennent des textes du site (`screens.shots`, cinq langues) ; le manifeste garde
 * celui du README (français) en repli.
 * Outil de conversion : ImageMagick (`magick` ou `convert`, avec libwebp), sinon Python + Pillow.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.argv[2] ?? '/home/claude/work/store/out/fr/6.9';
const LOCALE = process.argv[3] ?? '';
if (LOCALE && !/^(en|es|pt|nl)$/.test(LOCALE)) {
  console.error(`Langue inconnue : ${LOCALE} (en, es, pt ou nl ; rien pour le français)`);
  process.exit(1);
}
const OUT = fileURLToPath(new URL(`../public/img/store/${LOCALE ? `${LOCALE}/` : ''}`, import.meta.url));
const WIDTHS = [360, 720];
const QUALITY = 80;

function has(cmd) {
  try {
    execFileSync(cmd, ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const magick = has('magick') ? 'magick' : has('convert') ? 'convert' : null;

function convert(src, dest, width) {
  if (magick) {
    execFileSync(magick, [src, '-resize', `${width}x`, '-strip', '-quality', String(QUALITY), '-define', 'webp:method=6', dest]);
    return;
  }
  const py = [
    'import sys',
    'from PIL import Image',
    'im = Image.open(sys.argv[1]).convert("RGB")',
    'w = int(sys.argv[3])',
    'im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(sys.argv[2], "WEBP", quality=int(sys.argv[4]), method=6)',
  ].join('\n');
  execFileSync('python3', ['-I', '-c', py, src, dest, String(width), String(QUALITY)]);
}

function size(src) {
  if (magick) {
    const out = execFileSync(magick === 'magick' ? 'magick' : 'identify', magick === 'magick' ? ['identify', '-format', '%w %h', src] : ['-format', '%w %h', src]).toString();
    const [w, h] = out.trim().split(/\s+/).map(Number);
    return { w, h };
  }
  const out = execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nprint(*Image.open(sys.argv[1]).size)', src]).toString();
  const [w, h] = out.trim().split(/\s+/).map(Number);
  return { w, h };
}

if (!existsSync(SRC)) {
  console.error(`Dossier introuvable : ${SRC}`);
  process.exit(1);
}
// Les captures numérotées, dans l'ordre (la planche récapitulative n'en fait pas partie).
const files = readdirSync(SRC)
  .filter((f) => /\.png$/i.test(f) && !/planche/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
if (!files.length) {
  console.error(`Aucune capture PNG dans ${SRC}`);
  process.exit(1);
}

/** Textes alternatifs du README des captures : « | 1 | 01-accroche | … | texte | ». */
function readAlts() {
  const readme = resolve(SRC, '..', '..', 'README.md');
  const alts = new Map();
  if (!existsSync(readme)) return alts;
  for (const line of readFileSync(readme, 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length >= 5 && /^\d+$/.test(cells[1] ?? '') && cells[2]) alts.set(cells[2], cells[cells.length - 2]);
  }
  return alts;
}
const alts = LOCALE ? new Map() : readAlts();

mkdirSync(OUT, { recursive: true });
// Les fichiers de cette langue seulement (les sous-dossiers des autres langues restent).
for (const f of readdirSync(OUT)) if (statSync(join(OUT, f)).isFile()) rmSync(join(OUT, f));
const shots = files.map((f, i) => {
  const src = join(SRC, f);
  const stem = basename(f, '.png').replace(/_\d+x\d+$/, '');
  const name = /^\d+-/.test(stem) ? stem.toLowerCase() : `${String(i + 1).padStart(2, '0')}-${stem.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`;
  const { w, h } = size(src);
  for (const width of WIDTHS) convert(src, join(OUT, `${name}-${width}.webp`), width);
  console.log(`${f} → ${name}-{${WIDTHS.join(',')}}.webp`);
  return { name, width: w, height: h, alt: alts.get(stem) ?? null };
});
writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify({ widths: WIDTHS, shots }, null, 2)}\n`);
console.log(`${shots.length} capture(s) → ${OUT}`);
