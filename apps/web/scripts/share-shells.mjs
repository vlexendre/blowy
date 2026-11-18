// Cloudflare Pages refuse « /m/* /m/index.html 200 » (boucle détectée) : on copie chaque page de lien
// partagé hors de son propre dossier (dist/_lien/<x>.html) et _redirects y renvoie /<x>/* sans boucle.
// Ces pages ont les cinq langues (layouts/Public.astro, mode `shell`). Pour le quiz et le quartier, la copie vient de
// dist/lien/<x>/ (même page que /<x>/, plus les traductions choisies par le téléphone), puis dist/lien est retiré.
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
mkdirSync(new URL('_lien/', dist), { recursive: true });
const sources = { m: 'm', i: 'i', g: 'g', c: 'c', r: 'r', l: 'l', quiz: 'lien/quiz', quartier: 'lien/quartier' };
for (const [x, dir] of Object.entries(sources)) {
  const src = new URL(`${dir}/index.html`, dist);
  if (!existsSync(src)) throw new Error(`page manquante : dist/${dir}/index.html`);
  copyFileSync(src, new URL(`_lien/${x}.html`, dist));
}
rmSync(new URL('lien/', dist), { recursive: true, force: true });
