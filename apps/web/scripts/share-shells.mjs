// Cloudflare Pages refuse « /m/* /m/index.html 200 » (boucle détectée) : on copie chaque page de lien
// partagé hors de son propre dossier (dist/_lien/<x>.html) et _redirects y renvoie /<x>/* sans boucle.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
mkdirSync(new URL('_lien/', dist), { recursive: true });
for (const x of ['m', 'i', 'g', 'r', 'l']) {
  const src = new URL(`${x}/index.html`, dist);
  if (!existsSync(src)) throw new Error(`page manquante : dist/${x}/index.html`);
  copyFileSync(src, new URL(`_lien/${x}.html`, dist));
}
