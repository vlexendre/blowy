// Après le build : aucune page publiée ne doit contenir « À COMPLÉTER » (valeur TODO de src/config/legal.ts).
// Les pages légales omettent déjà tout champ inconnu ; ce contrôle attrape le reste (texte en dur, nouveau rendu).
// ALLOW_TODO=1 pour un build de travail qui le tolère.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARK = 'À COMPLÉTER';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const TEXT = /\.(html|xml|txt|json|js|css|webmanifest)$|^_redirects$|^_headers$/;

/** Fichiers texte de dist, récursivement. */
function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (TEXT.test(e.name)) yield p;
  }
}

const hits = [];
for (const file of walk(dist)) {
  const n = readFileSync(file, 'utf8').split(MARK).length - 1;
  if (n > 0) hits.push(`${file.slice(dist.length)} (${n})`);
}

if (hits.length === 0) {
  console.log(`check-no-todo : aucun « ${MARK} » dans dist.`);
} else if (process.env.ALLOW_TODO === '1') {
  console.warn(`check-no-todo : « ${MARK} » toléré (ALLOW_TODO=1) dans :\n  ${hits.join('\n  ')}`);
} else {
  console.error(`check-no-todo : « ${MARK} » trouvé dans dist (compléter src/config/legal.ts, ou ALLOW_TODO=1) :\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
